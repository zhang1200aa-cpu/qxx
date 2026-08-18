/**
 * /admin — 管理后台仪表盘（仅 ADMIN_EMAILS）
 * 数据源：lib/registry 会员索引（内存/Redis 缓存层）
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, CreditCard, Activity, Star, Search } from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { adminStats } from "@/lib/registry";
import { SeoAnalytics } from "@/components/features/SeoAnalytics";

export const metadata: Metadata = {
  title: "Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const stats = await adminStats();
  const cards = [
    { icon: Users, label: "Registered members", value: stats.members },
    { icon: CreditCard, label: "Subscribers", value: stats.subscribers },
    { icon: Activity, label: "API calls this month", value: stats.apiCallsMonth },
    { icon: Star, label: "Watchlist entries", value: stats.watchlists },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Customer operations · qxx.uk</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <c.icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {c.value.toLocaleString("en-GB")}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* SEO 性能面板 */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Search className="h-4 w-4 text-blue-700" aria-hidden="true" />
            SEO Performance
          </h2>
        </div>
        <div className="mt-3">
          <SeoAnalytics />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/customers"
          className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          Customers &amp; Subscriptions →
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        数据来源为运行缓存（Redis/内存），与线上服务同寿命。生产建议配置 REDIS_URL 持久化；VPS 当前为内存缓存。
      </p>
    </div>
  );
}