import type { Metadata } from "next";
import { SearchBox } from "@/components/features/SearchBox";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { AdSlot } from "@/components/ui/AdSlot";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const metadata: Metadata = {
  title: "UK VAT Number Validator — Check HMRC VAT Registration",
  description:
    "Verify any UK VAT number against official HMRC records in real time. Check registered business name, address and validity. Free UK VAT number lookup.",
  alternates: { canonical: "/vat" },
};

export default async function VatLandingPage() {
  const lang = await getLang();
  const dict = getDict(lang);
  const faq = getFaqData(lang);

  const faqItems = [faq.vatHow, faq.vatFormat, faq.dataSources, faq.freeToUse];

  const benefits = [
    {
      title: dict.cards.vatNumber,
      desc: dict.badges.validVat + " / " + dict.badges.invalidVat,
    },
    {
      title: dict.cards.businessName,
      desc: dict.cards.officialAddress,
    },
    {
      title: dict.actions.downloadPdf,
      desc: dict.actions.copySummary,
    },
  ];

  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {dict.search.tabVat}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {dict.hero.subtitle}
          </p>
          <div className="mt-8 w-full">
            <SearchBox initialTab="vat" />
          </div>
          <TrustBadges />
          <div className="mt-10 w-full max-w-[728px]">
            <AdSlot slot="leaderboard-vat" format="horizontal" className="h-[90px] w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-3xl px-4 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {dict.trust.liveSync}
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
          {benefits.map((b, i) => (
            <li key={b.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="mt-0.5 font-mono font-bold text-blue-700">0{i + 1}</span>
              <span>
                <strong className="text-slate-900">{b.title}</strong> — {b.desc}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto mt-12 w-full max-w-[728px] px-4">
        <AdSlot slot="rectangle-vat-1" format="rectangle" className="h-[250px] w-full" />
      </div>

      <div className="mt-16">
        <FaqSection heading={faq.heading} items={faqItems} />
      </div>

      <AffiliateSection title={dict.affiliate.title} />
    </div>
  );
}