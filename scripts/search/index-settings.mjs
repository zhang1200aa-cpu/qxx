#!/usr/bin/env node
/**
 * index-settings.mjs — 创建 Meilisearch 索引并下发搜索配置
 *
 * 目标索引：companies
 *   primaryKey            : company_number
 *   searchableAttributes  : company_name / company_number / previous_names / sic_codes
 *   filterableAttributes  : company_status / company_category / country_of_origin
 *   sortableAttributes    : company_number
 *   typoTolerance         : 开启（minWordSizeForTypos=5/9，即 ≤4 字符词不纠错，长词允 2 typo）
 *   prefixSearch          : 默认开启（indexingTime），输入"tes"即命中 "TESCO PLC"
 *
 * 认证：Meilisearch API Key（master 或拥有 indexes.create/settings 权限的 key）
 *
 * 用法：
 *   MEILISEARCH_URL=http://127.0.0.1:7700 MEILISEARCH_KEY=masterKey \
 *     node scripts/search/index-settings.mjs [--index companies] [--reset]
 */
const MS_URL = (process.env.MEILISEARCH_URL || "http://127.0.0.1:7700").replace(/\/$/, "");
const MS_KEY = process.env.MEILISEARCH_KEY || "";

function parseArgs(argv) {
  const args = { index: process.env.MEILISEARCH_INDEX || "companies", reset: false };
  const next = (i) => argv[i + 1];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--index") args.index = next(i++);
    else if (a === "--reset") args.reset = true;
    else if (a === "--help") args.help = true;
  }
  return args;
}

function headers(json = false) {
  const h = {};
  if (MS_KEY) h.Authorization = `Bearer ${MS_KEY}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

/** 向 Meilisearch 发请求，2xx 返回 JSON，否则抛错 */
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
    throw new Error(`Meilisearch ${res.status} ${res.statusText} @ ${path}${body?.message ? ` — ${body.message}` : ""}`);
  }
  return body;
}

async function waitTask(taskUid, timeoutMs = 60_000) {
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`用法: MEILISEARCH_URL=… MEILISEARCH_KEY=… node ${process.argv[1]} [--index companies] [--reset]`);
    return;
  }

  // 1) 健康检查
  const health = await ms("/health");
  if (health.status !== "available") throw new Error(`Meilisearch 不可用：${JSON.stringify(health)}`);
  console.log(`[ms] Meilisearch 可用（v${health.version?.pkgVersion ?? "?"} @ ${MS_URL}）`);

  // 2) 创建索引（已存在则忽略）
  try {
    const created = await ms("/indexes", {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({ uid: args.index, primaryKey: "company_number" }),
    });
    console.log(`[ms] 索引 ${args.index} 创建中 task=${created.taskUid}`);
    await waitTask(created.taskUid);
  } catch (err) {
    if (err.message.includes("index_already_exists")) console.log(`[ms] 索引 ${args.index} 已存在，跳过创建`);
    else throw err;
  }

  // 3) 下发搜索设置
  const settings = {
    searchableAttributes: ["company_name", "company_number", "previous_names", "sic_codes"],
    filterableAttributes: ["company_status", "company_category", "country_of_origin"],
    sortableAttributes: ["company_number"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
    },
    // prefixSearch 默认 indexingTime（输入 2-3 字母即时前缀匹配）
    distinctAttribute: null,
    pagination: { maxTotalHits: 100000 },
  };
  const applied = await ms(`/indexes/${args.index}/settings`, {
    method: "PUT",
    headers: headers(true),
    body: JSON.stringify(settings),
  });
  console.log(`[ms] settings 更新中 task=${applied.taskUid}`);
  await waitTask(applied.taskUid);

  // 4) 回读确认
  const actual = await ms(`/indexes/${args.index}/settings`);
  console.log(`[ms] searchableAttributes = ${JSON.stringify(actual.searchableAttributes)}`);
  console.log(`[ms] typoTolerance.enabled = ${actual.typoTolerance?.enabled ?? actual.typoTolerance}`);
  console.log("[ms] 索引配置完成 ✅");
}

main().catch((err) => {
  console.error("[ms] 失败：", err.message);
  process.exit(1);
});