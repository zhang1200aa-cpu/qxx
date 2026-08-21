import Link from "next/link";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { POPULAR_COMPANIES, POPULAR_POSTCODES } from "@/lib/seed";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

/** 首页热门快捷入口（同时为 pSEO 提供内链） */
export async function QuickLinks() {
  const lang = await getLang();
  const dict = getDict(lang);
  const q = dict.quickLinks;

  return (
    <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6">
      <section aria-label={q.popularCompanies} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {q.popularCompanies}
          </h2>
          <Link
            href="/search"
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            {q.searchAll} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-4 space-y-1">
          {POPULAR_COMPANIES.slice(0, 6).map((c) => (
            <li key={c.crn}>
              <Link
                href={`/company/${c.crn}`}
                className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="truncate font-medium group-hover:text-blue-700">
                  {c.name}
                </span>
                <span className="ml-3 shrink-0 font-mono text-xs text-slate-400">
                  CRN {c.crn}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={q.popularPostcodes} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {q.popularPostcodes}
          </h2>
          <Link
            href="/postcode"
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            {q.lookupPostcode} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {POPULAR_POSTCODES.map((p) => (
            <li key={p.postcode}>
              <Link
                href={`/postcode/${p.postcode.replace(/\s+/g, "")}`}
                className="group flex flex-col rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
              >
                <span className="font-mono text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                  {p.postcode}
                </span>
                <span className="text-xs text-slate-400">{p.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 批量查询指南入口（全宽卡片，引导非技术用户） */}
      <section
        aria-label={dict.nav.bulkGuide}
        className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{dict.nav.bulkGuide}</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                {lang === "zh"
                  ? "一次批量核验数百家英国公司、VAT 税号或邮编 —— 单批次最多 5,000 行。无需 API，复制示例、三步上手。"
                  : lang === "de"
                    ? "Prüfen Sie Hunderte britische Firmen, USt-IdNr. oder Postleitzahlen auf einmal – bis zu 5.000 Zeilen pro Batch. Kein API nötig."
                    : "Check hundreds of UK companies, VAT numbers or postcodes in one go — up to 5,000 rows per batch. No API needed."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/bulk-guide"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {dict.nav.bulkGuide}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
            >
              {lang === "zh" ? "去批量工具" : lang === "de" ? "Zum Stapel-Tool" : "Open bulk tool"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}