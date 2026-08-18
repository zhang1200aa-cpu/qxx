import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getLang, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About qxx.uk",
  description:
    "qxx.uk is an independent UK corporate & tax intelligence tool powered by official open government data.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const lang = await getLang();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero: 品牌插图 + 标题 */}
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t(lang, `About ${siteConfig.name}`, `关于 ${siteConfig.name}`, `Über ${siteConfig.name}`)}
          </h1>
          <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-600">
            <p>
              {t(
                lang,
                `${siteConfig.name} is an independent UK corporate & tax intelligence tool. We believe that access to official company and tax data should be fast, free and frictionless — so we built a search experience directly on top of the UK Government's open registers.`,
                `${siteConfig.name} 是独立的英国企业与税务情报工具。我们相信官方企业与税务数据应当快速、免费、零门槛获取 —— 因此我们直接在英国政府开放登记系统之上构建了极速查询体验。`,
                `${siteConfig.name} ist ein unabhängiges britisches Tool für Unternehmens- und Steuerinformationen. Wir glauben, dass der Zugang zu offiziellen Unternehmens- und Steuerdaten schnell, kostenlos und reibungslos sein sollte – deshalb haben wir eine Suche direkt auf den offenen Registern der britischen Regierung aufgebaut.`
              )}
            </p>
            <p>
              {t(
                lang,
                "Every record on this site is retrieved in real time from the official public APIs of Companies House, HM Revenue & Customs and the Office for National Statistics (via Postcodes.io). We don't produce editorial content — we surface authoritative data with clean presentation and instant export tools.",
                "本站每条记录均实时来自 Companies House、英国税务海关总署与国家统计局（经 Postcodes.io）的官方公开 API。我们不生产编辑内容 —— 我们以清晰的呈现与即时导出工具展示权威数据。",
                "Jeder Eintrag auf dieser Website wird in Echtzeit von den offiziellen öffentlichen APIs von Companies House, HM Revenue & Customs und dem Office for National Statistics (über Postcodes.io) abgerufen. Wir produzieren keine redaktionellen Inhalte – wir präsentieren maßgebliche Daten in sauberer Darstellung mit sofortigen Export-Tools."
              )}
            </p>
            <p>
              {t(
                lang,
                "For risk teams, e-commerce sellers and developers, we provide a simple",
                "面向风控团队、电商卖家和开发者，我们提供简单易用的",
                "Für Risikoteams, E-Commerce-Verkäufer und Entwickler bieten wir eine einfache"
              )}{" "}
              <a href="/api-docs" className="font-medium text-blue-700 hover:underline">
                JSON API
              </a>{" "}
              {t(
                lang,
                "for automated supplier verification and compliance workflows.",
                "，用于自动化的供应商核验与合规流程。",
                "für automatisierte Lieferantenprüfung und Compliance-Workflows."
              )}
            </p>
          </div>
        </div>
{/* 品牌插图（SVG） */}
        <div className="w-full max-w-sm shrink-0 lg:w-72">
          <img
            src="/images/about-illustration.svg"
            alt={`${siteConfig.name} data pipeline illustration`}
            className="h-auto w-full"
            width={400}
            height={240}
          />
        </div>
      </div>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-600">
        <h2 className="pt-2 text-lg font-bold text-slate-900">
          {t(lang, "Data Sources & Licence", "数据来源与许可", "Datenquellen & Lizenz")}
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Companies House public register —{" "}
            <a
              href="https://www.gov.uk/government/organisations/companies-house"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 hover:underline"
            >
              developer.company-information.service.gov.uk
            </a>
          </li>
          <li>
            HMRC VAT lookup —{" "}
            <a
              href="https://developer.service.hmrc.gov.uk"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 hover:underline"
            >
              HMRC Developer Hub
            </a>
          </li>
          <li>
            Postcode &amp; geography —{" "}
            <a
              href="https://postcodes.io"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-700 hover:underline"
            >
              Postcodes.io
            </a>{" "}
            (ONS data)
          </li>
        </ul>
        <p className="text-xs text-slate-400">
          {t(
            lang,
            "All public data is used under the",
            "所有公开数据依据",
            "Alle öffentlichen Daten werden unter der"
          )}{" "}
          <a
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open Government Licence v3.0
          </a>
          . © Crown copyright.
        </p>
        <p className="pt-2 text-slate-500">
          {t(
            lang,
            "Questions or feedback? Email",
            "有问题或反馈？请发送邮件至",
            "Fragen oder Feedback? E-Mail an"
          )}{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-medium text-blue-700 hover:underline"
          >
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}