/**
 * Companies House 官方 API 封装
 *
 * 文档: https://developer.company-information.service.gov.uk
 * 认证: HTTP Basic（用户名 = API Key，密码为空）
 * 限频: 600 requests / 5 minutes（通过 rate-limit + 缓存保护）
 */
import { getCache, CACHE_TTL } from "./cache";
import { rateLimitAllow, CH_LIMIT } from "./rate-limit";
import type {
  CompanyDetail,
  CompanyProfile,
  CompanySearchResult,
} from "./types";

const CH_BASE =
  process.env.COMPANIES_HOUSE_ENV === "sandbox"
    ? "https://api-sandbox.company-information.service.gov.uk"
    : "https://api.company-information.service.gov.uk";

/** 当前使用的 Companies House 环境（sandbox | production） */
export const COMPANIES_HOUSE_ENV =
  process.env.COMPANIES_HOUSE_ENV === "sandbox" ? "sandbox" : "production";

export class CompaniesHouseError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeader(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) {
    throw new CompaniesHouseError(
      "Companies House API key is not configured (COMPANIES_HOUSE_API_KEY)",
      500
    );
  }
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

/** 校验 CRN：6-8 位数字（实际签发最小 6 位） */
export function validCrn(value: string): boolean {
  return /^\d{6,8}$/.test(value.trim());
}

