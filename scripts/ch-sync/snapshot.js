#!/usr/bin/env node
/**
 * snapshot.js — Companies House Free Company Data Product 批量导入
 *
 * 官方数据源（每月发布 basic_company_data_YYYY_MM.zip，OGL v3 许可）：
 *   https://find-and-update.company-information.service.gov.uk
 *   → 侧栏 "Free Company Data Product"（下载页 download.companieshouse.gov.uk/en_output.html）
 *
 * 特性：
 *   - .zip / .csv 均支持（zip 自动解压：macOS/Linux 用 unzip -p 零落盘直管道；Windows 用内置 bsdtar 解临时目录）
 *   - 字节级流式 CSV 解析（引号包裹/””转义/字段内换行/CRLF/UTF-8 BOM）
 *   - 每批 5000 行一个事务 + Prepared Statement；Upsert（幂等，可随时 Ctrl+C 后重跑续导）
 *   - 核心字段：CompanyNumber / CompanyName / SIC Codes / 注册与注销日期 / 公司状态
 *
 * 用法：
 *   node scripts/ch-sync/snapshot.js --input basic_company_data_2026_08.zip
 *     [--db postgres://user:pass@host:5432/db | data/ch-companies.db] [--limit 100000] [--batch 5000]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createReadStream } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { createCsvParser } from "./csv.js";
import { snapshotToRow, log, fmtNum } from "./common.js";
import { openDb, resolveDbUri } from "./db.js";

function parseArgs(argv) {
  const args = { help: false };
  const next = (i) => argv[i + 1];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help") args.help = true;
    else if (a === "--input") args.input = next(i++);
    else if (a === "--db") args.db = next(i++);
    else if (a === "--limit") args.limit = Number(next(i++));
    else if (a === "--batch") args.batch = Number(next(i++));
    else if (a && !a.startsWith("--") && !args.input) args.input = a; // 位置参数兼容
  }
  return args;
}

function usage() {
  console.log(`用法:
  node scripts/ch-sync/snapshot.js --input <快照.zip|.csv> [选项]

选项:
  --input <path>   Companies House 快照 .zip 或已解压 .csv（必填）
  --db <uri>       postgres://... 走 PostgreSQL（需 npm i pg）；否则视为 SQLite 文件路径（默认 data/ch-companies.db）
  --limit <N>      最多导入 N 条（调试用，默认不限制）
  --batch <N>      每 N 行提交一个事务（默认 5000）

示例:
  node scripts/ch-sync/snapshot.js --input mock/sample-snapshot.csv
  node scripts/ch-sync/snapshot.js --input basic_company_data_2026_08.zip --limit 100000`);
}

/**
 * 打开快照输入流：
 *  - .csv  → createReadStream
 *  - .zip  → unix: `unzip -p` 输出到 stdout（零落盘）；win32: `tar -xf` 解临时目录后读 csv
 * 返回 { stream, cleanup? }；cleanup 负责删除临时目录。
 */
async function openSnapshot(input) {
  const lower = String(input).toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    return { stream: createReadStream(input), cleanup: null };
  }
  if (!lower.endsWith(".zip")) {
    throw new Error(`不支持的输入：${input}（请传 .zip 或 .csv）`);
  }
  if (process.platform === "win32") {
    // Windows 自带 bsdtar（libarchive）可解 zip
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ch-sync-"));
    const r = spawnSync("tar", ["-xf", input, "-C", tmp], { stdio: "inherit" });
    if (r.status !== 0) {
      fs.rmSync(tmp, { recursive: true, force: true });
      throw new Error("Windows tar 解压 zip 失败。可手动解压后传 .csv 文件。");
    }
    const csv = fs.readdirSync(tmp).find((f) => f.toLowerCase().endsWith(".csv"));
    if (!csv) {
      fs.rmSync(tmp, { recursive: true, force: true });
      throw new Error("zip 内未找到 .csv 文件。");
    }
    const cleanup = () => new Promise((res) => fs.rm(tmp, { recursive: true, force: true }, () => res()));
    return { stream: createReadStream(path.join(tmp, csv)), cleanup };
  }
  // macOS / Linux：unzip -p 只写 stdout，零落盘
  const child = spawn("unzip", ["-p", input], { stdio: ["ignore", "pipe", "inherit"] });
  child.once("error", (err) => {
    if (!child.stdout.destroyed) child.stdout.destroy(err);
  });
  child.once("close", (code) => {
    if (code !== 0 && !child.stdout.destroyed) {
      child.stdout.destroy(new Error(`unzip 退出码 ${code}，请确认已安装 unzip`));
    }
  });
  return { stream: child.stdout, cleanup: null };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    usage();
    process.exit(args.help ? 0 : 1);
  }
  const limit = args.limit && args.limit > 0 ? args.limit : Infinity;
  const batch = args.batch && args.batch > 0 ? args.batch : 5000;

  const db = await openDb(resolveDbUri(args.db));
  const { stream, cleanup } = await openSnapshot(args.input);
  const parser = createCsvParser();
  const started = Date.now();
  let header = null;
  let idx = {};
  let scanned = 0;
  let kept = 0;

  try {
    await db.begin();
    await pipeline(
      stream,
      parser,
      async function* (source) {
        for await (const row of source) {
          if (!header) {
            const map = {};
            row.forEach((c, i) => { map[c.trim()] = i; });
            idx = map;
            header = row;
            if (idx.CompanyNumber === undefined) {
              throw new Error("表头缺少 CompanyNumber —— 文件可能不是 Companies House 快照 CSV");
            }
            continue;
          }
          scanned += 1;
          const d = snapshotToRow(row, idx, "snapshot");
          if (!d.company_number) continue; // 空行 / 缺主键
          await db.upsertCompany(d);
          kept += 1;
          if (kept % batch === 0) {
            await db.commit();
            await db.begin();
            const sec = (Date.now() - started) / 1000 || 1;
            log(`[snapshot] 已入库 ${fmtNum(kept)} 行 / 已扫 ${fmtNum(scanned)}（${Math.round(kept / sec)} 行/s）`);
          }
          if (kept >= limit) break;
        }
      }
    );
    await db.commit();
    await db.setMeta("last_snapshot_run", new Date().toISOString());
    log(
      `[snapshot] 完成：扫描 ${fmtNum(scanned)} 行，入库/Upsert ${fmtNum(kept)} 条，` +
        `耗时 ${((Date.now() - started) / 1000).toFixed(1)}s，库内总计 ${fmtNum(await db.countCompanies())} 家`
    );
  } catch (err) {
    await db.rollback();
    throw err;
  } finally {
    if (cleanup) await cleanup();
    await db.close();
  }
}

main().catch((err) => {
  console.error("[snapshot] 失败：", err.message);
  process.exit(1);
});