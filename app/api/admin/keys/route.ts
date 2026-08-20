/**
 * /api/admin/keys — Key 配置 API（运行时配置层）
 *   GET                → 列出所有可管理 KEY 及其"已配置值/生效值"
 *   PUT { values }     → 保存运行时 KEY 覆盖（存 data/env-config.json，不重启即生效）
 *   POST ?action=reset → 清空所有运行时 KEY 覆盖
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  describeKeys,
  saveEnvConfig,
  resetEnvConfig,
} from "@/lib/env-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const keys = describeKeys();
  return NextResponse.json({ success: true, data: keys });
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  let body: { values?: Record<string, string>; storeEmpty?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body.values !== "object" || body.values === null) {
    return NextResponse.json(
      { success: false, error: "Expected { values: {...} }." },
      { status: 400 }
    );
  }

  try {
    const { saved, matched } = saveEnvConfig(body.values, {
      storeEmpty: Boolean(body.storeEmpty),
    });
    return NextResponse.json({ success: true, data: { saved, matched } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save keys.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
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
    resetEnvConfig();
    return NextResponse.json({ success: true, data: describeKeys() });
  }
  return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
}