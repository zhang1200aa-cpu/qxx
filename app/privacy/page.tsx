import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy",
  description:
    "How qxx.uk handles your data and cookies, in line with UK GDPR and Google requirements.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    h: "1. Introduction",
    p: `${siteConfig.name} ("we", "us") operates the website at ${siteConfig.domain}. We are committed to protecting your privacy in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.`,
  },
  {
    h: "2. Data We Collect",
    p: "We process only what is necessary to provide the lookup service: the company number, VAT number or postcode you enter; a timestamp; and technical data such as your IP address, browser type and pages visited (via analytics/cookies). We do not require an account or any personal details to use the free lookups.",
  },
  {
    h: "3. How We Use Your Data",
    p: "Entered queries are used solely to query official public registers (Companies House, HMRC, ONS/Postcodes.io) and to return results to you. Aggregated, anonymous analytics may be used to understand usage and improve the service.",
  },
  {
    h: "4. Cookies & Advertising",
    p: "We use cookies that are necessary for the operation of the site, and — with your consent — advertising cookies served by Google AdSense to personalise ads based on your browsing. A consent management platform (CMP) is shown on first visit to obtain your consent in line with UK GDPR and Google's EU User Consent Policy. You can withdraw consent at any time via the cookie settings button in the site footer.",
  },
  {
    h: "5. Third-Party Processors",
    p: "We may share limited data with service providers that help us operate and monetise the site, including hosting providers, Google (AdSense), analytics providers, and a consent management platform. Each processor is bound by contract to process data only on our instructions.",
  },
  {
    h: "6. Data Retention",
    p: "Lookup results are cached for between 7 and 30 days to keep the service fast and within official API rate limits. Cached data is technical/public register data, not personal data about you.",
  },
  {
    h: "7. Your Rights",
    p: "Under UK GDPR you have the right to access, rectify, erase and restrict processing of your personal data, and to object to processing. To exercise any of these rights, contact us at the email address below. We will respond within 30 days.",
  },
  {
    h: "8. Contact",
    p: `Questions about this policy: ${siteConfig.contactEmail}.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Privacy &amp; Cookie Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Last updated: January 2026 · {siteConfig.domain}
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-bold text-slate-900">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}