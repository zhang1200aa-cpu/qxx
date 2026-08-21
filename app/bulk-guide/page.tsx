import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Gauge,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { SampleDataCard } from "@/components/features/SampleDataCard";
import { getPlans } from "@/lib/plan-config";
import { getLang, t } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";
import { BreadcrumbJsonLd } from "@/components/ui/JsonLd";

export const metadata: Metadata = {
  title: "CSV Batch Lookup Guide & Examples — 一次最多 5,000 行的批量查询方法",
  description:
    "Step-by-step guide for CSV batch lookups of UK companies, VAT numbers and postcodes — up to 5,000 rows per batch for accountants, risk teams and sales. Copy ready-to-use sample data.",
  alternates: { canonical: "/bulk-guide" },
};

export default async function BulkGuidePage() {
  const lang = await getLang();
  const dict = getDict(lang);
  const plans = await getPlans();
  const pro = plans["accountant-pro"];

  const steps = [
    {
      icon: FileSpreadsheet,
      title: t(
        lang,
        "Prepare your list",
        "准备你的名单",
        "Liste vorbereiten"
      ),
      desc: t(
        lang,
        "Each row holds one item — a company number, a VAT number or a postcode. Excel, Google Sheets and Notion all export to plain CSV or paste-ready columns.",
        "每行放一个查询项：一个公司编号、一个 VAT 税号或一个邮编。Excel、Google Sheets、Notion 都能导出为纯 CSV 或可直接粘贴的列。",
        "Jede Zeile enthält einen Eintrag – eine Firmennummer, eine USt-IdNr. oder eine Postleitzahl. Excel, Google Sheets und Notion exportieren als CSV oder kopierbare Spalten."
      ),
    },
    {
      icon: ClipboardPaste,
      title: t(
        lang,
        "Paste into the bulk tool",
        "粘贴到批量工具",
        "In das Stapel-Tool einfügen"
      ),
      desc: t(
        lang,
        "Open the dashboard, pick your lookup type, and paste the whole column. No API keys, no coding — the tool does the rest.",
        "打开仪表盘，选择查询类型，粘贴整列即可。不需要 API Key，不需要写代码。",
        "Öffnen Sie das Dashboard, wählen den Typ und fügen die Spalte ein. Kein API-Key, kein Codieren nötig."
      ),
    },
    {
      icon: MousePointerClick,
      title: t(
        lang,
        "Run & export CSV",
        "运行并导出 CSV",
        "Starten & CSV exportieren"
      ),
      desc: t(
        lang,
        "One click checks every row against the official UK registers, then hit Export CSV to download the results for your files or spreadsheet.",
        "一键对每个编号逐条核验官方英国登记记录，然后点「导出 CSV」下载结果，方便存档或回到表格里。",
        "Ein Klick prüft jede Zeile gegen die offiziellen britischen Register. Dann auf \"CSV exportieren\" klicken – fertig."
      ),
    },
  ];

  const tierRows = [
    {
      label: t(lang, "Guest (no login)", "游客（未登录）", "Gast (ohne Login)"),
      batch: "5",
      daily: "50",
    },
    {
      label: t(lang, "Free member", "免费会员", "Kostenloses Mitglied"),
      batch: "50",
      daily: "200",
    },
    {
      label: t(lang, "Accountant Pro ★", "会计师专业版 ★", "Accountant Pro ★"),
      batch: String(pro.limits.bulkRowLimitPerBatch.toLocaleString()),
      daily: pro.limits.bulkDailyCap.toLocaleString(),
    },
  ];
const faqs = [
    {
      q: t(lang, "Do I need an API key to use the bulk tool?", "使用批量工具需要 API Key 吗？", "Braucht das Stapel-Tool einen API-Key?"),
      a: t(
        lang,
        "No. The dashboard bulk tool works in the browser — just log in and paste. API keys are only needed for automated integrations from code.",
        "不需要。仪表盘批量工具直接在浏览器里用，登录后粘贴即可。只有用代码做自动化集成时才需要 API Key。",
        "Nein. Das Stapel-Tool im Dashboard funktioniert im Browser – einfach einloggen und einfügen. API-Keys werden nur für automatische Integrationen benötigt."
      ),
    },
    {
      q: t(lang, "What counts as one row?", "什么算一行？", "Was zählt als eine Zeile?"),
      a: t(
        lang,
        "Each line of your input is one lookup. A company number, a VAT number or a postcode on its own line counts as one row towards your batch limit.",
        "输入的每一行就是一次查询。单独一行的一个公司编号、VAT 号或邮编，都按一行计入批量额度。",
        "Jede Eingabezeile ist eine Abfrage. Eine Firmennummer, USt-IdNr. oder Postleitzahl in einer eigenen Zeile zählt als eine Zeile zum Batch-Limit."
      ),
    },
    {
      q: t(lang, "What happens to rows that fail?", "查询失败的行会怎样？", "Was passiert mit fehlgeschlagenen Zeilen?"),
      a: t(
        lang,
        "Failed rows don't stop the batch. They are collected in the error list with the reason (e.g. not found), so your results are never blocked by one bad row.",
        "失败行不会中断整个批次。它们会被收集到错误列表并注明原因（例如未查到），一条坏行不会影响你的其它结果。",
        "Fehlgeschlagene Zeilen stoppen den Batch nicht. Sie werden mit Grund (z. B. nicht gefunden) in der Fehlerliste gesammelt – eine schlechte Zeile blockiert nie die übrigen Ergebnisse."
      ),
    },
    {
      q: t(lang, "Can I bulk check mixed types in one run?", "一次能混查不同类型吗？", "Kann ich verschiedene Typen in einem Lauf prüfen?"),
      a: t(
        lang,
        "Each run handles one type. For mixed lists, split them into three runs — one for companies, one for VAT numbers, one for postcodes.",
        "每次运行只处理一种类型。混合名单请拆成三次：公司、VAT、邮编各一次。",
        "Jeder Lauf verarbeitet einen Typ. Bei gemischten Listen teilen Sie sie in drei Läufe auf – Firmen, USt-IdNr. und Postleitzahlen getrennt."
      ),
    },
  ];

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: dict.misc.home, path: "/" },
          { name: "Bulk CSV Guide", path: "/bulk-guide" },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="rounded-3xl bg-slate-900 p-8 text-white sm:p-12">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t(lang, "No code required", "无需写代码", "Kein Code nötig")}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t(
              lang,
              "CSV Batch Lookup — the 3-minute guide",
              "CSV 批量查询 —— 3 分钟上手指南",
              "CSV-Stapelabfrage – der 3-Minuten-Leitfaden"
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
            {t(
              lang,
              "Check hundreds of UK companies, VAT numbers or postcodes in one go — up to 5,000 rows per batch. Exactly how accountants, risk teams and sales teams do it, without touching the API.",
              "一次核验数百家英国公司、VAT 税号或邮编 —— 单批次最多 5,000 行。会计所、风控团队和销售团队就是这么做的，完全不用碰 API。",
              "Prüfen Sie Hunderte britische Firmen, USt-IdNr. oder Postleitzahlen auf einmal – bis zu 5.000 Zeilen pro Batch. Genau so arbeiten Buchhalter, Risikoteams und Vertriebsteams, ganz ohne API."
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              {t(lang, "Open the bulk tool", "打开批量工具", "Stapel-Tool öffnen")}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-400"
            >
              {t(lang, "Compare plans", "查看套餐", "Tarife vergleichen")}
            </Link>
          </div>
        </div>
{/* 三步流程 */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t(lang, "How it works", "查询方法三步走", "So funktioniert es")}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <s.icon className="h-6 w-6 text-blue-700" aria-hidden="true" />
                  <span className="text-xs font-bold text-slate-300">STEP {i + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 示例数据 */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t(lang, "Copy & try these samples", "复制示例，直接试一下", "Beispiele kopieren & ausprobieren")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              lang,
              "These are real formats you'll encounter. Copy the sample, then open it in the bulk tool — it pre-fills automatically.",
              "下面是常见的真实格式。复制示例后点「在批量工具中打开」，工具会自动预填。",
              "Das sind echte Formate aus der Praxis. Beispiel kopieren und im Stapel-Tool öffnen – es wird automatisch vorausgefüllt."
            )}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SampleDataCard type="company" />
            <SampleDataCard type="vat" />
            <SampleDataCard type="postcode" />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            <Download className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            {t(
              lang,
              "Tip: for your own file, export your CRM / spreadsheet as CSV, then only keep the column you want to check.",
              "小贴士：用自己文件时，把 CRM / 表格导出为 CSV，只保留要查询的那一列即可。",
              "Tipp: Exportieren Sie Ihre CRM-/Tabellendaten als CSV und behalten nur die Spalte, die geprüft werden soll."
            )}
          </p>
        </section>
{/* 额度对照 */}
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t(lang, "How many rows can I check?", "一次能查多少行？", "Wie viele Zeilen kann ich prüfen?")}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">{t(lang, "Tier", "层级", "Stufe")}</th>
                  <th className="px-4 py-3 font-semibold">{t(lang, "Rows per batch", "单次批量行数", "Zeilen pro Batch")}</th>
                  <th className="px-4 py-3 font-semibold">{t(lang, "Rows per day", "每日行数", "Zeilen pro Tag")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {tierRows.map((r) => (
                  <tr key={r.label}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.label}</td>
                    <td className="px-4 py-3 font-mono">{r.batch}</td>
                    <td className="px-4 py-3 font-mono">{r.daily}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {t(
              lang,
              "A free account (login) raises the guest limit from 5 to 50 rows per batch. Accountant Pro unlocks 5,000 rows per batch.",
              "注册免费账号（登录）即可把游客的 5 行提升到每次 50 行。会计师专业版解锁单次 5,000 行。",
              "Ein kostenloses Konto hebt das Gast-Limit von 5 auf 50 Zeilen pro Batch. Accountant Pro schaltet 5.000 Zeilen pro Batch frei."
            )}
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t(lang, "Quick answers", "常见问题", "Kurz & knapp")}
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <summary className="cursor-pointer text-sm font-semibold text-slate-900 marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-emerald-900">
            {t(lang, "Ready to check your first batch?", "准备好查第一批了吗？", "Bereit für Ihren ersten Batch?")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-800">
            {t(
              lang,
              "Login is free and lifts you straight to 50 rows per batch. Ready to scale to 5,000 rows? The Accountant Pro plan does it in the same tool.",
              "注册登录免费，直接解锁每次 50 行。想一次查 5,000 行？会计师专业版在同一工具里即可实现。",
              "Login ist kostenlos und hebt Sie direkt auf 50 Zeilen pro Batch. Für 5.000 Zeilen macht es der Accountant-Pro-Tarif im selben Tool."
            )}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
            >
              {t(lang, "Go to dashboard", "前往仪表盘", "Zum Dashboard")}
            </Link>
            <Link
              href="/api-docs"
              className="rounded-lg border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              {t(lang, "Need the API instead? See docs", "需要 API？查看文档", "Stattdessen API? Zur Doku")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}