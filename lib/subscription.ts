/**
 * 订阅账户与 API Key 管理（配额记账引擎）
 *
 * 设计：
 *   - 无独立数据库时的最小实现：账户/用量全部存缓存层（Redis 或内存）
 *   - 生产环境建议把 accounts 表落到 Postgres / Turso，本模块是横切逻辑
 *   - 用法：API 路由里 authenticateApiKey(req) → consumeApiQuota(account)
 *
 * 数据模型：
 *   key:{apiKey}            → accountId(email)
 *   acct:{email}            → SubscriptionAccount JSON
 *   usage:api:{email}:MM   → 本月已用 API 次数（incr）
 */
import { randomBytes, createHash } from "crypto";
import { getCache } from "./cache";
import { type PlanId } from "./billing";
import { getPlan } from "./plan-config";
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "expired";

export interface SubscriptionAccount {
  email: string;
  plan: PlanId;
  apiKey?: string;
  credits: number; // 可用无印 PDF 报告点数
  creditsSpent: number;
  alertsEnabled: boolean;
  bulkRowsToday: number;
  status: SubscriptionStatus;
  provider: "lemon-squeezy" | "stripe" | "manual" | "none";
  providerSubscriptionId?: string;
  trialEndsAt?: string;
  updatedAt: string;
}

type AccountPatch = Partial<Omit<SubscriptionAccount, "email">>;

const cache = () => getCache();
const MONTH_KEY = () => new Date().toISOString().slice(0, 7); // yyyy-MM

/** 生成随机 API Key（格式 qx_live_... 便于识别） */
export function generateApiKey(): string {
  return `qx_live_${randomBytes(24).toString("hex")}`;
}

/** 简单 key 格式校验 */
export function looksLikeApiKey(value: string): boolean {
  return /^qx_(live|test)_[0-9a-f]{48}$/.test(value.trim());
}

export async function getAccountByEmail(email: string): Promise<SubscriptionAccount | null> {
  const acct = await cache().get<SubscriptionAccount>(`acct:${email.toLowerCase()}`);
  return acct;
}

export async function getAccountByApiKey(apiKey: string): Promise<SubscriptionAccount | null> {
  const email = await cache().get<string>(`key:${apiKey.trim()}`);
  if (!email) return null;
  return getAccountByEmail(email);
}

/** 创建或更新账户（webhook / 订阅流程回调） */
export async function upsertAccount(
  email: string,
  patch: AccountPatch
): Promise<SubscriptionAccount> {
  const key = email.toLowerCase();
  const existing = (await getAccountByEmail(key)) ?? {
    email: key,
    plan: "free" as PlanId,
    credits: 0,
    creditsSpent: 0,
    alertsEnabled: false,
    bulkRowsToday: 0,
    status: "active" as SubscriptionStatus,
    provider: "none" as const,
    updatedAt: new Date().toISOString(),
  };

  const next: SubscriptionAccount = {
    ...existing,
    ...patch,
    email: key,
    updatedAt: new Date().toISOString(),
  };
  await cache().set(`acct:${key}`, next, 60 * 60 * 24 * 365);
  if (next.apiKey) {
    await cache().set(`key:${next.apiKey}`, key, 60 * 60 * 24 * 365);
  }
  return next;
}

/** 授权一个 API 请求：返回账户（无 key 时为 free 匿名态） */
export async function authenticateApiKey(
  req: Request
): Promise<{ account: SubscriptionAccount | null; apiKey?: string }> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return { account: null };
  const account = await getAccountByApiKey(apiKey);
  if (!account) return { account: null, apiKey };
  if (account.status === "cancelled" || account.status === "expired") {
    return { account, apiKey };
  }
  return { account, apiKey };
}

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reason?: string;
}

/**
 * 消费一次 API 配额。
 * - 免费匿名：无配额概念，由调用方用 IP 限流兜底
 * - 付费 API 套餐：按月度配额扣减
 */
