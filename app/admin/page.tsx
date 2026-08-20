/**
 * /admin — 管理后台仪表盘（仅 ADMIN_EMAILS）
 * 数据源：lib/registry 会员索引（内存/Redis 缓存层）+ lib/search-stats 前台搜索统计
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Activity,
  Star,
  Search,
  Settings,
  Package,
  KeyRound,
  BarChart3,
  MousePointerClick,
  CalendarDays,
  SearchCheck,
} from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { adminStats } from "@/lib/registry";
import { SeoAnalytics } from "@/components/features/SeoAnalytics";
import type { SearchType } from "@/lib/search-stats";

export const metadata: Metadata = {
  title: "Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TYPE_META: Record<SearchType, { label: string; sub: string }> = {
  company: { label: "公司搜索 (Company)", sub: "/search · /company" },
  vat: { label: "VAT 验证", sub: "/vat/{vrn}" },
  postcode: { label: "邮编查询", sub: "/postcode/{code}" },
};

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const stats = await adminStats();
  const { search } = stats;
  const cards = [
    { icon: Users, label: "Registered members", value: stats.members },
    { icon: CreditCard, label: "Subscribers", value: stats.subscribers },
    { icon: Activity, label: "API calls this month", value: stats.apiCallsMonth },
    { icon: Star, label: "Watchlist entries", value: stats.watchlists },
  ];

  // 前台搜索统计卡片
  const searchCards = [
    { icon: SearchCheck, label: "Searches today", value: search.today.total },
    { icon: MousePointerClick, label: "Guest searches today", value: search.today.guest },
    { icon: Users, label: "Member searches today", value: search.today.member },
    { icon: CalendarDays, label: "Searches this month", value: search.month.total },
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

      {/* 前台搜索统计面板 */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <BarChart3 className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Frontend Search Analytics
          </h2>
          <span className="text-xs text-slate-400">游客 / 注册会员前台界面搜索 · 已过滤爬虫</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {searchCards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-sm">
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

        {/* 按类型/身份拆分明细 */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">搜索类型</th>
                <th className="px-4 py-3 text-right">游客 (Guest)</th>
                <th className="px-4 py-3 text-right">注册会员 (Member)</th>
                <th className="px-4 py-3 text-right">今日合计</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(TYPE_META) as SearchType[]).map((t) => {
                const row = search.today.byType[t];
                return (
                  <tr key={t} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{TYPE_META[t].label}</p>
                      <p className="text-xs text-slate-400">{TYPE_META[t].sub}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{row.guest.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">{row.member.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{row.total.toLocaleString("en-GB")}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-800">合计</p>
                  <p className="text-xs text-slate-400">其中本月游客 {search.month.guest.toLocaleString("en-GB")} · 会员 {search.month.member.toLocaleString("en-GB")}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{search.today.guest.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{search.today.member.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{search.today.total.toLocaleString("en-GB")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO 性能面板 */}
      <div className="mt-10">
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
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700"
        >
          <Package className="h-4 w-4" aria-hidden="true" />
          套餐设置 →
        </Link>
        <Link
          href="/admin/keys"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Key 配置 →
        </Link>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Search Limit Settings →
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        数据来源为 Redis 持久化缓存（配置 REDIS_URL 时启用；未配置则回退内存缓存）。搜索统计自部署后开始累积，自动过滤搜索引擎/社交爬虫，重启服务数据不丢失。
      </p>
    </div>
  );
}
