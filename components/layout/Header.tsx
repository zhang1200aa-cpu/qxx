import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";
import { AccountBadge } from "@/components/layout/AccountBadge";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { HeaderMobileMenu, type MobileNavItem } from "@/components/layout/HeaderMobileMenu";

/** 桌面端主导航（label 来自当前语言词典） */
function buildNav(dict: ReturnType<typeof getDict>): { href: string; label: string }[] {
  return [
    { href: "/", label: dict.nav.companySearch },
    { href: "/vat", label: dict.nav.vatValidator },
    { href: "/postcode", label: dict.nav.postcodeLookup },
    { href: "/pricing", label: dict.nav.pricing },
    { href: "/api-docs", label: dict.nav.apiDocs },
  ];
}

/**
 * 纯服务端 Header：保持静态预渲染（SEO 友好，游客/爬虫拿到完整 HTML）。
 * 登录状态由客户端 <AccountBadge /> 增强，绝不阻塞首屏。
 */
export async function Header() {
  const lang = await getLang();
  const dict = getDict(lang);
  const navItems: MobileNavItem[] = buildNav(dict);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label={`${siteConfig.name} homepage`}>
          {/* 品牌 SVG 图标（替代 lucide ShieldCheck） */}
          <span className="relative h-9 w-9 shrink-0">
            <img
              src="/logo/qxx-logo.svg"
              alt={siteConfig.name}
              className="h-9 w-9"
              width={36}
              height={36}
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {siteConfig.name}
            </span>
            <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:block">
              {siteConfig.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          {/* 移动端也显示账户徽章（登录态/套餐入口）——修复手机端看不到"我的账户" */}
          <AccountBadge />
          <HeaderMobileMenu items={navItems} />
        </div>
      </div>
    </header>
  );
}