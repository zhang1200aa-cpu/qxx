/**
 * db.js — 存储适配层：SQLite（node:sqlite，默认，零依赖）或 PostgreSQL（pg，可选）
 *
 * URI 约定（CH_SYNC_DB 环境变量或 --db 参数）：
 *   - postgres://user:pass@host:5432/dbname  → PostgreSQL（首次使用需 `npm i pg`）
 *   - 其他（默认 ./data/ch-companies.db）    → SQLite 文件（Node >= 22.5 内置）
 *
 * 数据模型：
 *   companies     — 公司主表（Upsert：INSERT ... ON CONFLICT (company_number) DO UPDATE）
 *   sync_meta     — 同步断点（快照完成标记 / Streaming API 的 last timepoint）
 *   stream_events — Streaming 事件审计行（骨架用，可随时清空）
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { log } from "./common.js";

/** companies 表的列（顺序 = Upsert 参数顺序） */
export const COMPANY_COLUMNS = [
  "company_number",
  "company_name",
  "company_category",
  "company_status",
  "country_of_origin",
  "incorporation_date",
  "dissolution_date",
  "reg_address_line1",
  "reg_address_line2",
  "reg_address_post_town",
  "reg_address_county",
  "reg_address_country",
  "reg_address_postcode",
  "accounts_next_due",
  "accounts_last_made_up_to",
  "confirmation_statement_next_due",
  "confirmation_statement_last_made_up_to",
  "sic_codes",
  "primary_sic_code",
  "uri",
  "previous_names",
  "source",
  "last_event_timepoint",
  "synced_at",
];

/** 通用建表 DDL（SQLite 与 PostgreSQL 均兼容） */
export const DDL = `
CREATE TABLE IF NOT EXISTS companies (
  company_number TEXT PRIMARY KEY,
  company_name TEXT,
  company_category TEXT,
  company_status TEXT,
  country_of_origin TEXT,
  incorporation_date TEXT,
  dissolution_date TEXT,
  reg_address_line1 TEXT,
  reg_address_line2 TEXT,
  reg_address_post_town TEXT,
  reg_address_county TEXT,
  reg_address_country TEXT,
  reg_address_postcode TEXT,
  accounts_next_due TEXT,
  accounts_last_made_up_to TEXT,
  confirmation_statement_next_due TEXT,
  confirmation_statement_last_made_up_to TEXT,
  sic_codes TEXT,
  primary_sic_code TEXT,
  uri TEXT,
  previous_names TEXT,
  source TEXT,
  last_event_timepoint INTEGER,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(company_status);
CREATE INDEX IF NOT EXISTS idx_companies_incorp ON companies(incorporation_date);
CREATE INDEX IF NOT EXISTS idx_companies_name   ON companies(company_name);
CREATE TABLE IF NOT EXISTS sync_meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS stream_events (
  timepoint INTEGER PRIMARY KEY,
  event_type TEXT,
  resource_kind TEXT,
  resource_uri TEXT,
  received_at TEXT
);
`;

const UPSERT_COLS = COMPANY_COLUMNS.filter((c) => c !== "company_number");
// COALESCE 语义：新增数据中为空的字段保留库里旧值——
// 官方 Streaming 的 company-profile 事件常缺省 previous_names / 地址等字段，
// 直接覆盖会把快照导入的既有数据误清空；company_number 为主键不参与更新。
const UPSERT_SQL = `INSERT INTO companies (${COMPANY_COLUMNS.join(", ")})
VALUES (${COMPANY_COLUMNS.map(() => "?").join(", ")})
ON CONFLICT (company_number) DO UPDATE SET
${UPSERT_COLS.map((c) => `${c} = COALESCE(excluded.${c}, companies.${c})`).join(",\n")}`;

// ---------------------------------------------------------------------------
// SQLite 实现（node:sqlite，同步底层；外部保持 async API 对齐 PostgreSQL）
// ---------------------------------------------------------------------------

