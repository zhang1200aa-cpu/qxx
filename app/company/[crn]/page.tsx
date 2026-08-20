import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, ExternalLink, Printer } from "lucide-react";
import {
  getCompanyByCrn,
  CompaniesHouseError,
  typeLabel,
} from "@/lib/companies-house";
import { formatAddress, formatDate, sicLabel } from "@/lib/format";
import { InfoCard, Field } from "@/components/ui/InfoCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WatchButton } from "@/components/features/WatchButton";
import { CopyButton, PrintReportButton } from "@/components/ui/ActionButtons";
import { JsonLd, BreadcrumbJsonLd, CompanyJsonLd } from "@/components/ui/JsonLd";
import {
  companyMetaTitle,
  companyMetaDescription,
  companyMetaKeywords,
  companyRobots,
} from "@/lib/seo";
import { AdSlot } from "@/components/ui/AdSlot";
import { FaqSection, getFaqData } from "@/components/features/FaqSection";
import { AffiliateSection } from "@/components/features/AffiliateSection";
import { listCompaniesBySic } from "@/lib/company-store";
import { PdfWatermark } from "@/components/ui/PdfWatermark";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";
import { recordFrontendSearch } from "@/lib/search-stats";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = { params: Promise<{ crn: string }> };

function statusText(status: string): string {
  const map: Record<string, string> = {
    active: "Active on the Companies House register",
    dissolved: "Dissolved — no longer on the register",
    liquidation: "In liquidation",
  };
  return map[status] ?? `Status: ${status}`;
}

