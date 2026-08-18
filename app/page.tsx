import type { Metadata } from "next";
import Link from "next/link";
import {
  Landmark,
  Radar,
  RefreshCcw,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { SearchBox } from "@/components/features/SearchBox";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { QuickLinks } from "@/components/ui/QuickLinks";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { AdSlot } from "@/components/ui/AdSlot";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const metadata: Metadata = {
  title: "Instant UK Company & VAT Verification — qxx.uk",
  description:
    "Verify UK company registration status, corporate filings and VAT validity in seconds. Live data from Companies House and HMRC public registers. Free, no sign-up.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const lang = await getLang();
  const dict = getDict(lang);
  const faq = getFaqData(lang);

  const FEATURES = [
    { icon: Landmark, title: dict.why.f1Title, desc: dict.why.f1Desc },
    { icon: Radar, title: dict.why.f2Title, desc: dict.why.f2Desc },
    { icon: TerminalSquare, title: dict.why.f3Title, desc: dict.why.f3Desc },
    { icon: RefreshCcw, title: dict.why.f4Title, desc: dict.why.f4Desc },
  ];

  const faqItems = [faq.dataSources, faq.vatFormat, faq.freeToUse, faq.howFresh];

  return (
    <div>
      {/* Hero — 带品牌背景图 */}
      <section className="relative overflow-hidden border-b border-slate-200">
        {/* 背景图（SVG 程序生成，零请求开销） */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/hero-bg.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {dict.hero.badge}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-8 w-full">
            <SearchBox />
          </div>
          <TrustBadges />

          {/* Leaderboard 广告位：搜索框正下方 */}
          <div className="mt-10 w-full max-w-[728px]">
            <AdSlot slot="leaderboard-home" format="horizontal" className="h-[90px] w-full" />
          </div>
        </div>
        </div>
      </section>
      <QuickLinks />

      {/* Why Use qxx.uk */}
      <section aria-label={dict.why.title} className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {dict.why.title}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          {dict.why.subtitle}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 详情页广告位 */}
      <div className="mx-auto mt-14 w-full max-w-[728px] px-4">
        <AdSlot slot="rectangle-home-1" format="rectangle" className="h-[250px] w-full" />
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <FaqSection heading={faq.heading} items={faqItems} />
      </div>

      {/* 变现 CTA：分层定价 — 带品牌 SVG 背景 */}
      <section className="relative mx-auto mt-14 w-full max-w-4xl overflow-hidden px-4 sm:px-6">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/images/cta-bg.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-6 rounded-2xl px-6 py-10 text-center bg-slate-900/85 backdrop-blur-sm sm:px-12">
          <h2 className="text-2xl font-bold text-white">{dict.cta.title}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300">{dict.cta.desc}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <TerminalSquare className="h-4 w-4" aria-hidden="true" />
              {dict.cta.viewPricing}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-400"
            >
              {dict.cta.tryBatch}
            </Link>
          </div>
        </div>
      </section>

      {/* 联盟推荐 */}
      <AffiliateSection />
    </div>
  );
}
