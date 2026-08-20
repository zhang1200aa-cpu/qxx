/**
 * /api/admin/settings — 管理后台设置 API
 *   GET  → 读取当前搜索限流配置
 *   PUT  → 更新搜索限流配置
 *   POST ?action=reset → 重置为默认值
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import {
  getSearchLimits,
  updateSearchLimits,
  resetSearchLimits,
  type SearchLimits,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const limits = await getSearchLimits();
  return NextResponse.json({ success: true, data: limits });
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  let body: Partial<SearchLimits>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  // 只允许更新我们知道的字段
  const patch: Partial<SearchLimits> = {};
  if (body.guestIntervalSeconds !== undefined) {
    patch.guestIntervalSeconds = Number(body.guestIntervalSeconds);
  }
  if (body.memberDailySearchLimit !== undefined) {
    patch.memberDailySearchLimit = Number(body.memberDailySearchLimit);
  }
  if (body.guestMaxPerWindow !== undefined) {
    patch.guestMaxPerWindow = Number(body.guestMaxPerWindow);
  }

  try {
    const limits = await updateSearchLimits(patch);
    return NextResponse.json({ success: true, data: limits });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to save settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const action = req.nextUrl.searchParams.get("action");
  if (action === "reset") {
    const limits = await resetSearchLimits();
    return NextResponse.json({ success: true, data: limits });
  }
  return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
}