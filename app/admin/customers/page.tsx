/**
 * /admin/customers — 客户列表（仅管理员）
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { listMembers } from "@/lib/registry";
import { PLANS } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Customers — Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function CustomersPage({ searchParams }: Props) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { items, total } = await listMembers({ q, page, pageSize: 20 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">{total} registered member(s)</p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-700 hover:underline">
          ← Admin home
        </Link>
      </div>

      <form method="GET" className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">API / mo</th>
              <th className="px-4 py-3">Watched</th>
              <th className="px-4 py-3">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p.rec.email} className="hover:bg-blue-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${encodeURIComponent(p.rec.email)}`} className="font-semibold text-blue-700 hover:underline">
                    {p.rec.email}
                  </Link>
                  {p.rec.name ? <span className="ml-2 text-xs text-slate-400">{p.rec.name}</span> : null}
                </td>
                <td className="px-4 py-3 capitalize">{p.rec.tier}</td>
                <td className="px-4 py-3">{PLANS[p.rec.planId as keyof typeof PLANS]?.name ?? p.rec.planId}</td>
                <td className="px-4 py-3 capitalize">{p.subscription?.status ?? "member"}</td>
                <td className="px-4 py-3">{p.apiUsageMonth.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3">{p.watchlistCount}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {p.rec.lastSeen ? new Date(p.rec.lastSeen).toLocaleString("en-GB") : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  暂无会员记录。请先用注册账号登录一次（活跃登记），或稍后刷新。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <Link
          href={`/admin/customers?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-blue-400"
        >
          ← Prev
        </Link>
        <span>Page {page}</span>
        {items.length === 20 && (
          <Link
            href={`/admin/customers?q=${encodeURIComponent(q)}&page=${page + 1}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-blue-400"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}