import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { BulkTool } from "@/components/features/BulkTool";
import { AlertOptIn } from "@/components/features/AlertOptIn";
import { getPlans } from "@/lib/plan-config";

export const metadata: Metadata = {
  title: "Dashboard — Bulk Tools, Alerts & API",
  description:
    "Bulk UK company / VAT / postcode verification, filing-deadline alerts and API access for accountants, risk teams and developers.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: true },
};

export default async function DashboardPage() {
  const plans = await getPlans();
  const planCards = [
    { plan: plans.free, note: "Web lookups + 5-row batches" },
    { plan: plans["api-starter"], note: "REST API · API quota/mo" },
    { plan: plans["accountant-pro"], note: "5,000-row batches + alerts" },
  ] as const;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Business Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Bulk checks, deadline alerts and API automation — the paid features that
            save accountants, risk and sales teams hours every week.
          </p>
        </div>
        <Link
          href="/pricing"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700"
        >
          Upgrade plan
        </Link>
      </div>

      {/* 计划配额概览 */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {planCards.map(({ plan, note }) => (
          <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {plan.name}
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {plan.priceLabel}
              <span className="text-xs font-medium text-slate-400">
                {" "}
                {plan.period === "month" ? "/month" : ""}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BulkTool />
        </div>
        <div className="space-y-6">
          <AlertOptIn />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <KeyRound className="h-4 w-4 text-blue-700" aria-hidden="true" />
              API keys
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              API Starter and Accountant Pro customers get an API key instantly after
              checkout. Use it with the{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">
                x-api-key
              </code>{" "}
              header.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
{`curl -H "x-api-key: qx_live_..." \\
  https://qxx.uk/api/v1/company?crn=00445790`}
            </pre>
            <Link
              href="/api-docs"
              className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline"
            >
              View full API docs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}