/**
 * Google Search Console (GSC) API 封装
 *
 * 用途：拉取 qxx.uk 的搜索表现数据（展示在管理后台的 SEO 仪表盘）。
 * 认证：使用 OAuth 3-legged 或简单的 API Key + Site URL 查询。
 * 说明：当前使用 API Key 方式（走 service account / 已授权的 token）。
 */

export interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface GscResponse {
  rows: GscRow[];
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  avgCtr: number;
}

/** GSC 端点（v1 searchAnalytics.query） */
const GSC_ENDPOINT = "https://searchconsole.googleapis.com/webmasters/v3/sites";

/** 站点 URL（从环境变量读取，默认 https://qxx.uk） */
function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") || "qxx.uk";
}

/** 请求 GSC Search Analytics */
export async function queryGsc(
  startDate: string,
  endDate: string,
  dimensions: string[] = ["query"],
  rowLimit = 20,
  dimensionFilterGroups?: unknown
): Promise<GscResponse> {
  const endpoint = `${GSC_ENDPOINT}/sc-domain%3A${siteUrl()}/searchAnalytics:query`;
  const key = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
  const token = process.env.GOOGLE_SEARCH_CONSOLE_TOKEN;

  if (!key && !token) {
    throw new GscError("Google Search Console API key or OAuth token not configured.", 401);
  }

  const url = key ? `${endpoint}?key=${encodeURIComponent(key)}` : endpoint;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!key && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
      dimensionFilterGroups,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GscError(`GSC API error ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }

  const json = (await res.json()) as {
    rows?: GscRow[];
    responseAggregationType?: string;
  };

  const rows = json.rows ?? [];
  
  // 聚合指标（显式类型，避免 TS reduce 推断问题）
  let clicks = 0;
  let impressions = 0;
  let positionWeighted = 0;

  for (const r of rows) {
    clicks += r.clicks ?? 0;
    impressions += r.impressions ?? 0;
    positionWeighted += (r.position ?? 0) * (r.impressions ?? 0);
  }

  const gscResponse: GscResponse = {
    rows,
    totalClicks: clicks,
    totalImpressions: impressions,
    avgPosition: impressions > 0 ? +(positionWeighted / impressions).toFixed(1) : 0,
    avgCtr: impressions > 0 ? +((clicks / impressions) * 100).toFixed(2) : 0,
  };
  return gscResponse;
}

/** GSC 错误 */
export class GscError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** 便捷工具：获取最近 28 天的日期范围 */
export function last30Days(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}