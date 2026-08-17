/**
 * sitemap-repo.ts — 分卷 Sitemap 数据源与分卷规则
 *
 * 分卷规则（Google 限制单文件 ≤ 50,000 条）：
 *   digits-{00..99}  8 位纯数字公司号按前 2 位分 100 卷（~5 万/卷）
 *   prefix-{SC,NI,…} 19 种 2 位前缀公司号各一卷
 *   other            其余形态（兜底）
 *
 * 数据源优先级：
 *   1) CH_SITEMAP_DB（SQLite 文件，scripts/ch-sync 管道产出）
 *   2) CH_SITEMAP_DB_URL（PostgreSQL）
 *   3) 种子数据 POPULAR_COMPANIES（本地/上线前回退，保证可见）
 */
import { CRN_PREFIXES } from "./crn";
import { POPULAR_COMPANIES, POPULAR_POSTCODES } from "./seed";
import { siteConfig } from "./site";

export interface SitemapHit {
  loc: string;
  lastmod?: string;
}

/** 数字分卷：00..99 */
export const DIGIT_VOLUMES = Array.from({ length: 100 }, (_, i) =>
  String(i).padStart(2, "0")
);
/** 前缀公司分卷（19 种） */
export const PREFIX_VOLUMES: string[] = [...CRN_PREFIXES];
export const OTHER_VOLUME = "other";

/** 全部分卷号（sitemap index 与 route 共用） */
export const VOLUMES = [
  ...DIGIT_VOLUMES.map((d) => `digits-${d}`),
  ...PREFIX_VOLUMES.map((p) => `prefix-${p.toLowerCase()}`),
  OTHER_VOLUME,
] as const;

type Vol =
  | { kind: "digits"; prefix: string }
  | { kind: "prefix"; code: string }
  | { kind: "other" };

/** 解析分卷号，非法返回 null */
export function parseVolume(vol: unknown): Vol | null {
  if (typeof vol !== "string") return null; // 防御：build 期元数据传递异常
  if (vol.startsWith("digits-")) {
    const digits = vol.slice("digits-".length);
    return /^\d{2}$/.test(digits) ? { kind: "digits", prefix: digits } : null;
  }
  if (vol.startsWith("prefix-")) {
    const code = vol.slice("prefix-".length).toUpperCase();
    return PREFIX_VOLUMES.includes(code) ? { kind: "prefix", code } : null;
  }
  if (vol === OTHER_VOLUME) return { kind: "other" };
  return null;
}

/** 每条 <url> 的最大数量（Google 硬限制 50k，留一点冗余） */
export const MAX_PER_VOLUME = 50_000;

/** 生成该卷的 WHERE（SQLite / PostgreSQL 均可执行）；只收录 Active 公司 */
function whereFor(vol: Vol): { sql: string; params: string[] } {
  const active = "company_status = 'active'";
  if (vol.kind === "digits") {
    return { sql: `company_number LIKE ? AND ${active}`, params: [`${vol.prefix}%`] };
  }
  if (vol.kind === "prefix") {
    return { sql: `company_number LIKE ? AND ${active}`, params: [`${vol.code}%`] };
  }
  const list = PREFIX_VOLUMES.map((p) => `'${p}'`).join(", ");
  return {
    sql: `substr(company_number, 1, 2) NOT IN (${list}) AND substr(company_number, 1, 1) NOT BETWEEN '0' AND '9' AND ${active}`,
    params: [],
  };
}

/* ---------------------------------------------------------------------------
 * DB 查询（懒加载驱动；任何失败都回退种子数据）
 * ------------------------------------------------------------------------- */

type DbRow = { company_number: string; synced_at: string };

async function querySqlite(vol: Vol, file: string): Promise<DbRow[] | null> {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(file, { readOnly: true });
    const { sql, params } = whereFor(vol);
    const stmt = db.prepare(
      `SELECT company_number, synced_at FROM companies WHERE ${sql} ORDER BY company_number LIMIT ${MAX_PER_VOLUME}`
    );
    const rows = stmt.all(...params) as unknown as DbRow[];
    db.close();
    return rows;
  } catch (err) {
    console.error(
      `[sitemap] SQLite 读取 ${file} 失败，回退种子数据：`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function queryPostgres(vol: Vol, url: string): Promise<DbRow[] | null> {
  try {
    // 由 next.config.ts 的 serverExternalPackages 外部化，运行期才 require（未安装则降级种子）
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 2 });
    const { sql, params } = whereFor(vol);
    const r = await pool.query(
      `SELECT company_number, synced_at FROM companies WHERE ${sql} ORDER BY company_number LIMIT ${MAX_PER_VOLUME}`,
      params
    );
    await pool.end();
    return r.rows as unknown as DbRow[];
  } catch (err) {
    console.error(
      "[sitemap] PostgreSQL 查询失败，回退种子数据：",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** 种子回退（保证无 DB 时 sitemap 依然可用） */
function seedHits(vol: Vol): SitemapHit[] {
  const base = siteConfig.url;
  return POPULAR_COMPANIES.map((c) => c.crn)
    .filter((crn) => {
      if (vol.kind === "digits") {
        return /^\d{8}$/.test(crn) && crn.startsWith(vol.prefix);
      }
      if (vol.kind === "prefix") return crn.startsWith(vol.code);
      return false;
    })
    .map((crn) => ({ loc: `${base}/company/${crn}` }));
}

/* ---------------------------------------------------------------------------
 * 对外查询入口
 * ------------------------------------------------------------------------- */

/** 取某卷的公司 URL 列表（DB 优先，无则种子） */
export async function companiesForVolume(volCode: string): Promise<SitemapHit[]> {
  const vol = parseVolume(volCode);
  if (!vol) return [];
  const base = siteConfig.url;
  const dbFile = process.env.CH_SITEMAP_DB;
  const dbUrl = process.env.CH_SITEMAP_DB_URL;

  if (dbFile || dbUrl) {
    const rows = dbFile
      ? await querySqlite(vol, dbFile)
      : await queryPostgres(vol, dbUrl!);
    if (rows) {
      return rows.map((r) => ({
        loc: `${base}/company/${r.company_number}`,
        lastmod: r.synced_at ? r.synced_at.slice(0, 10) : undefined,
      }));
    }
  }
  return seedHits(vol);
}

/** 静态工具页 URL（供 sitemap-static.xml） */
export function staticPageHits(): SitemapHit[] {
  const base = siteConfig.url;
  const today = new Date().toISOString().slice(0, 10);
  const pages = [
    "/", "/vat", "/postcode", "/search", "/pricing",
    "/api-docs", "/about", "/privacy", "/terms", "/contact",
  ];
  return pages.map((p) => ({ loc: `${base}${p}`, lastmod: today }));
}

/** 邮编详情页 URL（种子数据） */
export function postcodeHits(): SitemapHit[] {
  const base = siteConfig.url;
  return POPULAR_POSTCODES.map((p) => ({
    loc: `${base}/postcode/${p.postcode.replace(/\s+/g, "")}`,
  }));
}

/** sitemap 系列响应头：XML 类型 + CDN 短缓存（公司状态低频变化，1 小时足够） */
export function sitemapXmlHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=0, s-maxage=3600",
    "CDN-Cache-Control": "public, max-age=0, s-maxage=3600",
  };
}