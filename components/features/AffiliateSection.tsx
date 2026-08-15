import { siteConfig, affiliateEnabled } from "@/lib/site";
import { ArrowUpRight } from "lucide-react";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

/**
 * 联盟营销推荐模块（B2B 高佣金挂载点）
 * 未配置 Affiliate 链接时整段不渲染。
 */
const AFFILIATES = [
  {
    key: "tide" as const,
    name: "Tide Business Banking",
    desc: {
      en: "Free UK business current account with built-in invoicing.",
      zh: "免费英国企业活期账户，内置发票功能。",
      de: "Kostenloses britisches Geschäftskonto mit integrierter Rechnungsstellung.",
    },
    badgeKey: "banking" as const,
  },
  {
    key: "wise" as const,
    name: "Wise Business",
    desc: {
      en: "Send money internationally at the real exchange rate.",
      zh: "按实时汇率进行国际汇款。",
      de: "Internationale Überweisungen zum echten Wechselkurs.",
    },
    badgeKey: "fx" as const,
  },
  {
    key: "revolut" as const,
    name: "Revolut Business",
    desc: {
      en: "Multi-currency accounts and global expense cards.",
      zh: "多币种账户与全球企业支出卡。",
      de: "Multiwährungskonten und weltweite Geschäftskarten.",
    },
    badgeKey: "banking" as const,
  },
  {
    key: "firstFormations" as const,
    name: "1st Formations",
    desc: {
      en: "Company registration from £12.99 + free £750 business banking.",
      zh: "公司注册 £12.99 起，另赠 £750 企业银行开户礼包。",
      de: "Firmengründung ab 12,99 £ inkl. 750 £ Startup-Banking.",
    },
    badgeKey: "formation" as const,
  },
  {
    key: "freeagent" as const,
    name: "FreeAgent Accounting",
    desc: {
      en: "Cloud accounting built for freelancers & small businesses.",
      zh: "为自由职业者与小微企业打造的云端会计软件。",
      de: "Cloud-Buchhaltung für Freelancer & kleine Unternehmen.",
    },
    badgeKey: "accounting" as const,
  },
] as const;

export async function AffiliateSection({
  title,
}: {
  title?: string;
}) {
  const lang = await getLang();
  const dict = getDict(lang);
  const aff = dict.affiliate;
  const active = AFFILIATES.filter((a) => affiliateEnabled(a.key));
  if (active.length === 0) return null;

  return (
    <section
      aria-label={aff.title}
      className="mx-auto mt-12 w-full max-w-5xl px-4 sm:px-6"
    >
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{title ?? aff.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{aff.subtitle}</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((a) => (
          <a
            key={a.key}
            href={siteConfig.affiliates[a.key]}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                {aff.badges[a.badgeKey]}
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-600"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">{a.name}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
              {a.desc[lang]}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}