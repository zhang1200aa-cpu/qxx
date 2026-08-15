/**
 * JSON-LD 结构化数据（Schema.org）生成器
 *
 * 应用到页面：
 *   - 公司页：Organization + PostalAddress + FAQPage
 *   - VAT 页：TaxService/FAQPage
 *   - 邮编页：Place + PostalAddress + FAQPage
 */
import { siteConfig } from "./site";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/company?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema(opts: {
  name: string;
  crn: string;
  status: string;
  url: string;
  address?: {
    address_line_1?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  } | null;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
    identifier: `GB Company Number ${opts.crn}`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Companies House Number",
        value: opts.crn,
      },
      {
        "@type": "PropertyValue",
        name: "Registration Status",
        value: opts.status,
      },
    ],
    sourceOrganization: {
      "@type": "GovernmentOrganization",
      name: "Companies House",
      url: "https://www.gov.uk/government/organisations/companies-house",
    },
  };
  if (opts.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: [opts.address.address_line_1, opts.address.region]
        .filter(Boolean)
        .join(", ") || undefined,
      addressLocality: opts.address.locality || undefined,
      addressRegion: opts.address.region || undefined,
      postalCode: opts.address.postal_code || undefined,
      addressCountry: opts.address.country || "GB",
    };
  }
  return data;
}

export function placeSchema(opts: {
  postcode: string;
  url: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: opts.name,
    url: opts.url,
    address: { "@type": "PostalAddress", postalCode: opts.postcode, addressCountry: "GB" },
    containedInPlace: { "@type": "Country", name: "United Kingdom" },
  };
  if (opts.latitude != null && opts.longitude != null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: opts.latitude,
      longitude: opts.longitude,
    };
  }
  return data;
}

export function faqSchema(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
}

/** 面包屑导航 */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteConfig.url}${it.path}`,
    })),
  };
}