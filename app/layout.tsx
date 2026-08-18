import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WebsiteJsonLd } from "@/components/ui/JsonLd";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN, deDE, enUS } from "@clerk/localizations";
import { clerkConfigured } from "@/lib/auth/clerk";
import { siteConfig } from "@/lib/site";
import { getLang } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — UK Corporate & Tax Intelligence`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "UK company search",
    "Companies House lookup",
    "UK VAT number validation",
    "HMRC VAT check",
    "UK postcode lookup",
    "company CRN check",
    "verify company",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    title: `${siteConfig.name} — UK Corporate & Tax Intelligence`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/api/og/default",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — UK Corporate & Tax Intelligence`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — UK Corporate & Tax Intelligence`,
    description: siteConfig.description,
    images: ["/api/og/default"],
  },
  icons: {
    icon: "/logo/qxx-logo.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    // Google AdSense 网站所有权验证（元标记方式）。
    // 未配置 NEXT_PUBLIC_ADSENSE_CLIENT 时回退到本站已确认的发布商 ID，保证随时可验证。
    "google-adsense-account": siteConfig.adsenseClient || "ca-pub-8629889510424643",
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/sitemap.xml",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  const htmlLang = lang === "zh" ? "zh-CN" : lang === "de" ? "de-DE" : "en-GB";
  const adsense = siteConfig.adsenseClient;
  const cookieScriptId = siteConfig.cookieScriptId;
  const clerkEnabled = clerkConfigured();

  const body = (
    <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <WebsiteJsonLd />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Google AdSense 脚本（未配置 Client ID 时不加载） */}
      {adsense && (
        <Script
          strategy="afterInteractive"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
          crossOrigin="anonymous"
        />
      )}

      {/* UK GDPR 合规 CMP：Cookie-Script（Google 认证 CMP） */}
      {cookieScriptId && (
        <Script
          strategy="afterInteractive"
          id="cookie-script"
          src={`https://cdn.cookie-script.com/s/${cookieScriptId}.js`}
          data-uid={cookieScriptId}
          crossOrigin="anonymous"
        />
      )}
    </body>
  );

  // Clerk 启用时全局包裹（提供 SignIn/SignUp 云端组件与会话上下文）
  const fontClass = `${geistSans.variable} ${geistMono.variable}`;

  if (clerkEnabled) {
    const clerkLocale = lang === "zh" ? zhCN : lang === "de" ? deDE : enUS;
    return (
      <html lang={htmlLang} className={fontClass}>
        {/* locale 经 spread 透传：运行时让 Clerk 表单跟随界面语言（zh/de/en） */}
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          {...({ locale: clerkLocale } as object)}
        >
          {body}
        </ClerkProvider>
      </html>
    );
  }
  return (
    <html lang={htmlLang} className={fontClass}>
      {body}
    </html>
  );
}