export async function consumeApiQuota(
  account: SubscriptionAccount
): Promise<QuotaResult> {
  const plan = await getPlan(account.plan);
  const limit = plan.limits.apiCallsPerMonth;
  if (limit <= 0) {
    return { allowed: true, remaining: 0, limit: 0 };
  }
  const usageKey = `usage:api:${account.email}:${MONTH_KEY()}`;
  const used = await cache().incr!(usageKey, 60 * 60 * 24 * 40);
  if (used > limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason:
        "Monthly API quota exceeded. Upgrade your plan or wait for the reset.",
    };
  }
  return { allowed: true, remaining: Math.max(0, limit - used), limit };
}

/** 批量查询行数授权（按用户层级 + x-api-key 账户） */
export async function authorizeBulk(
  planId: PlanId,
  requestedRows: number
): Promise<QuotaResult> {
  const plan = await getPlan(planId);
  const limit = plan.limits.bulkRowLimitPerBatch;
  if (requestedRows > limit) {
    return {
      allowed: false,
      remaining: limit,
      limit,
      reason: `Bulk batch limit for the current plan is ${limit} rows. Upgrade to process more.`,
    };
  }
  // 每日行数防滥用（以计划为粒度计数，上限从套餐配置读取）
  const identity = planId;
  const rowKey = `usage:bulk:${identity}:${new Date().toISOString().slice(0, 10)}`;
  const usedRows = await cache().incr!(rowKey, 60 * 60 * 26);
  const dailyCap = plan.limits.bulkDailyCap;
  if (usedRows > dailyCap) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: "Daily bulk row cap reached.",
    };
  }
  return { allowed: true, remaining: Math.max(0, limit - requestedRows), limit };
}

/** 用一份无印报告点数 */
export async function spendCredit(
  email: string
): Promise<{ ok: boolean; remaining: number }> {
  const account = await getAccountByEmail(email);
  if (!account || account.credits <= 0) {
    return { ok: false, remaining: 0 };
  }
  await upsertAccount(email, {
    credits: account.credits - 1,
    creditsSpent: (account.creditsSpent ?? 0) + 1,
  });
  return { ok: true, remaining: account.credits - 1 };
}
/* ---------------------------------------------------------------------------
 * 管理员账户操作（Admin 后台调用）
 * ------------------------------------------------------------------------- */

/**
 * 发放 / 重置 API Key：已有 Key 且非 reset 时幂等返回原 Key；
 * reset 时旧 Key 映射立即失效并签发新 Key。
 */
export async function issueApiKey(
  email: string,
  { reset = false }: { reset?: boolean } = {}
): Promise<string> {
  const keyName = email.toLowerCase();
  const existing = await getAccountByEmail(keyName);
  if (existing?.apiKey && !reset) return existing.apiKey;

  const newKey = generateApiKey();
  if (existing?.apiKey) {
    await cache().del(`key:${existing.apiKey}`);
  }
  await upsertAccount(keyName, {
    apiKey: newKey,
    plan: existing?.plan ?? "api-starter",
    status: (existing?.status ?? "active") as SubscriptionStatus,
  });
  return newKey;
}

/** 撤销 API Key（删除 key 映射与账户内记录） */
export async function revokeApiKey(email: string): Promise<void> {
  const keyName = email.toLowerCase();
  const existing = await getAccountByEmail(keyName);
  if (existing?.apiKey) {
    await cache().del(`key:${existing.apiKey}`);
  }
  await upsertAccount(keyName, { apiKey: undefined as never });
}

/** 停用 / 恢复账户：cancelled / expired 拒绝权益，active 恢复 */
export async function setAccountStatus(
  email: string,
  status: SubscriptionStatus
): Promise<void> {
  await upsertAccount(email.toLowerCase(), { status });
}

/** 账户指纹（webhook / 邮件密钥） */
export function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 20);
}