/**
 * search-stats.ts — 前台界面搜索统计（区分游客 / 注册会员）
 *
 * 说明：
 *   - 在搜索结果页（公司 / VAT / 邮编）渲染成功后调用 recordFrontendSearch(type)
 *   - 自动过滤主流搜索引擎/社交爬虫，避免污染真实用户数据
 *   - 通过缓存层按 「天 / 月」 聚合计数（与现有 usage:api 等键共存）
 *   - 游客 -> guest；注册会员与付费订阅统一计入 member（订阅用户本质也是注册用户）
 *
 * 键设计：
 *   search:d:{YYYY-MM-DD}:total        今日搜索总数
 *   search:d:{YYYY-MM-DD}:guest:total  今日游客搜索数
 *   search:d:{YYYY-MM-DD}:member:total 今日注册会员搜索数
 *   search:d:{YYYY-MM-DD}:{tier}:{type} 今日按类型计数
 *   search:m:{YYYY-MM}:total           本月搜索总数
 *   search:m:{YYYY-MM}:guest:total     本月游客搜索数
 *   search:m:{YYYY-MM}:member:total    本月注册会员搜索数
 */
import "server-only";
import { headers } from "next/headers";
import { getCache } from "./cache";
import { getCurrentUser } from "./auth";

export type SearchType = "company" | "vat" | "postcode";
export type SearchTier = "guest" | "member";

/** 前台搜索动作可统计的页面类型 */
export const SEARCH_TYPES: SearchType[] = ["company", "vat", "postcode"];

/** 常见爬虫 UA 关键词（命中则不计入统计） */
const BOT_PATTERN =
  /(?:bot|spider|crawl|slurp|preview|facebookexternalhit|twitterbot|whatsapp|pinterest|linkedinbot|duckduckbot|ia_archiver|headlesschrome|curl|wget|python-requests|go-http-client|node-fetch|uptimerobot|pingdom|newrelic|statuscake|monitor)/i;

const DAY_TTL = 3 * 24 * 3600; // 日键保留 3 天
const MONTH_TTL = 32 * 24 * 3600; // 月键保留 32 天

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/** 判断 UA 是否为爬虫（命中返回 true → 跳过统计） */
export function isSearchBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}

/**
 * 记录一次前台搜索。
 * 在服务端渲染的搜索结果页成功被访问时调用；内部自动识别登录用户与爬虫。
 */
export async function recordFrontendSearch(type: SearchType): Promise<void> {
  try {
    const hd = await headers();
    const ua = hd.get("user-agent") ?? "";
    if (isSearchBot(ua)) return;

    const user = await getCurrentUser();
    const tier: SearchTier = user.tier === "guest" ? "guest" : "member";
    const cache = getCache();
    const day = dayKey();
    const month = monthKey();

    // 今日计数
    await cache.incr!(`search:d:${day}:total`, DAY_TTL);
    await cache.incr!(`search:d:${day}:${tier}:total`, DAY_TTL);
    await cache.incr!(`search:d:${day}:${tier}:${type}`, DAY_TTL);
    await cache.incr!(`search:d:${day}:total:${type}`, DAY_TTL);
    // 本月计数
    await cache.incr!(`search:m:${month}:total`, MONTH_TTL);
    await cache.incr!(`search:m:${month}:${tier}:total`, MONTH_TTL);
  } catch (err) {
    // 统计失败绝不阻塞页面渲染
    console.error("[search-stats] record failed", err);
  }
}

/** 单日/单月搜索统计结构 */
export interface SearchTierCounts {
  /** 游客 */
  guest: number;
  /** 注册会员（含付费订阅） */
  member: number;
  /** 合计 */
  total: number;
}

export interface SearchStats {
  today: SearchTierCounts & { byType: Record<SearchType, SearchTierCounts> };
  month: SearchTierCounts;
}

async function readTierCounts(
  prefix: string,
  suffix: string
): Promise<SearchTierCounts> {
  const cache = getCache();
  const [guest, member, total] = await Promise.all([
    cache.get<number>(`${prefix}:guest${suffix}`),
    cache.get<number>(`${prefix}:member${suffix}`),
    cache.get<number>(`${prefix}${suffix}`),
  ]);
  return {
    guest: guest ?? 0,
    member: member ?? 0,
    total: total ?? 0,
  };
}

/** 读取当前搜索统计（今日 + 本月聚合） */
export async function getSearchStats(): Promise<SearchStats> {
  const cache = getCache();
  const day = dayKey();
  const month = monthKey();

  const todayBase = await readTierCounts(`search:d:${day}`, ":total");
  const monthBase = await readTierCounts(`search:m:${month}`, ":total");

  const byType = {} as Record<SearchType, SearchTierCounts>;
  for (const t of SEARCH_TYPES) {
    const [guest, member, total] = await Promise.all([
      cache.get<number>(`search:d:${day}:guest:${t}`),
      cache.get<number>(`search:d:${day}:member:${t}`),
      cache.get<number>(`search:d:${day}:total:${t}`),
    ]);
    byType[t] = {
      guest: guest ?? 0,
      member: member ?? 0,
      total: total ?? 0,
    };
  }

  return {
    today: { ...todayBase, byType },
    month: monthBase,
  };
}