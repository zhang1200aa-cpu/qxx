/**
 * /admin/customers/[email] — 客户详情（仅管理员）
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { getMemberProfile } from "@/lib/registry";
import { type PlanId } from "@/lib/billing";
import { getPlan } from "@/lib/plan-config";
import { CustomerActions } from "./CustomerActions";

export const metadata: Metadata = {
  title: "Customer — Admin — qxx.uk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ email: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthRequiredError) notFound();
    throw err;
  }
  const { email } = await params;
  const profile = await getMemberProfile(decodeURIComponent(email));
  if (!profile) notFound();

  const sub = profile.subscription;
  const activePlan = sub ? await getPlan(sub.plan as PlanId) : null;
  const planName = activePlan?.name ?? sub?.plan ?? "member";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin/customers" className="text-sm font-medium text-blue-700 hover:underline">
        ← Customers
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{profile.rec.email}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.rec.name ?? "—"} · Registered {profile.rec.registeredAt.slice(0, 10)} · Last seen{" "}
            {new Date(profile.rec.lastSeen).toLocaleString("en-GB")}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
          {profile.rec.tier}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 账户概览 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Subscription</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Plan", planName],
              ["Status", sub?.status ?? "member（未建账户）"],
              ["Provider", sub?.provider ?? "—"],
              ["Credits", String(sub?.credits ?? 0)],
              ["Alerts", sub?.alertsEnabled ? "On" : "Off"],
              ["API Key", sub?.apiKey ? `${sub.apiKey.slice(0, 12)}…${sub.apiKey.slice(-6)}` : "—"],
              ["API used (month)", String(profile.apiUsageMonth)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-mono text-xs font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 操作表单 */}
        <CustomerActions
          email={profile.rec.email}
          initial={{
            plan: sub?.plan ?? "member",
            status: sub?.status ?? "active",
            credits: sub?.credits ?? 0,
            alertsEnabled: sub?.alertsEnabled ?? false,
            apiKey: sub?.apiKey,
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 关注清单 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
            Watchlist ({profile.watchlistCount})
          </h2>
          {profile.watchlist && profile.watchlist.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {profile.watchlist.slice(0, 20).map((crn) => (
                <li key={crn}>
                  <Link
                    href={`/company/${crn}`}
                    className="font-mono text-xs text-blue-700 hover:underline"
                    target="_blank"
                  >
                    {crn}
                  </Link>
                </li>
              ))}
              {profile.watchlist.length > 20 && (
                <li className="text-xs text-slate-400">… 等 {profile.watchlist.length} 家</li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">无关注记录。</p>
          )}
        </div>

        {/* 申报提醒订阅 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Filing alerts</h2>
          {profile.alerts ? (
            <ul className="mt-3 space-y-1">
              {profile.alerts.crns.map((crn) => (
                <li key={crn} className="font-mono text-xs text-slate-700">
                  {crn}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">未订阅申报提醒。</p>
          )}
        </div>
      </div>
    </div>
  );
}