/**
 * /api/admin/plans — 管理后台套餐设置 API
 *   GET               → 全部套餐（含默认值对比，供页面回显）
 *   PUT               → 保存套餐覆盖（数字/布尔/价格）
 *   POST ?action=reset → 重置为默认值
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getPlansWithDefaults,
  updatePlans,
  resetPlans,
  type PlanPatch,
} from "@/lib/plan-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const items = await getPlansWithDefaults();
  return NextResponse.json({ success: true, data: items });
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const patches = Array.isArray(body) ? (body as PlanPatch[]) : null;
  if (!patches) {
    return NextResponse.json(
      { success: false, error: "Expected an array of plan patches." },
      { status: 400 }
    );
  }

  try {
    const plans = await updatePlans(patches);
    return NextResponse.json({ success: true, data: plans });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save plans.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
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
    const plans = await resetPlans();
    return NextResponse.json({ success: true, data: plans });
  }
  return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
}