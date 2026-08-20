/**
 * /admin/keys — Key 配置管理（运行时配置层）
 * 可热配置各 API Key/Token，保存后无需重启（存 data/env-config.json）。
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { describeKeys } from "@/lib/env-config";
import { KeysForm } from "./KeysForm";

export const metadata: Metadata = {
  title: "Keys — Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const keys = describeKeys();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
            <KeyRound className="h-6 w-6 text-blue-700" aria-hidden="true" />
            Key 配置
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            可视化配置各 API Key / Token。保存后立即生效，无需重启（除非标注需重启）。
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-blue-700 hover:underline">
          ← Admin home
        </Link>
      </div>

      <KeysForm initial={keys} />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">说明</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
          <li>• 这里的值写入 <code className="rounded bg-slate-100 px-1">data/env-config.json</code>，优先于 <code className="rounded bg-slate-100 px-1">.env.local</code>。</li>
          <li>• 对运行时读取的 KEY（如 GSC Token、Gemini）保存后立即生效。</li>
          <li>• 需要在进程启动时初始化的（如 Lemon Squeezy/Stripe）保存后需手动重启服务。</li>
        </ul>
      </div>
    </div>
  );
}