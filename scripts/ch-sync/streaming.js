#!/usr/bin/env node
/**
 * streaming.js — Companies House Streaming API 客户端骨架（长轮询 / NDJSON）
 *
 * 作用：快照导入完成后，持续监听官方企业档案变更，实时增量更新 companies 表，
 * 从而把“实时触发 REST API 的限流压力”降到最低。
 *
 * 断点续传：每条事件携带 event.timepoint，收到即写入 sync_meta.streaming_last_timepoint；
 * 断线/重启后从该 timepoint 继续，不丢不改。
 *
 * 认证：Streaming API Key（官网 developer 后台单独申请，与 REST Key **不通用**），
 * 以 HTTP Basic 提交（用户名 = Key，密码为空）。
 *
 * 用法：
 *   真实模式（需 Streaming Key）：
 *     COMPANIES_HOUSE_STREAMING_API_KEY=xxxx node scripts/ch-sync/streaming.js [--once] [--db ...]
 *   离线调试（无 Key，解析本地 NDJSON 验证解析/写入链路）：
 *     node scripts/ch-sync/streaming.js --file mock/sample-events.ndjson [--db ...]
 */
import fs from "node:fs";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { profileToRow, log, fmtNum } from "./common.js";
import { openDb, resolveDbUri } from "./db.js";

const STREAM_ENDPOINT = "https://stream.companieshouse.gov.uk/companies";
const MAX_RECV_MS = 120_000; // 单次连接最长存活（官方会周期性断开/保活）
const MAX_RETRY_MS = 15_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const args = { help: false };
  const next = (i) => argv[i + 1];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help") args.help = true;
    else if (a === "--file") args.file = next(i++);
    else if (a === "--db") args.db = next(i++);
    else if (a === "--once") args.once = true;
  }
  return args;
}

function usage() {
  console.log(`用法:
  真实模式（长轮询）:
    COMPANIES_HOUSE_STREAMING_API_KEY=xxxx node scripts/ch-sync/streaming.js [--once] [--db <uri>]

  离线调试（本地 NDJSON）:
    node scripts/ch-sync/streaming.js --file mock/sample-events.ndjson [--db <uri>]

选项:
  --file <path>  读取本地 NDJSON 事件文件（无 Streaming Key 时验证解析/写入链路）
  --once         真实模式下拉取一段后退出（默认无限重连循环）
  --db <uri>     同 snapshot.js（postgres://… | SQLite 文件路径）`);
}

/** 从 ReadableStream<Uint8Array> 增量按行解析 NDJSON，逐事件回调 */
async function consumeLines(reader, onEvent) {
  const decoder = new TextDecoder();
  let pending = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, nl).trim();
      pending = pending.slice(nl + 1);
      if (!line) continue;
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        continue; // 官方心跳/空行或脏数据：跳过
      }
      await onEvent(ev);
    }
  }
}

/** 把 company-profile 事件推送为 Meilisearch 文档（增量联动；未配置 MS 时静默跳过） */
async function syncSearchDoc(data) {
  const url = (process.env.MEILISEARCH_URL || "").replace(/\/$/, "");
  const key = process.env.MEILISEARCH_KEY || "";
  const index = process.env.MEILISEARCH_INDEX || "companies";
  if (!url || !key) return;
  const a = data.registered_office_address ?? {};
  const doc = {
    company_number: data.company_number,
    company_name: data.company_name ?? "",
    company_status: data.company_status ?? "",
    company_category: data.type ?? "",
    country_of_origin: data.country_of_origin ?? "",
    incorporation_date: data.date_of_creation ?? null,
    registered_office_address: [
      a.address_line_1,
      a.address_line_2,
      a.locality,
      a.region,
      a.postal_code,
      a.country,
    ]
      .filter(Boolean)
      .join(", "),
    sic_codes: Array.isArray(data.sic_codes) ? data.sic_codes : [],
    previous_names: Array.isArray(data.previous_company_names)
      ? data.previous_company_names.map((n) => (typeof n === "string" ? n : n?.name ?? String(n)))
      : [],
    url: `/company/${data.company_number}`,
  };
  try {
    const res = await fetch(`${url}/indexes/${index}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify([doc]),
    });
    if (!res.ok) log(`[stream] Meilisearch 文档推送失败（HTTP ${res.status}）`);
  } catch (err) {
    log(`[stream] Meilisearch 推送异常：${err.message}`);
  }
}

/** 处理单条事件：推进 timepoint + 审计 + 公司档案增量 Upsert + Meilisearch 增量 */
async function handleEvent(db, ev) {
  const tp = ev?.event?.timepoint;
  const kind = ev?.resource_kind;
  const type = ev?.event?.type;
  if (Number.isFinite(tp)) {
    await db.setMeta("streaming_last_timepoint", String(tp));
    await db.saveEvent(tp, String(type ?? ""), String(kind ?? ""), String(ev?.resource_uri ?? ""));
  }
  if (kind !== "company-profile") return false; // 只关心公司档案变更
  const data = ev?.data;
  if (!data || !data.company_number) return false;
  await db.upsertCompany(profileToRow(data, Number.isFinite(tp) ? tp : null));
  await syncSearchDoc(data);
  return true;
}

async function runLive(db, { once }) {
  const key = process.env.COMPANIES_HOUSE_STREAMING_API_KEY;
  if (!key) {
    throw new Error(
      "缺少 COMPANIES_HOUSE_STREAMING_API_KEY（Streaming Key，REST Key 不通用）。可先 --file 离线调试。"
    );
  }
  const auth = "Basic " + Buffer.from(`${key}:`).toString("base64");
  let timepoint = await db.lastTimepoint();
  let attempts = 0;
  log(`[stream] 连接 ${STREAM_ENDPOINT}?timepoint=${timepoint}`);
  for (;;) {
    try {
      const res = await fetch(`${STREAM_ENDPOINT}?timepoint=${timepoint}`, {
        headers: { Authorization: auth, Accept: "application/json" },
        signal: AbortSignal.timeout(MAX_RECV_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let changed = 0;
      await consumeLines(res.body.getReader(), async (ev) => {
        if (await handleEvent(db, ev)) changed += 1;
        timepoint = await db.lastTimepoint(); // 事件处理即推进断点
      });
      attempts = 0;
      log(`[stream] 本轮 ${fmtNum(changed)} 家公司档案变更，timepoint=${timepoint}`);
      if (once) break;
      await sleep(1000);
    } catch (err) {
      attempts += 1;
      const wait = Math.min(attempts * 1000, MAX_RETRY_MS);
      log(`[stream] 连接中断（${err.message}），${wait}ms 后从 timepoint=${timepoint} 重连`);
      await sleep(wait);
      timepoint = await db.lastTimepoint();
    }
  }
}

async function runFile(db, file) {
  if (!fs.existsSync(file)) throw new Error(`文件不存在：${file}`);
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let total = 0;
  let changed = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch (e) {
      log(`[file] 跳过非法 JSON 行：${e.message}`);
      continue;
    }
    total += 1;
    if (await handleEvent(db, ev)) changed += 1;
  }
  log(
    `[file] 处理 ${total} 个事件，其中 ${changed} 家公司档案 Upsert；` +
      `timepoint=${await db.lastTimepoint()}，库内总计 ${fmtNum(await db.countCompanies())} 家`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }
  const db = await openDb(resolveDbUri(args.db));
  try {
    if (args.file) await runFile(db, args.file);
    else await runLive(db, { once: Boolean(args.once) });
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error("[stream] 失败：", err.message);
  process.exit(1);
});