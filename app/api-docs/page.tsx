import type { Metadata } from "next";
import Link from "next/link";
import { Code2, CreditCard, KeyRound, Rocket } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Developer API — Bulk UK Company & VAT Verification",
  description:
    "Automated UK company, VAT and postcode verification. Free single lookups; API automation from $9.99/month; accountant bulk CSV and compliance report plans.",
  alternates: { canonical: "/api-docs" },
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/company?crn={crn}",
    desc: "Full Companies House profile for a company number.",
  },
  {
    method: "GET",
    path: "/api/v1/company?q={name}",
    desc: "Search companies by name, returns top matches.",
  },
  {
    method: "GET",
    path: "/api/v1/vat?vat={vatNumber}",
    desc: "Validate a UK VAT number against HMRC in real time.",
  },
  {
    method: "GET",
    path: "/api/v1/postcode?postcode={postcode}",
    desc: "Full postcode geography, council and ULEZ info.",
  },
  {
    method: "POST",
    path: "/api/v1/bulk",
    desc: "Batch lookups (companies / VAT / postcodes) in one call — CSV-ready.",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <Code2 className="h-8 w-8 text-blue-700" aria-hidden="true" />
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Developer API
        </h1>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Verify UK companies, VAT numbers and postcodes programmatically for checkout
        tax decisions, supplier onboarding, KYC and lead enrichment. Single lookups
        are free; paid plans add quota, bulk CSV and priority rate limits.
      </p>

      {/* 免费试用 */}
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-emerald-900">
          <Rocket className="h-5 w-5" aria-hidden="true" /> Try it now, free
        </h2>
        <p className="mt-1 text-sm text-emerald-800">
          No API key needed for individual lookups — try live examples right now:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-emerald-900">
          <li>
            <Link
              href="/api/v1/company?crn=00445790"
              className="font-mono text-xs underline hover:text-emerald-700"
            >
              {`${siteConfig.url}/api/v1/company?crn=00445790`}
            </Link>
          </li>
          <li>
            <Link
              href="/api/v1/vat?vat=123456789"
              className="font-mono text-xs underline hover:text-emerald-700"
            >
              {`${siteConfig.url}/api/v1/vat?vat=123456789`}
            </Link>
          </li>
          <li>
            <Link
              href="/api/v1/postcode?postcode=SW1A%201AA"
              className="font-mono text-xs underline hover:text-emerald-700"
            >
              {`${siteConfig.url}/api/v1/postcode?postcode=SW1A1AA`}
            </Link>
          </li>
        </ul>
      </section>

      {/* 端点列表 */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">Endpoints</h2>
        <div className="mt-4 space-y-3">
          {ENDPOINTS.map((e) => (
            <div
              key={e.path}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-blue-700 px-2 py-0.5 font-mono text-xs font-bold text-white">
                  {e.method}
                </span>
                <code className="font-mono text-xs text-slate-800">{e.path}</code>
              </div>
              <p className="mt-2 text-sm text-slate-500">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 批量调用示例 */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Batch check (bulk CSV)</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
{`curl -X POST "${siteConfig.url}/api/v1/bulk" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"type":"company","items":["00445790","00488639"]}'`}
        </pre>
        <p className="mt-2 text-xs text-slate-500">
          Free tier: 5 rows per batch. Accountant Pro: 5,000 rows + CSV export from the
          dashboard.
        </p>
      </section>
{/* 鉴权 */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <KeyRound className="h-5 w-5 text-blue-700" aria-hidden="true" /> Authentication &amp; quotas
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Paid subscribers receive an API key after checkout. Send it in the{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
            x-api-key
          </code>{" "}
          header. Quotas reset monthly on your signup date.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
{`curl -H "x-api-key: YOUR_API_KEY" \\
  "${siteConfig.url}/api/v1/company?crn=00445790"`}
        </pre>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Status codes: <code className="font-mono">401</code> invalid key ·{" "}
          <code className="font-mono">402</code> subscription inactive ·{" "}
          <code className="font-mono">429</code> quota exceeded / rate limited ·{" "}
          <code className="font-mono">404</code> record not found.
        </p>
      </section>

      {/* 分层计划 */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          Plans built for each job
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlanCard name="API Starter" price="$9.99/mo" points={["10,000 API calls / month", "Priority rate budget", "VAT + company + postcode"]} />
          <PlanCard name="Accountant Pro" price="$29/mo" points={["5,000-row CSV batches", "Filing-deadline alerts", "50,000 API calls / month"]} />
          <PlanCard name="Credit Pack" price="$3 / report" points={["No-watermark PDF reports", "Timestamps + source watermark", "Archive-ready for risk files"]} />
          <PlanCard name="Lead Export" price="$29 / 5,000 rows" points={["SIC / address / incorporation year", "Active-company filter", "CSV download for cold email"]} />
        </div>
        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Compare plans →
        </Link>
      </section>

      <p className="mt-8 text-xs leading-relaxed text-slate-400">
        All data is sourced from official UK public registers under the Open Government
        Licence v3.0. Checkout is handled by Lemon Squeezy (preferred) or Stripe — see{" "}
        <Link href="/pricing" className="text-blue-600 hover:underline">
          /pricing
        </Link>{" "}
        to subscribe.
      </p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  points,
}: {
  name: string;
  price: string;
  points: string[];
}) {
  return (
    <div className="rounded-xl bg-slate-800 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p>
      <p className="mt-1 text-lg font-bold">{price}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}