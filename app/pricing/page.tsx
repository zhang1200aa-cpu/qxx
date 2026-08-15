import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/billing";
import { PLAN_ZH, PRICING_ZH } from "@/lib/i18n-zh";
import { getLang, t, type Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Pricing — API, Bulk, Reports & Data Export",
  description:
    "Free company & VAT lookups on the web. Paid plans for API automation ($9.99), accountant bulk CSV ($29), compliance PDF reports ($3) and lead data export ($29) — built for UK B2B teams.",
  alternates: { canonical: "/pricing" },
};

const HIGHLIGHT: PlanId = "accountant-pro";

// 对比表行定义（feature / values 均为 [英文, 中文] 二元组，配合 t(lang, en, zh) 使用）
const ROWS: { feature: [string, string]; values: [string, string][] }[] = [
  {
    feature: ["Single web lookups", "网页单次查询"],
    values: [
      ["Unlimited", "✓ 不限"],
      ["Yes", "✓"],
      ["Yes", "✓"],
      ["Yes", "✓"],
      ["—", "—"],
    ],
  },
  {
    feature: ["JSON API (REST)", "JSON API（REST）"],
    values: [
      ["IP rate-limited", "IP 限流"],
      ["10,000/month", "10,000/月"],
      ["50,000/month", "50,000/月"],
      ["—", "—"],
      ["—", "—"],
    ],
  },
  {
    feature: ["Bulk batch rows / run", "单次批量行数"],
    values: [
      ["5", "5"],
      ["200", "200"],
      ["5,000", "5,000"],
      ["5", "5"],
      ["5,000", "5,000"],
    ],
  },
  {
    feature: ["PDF compliance report", "PDF 合规报告"],
    values: [
      ["Watermarked", "带水印"],
      ["Watermarked", "带水印"],
      ["Watermarked", "带水印"],
      ["No watermark", "无水印"],
      ["—", "—"],
    ],
  },
  {
    feature: ["Filing deadline alerts", "申报临期提醒"],
    values: [
      ["—", "—"],
      ["—", "—"],
      ["30/14/7/3-day alerts", "✓ 30/14/7/3天"],
      ["—", "—"],
      ["—", "—"],
    ],
  },
  {
    feature: ["CSV / data export", "CSV / 数据导出"],
    values: [
      ["—", "—"],
      ["—", "—"],
      ["50,000 rows", "50,000 行"],
      ["—", "—"],
      ["5,000 rows", "5,000 行"],
    ],
  },
  {
    feature: ["Multi-account portfolio", "多客户组合视图"],
    values: [
      ["—", "—"],
      ["—", "—"],
      ["Yes", "✓"],
      ["—", "—"],
      ["—", "—"],
    ],
  },
  {
    feature: ["Email support", "邮件支持"],
    values: [
      ["—", "—"],
      ["Yes", "✓"],
      ["Priority", "优先"],
      ["Yes", "✓"],
      ["Yes", "✓"],
    ],
  },
];

// FAQ（q / a 均为 [英文, 中文] 二元组）
const FAQ_ITEMS: { q: [string, string]; a: [string, string] }[] = [
  {
    q: ["If the data is public, why do you charge?", "数据既然是公开的，为什么收费？"],
    a: [
      "You're not paying for the data — you're paying for engineering: live integration, caching, compliance-grade output, rate-limit management and the hours it saves. Public registers stay free; our tooling doesn't.",
      "你付的不是数据，而是工程服务：实时对接、缓存、合规输出、限流管理与省下的人工时间。公共注册表必须免费，我们的工具服务收费。",
    ],
  },
  {
    q: ["How do API keys work after subscribing?", "订阅后 API Key 怎么用？"],
    a: [
      "After checkout, our webhook issues an API key instantly. Send it as the x-api-key header. Quotas reset monthly on your signup date. No key = free tier limits.",
      "结账成功后 webhook 会即时下发 API Key，放在 x-api-key 请求头即可。月度配额按订阅日重置；无 Key 走免费额度。",
    ],
  },
  {
    q: ["Can I cancel anytime?", "可以随时取消吗？"],
    a: [
      "Yes. Monthly plans cancel immediately from the billing provider; API access continues until the end of the billing period.",
      "可以。月度计划在支付渠道即时取消；API 访问持续到账单周期结束。",
    ],
  },
  {
    q: ["Do you offer trial access?", "支持试用吗？"],
    a: [
      "Every plan path starts with the free tier. Request a trial API key by emailing ai@qxx.uk — we usually reply within one business day.",
      "所有路径都从免费层开始。需要试用 Key 可发邮件至 ai@qxx.uk，通常一个工作日内回复。",
    ],
  },
];

