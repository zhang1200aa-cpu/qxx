import Link from "next/link";
import { SearchX } from "lucide-react";
import { getLang, t } from "@/lib/i18n";

export default async function NotFound() {
  const lang = await getLang();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <SearchX className="h-12 w-12 text-slate-300" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        404 — {t(lang, "Record not found", "记录未找到", "Eintrag nicht gefunden")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {t(
          lang,
          "The company, VAT number or postcode could not be found in the official UK registers, or the address was incorrect.",
          "在公司、VAT 税号或邮编官方登记系统中未找到该记录，或输入的地址有误。",
          "Die Firma, VAT-Nummer oder Postleitzahl wurde in den offiziellen britischen Registern nicht gefunden, oder die Adresse war falsch."
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          {t(lang, "Back to search", "返回搜索", "Zurück zur Suche")}
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
        >
          {t(lang, "Report an issue", "问题反馈", "Problem melden")}
        </Link>
      </div>
    </div>
  );
}