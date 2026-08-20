import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MapPin, Printer } from "lucide-react";
import {
  lookupPostcode,
  normalizePostcode,
  PostcodeError,
  londonZoneInfo,
} from "@/lib/postcodes";
import { InfoCard, Field } from "@/components/ui/InfoCard";
import { CopyButton, PrintReportButton } from "@/components/ui/ActionButtons";
import { JsonLd, BreadcrumbJsonLd } from "@/components/ui/JsonLd";
import { AdSlot } from "@/components/ui/AdSlot";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { PdfWatermark } from "@/components/ui/PdfWatermark";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";
import { recordFrontendSearch } from "@/lib/search-stats";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  try {
    const data = await lookupPostcode(code);
    const r = data.result!;
    const display = normalizePostcode(code);
    const title = `${display} Postcode Info, Council & Area Guide`;
    return {
      title,
      description: `${display} — ${r.admin_district ?? "UK"} district, ${
        r.parliamentary_constituency ?? "constituency"
      }, ${r.region ?? r.country ?? "region"}. Full postcode data, coordinates ${
        r.latitude != null && r.longitude != null
          ? `(${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)})`
          : ""
      } and London ULEZ status.`,
      alternates: { canonical: `/postcode/${display}` },
      openGraph: {
        title,
        description: `${display} postcode lookup: ${r.admin_district ?? "local authority"}, ${r.parliamentary_constituency ?? "constituency"}, ${r.region ?? "region"}.`,
        url: `/postcode/${display}`,
        type: "website",
      },
    };
  } catch (err) {
    if (err instanceof PostcodeError && (err.status === 400 || err.status === 404)) {
      return { title: `${normalizePostcode(code)} Postcode Lookup` };
    }
    return { title: `${normalizePostcode(code)} — Lookup failed` };
  }
}
export default async function PostcodeDetailPage({ params }: PageProps) {
  const { code } = await params;
  const lang = await getLang();
  const dict = getDict(lang);
  const c = dict.cards;
  const a = dict.actions;
  let data;
  try {
    data = await lookupPostcode(code);
  } catch (err) {
    if (err instanceof PostcodeError && (err.status === 400 || err.status === 404)) {
      notFound();
    }
    throw err;
  }

  // 统计前台邮编查询（游客 / 注册会员分别计数；自动过滤爬虫）
  await recordFrontendSearch("postcode");

  const r = data.result!;
  const display = normalizePostcode(code);
  const zone = londonZoneInfo({
    postcode: r.postcode,
    admin_district: r.admin_district,
  });
  const district = r.postcode.match(/^[A-Z]{1,2}\d[A-Z]?/)?.[0] ?? r.postcode;

  const summary = [
    `Postcode: ${display}`,
    `Postcode District: ${district}`,
    `Local Authority / Council: ${r.admin_district ?? "—"}`,
    `Region: ${r.region ?? r.country ?? "—"}`,
    `Parliamentary Constituency: ${r.parliamentary_constituency ?? "—"}`,
    `London ULEZ / Congestion Status: ${zone.status}`,
    `Coordinates: ${r.latitude ?? "—"}, ${r.longitude ?? "—"}`,
    `NUTS Code: ${r.codes?.nuts ?? "—"}`,
    `Verified at: ${new Date().toISOString()}`,
    "Source: Office for National Statistics / Postcodes.io (Open Government Licence v3.0) via qxx.uk",
  ]
    .filter(Boolean)
    .join("\n");

  const faqData = getFaqData(lang);
  const faqItems = [
    {
      question: `What council and constituency covers ${display}?`,
      answer: `${display} is located in the ${r.admin_district ?? "relevant"} local authority area${
        r.parliamentary_constituency
          ? ` and falls within the ${r.parliamentary_constituency} parliamentary constituency`
          : ""
      }.`,
    },
    {
      question: `Is ${display} in the London ULEZ or congestion charge zone?`,
      answer: `Based on the official ONS administrative data, this postcode is ${zone.status.toLowerCase()}. For the definitive boundary, check the TfL online map.`,
    },
    faqData.dataSources,
    faqData.freeToUse,
  ];

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Postcode Lookup", path: "/postcode" },
          { name: display, path: `/postcode/${display}` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Place",
          name: `${display} Postcode Area`,
          url: `${siteConfig.url}/postcode/${display}`,
          address: {
            "@type": "PostalAddress",
            postalCode: display,
            addressCountry: "GB",
          },
          geo:
            r.latitude != null && r.longitude != null
              ? {
                  "@type": "GeoCoordinates",
                  latitude: r.latitude,
                  longitude: r.longitude,
                }
              : undefined,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />

      <div className="print-report-header">
        <p className="text-lg font-bold">
          {siteConfig.name} — Postcode Area Report
        </p>
        <p className="text-xs text-slate-500">
          Generated {new Date().toISOString()} · {display}
        </p>
      </div>
      <PdfWatermark entity={display} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav className="no-print mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            {dict.misc.home}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/postcode" className="hover:text-blue-700">
            {dict.nav.postcodeLookup}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-slate-900">{display}</span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <MapPin className="h-7 w-7 text-blue-700" aria-hidden="true" />
            {display} — {c.postcodeOverview}
          </h1>
          <p className="text-sm text-slate-500">
            {r.admin_district ?? "Local authority"}, {r.region ?? r.country ?? "UK"}
          </p>
        </div>
<div className="mt-6">
          <InfoCard
            title={c.postcodeOverview}
            actions={
              <>
                <CopyButton text={summary} label={a.copySummary} />
                <PrintReportButton label={a.downloadPdfGuide}>
                  <Printer className="h-4 w-4" aria-hidden="true" />
                </PrintReportButton>
              </>
            }
          >
            <Field label={c.postcode}>
              <span className="font-mono font-semibold">{display}</span>
            </Field>
            <Field label={c.postcodeDistrict}>{district}</Field>
            <Field label={c.council}>
              {r.admin_district ?? "—"}
            </Field>
            <Field label={c.region}>
              {[r.region, r.country].filter(Boolean).join(", ") || "—"}
            </Field>
            <Field label={c.constituency}>
              {r.parliamentary_constituency ?? "—"}
            </Field>
            <Field label={c.ulezStatus}>
              <span className="font-semibold text-slate-900">{zone.status}</span>
            </Field>
            <Field label={c.coordinates}>
              {r.latitude != null && r.longitude != null ? (
                <span className="font-mono break-all">
                  {r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}
                </span>
              ) : (
                "—"
              )}
            </Field>
            <Field label={c.nutsCode}>
              <span className="font-mono">
                {r.codes?.nuts ?? r.nuts ?? "—"}
              </span>
            </Field>
            <Field label={c.nhsArea}>
              {r.nhs_ha ?? "—"}
            </Field>
          </InfoCard>
        </div>

        <div className="mt-6">
          <AdSlot
            slot="rectangle-postcode-1"
            format="rectangle"
            className="h-[250px] w-full"
          />
        </div>

        <div className="mt-14">
          <FaqSection heading={dict.faq.heading} items={faqItems} />
        </div>

        <AffiliateSection title={dict.affiliate.title} />
      </div>
    </div>
  );
}