/**
 * 演示会话（仅开发/演示环境）
 *
 * 用途：本地验证"注册后解锁高级功能"的边界逻辑，不涉及密码/邮箱验证码。
 * 生产环境必须配置 Clerk（或等效 IdP），演示模式默认只在
 *   NODE_ENV === "development" 或显式 AUTH_DEMO_MODE=1 时启用。
 */
import { cookies } from "next/headers";

export const DEMO_SESSION_COOKIE = "qxx_demo_session";

export function demoMode(): boolean {
  return (
    process.env.AUTH_DEMO_MODE === "1" || process.env.NODE_ENV === "development"
  );
}

interface DemoSession {
  email: string;
  name?: string;
  createdAt: string;
}

export async function getDemoUser(): Promise<{ email: string; name: string | null } | null> {
  if (!demoMode()) return null;
  try {
    const store = await cookies();
    const raw = store.get(DEMO_SESSION_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed.email || !parsed.email.includes("@")) return null;
    return { email: parsed.email.toLowerCase(), name: parsed.name ?? null };
  } catch {
    return null;
  }
}

export async function setDemoSession(email: string, name?: string): Promise<void> {
  if (!demoMode()) return;
  const payload: DemoSession = {
    email: email.toLowerCase(),
    name,
    createdAt: new Date().toISOString(),
  };
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    // demo 会话为演示专用：开发环境与显式演示模式无需 HTTPS 限定，避免本地弃用
    secure: process.env.NODE_ENV === "production" && !demoMode(),
    maxAge: 60 * 60 * 24 * 30, // 30 天
    path: "/",
  });
}

export async function clearDemoSession(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(DEMO_SESSION_COOKIE);
  } catch {
    // 忽略
  }
}