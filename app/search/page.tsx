import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search as SearchIcon } from "lucide-react";
import { searchCompanies } from "@/lib/companies-house";
import { formatDate } from "@/lib/format";
import { SearchBox } from "@/components/features/SearchBox";
import { BreadcrumbJsonLd } from "@/components/ui/JsonLd";
import { AdSlot } from "@/components/ui/AdSlot";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UK Company Name Search — Companies House Lookup",
  description:
    "Search UK companies by name and get instant registration status, company number and incorporation date from Companies House.",
  alternates: { canonical: "/search" },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function CompanySearchPage({ searchParams }: SearchPageProps) {
  const lang = await getLang();
  const dict = getDict(lang);
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);

  let results;
  let error: string | null = null;
  if (query) {
    try {
      results = await searchCompanies(query);
    } catch (err) {
      error = err instanceof Error ? err.message : "Search failed.";
    }
  }

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: dict.misc.home, path: "/" },
          { name: dict.nav.companySearch, path: "/search" },
          ...(query ? [{ name: `"${query}"`, path: `/search?q=${encodeURIComponent(query)}` }] : []),
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {dict.nav.companySearch}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{dict.hero.subtitle}</p>

        <div className="mt-6">
          <SearchBox initialTab="company" compact />
        </div>

        {!query && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <SearchIcon className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">
              {dict.misc.searchHint}{" "}
              <Link href="/search?q=Tesco" className="font-medium text-blue-700 hover:underline">
                Tesco
              </Link>
              ,{" "}
              <Link href="/search?q=Barclays" className="font-medium text-blue-700 hover:underline">
                Barclays
              </Link>
              .
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {results && !error && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                {results.total_results} {dict.misc.registeredCompany} — &quot;{query}&quot;
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {results.items.map((item) => (
                <li key={item.company_number}>
                  <Link
                    href={`/company/${item.company_number}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <span className="font-mono text-xs text-slate-400">
                        {item.company_number}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {item.description ?? item.address_snippet ?? dict.misc.registeredCompany}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {item.date_of_creation && (
                        <span>{dict.misc.incorporated} {formatDate(item.date_of_creation)}</span>
                      )}
                      {item.company_status && (
                        <span className="font-medium capitalize">{item.company_status}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {results.items.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {dict.misc.noMatches}
              </div>
            )}

            <div className="mt-8">
              <AdSlot
                slot="leaderboard-search"
                format="horizontal"
                className="h-[90px] w-full"
              />
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center gap-1.5 text-sm text-slate-400">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{dict.misc.dataSourceNote}</span>
        </div>
      </div>
    </div>
  );
}