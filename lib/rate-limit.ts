/**
 * 简单滑动窗口限流（基于缓存层的 incr）
 *
 * 用途：
 *   1. 保护上游 Companies House API（官方上限 600 req / 5 min，全局共享）
 *   2. 保护自身 API 端点（如 /api/v1/*，每 IP 默认 60 req / min）
 */
import { getCache } from "./cache";

const cache = () => getCache();

/** 检查是否允许通过；超过上限返回 false */
export async function rateLimitAllow(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const count = await cache().incr!(`rl:${key}`, windowSeconds);
  return count <= max;
}

/** 获取当前已用次数（用于响应头 X-RateLimit-Remaining） */
export async function rateLimitUsed(key: string): Promise<number> {
  try {
    const raw = await cache().get<number>(`rl:${key}`);
    return typeof raw === "number" ? raw : 0;
  } catch {
    return 0;
  }
}

// ---- 预定义限流策略 ----

/** Companies House 官方：600 req / 5 min（所有请求共享预算） */
export const CH_LIMIT = { max: 600, windowSeconds: 300 };

/** 公开 API：每 IP 每分钟 60 次 */
export const API_IP_LIMIT = { max: 60, windowSeconds: 60 };

/** HMRC VAT：保守限流（官方按 key 限流，这里再收紧一层） */
export const HMRC_LIMIT = { max: 100, windowSeconds: 60 };
