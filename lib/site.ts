/**
 * 站点全局配置 — qxx.uk
 */
export const siteConfig = {
  name: "qxx.uk",
  domain: "qxx.uk",
  // 部署时通过 NEXT_PUBLIC_SITE_URL 覆盖（如 https://qxx.uk）
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  tagline: "UK Corporate & Tax Intelligence",
  description:
    "Instant UK company, VAT and postcode verification powered by official Companies House, HMRC and ONS open data. Free, no sign-up required.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "ai@qxx.uk",
  copyrightYear: new Date().getFullYear(),
  // 变现开关（留空则不渲染广告/联盟链接，方便本地开发）
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "", // e.g. ca-pub-XXXXXXXXXXXXXXXX
  // Cookie-Script 站点 ID：脚本地址形如 https://cdn.cookie-script.com/s/{ID}.js
  // 从 Cookie-Script 后台复制的 script src 里取 ID（如 d07e95a8ec9f00ea51dc2c981aa14e6b）
  cookieScriptId: process.env.NEXT_PUBLIC_COOKIESCRIPT_ID || "",
  // Affiliate（联盟营销）链接，留空则隐藏推荐模块
  affiliates: {
    tide: process.env.NEXT_PUBLIC_TIDE_AFFILIATE || "",
    wise: process.env.NEXT_PUBLIC_WISE_AFFILIATE || "",
    revolut: process.env.NEXT_PUBLIC_REVOLUT_AFFILIATE || "",
    firstFormations: process.env.NEXT_PUBLIC_1ST_FORMATIONS_AFFILIATE || "",
    freeagent: process.env.NEXT_PUBLIC_FREEAGENT_AFFILIATE || "",
  },
} as const;

/** 判断是否启用某联盟链接（有值才渲染） */
export function affiliateEnabled(key: keyof typeof siteConfig.affiliates): boolean {
  return Boolean(siteConfig.affiliates[key]);
}