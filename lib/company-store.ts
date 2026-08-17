/**
 * company-store.ts — 本地 companies 表只读适配器（ch-sync 管道产出）
 *
 * 让公司详情页/API 从本地库直读（毫秒级、零消耗 CH REST 配额），
 * 未配置或未命中时由调用方回源 Companies House 官方 API。
 *
 * 数据源：
 *   - CH_LOCAL_DB（SQLite 文件，推荐，Node >= 22.5）
 *   - CH_LOCAL_DB_URL（PostgreSQL，需 npm i pg）
 * 与分卷 sitemap（CH_SITEMAP_DB*）、Meilisearch（scripts/search）共用同一份库。
 */
import type { CompanyProfile } from "./types";

const SQLITE_DB = (process.env.CH_LOCAL_DB || "").trim();
const PG_URL = (process.env.CH_LOCAL_DB_URL || "").trim();

/** 是否配置了本地公司库 */
export function localStoreConfigured(): boolean {
  return Boolean(SQLITE_DB || PG_URL);
}

interface StoreRow {
  company_number: string;
  company_name: string;
  company_status: string;
  company_category: string | null;
  country_of_origin: string | null;
  incorporation_date: string | null;
  dissolution_date: string | null;
  reg_address_line1: string | null;
  reg_address_line2: string | null;
  reg_address_post_town: string | null;
  reg_address_county: string | null;
  reg_address_country: string | null;
  reg_address_postcode: string | null;
  accounts_next_due: string | null;
  accounts_last_made_up_to: string | null;
  confirmation_statement_next_due: string | null;
  confirmation_statement_last_made_up_to: string | null;
  sic_codes: string | null; // JSON array 文本
  previous_names: string | null; // JSON array 文本
}

const SELECT_COLS = [
  "company_number", "company_name", "company_status", "company_category",
  "country_of_origin", "incorporation_date", "dissolution_date",
  "reg_address_line1", "reg_address_line2", "reg_address_post_town",
  "reg_address_county", "reg_address_country", "reg_address_postcode",
  "accounts_next_due", "accounts_last_made_up_to",
  "confirmation_statement_next_due", "confirmation_statement_last_made_up_to",
  "sic_codes", "previous_names",
].join(", ");

function parseJson<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

async function querySqlite(crn: string): Promise<StoreRow | null> {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(SQLITE_DB, { readOnly: true });
  try {
    const row = db
      .prepare(`SELECT ${SELECT_COLS} FROM companies WHERE company_number = ?`)
      .get(crn) as unknown as Record<string, unknown> | undefined;
    return row ? (row as unknown as StoreRow) : null;
  } finally {
    db.close();
  }
}

async function queryPostgres(crn: string): Promise<StoreRow | null> {
  // 由 next.config.ts 的 serverExternalPackages 外部化，运行期才 require（未安装则降级回源）
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: PG_URL, max: 2 });
  try {
    const r = await pool.query(`SELECT ${SELECT_COLS} FROM companies WHERE company_number = $1`, [crn]);
    return r.rows[0] ? (r.rows[0] as unknown as StoreRow) : null;
  } finally {
    await pool.end();
  }
}

/** 本地库行 → CompanyProfile（与官方 API 返回结构对齐） */
function mapRow(r: StoreRow): CompanyProfile {
  const sicCodes = parseJson<string>(r.sic_codes);
  const previousNames = parseJson<{ name: string; effective_from?: string }>(r.previous_names);
  const hasAddress = Boolean(
    r.reg_address_line1 || r.reg_address_post_town || r.reg_address_postcode
  );

  return {
    company_number: r.company_number,
    company_name: r.company_name,
    company_status: r.company_status || "unknown",
    company_type: r.company_category || "other",
    date_of_creation: r.incorporation_date ?? null,
    date_of_cessation: r.dissolution_date ?? null,
    registered_office_address: hasAddress
      ? {
          address_line_1: r.reg_address_line1 ?? "",
          address_line_2: r.reg_address_line2 ?? undefined,
          locality: r.reg_address_post_town ?? undefined,
          region: r.reg_address_county ?? undefined,
          postal_code: r.reg_address_postcode ?? undefined,
          country: r.reg_address_country ?? undefined,
        }
      : null,
    sic_codes: sicCodes.length ? sicCodes : undefined,
    accounts:
      r.accounts_next_due || r.accounts_last_made_up_to
        ? {
            next_due: r.accounts_next_due ?? null,
            next_made_up_to: r.accounts_last_made_up_to ?? null,
            // 本地库未存 overdue 状态，按业务默认非逾期展示
            overdue: false,
          }
        : null,
    confirmation_statement:
      r.confirmation_statement_next_due || r.confirmation_statement_last_made_up_to
        ? {
            next_due: r.confirmation_statement_next_due ?? null,
            next_made_up_to: r.confirmation_statement_last_made_up_to ?? null,
            overdue: false,
          }
        : null,
    previous_company_names: previousNames.length
      ? previousNames.map((n) => ({ name: n.name, effective_from: n.effective_from ?? null }))
      : undefined,
    links: null,
  };
}

/** 本地库中与指定 SIC 相同行业的部分公司（详情页内链用） */
export interface StoreCompanyLink {
  company_number: string;
  company_name: string;
  company_status: string;
}

const LINK_SQL =
  "SELECT company_number, company_name, company_status FROM companies";

function linkRows(rows: unknown[]): StoreCompanyLink[] {
  return (rows as Record<string, unknown>[]).map((r) => ({
    company_number: String(r.company_number ?? ""),
    company_name: String(r.company_name ?? ""),
    company_status: String(r.company_status ?? ""),
  }));
}

export async function listCompaniesBySic(
  sicCodes: string[],
  excludeCrn: string,
  limit = 5
): Promise<StoreCompanyLink[]> {
  if (!localStoreConfigured() || !sicCodes.length) return [];
  const clauses = sicCodes.map(() => "sic_codes LIKE ?").join(" OR ");
  const params = sicCodes.map((c) => `%${c}%`);

  try {
    if (SQLITE_DB) {
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(SQLITE_DB, { readOnly: true });
      try {
        const rows = db
          .prepare(
            `${LINK_SQL} WHERE (${clauses}) AND company_number != ? ORDER BY company_number LIMIT ?`
          )
          .all(...params, excludeCrn, limit);
        return linkRows(rows);
      } finally {
        db.close();
      }
    }
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: PG_URL, max: 2 });
    try {
      const r = await pool.query(
        `${LINK_SQL} WHERE (${clauses}) AND company_number != $${params.length + 1} ORDER BY company_number LIMIT $${params.length + 2}`,
        [...params, excludeCrn, limit]
      );
      return linkRows(r.rows);
    } finally {
      await pool.end();
    }
  } catch (err) {
    console.error(
      "[store] 同行业公司查询失败：",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

/** 从本地公司库按规范 CRN 取公司档案；未配置 / 未命中 / 库损坏均返回 null（交回源） */
export async function getCompanyFromStore(
  crn: string
): Promise<CompanyProfile | null> {
  if (!localStoreConfigured()) return null;
  try {
    const row = SQLITE_DB ? await querySqlite(crn) : await queryPostgres(crn);
    return row ? mapRow(row) : null;
  } catch (err) {
    console.error(
      `[store] 本地库读取失败（${SQLITE_DB || PG_URL}），回源官网 API：`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}