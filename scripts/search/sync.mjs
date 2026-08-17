#!/usr/bin/env node
/**
 * sync.mjs — 把 scripts/ch-sync 管道产出的 companies 表全量同步进 Meilisearch
 *
 * 文档结构（primaryKey = company_number）：
 *   { company_number, company_name, company_status, company_category,
 *     country_of_origin, sic_codes: string[], previous_names: string[],
 *     url: "/company/{crn}" }
 *
 * 用法（默认连本机 Meilisearch）：  
 *   MEILISEARCH_URL=http://127.0.0.1:7700 MEILISEARCH_KEY=masterKey \
 *     node scripts/search/sync.mjs [--db data/ch-companies.db] [--index companies] [--limit 10000] [--batch 10000]
 *
 * 全量重灌开销：每批 1 万条文档 + 等待任务；510 万家公司约 510 批（视网络/单条体积 3~10 分钟）。
 * 也可由 cron 每日跑一次；或安装后在 streaming.js 增量事件后追加单条文档。
 */
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

const MS_URL = (process.env.MEILISEARCH_URL || "http://127.0.0.1:7700").replace(/\/$/, "");
const MS_KEY = process.env.MEILISEARCH_KEY || "";
const DEFAULT_DB = process.env.CH_SYNC_DB || "data/ch-companies.db";

function parseArgs(argv) {
  const args = { db: DEFAULT_DB, index: process.env.MEILISEARCH_INDEX || "companies", limit: 0, batch: 10000 };
  const next = (i) => argv[i + 1];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--db") args.db = next(i++);
    else if (a === "--index") args.index = next(i++);
    else if (a === "--limit") args.limit = Number(next(i++) || 0);
    else if (a === "--batch") args.batch = Number(next(i++) || 10000);
    else if (a === "--help") args.help = true;
  }
  return args;
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (MS_KEY) h.Authorization = `Bearer ${MS_KEY}`;
  return h;
}

async function ms(path, options = {}) {
  const res = await fetch(`${MS_URL}${path}`, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_e) {
    body = null;
  }
  if (!res.ok) {
    throw new Error(`Meilisearch ${res.status} @ ${path}${body?.message ? ` — ${body.message}` : ""}`);
  }
  return body;
}

async function waitTask(taskUid, timeoutMs = 120_000) {
  const until = Date.now() + timeoutMs;
  const interval = MS_URL.includes("localhost") || MS_URL.includes("127.0.0.1") ? 200 : 1000;
  for (;;) {
    const t = await ms(`/tasks/${taskUid}`);
    if (t.status === "succeeded") return t;
    if (t.status === "failed") throw new Error(`task ${taskUid} 失败：${t.error?.message ?? "unknown"}`);
    if (Date.now() > until) throw new Error(`task ${taskUid} 超时`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

/** 把库中 JSON 文本列解析为数组（null/空 → []） */
function parseList(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.name ?? String(x))) : [];
  } catch (_e) {
    return [];
  }
}

/** 读取公司行并映射为 Meilisearch 文档 */
function toDocs(rows) {
  return rows.map((r) => ({
    company_number: String(r.company_number),
    company_name: String(r.company_name ?? ""),
    company_status: String(r.company_status ?? ""),
    company_category: String(r.company_category ?? ""),
    country_of_origin: String(r.country_of_origin ?? ""),
    incorporation_date: r.incorporation_date ? String(r.incorporation_date) : null,
    registered_office_address: [
      r.reg_address_line1,
      r.reg_address_line2,
      r.reg_address_post_town,
      r.reg_address_county,
      r.reg_address_postcode,
      r.reg_address_country,
    ]
      .filter(Boolean)
      .join(", "),
    sic_codes: parseList(r.sic_codes),
    previous_names: parseList(r.previous_names),
    url: `/company/${String(r.company_number)}`,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`用法: MEILISEARCH_URL=… MEILISEARCH_KEY=… node ${process.argv[1]} [--db ${DEFAULT_DB}] [--index companies] [--limit 0] [--batch 10000]`);
    return;
  }
  if (!fs.existsSync(args.db)) {
    throw new Error(`找不到公司库 ${args.db}。请先运行 scripts/ch-sync/snapshot.js 导入数据，或 --db 指定路径。`);
  }

  const db = new DatabaseSync(args.db, { readOnly: true });
  const limit = args.limit > 0 ? args.limit : Infinity;
  let sent = 0;
  let total = Number(db.prepare("SELECT COUNT(*) AS n FROM companies").get().n);
  const stmt = db.prepare(
    `SELECT company_number, company_name, company_status, company_category, country_of_origin,
            incorporation_date,
            reg_address_line1, reg_address_line2, reg_address_post_town,
            reg_address_county, reg_address_postcode, reg_address_country,
            sic_codes, previous_names
       FROM companies
      WHERE company_number > ?
      ORDER BY company_number
      LIMIT ?`
  );

  console.log(`[sync] 源库 ${args.db} 共 ${total.toLocaleString("en-GB")} 家公司 → ${MS_URL}/indexes/${args.index}`);
  const started = Date.now();
  let cursor = "";
  let emptyRuns = 0;

  while (sent < limit) {
    const take = Math.min(args.batch, limit - sent);
    const rows = stmt.all(cursor, take) ?? [];
    if (!rows.length) break;
    const docs = toDocs(rows);
    const task = await ms(`/indexes/${args.index}/documents`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(docs),
    });
    await waitTask(task.taskUid);
    sent += rows.length;
    cursor = String(rows[rows.length - 1].company_number);
    const sec = (Date.now() - started) / 1000 || 1;
    console.log(`[sync] ${sent.toLocaleString("en-GB")} / ${total.toLocaleString("en-GB")}（${Math.round(sent / sec)} docs/s）`);
    emptyRuns = rows.length === 0 ? emptyRuns + 1 : 0;
    if (emptyRuns > 0) break;
    if (rows.length < take && cursor !== "") {
      // 正常到达表尾
      break;
    }
  }

  db.close();
  console.log(`[sync] 完成：共写入 ${sent.toLocaleString("en-GB")} 份文档，耗时 ${((Date.now() - started) / 1000).toFixed(1)}s ✅`);
}

main().catch((err) => {
  console.error("[sync] 失败：", err.message);
  process.exit(1);
});