import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact Support",
  description: `Get in touch with the ${siteConfig.name} team.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const lang = await getLang();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {t(lang, "Contact Support", "联系我们", "Support kontaktieren")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {t(
          lang,
          "Found incorrect data? Have a feature or API question? We answer within 1 business day.",
          "发现数据有误？有功能或 API 问题？我们在 1 个工作日内回复。",
          "Fehlerhafte Daten gefunden? Fragen zu Funktionen oder API? Wir antworten innerhalb eines Werktags."
        )}
      </p>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <div className="py-3">
            <dt className="text-sm font-semibold text-slate-900">
              {t(lang, "Email", "邮箱", "E-Mail")}
            </dt>
            <dd className="mt-1">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="font-mono text-sm text-blue-700 hover:underline break-all"
              >
                {siteConfig.contactEmail}
              </a>
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-sm font-semibold text-slate-900">
              {t(lang, "Data corrections", "数据更正", "Datenkorrekturen")}
            </dt>
            <dd className="mt-1 text-sm text-slate-600">
              {t(
                lang,
                "Records come from official registers — for corrections, contact Companies House or HMRC directly. We mirror the public data as-is.",
                "记录来自官方登记系统 —— 如需更正，请直接联系 Companies House 或 HMRC。我们原样镜像公开数据。",
                "Einträge stammen aus offiziellen Registern – für Korrekturen wenden Sie sich bitte direkt an Companies House oder HMRC. Wir spiegeln die öffentlichen Daten unverändert."
              )}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-sm font-semibold text-slate-900">
              {t(lang, "API subscriptions", "API 订阅", "API-Abonnements")}
            </dt>
            <dd className="mt-1 text-sm text-slate-600">
              {t(
                lang,
                'Include "API Subscription" in the subject line to get onboarded.',
                "请在邮件主题中注明“API Subscription”以便快速对接。",
                'Bitte "API Subscription" in die Betreffzeile schreiben.'
              )}
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-sm font-semibold text-slate-900">
              {t(lang, "Report an issue", "问题反馈", "Problem melden")}
            </dt>
            <dd className="mt-1 text-sm text-slate-600">
              {t(
                lang,
                "Include the URL and, where possible, a screenshot.",
                "请附上 URL，如有可能请附上截图。",
                "Bitte URL und, wenn möglich, einen Screenshot beifügen."
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}