function openSqlite(file) {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const raw = new DatabaseSync(file);
  raw.exec("PRAGMA journal_mode = WAL;");
  raw.exec("PRAGMA synchronous = NORMAL;");
  raw.exec("PRAGMA busy_timeout = 5000;");
  raw.exec(DDL);

  const upsertStmt = raw.prepare(UPSERT_SQL);
  const metaGet = raw.prepare("SELECT v FROM sync_meta WHERE k = ?");
  const metaSet = raw.prepare(
    "INSERT INTO sync_meta (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v"
  );
  const eventGet = raw.prepare("SELECT timepoint FROM stream_events WHERE timepoint = ?");
  const eventIns = raw.prepare(
    "INSERT INTO stream_events (timepoint, event_type, resource_kind, resource_uri, received_at) VALUES (?, ?, ?, ?, ?)"
  );
  const countStmt = raw.prepare("SELECT COUNT(*) AS n FROM companies");

  return {
    kind: "sqlite",
    raw,
    async createSchema() {
      raw.exec(DDL);
    },
    async begin() {
      raw.exec("BEGIN");
    },
    async commit() {
      raw.exec("COMMIT");
    },
    async rollback() {
      try {
        raw.exec("ROLLBACK");
      } catch (_e) {
        /* noop */
      }
    },
    async upsertCompany(row) {
      upsertStmt.run(...COMPANY_COLUMNS.map((c) => (row[c] === undefined ? null : row[c])));
    },
    async setMeta(key, value) {
      metaSet.run(key, String(value));
    },
    async getMeta(key) {
      const r = metaGet.get(key);
      return r ? r.v : null;
    },
    async lastTimepoint() {
      const v = await this.getMeta("streaming_last_timepoint");
      return v ? Number(v) : 0;
    },
    async saveEvent(timepoint, eventType, resourceKind, resourceUri) {
      if (!eventGet.get(timepoint)) {
        eventIns.run(timepoint, eventType ?? null, resourceKind ?? null, resourceUri ?? null, new Date().toISOString());
      }
    },
    async countCompanies() {
      return Number(countStmt.get().n);
    },
    async close() {
      raw.close();
    },
  };
}

// ---------------------------------------------------------------------------
// PostgreSQL 实现（pg，懒加载；未安装时给出明确提示）
// ---------------------------------------------------------------------------

async function openPostgres(uri) {
  let mod;
  try {
    mod = await import("pg");
  } catch (_e) {
    throw new Error(
      "[db] 选择了 PostgreSQL 但未安装 pg。请先执行 `npm i pg`，或改用默认 SQLite（--db data/ch-companies.db）。"
    );
  }
  const { Pool } = mod;
  const pool = new Pool({ connectionString: uri, max: 5 });
  await pool.query(DDL);

  return {
    kind: "postgres",
    pool,
    async createSchema() {
      await pool.query(DDL);
    },
    async begin() {
      await pool.query("BEGIN");
    },
    async commit() {
      await pool.query("COMMIT");
    },
    async rollback() {
      try {
        await pool.query("ROLLBACK");
      } catch (_e) {
        /* noop */
      }
    },
    async upsertCompany(row) {
      const cols = COMPANY_COLUMNS;
      const params = cols.map((c) => (row[c] === undefined ? null : row[c]));
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const setClause = UPSERT_COLS.map((c) => `${c} = COALESCE(excluded.${c}, companies.${c})`).join(", ");
      await pool.query(
        `INSERT INTO companies (${cols.join(", ")}) VALUES (${placeholders})
         ON CONFLICT (company_number) DO UPDATE SET ${setClause}`,
        params
      );
    },
    async setMeta(key, value) {
      await pool.query(
        `INSERT INTO sync_meta (k, v) VALUES ($1, $2)
         ON CONFLICT (k) DO UPDATE SET v = excluded.v`,
        [key, String(value)]
      );
    },
    async getMeta(key) {
      const r = await pool.query("SELECT v FROM sync_meta WHERE k = $1", [key]);
      return r.rowCount ? r.rows[0].v : null;
    },
    async lastTimepoint() {
      const v = await this.getMeta("streaming_last_timepoint");
      return v ? Number(v) : 0;
    },
    async saveEvent(timepoint, eventType, resourceKind, resourceUri) {
      await pool.query(
        `INSERT INTO stream_events (timepoint, event_type, resource_kind, resource_uri, received_at)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (timepoint) DO NOTHING`,
        [timepoint, eventType ?? null, resourceKind ?? null, resourceUri ?? null, new Date().toISOString()]
      );
    },
    async countCompanies() {
      const r = await pool.query("SELECT COUNT(*) AS n FROM companies");
      return Number(r.rows[0].n);
    },
    async close() {
      await pool.end();
    },
  };
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

/** 打开数据库适配器（URI 协议判断 SQLite / PostgreSQL） */
export async function openDb(uri) {
  if (/^postgres(ql)?:\/\//i.test(uri)) return openPostgres(uri);
  log(`[db] SQLite: ${uri}`);
  return openSqlite(uri);
}

/** 默认用 CH_SYNC_DB 环境变量，否则 data/ch-companies.db */
export function resolveDbUri(cliValue) {
  return cliValue || process.env.CH_SYNC_DB || "data/ch-companies.db";
}
