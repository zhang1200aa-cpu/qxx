/**
 * meilisearch.ts — 服务端 Meilisearch 客户端（毫秒级公司搜索补全）
 *
 * 通过官方 HTTP API（indexes/{uid}/search）访问，零安装依赖。
 * 索引配置见 scripts/search/index-settings.mjs，数据同步见 scripts/search/sync.mjs。
 */
import { siteConfig } from "./site";

const MS_URL = (process.env.MEILISEARCH_URL || "").replace(/\/$/, "");
const MS_KEY = process.env.MEILISEARCH_KEY || "";
export const MEILISEARCH_INDEX = process.env.MEILISEARCH_INDEX || "companies";

/** 是否已配置 Meilisearch（未配置时前端保持"提交到结果页"的既有行为） */
export function meiliConfigured(): boolean {
  return Boolean(MS_URL && MS_KEY);
}

export interface MeiliCompanyHit {
  company_number: string;
  company_name: string;
  company_status?: string;
  company_category?: string;
  url?: string;
  _formatted?: { company_name?: string };
}

export interface AutocompleteResult {
  hits: MeiliCompanyHit[];
  total: number;
  configured: boolean;
}

/**
 * 公司名/CRN/曾用名/SIC 前缀补全查询（Top N）。
 * - typoTolerance 与 prefixSearch 由索引 settings 控制（见 index-settings.mjs）
 * - 未配置 Meilisearch → { hits: [], configured: false }
 * - 上游异常向上抛出（由 API 路由兜底为 500，前端静默忽略）
 */
export async function searchAutocomplete(
  q: string,
  { limit = 8 }: { limit?: number } = {}
): Promise<AutocompleteResult> {
  if (!meiliConfigured()) return { hits: [], total: 0, configured: false };

  const res = await fetch(`${MS_URL}/indexes/${MEILISEARCH_INDEX}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MS_KEY}`,
    },
    body: JSON.stringify({
      q,
      limit,
      attributesToRetrieve: [
        "company_number",
        "company_name",
        "company_status",
        "company_category",
        "url",
        "previous_names",
        "sic_codes",
      ],
      attributesToHighlight: ["company_name"],
      showMatchesPosition: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!res.ok) {
    throw new Error(`Meilisearch search failed (${res.status})`);
  }
  const data = (await res.json()) as {
    hits: MeiliCompanyHit[];
    estimatedTotalHits?: number;
    query?: string;
  };
  return {
    hits: data.hits ?? [],
    total: data.estimatedTotalHits ?? 0,
    configured: true,
  };
}

/** 归一化 URL：优先索引内 url，其次构造 */
export function companyUrl(hit: MeiliCompanyHit): string {
  return hit.url || `${siteConfig.url}/company/${hit.company_number}`;
}

// ---------------------------------------------------------------------------
// 搜索结果页全量查询（/search）
// ---------------------------------------------------------------------------

export interface MeiliCompanyHitFull extends MeiliCompanyHit {
  incorporation_date?: string | null;
  registered_office_address?: string | null;
  sic_codes?: string[];
}

export interface SearchFullResult {
  hits: MeiliCompanyHitFull[];
  total: number;
  configured: boolean;
}

/**
 * 搜索结果页查询（Top 20，含更多展示字段）。
 * 未配置 Meilisearch 时返回 { hits:[], configured:false }，调用方回退官方 CH 搜索。
 */
export async function searchCompaniesFull(
  q: string,
  { limit = 20 }: { limit?: number } = {}
): Promise<SearchFullResult> {
  if (!meiliConfigured()) return { hits: [], total: 0, configured: false };
  const res = await fetch(`${MS_URL}/indexes/${MEILISEARCH_INDEX}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MS_KEY}`,
    },
    body: JSON.stringify({
      q,
      limit,
      attributesToRetrieve: [
        "company_number",
        "company_name",
        "company_status",
        "company_category",
        "incorporation_date",
        "registered_office_address",
        "sic_codes",
        "url",
      ],
      attributesToHighlight: ["company_name"],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!res.ok) {
    throw new Error(`Meilisearch search failed (${res.status})`);
  }
  const data = (await res.json()) as {
    hits: MeiliCompanyHitFull[];
    estimatedTotalHits?: number;
  };
  return {
    hits: data.hits ?? [],
    total: data.estimatedTotalHits ?? 0,
    configured: true,
  };
}