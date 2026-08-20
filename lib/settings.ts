/**
 * settings.ts — 网站级搜索限流设置管理
 *
 * 通过缓存层存储可动态调整的限流配置。
 * 默认值：
 *   - 游客（未登录）：每 2 小时允许 1 次查询
 *   - 注册会员：每天最多 10 次查询
 *
 * 管理后台可在 /admin/settings 中修改这些值。
 */
import { getCache } from "./cache";

export interface SearchLimits {
  /** 游客：每隔多少秒允许一次查询 */
  guestIntervalSeconds: number;
  /** 注册会员：每天最多多少次查询 */
  memberDailySearchLimit: number;
  /** 游客每次窗口内允许的最大查询次数 */
  guestMaxPerWindow: number;
}

export const DEFAULT_SEARCH_LIMITS: SearchLimits = {
  guestIntervalSeconds: 2 * 60 * 60, // 每 2 小时
  memberDailySearchLimit: 10, // 每天最多 10 次
  guestMaxPerWindow: 1, // 每次窗口最多 1 次
};

const SETTINGS_KEY = "settings:search_limits";
const SETTINGS_TTL = 365 * 24 * 3600; // 1 年

/** 读取当前搜索限制设置 */
export async function getSearchLimits(): Promise<SearchLimits> {
  const cache = getCache();
  const stored = await cache.get<SearchLimits>(SETTINGS_KEY);
  if (stored) {
    return {
      ...DEFAULT_SEARCH_LIMITS,
      ...stored,
    };
  }
  return { ...DEFAULT_SEARCH_LIMITS };
}

/** 更新搜索限制设置 */
export async function updateSearchLimits(
  patch: Partial<SearchLimits>
): Promise<SearchLimits> {
  const cache = getCache();
  const current = await getSearchLimits();
  const next: SearchLimits = {
    ...current,
    ...patch,
  };
  // 基本校验
  next.guestIntervalSeconds = Math.max(
    60,
    Math.min(next.guestIntervalSeconds, 24 * 60 * 60)
  );
  next.guestMaxPerWindow = Math.max(1, Math.min(next.guestMaxPerWindow, 10));
  next.memberDailySearchLimit = Math.max(
    0,
    Math.min(next.memberDailySearchLimit, 1000)
  );
  await cache.set(SETTINGS_KEY, next, SETTINGS_TTL);
  return next;
}

/** 重置为默认值 */
export async function resetSearchLimits(): Promise<SearchLimits> {
  return updateSearchLimits({
    ...DEFAULT_SEARCH_LIMITS,
  });
}