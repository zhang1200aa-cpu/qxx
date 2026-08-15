/**
 * POST /api/auth/demo-login — 仅开发/演示环境的无密码登录
 *
 * 生产环境请使用 Clerk（/sign-in 页面）。此端点仅在 demoMode() 下可用，
 * 不涉及任何密码/验证码逻辑，用于本地验证"注册后解锁高级功能"的边界。
 */
import { NextResponse } from "next/server";
import { setDemoSession, demoMode } from "@/lib/auth/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!demoMode()) {
    return NextResponse.json(
      { success: false, error: { code: "demo_disabled", message: "Demo login is disabled in production." } },
      { status: 403 }
    );
  }
  let body: { email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: { code: "bad_email", message: "Invalid email address." } },
      { status: 400 }
    );
  }
  await setDemoSession(email, body.name?.trim() || undefined);
  return NextResponse.json({ success: true, data: { email, name: body.name ?? null, demo: true } });
}