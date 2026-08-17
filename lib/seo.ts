/**
 * seo.ts — 公司详情页 pSEO 共享工具
 *
 * 集中维护：动态 title/description/keywords、Dissolved 等状态自动 noindex、
 * Schema.org Corporation/LocalBusiness 的 JSON-LD 数据构造。
 * 供 app/company/[crn]/page.tsx 的 generateMetadata 与 components/ui/JsonLd.tsx 使用。
 */
import type { Metadata } from "next";
import { typeLabel, statusLabel } from "./companies-house";
import { formatDate, sicLabel } from "./format";
import { siteConfig } from "./site";
import type { CompanyProfile } from "./types";

/**
 * 需要从 Google 索引撤下的公司状态。
 * 注：CH 官方 company_status 没有 "dormant" 字段（Dormant 属于账户/财务类别），
 * 这里把已注销/已移除/已转换关闭的企业页标记 noindex，避免低价值长尾污染索引。
 */
export const SEO_NOINDEX_STATUSES = new Set([
  "dissolved",
  "removed",
  "converted-closed",
]);

/** 该公司页是否需要 noindex, follow */
export function isCompanyNoindex(
  company: Pick<CompanyProfile, "company_status">
): boolean {
  return SEO_NOINDEX_STATUSES.has(company.company_status);
}

/** 动态 <title>（layout 的 title.template 会自动追加 ` | qxx.uk`） */
export function companyMetaTitle(
  company: Pick<CompanyProfile, "company_name">
): string {
  return `${company.company_name} — Overview, Filing History & VAT Status`;
}

/** 动态 <meta name="description">（≤ ~160 字符的一两句话） */
export function companyMetaDescription(company: CompanyProfile): string {
  const parts = [
    `${company.company_name} is a ${typeLabel(company.company_type)} registered at Companies House (CRN ${company.company_number}).`,
    `Status: ${statusLabel(company.company_status)}.`,
    company.date_of_creation ? `Incorporated ${formatDate(company.date_of_creation)}.` : "",
    company.sic_codes?.length
      ? `Industry (SIC): ${company.sic_codes.map(sicLabel).join(", ")}.`
      : "",
    "Check official filing deadlines, confirmation statement due dates and VAT status.",
  ];
  return parts.filter(Boolean).join(" ");
}

/** 动态 <meta name="keywords"> */
export function companyMetaKeywords(company: CompanyProfile): string[] {
  const keywords = [
    company.company_name,
    `Companies House ${company.company_number}`,
    `CRN ${company.company_number}`,
    `${company.company_name} UK company`,
    typeLabel(company.company_type),
    statusLabel(company.company_status),
  ];
  for (const sic of company.sic_codes ?? []) keywords.push(sicLabel(sic));
  return [...new Set(keywords)].slice(0, 10);
}

/** 公司详情页 robots：Dissolved/Removed/Converted → noindex, follow */
export function companyRobots(
  company: Pick<CompanyProfile, "company_status">
): Metadata["robots"] {
  return isCompanyNoindex(company)
    ? { index: false, follow: true }
    : { index: true, follow: true };
}

/**
 * 构造 Schema.org 公司实体 JSON-LD。
 * 满足要求：@type Corporation / LocalBusiness、legalName、registrationNumber、
 * address（PostalAddress）、dateOfIncorporation(foundingDate)。
 * 返回 undefined 时调用方应跳过注入。
 */
export function companyJsonLd(
  company: CompanyProfile
): Record<string, unknown> | undefined {
  const crn = company.company_number;
  const addr = company.registered_office_address;
  const hasAddress = Boolean(
    addr?.address_line_1 || addr?.locality || addr?.postal_code
  );

  return {
    "@context": "https://schema.org",
    // 有注册办公地址的活跃企业可同时声明 LocalBusiness；无地址则仅 Corporation
    "@type": hasAddress ? ["Corporation", "LocalBusiness"] : "Corporation",
    name: company.company_name,
    legalName: company.company_name,
    identifier: `Companies House number ${crn}`,
    registrationNumber: crn,
    url: `${siteConfig.url}/company/${crn}`,
    sameAs: `https://find-and-update.company-information.service.gov.uk/company/${crn}`,
    description: companyMetaDescription(company),
    ...(company.date_of_creation
      ? { foundingDate: company.date_of_creation }
      : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [addr?.address_line_1, addr?.address_line_2]
              .filter(Boolean)
              .join(", ") || undefined,
            addressLocality: addr?.locality || undefined,
            addressRegion: addr?.region || undefined,
            postalCode: addr?.postal_code || undefined,
            addressCountry: addr?.country === "Scotland" ? "GB" : "GB",
          },
        }
      : {}),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Company Status",
        value: statusLabel(company.company_status),
      },
      ...(company.company_type
        ? [
            {
              "@type": "PropertyValue",
              name: "Company Type",
              value: typeLabel(company.company_type),
            },
          ]
        : []),
      ...(company.sic_codes?.length
        ? [
            {
              "@type": "PropertyValue",
              name: "SIC Codes",
              value: company.sic_codes.join(", "),
            },
          ]
        : []),
      ...(company.accounts?.next_due
        ? [
            {
              "@type": "PropertyValue",
              name: "Next Accounts Due",
              value: company.accounts.next_due,
            },
          ]
        : []),
    ],
  };
}