async function chFetch<T>(
  path: string,
  options?: { ttl?: number; key?: string }
): Promise<T> {
  const cache = getCache();
  const cacheKey = options?.key ?? `ch:${path}`;

  // Step 1: 查缓存
  const cached = await cache.get<T>(cacheKey);
  if (cached !== null) return cached;

  // Step 2: 全局频次保护（官方 600 req / 5 min）
  const allowed = await rateLimitAllow(
    "ch:global",
    CH_LIMIT.max,
    CH_LIMIT.windowSeconds
  );
  if (!allowed) {
    throw new CompaniesHouseError(
      "Companies House rate limit reached, please retry shortly.",
      429
    );
  }

  // Step 3: 调用官方 API
  const res = await fetch(`${CH_BASE}${path}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 429) {
    throw new CompaniesHouseError("Companies House rate limit reached.", 429);
  }
  if (res.status === 401) {
    throw new CompaniesHouseError(
      "Companies House authentication failed (401). The API key is invalid, revoked, or not yet activated. Verify it in the Companies House developer portal.",
      401
    );
  }
  if (res.status === 404) {
    throw new CompaniesHouseError(
      "Company not found in the Companies House register.",
      404
    );
  }
  if (!res.ok) {
    throw new CompaniesHouseError(
      `Companies House API error (${res.status}).`,
      res.status
    );
  }

  const data = (await res.json()) as T;
  // Step 4: 写入缓存（默认 TTL 30 天）
await cache.set(cacheKey, data, options?.ttl ?? CACHE_TTL.company);
  return data;
}
/** 公司类型 code -> 友好描述 */
export const COMPANY_TYPE_LABELS: Record<string, string> = {
  ltd: "Private Limited Company",
  plc: "Public Limited Company",
  private_unlimited: "Private Unlimited Company",
  limited_by_guarantee: "Private Limited Company by Guarantee",
  charity_incorporated_organisation: "Charitable Incorporated Organisation",
  community_interest_company: "Community Interest Company",
  llp: "Limited Liability Partnership",
  limited_partnership: "Limited Partnership",
  industrial_and_provident_society: "Industrial and Provident Society",
  overseas_company: "Overseas Company",
  old_public_company: "Old Public Company",
  royalty_charter_company: "Royal Charter Company",
  "private-limited-guarant-nsc": "Private Limited Company by Guarantee without Share Capital",
  "private-limited-guarant-nsc-limited-exempt": "Private Limited Company by Guarantee without Share Capital (Exempt)",
  "private-limited-shares-section-30-exemption": "Private Limited Company (s.30 Exemption)",
  "private-limited-company-without-share-capital": "Private Limited Company without Share Capital",
  "private-limited-company-with-share-capital": "Private Limited Company with Share Capital",
  "private-unlimited-with-share-capital": "Private Unlimited Company with Share Capital",
  "private-unlimited-without-share-capital": "Private Unlimited Company without Share Capital",
  other: "Other Company Type",
};

/** 常用状态英文 -> 展示用标签 */
export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  dissolved: "Dissolved",
  liquidation: "In Liquidation",
  receivership: "In Receivership",
  administration: "In Administration",
  "voluntary-arrangement": "Voluntary Arrangement",
  "converted-closed": "Converted / Closed",
  "insolvency-proceedings": "Insolvency Proceedings",
};

/** 友好显示公司状态 */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

/** 友好显示公司类型 */
export function typeLabel(type: string): string {
  return COMPANY_TYPE_LABELS[type] ?? type;
}
function mapAddress(a?: {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  care_of?: string;
}) {
  if (!a) return null;
  return {
    address_line_1: a.address_line_1 ?? "",
    address_line_2: a.address_line_2,
    locality: a.locality,
    region: a.region,
    postal_code: a.postal_code,
    country: a.country,
    care_of: a.care_of,
  };
}

/** 规范化 Companies House 原始响应 */
function normalizeProfile(raw: Record<string, unknown>): CompanyProfile {
  const addr = mapAddress(raw.registered_office_address as never);

  const accounts = raw.accounts as
    | { next_due?: string; next_made_up_to?: string; overdue?: boolean }
    | undefined;
  const confirmation = raw.confirmation_statement as
    | { next_due?: string; next_made_up_to?: string; overdue?: boolean }
    | undefined;
  const links = raw.links as
    | { filing_history?: string; officers?: string; persons_with_significant_control?: string }
    | undefined;

  return {
    company_number: String(raw.company_number ?? ""),
    company_name: String(raw.company_name ?? ""),
    company_status: String(raw.company_status ?? "unknown"),
    company_type: String(raw.type ?? raw.company_type ?? "other"),
    date_of_creation: (raw.date_of_creation as string) ?? null,
    date_of_cessation: (raw.date_of_cessation as string) ?? null,
    registered_office_address: addr,
    sic_codes: Array.isArray(raw.sic_codes) ? (raw.sic_codes as string[]) : undefined,
    accounts: accounts
      ? {
          next_due: accounts.next_due ?? null,
          next_made_up_to: accounts.next_made_up_to ?? null,
          overdue: Boolean(accounts.overdue),
        }
      : null,
    confirmation_statement: confirmation
      ? {
          next_due: confirmation.next_due ?? null,
          next_made_up_to: confirmation.next_made_up_to ?? null,
          overdue: Boolean(confirmation.overdue),
        }
      : null,
    previous_company_names: Array.isArray(raw.previous_company_names)
      ? (raw.previous_company_names as { name: string; effective_from?: string }[]).map(
          (n) => ({ name: n.name, effective_from: n.effective_from ?? null })
        )
      : undefined,
    links: links
      ? {
          filing_history: links.filing_history ?? undefined,
          officers: links.officers ?? undefined,
          persons_with_significant_control:
            links.persons_with_significant_control ?? undefined,
        }
      : null,
  };
}

/** 按 CRN 拉取公司详档（带缓存）；保留前导零，CRN 必须按注册表完整 8 位提交 */
export async function getCompanyByCrn(crn: string): Promise<CompanyProfile> {
  const clean = crn.replace(/\D/g, "");
  if (!validCrn(clean)) {
    throw new CompaniesHouseError("Invalid company number.", 400);
  }
  const raw = await chFetch<Record<string, unknown>>(`/company/${clean}`, {
    key: `ch:company:${clean}`,
  });
  return normalizeProfile(raw);
}

/** 按名称/关键词搜索公司（带缓存） */
export async function searchCompanies(
  q: string,
  itemsPerPage = 20
): Promise<CompanySearchResult> {
  const query = q.trim();
  if (!query) {
    throw new CompaniesHouseError("Search query is required.", 400);
  }
  const raw = await chFetch<{ total_results: number; items: Record<string, unknown>[] }>(
    `/search/companies?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}`,
    {
      key: `ch:search:${query.toLowerCase()}:${itemsPerPage}`,
      ttl: CACHE_TTL.search,
    }
  );
  return {
    total_results: raw.total_results ?? 0,
    query,
    items: (raw.items ?? []).map((it) => ({
      company_number: String(it.company_number ?? ""),
      title: String(it.title ?? ""),
      description: it.description ? String(it.description) : undefined,
      company_status: String(it.company_status ?? "unknown"),
      company_type: it.company_type ? String(it.company_type) : undefined,
      date_of_creation: it.date_of_creation ? String(it.date_of_creation) : undefined,
      address_snippet: it.address_snippet ? String(it.address_snippet) : undefined,
      links: it.links
        ? { self: String((it.links as { self?: string }).self ?? "") }
        : undefined,
    })),
  };
}

/** 公司档案 + （可选）VAT 关联信息的聚合查询 */
export async function getCompanyDetail(crn: string): Promise<CompanyDetail> {
  const cache = getCache();
  const cacheKey = `ch:detail:${crn}`;
  const cached = await cache.get<CompanyDetail>(cacheKey);
  if (cached) return cached;

  const profile = await getCompanyByCrn(crn);
  const detail: CompanyDetail = {
    profile,
    vat: undefined,
    sourcedAt: new Date().toISOString(),
    cached: false,
  };
  await cache.set(cacheKey, detail, 60 * 60 * 12);
  return detail;
}