/** 侧边栏：同行业公司内链（基于本地 companies 库；未配置或无线索时渲染 null） */
async function SimilarCompanies({
  crn,
  sicCodes,
}: {
  crn: string;
  sicCodes?: string[];
}) {
  const similar = await listCompaniesBySic(sicCodes ?? [], crn, 5);
  if (!similar.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        Similar Companies
      </h2>
      <ul className="mt-3 space-y-1">
        {similar.map((s) => (
          <li key={s.company_number}>
            <Link
              href={`/company/${s.company_number}`}
              className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="truncate">{s.company_name}</span>
              <span className="shrink-0 font-mono text-[10px] text-slate-400 group-hover:text-blue-500">
                {s.company_number}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { crn } = await params;
  try {
    const company = await getCompanyByCrn(crn);
    const title = companyMetaTitle(company);
    const description = companyMetaDescription(company);
    return {
      title,
      description,
      keywords: companyMetaKeywords(company),
      // Dissolved / Removed / Converted 状态自动 noindex, follow（见 lib/seo.ts）
      robots: companyRobots(company),
      alternates: { canonical: `/company/${crn}` },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}/company/${crn}`,
        siteName: siteConfig.name,
        locale: "en_GB",
        type: "website",
        images: [
          {
            url: `${siteConfig.url}/api/og/company/${crn}`,
            width: 1200,
            height: 630,
            alt: company.company_name,
            type: "image/svg+xml",
          },
        ],
      },
    };
  } catch (err) {
    if (err instanceof CompaniesHouseError && (err.status === 404 || err.status === 400)) return {};
    return { title: `Company CRN ${crn} — Lookup failed` };
  }
}
export default async function CompanyDetailPage({ params }: PageProps) {
  const { crn } = await params;
  const lang = await getLang();
  const dict = getDict(lang);
  const c = dict.cards;
  const a = dict.actions;
  let company;
  try {
    company = await getCompanyByCrn(crn);
  } catch (err) {
    if (err instanceof CompaniesHouseError && err.status === 404) notFound();
    if (err instanceof CompaniesHouseError && err.status === 400) notFound();
    if (err instanceof CompaniesHouseError && (err.status === 401 || err.status === 500)) {
      // Companies House Key 未配置或未通过认证：给友好提示而不是 500 页
      const isAuth = err.status === 401;
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isAuth
              ? "Companies House API key is not authorized"
              : "Company lookup is not configured yet"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            {isAuth ? (
              <>
                The configured <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">COMPANIES_HOUSE_API_KEY</code>{" "}
                was rejected by Companies House (HTTP 401). Check that the key is
                correct and has been activated in the developer portal at
                developer.company-information.service.gov.uk.
              </>
            ) : (
              <>
                Set <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">COMPANIES_HOUSE_API_KEY</code>{" "}
                in your environment to enable live Companies House lookups. Register a
                free key at developer.company-information.service.gov.uk.
              </>
            )}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Back to search
          </Link>
        </div>
      );
    }
    throw err;
  }

  // 统计前台公司搜索（游客 / 注册会员分别计数；自动过滤爬虫）
  await recordFrontendSearch("company");

  const address = formatAddress(company.registered_office_address);
  const summary = [
    `Company Name: ${company.company_name}`,
    `Company Number (CRN): ${company.company_number}`,
    `Status: ${statusText(company.company_status)}`,
    `Company Type: ${typeLabel(company.company_type)}`,
    `Incorporated: ${company.date_of_creation ?? "—"}`,
    `Registered Office: ${address}`,
    company.sic_codes?.length
      ? `Nature of Business (SIC): ${company.sic_codes.map(sicLabel).join("; ")}`
      : "",
    company.accounts?.next_due ? `Next Accounts Due: ${company.accounts.next_due}` : "",
    company.confirmation_statement?.next_due
      ? `Confirmation Statement Due: ${company.confirmation_statement.next_due}`
      : "",
    `Verified at: ${new Date().toISOString()}`,
    "Source: Companies House (Open Government Licence v3.0) via qxx.uk",
  ]
    .filter(Boolean)
    .join("\n");

  const faqData = getFaqData(lang);
  const faqItems = [
    {
      question: `Is ${company.company_name} currently active?`,
      answer: `${company.company_name} is registered at Companies House with company number ${company.company_number}. Its current register status is "${statusText(company.company_status)}."`,
    },
    faqData.dataSources,
    faqData.officialStatus,
    faqData.howFresh,
  ];

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Company Search", path: "/" },
          { name: company.company_name, path: `/company/${company.company_number}` },
        ]}
      />
      <CompanyJsonLd company={company} />
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

      {/* 打印版验证报告头部 */}
      <div className="print-report-header">
        <p className="text-lg font-bold">
          {siteConfig.name} — Company Verification Report
        </p>
        <p className="text-xs text-slate-500">
          Generated {new Date().toISOString()} · CRN {company.company_number}
        </p>
      </div>
      <PdfWatermark entity={`CRN ${company.company_number}`} />

      {/* 页面主体 */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="no-print mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">
            {dict.misc.home}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/" className="hover:text-blue-700">
            {dict.nav.companySearch}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-slate-900">{company.company_name}</span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            <Building2 className="h-7 w-7 text-blue-700" aria-hidden="true" />
            {company.company_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={company.company_status} lang={lang} />
            <span className="font-mono text-sm text-slate-500">
              CRN: {company.company_number}
            </span>
          </div>
        </div>
<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InfoCard
              title={c.companyOverview}
              badge={<StatusBadge status={company.company_status} lang={lang} />}
              actions={
                <>
                  <WatchButton crn={company.company_number} />
                  <CopyButton text={summary} label={a.copySummary} />
                  <PrintReportButton label={a.downloadPdf}>
                    <Printer className="h-4 w-4" aria-hidden="true" />
                  </PrintReportButton>
                  <a
                    href={`https://find-and-update.company-information.service.gov.uk/company/${company.company_number}`}
                    target="_blank"
                    rel="nofollow noopener"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                  >
                    {a.viewGov}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </>
              }
            >
              <Field label={c.companyName}>
                <span className="break-words font-semibold">{company.company_name}</span>
              </Field>
              <Field label={c.crn}>
                <span className="font-mono">{company.company_number}</span>
              </Field>
              <Field label={c.companyType}>{typeLabel(company.company_type)}</Field>
              <Field label={c.incorporationDate}>
                {formatDate(company.date_of_creation)}
              </Field>
              <Field label={c.registeredAddress}>
                <span className="break-words text-slate-700">{address}</span>
              </Field>
              <Field label={c.sicCodes}>
                {company.sic_codes?.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {company.sic_codes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      >
                        <span className="font-mono">{code}</span> {sicLabel(code)}
                      </span>
                    ))}
                  </span>
                ) : (
                  c.notAvailable
                )}
              </Field>
              <Field label={c.nextAccountsDue}>
                {company.accounts?.next_due
                  ? formatDate(company.accounts.next_due)
                  : c.notAvailable}
              </Field>
              <Field label={c.confirmationDue}>
                {company.confirmation_statement?.next_due
                  ? formatDate(company.confirmation_statement.next_due)
                  : c.notAvailable}
              </Field>
              {company.company_status !== "active" && company.date_of_cessation && (
                <Field label={c.dateOfCessation}>
                  {formatDate(company.date_of_cessation)}
                </Field>
              )}
            </InfoCard>

            {/* 详情卡片右侧 = 页内矩形广告 */}
            <div className="mt-6">
              <AdSlot
                slot="rectangle-company-1"
                format="rectangle"
                className="h-[250px] w-full"
              />
            </div>
          </div>
<aside className="space-y-6">
            <InfoCard title={c.filingDeadlines}>
              <Field label={c.accountsStatus}>
                {company.accounts?.overdue ? (
                  <span className="font-semibold text-red-600">
                    {c.overdueWarning}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600">{c.onTime}</span>
                )}
              </Field>
              <Field label={c.accountsMadeUpTo}>
                {formatDate(company.accounts?.next_made_up_to)}
              </Field>
              <Field label={c.confirmationStatus}>
                {company.confirmation_statement?.overdue ? (
                  <span className="font-semibold text-red-600">{c.overdue}</span>
                ) : (
                  <span className="font-semibold text-emerald-600">{c.upToDate}</span>
                )}
              </Field>
            </InfoCard>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                {c.relatedSearches}
              </h2>
              <ul className="mt-3 space-y-1">
                {company.previous_company_names?.length ? (
                  company.previous_company_names
                    .slice(0, 2)
                    .map((n) => (
                      <li
                        key={n.name}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                      >
                        {dict.misc.formerly} {n.name}
                      </li>
                    ))
                ) : (
                  <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {dict.misc.formerHistoryUnavailable}
                  </li>
                )}
                <li className="pt-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(company.company_name)}`}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    {a.searchSimilar}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 同行业公司内链（pSEO 权重流转；本地库未配置时自动隐藏） */}
            <SimilarCompanies
              crn={company.company_number}
              sicCodes={company.sic_codes}
            />
          </aside>
        </div>

        <div className="mt-14">
          <FaqSection heading={dict.faq.heading} items={faqItems} />
        </div>

        <AffiliateSection
          title={`${dict.affiliate.title} — ${company.company_name.split(" ")[0]}`}
        />
      </div>
    </div>
  );
}