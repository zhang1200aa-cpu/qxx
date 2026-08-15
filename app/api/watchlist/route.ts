/**
 * /api/watchlist — 注册用户关注的公司清单（免费会员功能）
 *   GET                → 当前清单
 *   POST { crn }       → 添加
 *   DELETE ?crn=       → 移除
 * 未登录返回 401（由前端引导去 /sign-in，游客浏览不受影响）
 */
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = (userId: string) => `watchlist:${userId}`;
const CAP = 50;

async function list(userId: string): Promise<string[]> {
  const cache = getCache();
  return (await cache.get<string[]>(KEY(userId))) ?? [];
}

async function save(userId: string, crns: string[]): Promise<void> {
  const cache = getCache();
  await cache.set(KEY(userId), crns, 60 * 60 * 24 * 30); // 30 天
}

function cleanCrn(v: string): string | null {
  const digits = v.replace(/\D/g, "");
  return /^\d{6,8}$/.test(digits) ? digits : null;
}

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "auth_required", message: "Sign in to manage your watchlist." } },
      { status: 401 }
    );
  }
  const crns = await list(user.id);
  return NextResponse.json({ success: true, data: { crns, count: crns.length } });
}

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "auth_required", message: "Sign in to save companies." } },
      { status: 401 }
    );
  }
  let body: { crn?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "bad_request" } }, { status: 400 });
  }
  const crn = cleanCrn(body.crn ?? "");
  if (!crn) {
    return NextResponse.json({ success: false, error: { code: "bad_crn" } }, { status: 400 });
  }
  const current = await list(user.id);
  let next = current.includes(crn) ? current : [...current, crn];
  if (next.length > CAP) next = next.slice(-CAP);
  await save(user.id, next);
  return NextResponse.json({ success: true, data: { crns: next, added: crn } });
}

export async function DELETE(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "auth_required" } },
      { status: 401 }
    );
  }
  const crn = cleanCrn(new URL(req.url).searchParams.get("crn") ?? "");
  if (!crn) {
    return NextResponse.json({ success: false, error: { code: "bad_crn" } }, { status: 400 });
  }
  const current = await list(user.id);
  const next = current.filter((c) => c !== crn);
  await save(user.id, next);
  return NextResponse.json({ success: true, data: { crns: next, removed: crn } });
}