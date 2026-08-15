import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export async function Footer() {
  const lang = await getLang();
  const dict = getDict(lang);
  const t = dict.footer;

  const FOOTER_COLS: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t.tools,
      links: [
        { href: "/", label: dict.nav.companySearch },
        { href: "/vat", label: dict.nav.vatValidator },
        { href: "/postcode", label: dict.nav.postcodeLookup },
        { href: "/dashboard", label: dict.nav.dashboard },
      ],
    },
    {
      title: t.account,
      links: [
        { href: "/account", label: dict.nav.account },
        { href: "/watchlist", label: dict.nav.watchlist },
        { href: "/sign-up", label: dict.nav.signUp },
        { href: "/sign-in", label: dict.nav.signIn },
      ],
    },
    {
      title: t.pricingApi,
      links: [
        { href: "/pricing", label: dict.nav.pricing },
        { href: "/api-docs", label: dict.nav.apiDocs },
        { href: "/api/v1/company?crn=00445790", label: dict.nav.bulkTools },
        { href: "/api/health", label: dict.nav.status },
      ],
    },
    {
      title: t.legal,
      links: [
        { href: "/about", label: `About ${siteConfig.name}` },
        { href: "/terms", label: "Terms of Service" },
        { href: "/privacy", label: "Privacy & Cookie Policy" },
        { href: "/contact", label: "Contact Support" },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300 print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="leading-none">
                <p className="text-lg font-bold text-white">{siteConfig.name}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {siteConfig.tagline}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{t.aboutText}</p>
          </div>

          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            <strong className="font-semibold text-slate-400">{t.disclaimerLabel}:</strong>{" "}
            {t.disclaimerText}{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              {t.oglText}
            </a>
          </p>
          <div className="mt-4 flex flex-col items-start gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {siteConfig.copyrightYear} {siteConfig.name}. {t.rights}
            </p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="transition-colors hover:text-white"
            >
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}