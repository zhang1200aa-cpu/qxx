/**
 * /admin/plans — 套餐设置（可配置每个套餐的限额/价格/功能开关，即时反馈到前端）
 * 在保留原"搜索限制设置"基础上扩展为全套餐管理。
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { getPlansWithDefaults } from "@/lib/plan-config";
import { PlansForm } from "./PlansForm";

export const metadata: Metadata = {
  title: "Plans — Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const items = await getPlansWithDefaults();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
            <Package className="h-6 w-6 text-blue-700" aria-hidden="true" />
            套餐设置
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            配置各套餐的 API 配额、批量行数、导出行数、报告点数与功能开关。保存后即时生效并反馈到前台。
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-700 hover:underline">
          ← Admin home
        </Link>
      </div>

      <PlansForm initial={items} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">说明</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
          <li>• 每个套餐可单独设置；<strong>数字字段</strong>用输入框，<strong>功能开关</strong>用勾选框。</li>
          <li>• 改动点击「保存」后写入 <code className="rounded bg-slate-100 px-1">data/plans-config.json</code>，即时生效、无需重启。</li>
          <li>• 前台账户页/用量 API/定价对比会读取这里的值（不再使用旧硬编码 50/1000 等）。</li>
          <li>• 游客与注册会员的「前台搜索次数」在下方「搜索限制设置」页配置。</li>
        </ul>
      </div>
    </div>
  );
}