/**
 * sitemap-xml.ts — urlset / sitemapindex XML 构建（sitemap 路由共用）
 */
import type { SitemapHit } from "./sitemap-repo";

/** 构建 <urlset> 文本 */
export function buildUrlsetXml(hits: SitemapHit[]): string {
  const body = hits
    .map(
      (h) =>
        `  <url>\n    <loc>${h.loc}</loc>${
          h.lastmod ? `\n    <lastmod>${h.lastmod}</lastmod>` : ""
        }\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** 构建 <sitemapindex> 文本 */
export function buildIndexXml(entries: SitemapHit[]): string {
  const body = entries
    .map(
      (e) =>
        `  <sitemap>\n    <loc>${e.loc}</loc>${
          e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""
        }\n  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}