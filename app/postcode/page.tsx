import type { Metadata } from "next";
import { SearchBox } from "@/components/features/SearchBox";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { AdSlot } from "@/components/ui/AdSlot";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const metadata: Metadata = {
  title: "UK Postcode Lookup — District, Council & Area Guide",
  description:
    "Look up any UK postcode: local authority, parliamentary constituency, region, coordinates and London ULEZ status. Free postcode area guide with official ONS data.",
  alternates: { canonical: "/postcode" },
};

export default async function PostcodeLandingPage() {
  const lang = await getLang();
  const dict = getDict(lang);
  const faq = getFaqData(lang);

  const faqItems = [faq.postcodeWhat, faq.postcodeUlez, faq.dataSources, faq.freeToUse];

  const features = [
    dict.cards.council,
    dict.cards.constituency,
    dict.cards.coordinates,
    dict.cards.ulezStatus,
    dict.cards.nutsCode,
    dict.cards.nhsArea,
  ];

  return (
    <div>
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {dict.search.tabPostcode}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {dict.cards.postcodeOverview} — {dict.misc.trustedBy}
          </p>
          <div className="mt-8 w-full">
            <SearchBox initialTab="postcode" />
          </div>
          <TrustBadges />
          <div className="mt-10 w-full max-w-[728px]">
            <AdSlot slot="leaderboard-postcode" format="horizontal" className="h-[90px] w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-3xl px-4 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {dict.cards.postcodeOverview}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-12 w-full max-w-[728px] px-4">
        <AdSlot slot="rectangle-postcode-1" format="rectangle" className="h-[250px] w-full" />
      </div>

      <div className="mt-16">
        <FaqSection heading={faq.heading} items={faqItems} />
      </div>

      <AffiliateSection title={dict.affiliate.title} />
    </div>
  );
}