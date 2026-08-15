import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Landmark, Printer, ShieldCheck } from "lucide-react";
import {
  checkVatNumber,
  formatVatNumber,
  HmrcError,
  joinAddress,
} from "@/lib/hmrc-vat";
import { formatDate, formatTimestamp } from "@/lib/format";
import { InfoCard, Field } from "@/components/ui/InfoCard";
import { VatStatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton, PrintReportButton } from "@/components/ui/ActionButtons";
import { JsonLd, BreadcrumbJsonLd } from "@/components/ui/JsonLd";
import { AdSlot } from "@/components/ui/AdSlot";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { PdfWatermark } from "@/components/ui/PdfWatermark";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = { params: Promise<{ vrn: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vrn } = await params;
  try {
    const result = await checkVatNumber(vrn);
    const title = `Check UK VAT ${formatVatNumber(result.vat_number)} - Status & Verification`;
    const status = result.valid
      ? `Valid VAT registration held by ${result.name ?? "the registered business"}`
      : "This VAT number is not registered / invalid";
    return {
      title,
      description: `${status}. Official HMRC VAT lookup for ${formatVatNumber(
        result.vat_number
      )}, checked ${formatDate(result.requestDate)}. Verify suppliers before you pay.`,
      alternates: { canonical: `/vat/${vrn}` },
      openGraph: {
        title,
        description: status,
        url: `/vat/${vrn}`,
        type: "website",
      },
    };
  } catch (err) {
    if (err instanceof HmrcError && (err.status === 400 || err.status === 404)) {
      return { title: `UK VAT ${vrn} — Verification` };
    }
    return { title: `UK VAT ${vrn} — Lookup failed` };
  }
}
export default async function VatDetailPage({ params }: PageProps) {
  const { vrn } = await params;
  const lang = await getLang();
  const dict = getDict(lang);
  const c = dict.cards;
  const a = dict.actions;
  let result;
  try {
    result = await checkVatNumber(vrn);
  } catch (err) {
    if (err instanceof HmrcError && err.status === 400) notFound();
    if (err instanceof HmrcError && err.status === 404) notFound();
    throw err;
  }

  const businessAddress = result.address
    ? joinAddress([
        result.address.line1,
        result.address.line2,
        result.address.line3,
        result.address.line4,
        result.address.line5,
        result.address.postcode,
      ])
    : "Not disclosed";

  const certificate = [
    "UK VAT Number Verification Certificate",
    `VAT Number: ${formatVatNumber(result.vat_number)}`,
    `Status: ${result.valid ? "VALID VAT REGISTRATION" : "INVALID / DEREGISTERED"}`,
    result.valid && result.name ? `Registered Business Name: ${result.name}` : "",
    result.valid ? `Official Business Address: ${businessAddress}` : "",
    `Verification Date: ${result.requestDate}`,
    "Checked against HMRC's official VAT register.",
    "Source: HMRC (Open Government Licence v3.0) via qxx.uk",
  ]
    .filter(Boolean)
    .join("\n");

  const faqData = getFaqData(lang);
  const faqItems = [
    {
      question: `Is VAT number ${formatVatNumber(result.vat_number)} valid?`,
      answer: result.valid
        ? `Yes — this VAT number is currently registered with HMRC${
            result.name ? ` under the name "${result.name}"` : ""
          }. The status was confirmed on ${formatDate(result.requestDate)}.`
        : "No — HMRC does not currently recognise this VAT number as a valid registration. It may have been deregistered or mistyped. Double-check the number with the supplier.",
    },
    faqData.vatFormat,
    faqData.dataSources,
    faqData.freeToUse,
  ];

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "VAT Validator", path: "/vat" },
          { name: formatVatNumber(result.vat_number), path: `/vat/${result.vat_number}` },
        ]}
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
          {siteConfig.name} — UK VAT Verification Report
        </p>
        <p className="text-xs text-slate-500">
          Generated {new Date().toISOString()} · VRN {result.vat_number}
        </p>
      </div>
      <PdfWatermark entity={`VRN ${result.vat_number}`} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav className="no-print mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            {dict.misc.home}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/vat" className="hover:text-blue-700">
            {dict.nav.vatValidator}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-slate-900">
            {formatVatNumber(result.vat_number)}
          </span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <Landmark className="h-7 w-7 text-blue-700" aria-hidden="true" />
            {dict.nav.vatValidator} {formatVatNumber(result.vat_number)}
          </h1>
          <VatStatusBadge valid={result.valid} lang={lang} />
        </div>
<div className="mt-6">
          <InfoCard
            title={c.vatOverview}
            badge={<VatStatusBadge valid={result.valid} lang={lang} />}
            actions={
              result.valid ? (
                <>
                  <CopyButton text={certificate} label={a.copyVatCert} />
                  <PrintReportButton label={a.downloadPdf}>
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </PrintReportButton>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-red-500" aria-hidden="true" />
                  {dict.misc.disclaimerCta}
                </p>
              )
            }
          >
            <Field label={c.businessName}>
              {result.valid && result.name ? (
                <span className="font-semibold">{result.name}</span>
              ) : (
                <span className="text-slate-500">{dict.misc.notApplicable}</span>
              )}
            </Field>
            <Field label={c.vatNumber}>
              <span className="font-mono font-semibold">
                {formatVatNumber(result.vat_number)}
              </span>
            </Field>
            <Field label={c.officialAddress}>
              <span className="break-words text-slate-700">{businessAddress}</span>
            </Field>
            <Field label={c.verificationTime}>
              {formatTimestamp(result.requestDate)}
            </Field>
            <Field label={c.consultationId}>
              <span className="font-mono">{result.vat_number}</span>
            </Field>
          </InfoCard>
        </div>

        <div className="mt-6">
          <AdSlot
            slot="rectangle-vat-1"
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