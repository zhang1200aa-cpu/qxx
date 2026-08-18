/**
 * /api/admin/customers — 客户列表（仅管理员）
 *   GET ?q=&page=&limit= → { items: MemberProfile[], total }
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { listMembers } from "@/lib/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const sp = req.nextUrl.searchParams;
  const { items, total } = await listMembers({
    q: sp.get("q") ?? "",
    page: Number(sp.get("page") ?? 1),
    pageSize: Number(sp.get("limit") ?? 20),
  });
  return NextResponse.json({ success: true, data: { items, total } });
}