// 英文（默认）套餐文案：非 zh 语言统一使用，避免泄漏 billing.ts 中的中文字段
const PLAN_EN: Record<PlanId, { name: string; audience: string; features: string[]; cta: string; priceLabel: string }> = {
  free: {
    name: "Free",
    audience: "For individuals occasionally checking a company or a VAT number",
    features: [
      "Single web lookups · no sign-up",
      "Company status / address / filing deadlines",
      "VAT validity check (live HMRC)",
      "Postcode / council / ULEZ details",
      "PDF verification report (watermarked)",
      "API trial endpoints (60 req/min per IP)",
    ],
    cta: "Start free",
    priceLabel: "£0",
  },
  member: {
    name: "Free Member",
    audience: "Registered users — unlock a daily API quota, watchlists and a usage dashboard",
    features: [
      "50 free API calls per day",
      "Save companies to your watchlist",
      "Usage dashboard & watchlist management",
      "Email-only sign up (passwordless)",
    ],
    cta: "Sign up free",
    priceLabel: "£0",
  },
  "api-starter": {
    name: "API Starter",
    audience: "Online sellers / developers — validate VAT in real time at checkout",
    features: [
      "REST API: company / VAT / postcode endpoints",
      "10,000 API calls per month",
      "Millisecond responses · official data feeds",
      "Dedicated rate budget (off the free queue)",
      "JSON ready for any cart / CRM",
      "Email support",
    ],
    cta: "Get API key",
    priceLabel: "$9.99",
  },
  "accountant-pro": {
    name: "Accountant Pro",
    audience: "Accountants & formation agents maintaining hundreds of client companies",
    features: [
      "CSV batch lookups (up to 5,000 rows per run)",
      "Monthly company status monitoring",
      "Filing deadline (Accounts / CS) email alerts",
      "Automatic reminders at 30/14/7/3 days",
      "Pro web dashboard",
      "Export CSV / structured JSON",
    ],
    cta: "Start Pro",
    priceLabel: "$29",
  },
  "credit-pack": {
    name: "Credit Pack",
    audience: "Procurement / risk teams — supplier due diligence with official proof",
    features: [
      "Official PDF due-diligence reports (no watermark)",
      "Timestamp + official data-source authentication",
      "Covers status / incorporation / filing dates",
      "Valid for 12 months after purchase",
      "Archive-ready for internal risk systems",
      "Pay per report — no subscription",
    ],
    cta: "Buy credits",
    priceLabel: "$3 / report",
  },
  "lead-export": {
    name: "Lead Export",
    audience: "Export sales / BD teams building prospect lists from company data",
    features: [
      "5,000-row company data export",
      "Fields: name / CRN / SIC / address / incorporation year",
      "Active-company filter",
      "CSV download · ready for outreach",
      "Compliant: official public data only",
    ],
    cta: "Export contacts",
    priceLabel: "$29 / 5,000 rows",
  },
};

function planMeta(lang: Lang, id: PlanId) {
  const base = PLANS[id];
  if (lang === "zh") {
    const zh = PLAN_ZH[id];
    return { ...base, name: zh.name, audience: zh.audience, features: zh.features, cta: zh.cta };
  }
  // en / de 默认展示英文套餐文案（含英文 priceLabel）
  return { ...base, ...PLAN_EN[id] };
}

export default async function PricingPage() {
  const lang = await getLang();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {t(lang, "Simple pricing · cancel anytime", PRICING_ZH.badge)}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {lang === "zh" ? (
            <>
              {PRICING_ZH.title}
              <br className="hidden sm:block" /> {PRICING_ZH.title2}
            </>
          ) : (
            <>
              Official data stays free.
              <br className="hidden sm:block" /> You pay for speed, scale &amp; proof.
            </>
          )}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          {t(
            lang,
            "Data is published under the Open Government Licence and stays free for individual lookups. We charge where we save you hours: bulk automation, API integration, compliance reports and lead enrichment.",
            PRICING_ZH.sub
          )}
        </p>
      </div>

      {/* 套餐卡片 */}
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.filter((id) => id !== "free").map((id) => {
          const plan = planMeta(lang, id);
          const featured = id === HIGHLIGHT;
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                featured ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t(lang, "Most popular", "最受欢迎")}
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {plan.name}
              </p>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {plan.priceLabel}
                <span className="text-sm font-medium text-slate-400">
                  {" "}
                  {plan.period === "month" ? (lang === "zh" ? "/月" : "/month") : ""}
                </span>
              </p>
              <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
                {plan.audience}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/api/billing/checkout?plan=${id}`}
                className={`mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  featured
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* 免费卡 */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {t(lang, "Free — for individual lookups", PRICING_ZH.freeCardTitle)}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              {t(
                lang,
                "No account, no credit card. Web lookups for companies, VAT numbers and postcodes; PDF reports include a verification watermark. Free API endpoints are rate-limited per IP.",
                PRICING_ZH.freeCardDesc
              )}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
          >
            {t(lang, "Use the free search", PRICING_ZH.useFree)}
          </Link>
        </div>
      </div>

{/* 功能边界对比表 */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {t(lang, "Free vs. Paid — feature boundary", PRICING_ZH.tableTitle)}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">
                  {t(lang, "Capability", PRICING_ZH.tableCols[0])}
                </th>
                <th className="px-4 py-3 font-semibold text-emerald-700">
                  {t(lang, "Free", PRICING_ZH.tableCols[1])}
                </th>
                <th className="px-4 py-3 font-semibold">{t(lang, "API Starter", PRICING_ZH.tableCols[2])}</th>
                <th className="px-4 py-3 font-semibold">{t(lang, "Accountant Pro", PRICING_ZH.tableCols[3])}</th>
                <th className="px-4 py-3 font-semibold">{t(lang, "Credit Pack", PRICING_ZH.tableCols[4])}</th>
                <th className="px-4 py-3 font-semibold">{t(lang, "Lead Export", PRICING_ZH.tableCols[5])}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {ROWS.map((row) => (
                <Row
                  key={row.feature[0]}
                  lang={lang}
                  label={t(lang, row.feature[0], row.feature[1])}
                  values={row.values}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {t(lang, "Pricing questions", PRICING_ZH.pricingQ)}
        </h2>
        <div className="mt-4 space-y-3">
          {FAQ_ITEMS.map((f) => (
            <details key={f.q[0]} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 marker:hidden">
                {t(lang, f.q[0], f.q[1])}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t(lang, f.a[0], f.a[1])}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ label, values, lang }: { label: string; values: [string, string][]; lang: Lang }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-slate-800">{label}</td>
      {values.map(([en, zh], i) => (
        <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold text-emerald-700" : ""}`}>
          {t(lang, en, zh)}
        </td>
      ))}
    </tr>
  );
}