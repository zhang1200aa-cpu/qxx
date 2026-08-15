/**
 * POST /api/auth/demo-logout — 清除演示会话
 */
import { NextResponse } from "next/server";
import { clearDemoSession } from "@/lib/auth/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearDemoSession();
  return NextResponse.json({ success: true });
}