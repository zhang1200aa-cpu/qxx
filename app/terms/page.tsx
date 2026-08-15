import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using qxx.uk lookup tools and API.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    h: "1. Acceptance of Terms",
    p: `By accessing ${siteConfig.domain} you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service.`,
  },
  {
    h: "2. Service Description",
    p: "qxx.uk is an independent lookup tool that displays data from the UK public registers, including Companies House, HM Revenue & Customs (HMRC) and the Office for National Statistics (via Postcodes.io). We are not affiliated with, endorsed by, or operated on behalf of any UK government body.",
  },
  {
    h: "3. Data Accuracy & Disclaimer",
    p: "Public data is reproduced under the Open Government Licence v3.0 without any warranty as to accuracy, completeness or timeliness. You are responsible for verifying any record against the official register before relying on it. Nothing on this site constitutes legal, tax or financial advice.",
  },
  {
    h: "4. Acceptable Use",
    p: "You agree not to: use the service for unlawful purposes; attempt to breach rate limits or bypass security measures; scrape the site in a way that disrupts other users; or republish our derivative layouts or branding without permission. Reasonable automated use of the public API is permitted subject to the published rate limits.",
  },
  {
    h: "5. Paid API Subscription",
    p: "Bulk access is available by subscription (e.g. $9.99/month) processed via a third-party payment provider such as Stripe or Lemon Squeezy. Subscriptions renew automatically until cancelled. Refunds are provided within 14 days of purchase where no requests have been made.",
  },
  {
    h: "6. Intellectual Property",
    p: "The site layout, design and original text are our intellectual property. Underlying data remains subject to the Open Government Licence v3.0 (© Crown copyright).",
  },
  {
    h: "7. Limitation of Liability",
    p: "To the maximum extent permitted by law, we accept no liability for any loss or damage arising from use of, or reliance on, the information provided, including indirect or consequential losses.",
  },
  {
    h: "8. Changes to These Terms",
    p: "We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the revised Terms. Material changes will be highlighted on this page.",
  },
  {
    h: "9. Contact",
    p: `For any questions about these Terms, contact ${siteConfig.contactEmail}.`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Terms of Service
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