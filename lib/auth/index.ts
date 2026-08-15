/**
 * 认证抽象层 —— 分阶段、按需启用
 *
 * 设计原则（SEO 友好）：
 *   - 游客 = 默认状态，全站页面公开可爬，绝不弹注册框
 *   - 注册/登录 只出现在"高级功能"入口（账户、API 额度、批量、关注清单）
 *
 * 层级：
 *   guest      游客      → 免登录单次查询（IP 限流）
 *   member     注册用户   → 每天 50 次 API + 关注清单（免费）
 *   subscriber 付费用户   → 月度配额、CSV 批量、无印 PDF（billing 系统驱动）
 *
 * Provider 策略：
 *   1. Clerk（推荐）—— 配置 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 即启用，
 *      Google / 邮箱免密登录，前 10,000 MAU 免费
 *   2. Demo 模式（仅开发）—— 无密码 cookie 会话，用于本地验证权限边界；
 *      生产环境必须配置 Clerk 或等效 IdP
 */
import { getAccountByEmail, type SubscriptionAccount } from "@/lib/subscription";
import { PLANS, type PlanId } from "@/lib/billing";
import { getClerkSession, clerkUserRecord, clerkConfigured } from "./clerk";
import { getDemoUser, demoMode } from "./demo";

export type UserTier = "guest" | "member" | "subscriber";

export interface AuthUser {
  /** Clerk userId 或 demo:{email}；游客为 "anonymous" */
  id: string;
  email: string;
  name: string | null;
  tier: UserTier;
  planId: PlanId;
  isDemo: boolean;
  subscription: SubscriptionAccount | null;
}

export function guestUser(): AuthUser {
  return {
    id: "anonymous",
    email: "",
    name: null,
    tier: "guest",
    planId: "free",
    isDemo: false,
    subscription: null,
  };
}

/** 根据邮箱计算权益层级（付费状态由 billing 系统决定） */
async function resolveTier(email: string): Promise<{
  subscription: SubscriptionAccount | null;
  tier: UserTier;
  planId: PlanId;
}> {
  const sub = email ? await getAccountByEmail(email) : null;
  if (sub) {
    const isPaid = PLANS[sub.plan]?.priceUsd && PLANS[sub.plan].priceUsd! > 0;
    if (isPaid && sub.status === "active") {
      return { subscription: sub, tier: "subscriber", planId: sub.plan };
    }
  }
  return { subscription: sub ?? null, tier: "member", planId: sub?.plan ?? "member" };
}

/** 当前登录用户（服务器环境调用）；未登录始终返回 guest，绝不阻塞游客 */
export async function getCurrentUser(): Promise<AuthUser> {
  // ---- Channel 1: Clerk（生产主方案）----
  if (clerkConfigured()) {
    const session = await getClerkSession();
    if (session) {
      const record = await clerkUserRecord(session.userId);
      const email = (record?.email ?? "").toLowerCase();
      const resolved = await resolveTier(email);
      return {
        id: session.userId,
        email,
        name: record?.name ?? null,
        tier: resolved.tier,
        planId: resolved.planId,
        isDemo: false,
        subscription: resolved.subscription,
      };
    }
    return guestUser();
  }

  // ---- Channel 2: Demo 模式（仅开发/演示环境）----
  if (demoMode()) {
    const demo = await getDemoUser();
    if (demo) {
      const resolved = await resolveTier(demo.email);
      return {
        id: `demo:${demo.email}`,
        email: demo.email,
        name: demo.name ?? null,
        tier: resolved.tier,
        planId: resolved.planId,
        isDemo: true,
        subscription: resolved.subscription,
      };
    }
  }

  return guestUser();
}

/** 已登录则返回用户，否则 null（用于"按需登录"的页面/API） */
export async function optionalUser(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return user.tier === "guest" ? null : user;
}

/** 要求登录（仅高级功能入口） */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (user.tier === "guest") {
    throw new AuthRequiredError();
  }
  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}