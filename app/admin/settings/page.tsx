/**
 * /admin/settings — 搜索限流设置管理
 * 可配置：游客间隔、会员每日搜索次数
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { getSearchLimits } from "@/lib/settings";
import { getPlans } from "@/lib/plan-config";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = {
  title: "Settings — Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const limits = await getSearchLimits();
  const plans = await getPlans();
  const memberPlan = plans.member;
  const starterPlan = plans["api-starter"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
            <SettingsIcon className="h-6 w-6 text-blue-700" aria-hidden="true" />
            Search Limit Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            配置游客与注册会员的前台搜索限额
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-700 hover:underline">
          ← Admin home
        </Link>
      </div>

      <SettingsForm initial={limits} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          当前生效的配额
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 text-xs leading-relaxed text-slate-600 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-slate-900">游客（未登录）</p>
            <p className="mt-1">
              前台搜索：每{" "}
              {Math.round(limits.guestIntervalSeconds / 3600 * 100) / 100} 小时{" "}
              {limits.guestMaxPerWindow} 次
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-slate-900">注册会员</p>
            <p className="mt-1">
              前台搜索：每天 {limits.memberDailySearchLimit} 次<br />
              网页 API：每天 {memberPlan.limits.webDailyApiCalls} 次
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-slate-900">付费套餐</p>
            <p className="mt-1">
              API Starter 月配额：{" "}
              {starterPlan.limits.apiCallsPerMonth.toLocaleString()} 次<br />
              网页 API：每天 {starterPlan.limits.webDailyApiCalls} 次
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          说明
        </h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
          <li>• <strong>游客</strong>（未登录）：按 IP 限流。默认每 2 小时允许 1 次查询。Google/Bing 爬虫不受此限制。</li>
          <li>• <strong>注册会员</strong>：每天最多 10 次前台搜索（公司/VAT/邮编查询共享配额）。</li>
          <li>• <strong>付费订阅用户</strong>：不限制前台搜索次数（API 调用仍遵守月度配额）。</li>
          <li>• 各套餐的 API / 批量 / 导出配额在 <Link href="/admin/plans" className="font-medium text-blue-700 hover:underline">套餐设置</Link> 中配置。</li>
          <li>• 修改即时生效，无需重启服务。</li>
        </ul>
      </div>
    </div>
  );
}