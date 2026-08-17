import { NextResponse, type NextRequest } from "next/server";
import { isValidCrn, normalizeCrn } from "@/lib/crn";

/**
 * 边缘路由校验 —— 公司详情页 /company/[crn]
 *
 * 目的：Googlebot 会对形如 /company/<任意字符串> 的 URL 疯狂抓取，
 * 若全部放行进后端，每次都会触发 Companies House API 查询（600 req/5min 限频）
 * 并造成源站无效 404 暴增。这里在边缘（Middleware）先做公司号格式校验：
 *   - 非法格式：边缘端直接 404，完全不进入页面组件 / 数据库 / 上游 API；
 *     该 404 属于确定性结果，附带 Cache-Control 交给 CDN 缓存，杜绝"反复抓 → 反复穿透源站"。
 *   - 合法但非规范形式（小写 / 未补零的数字）：308 到规范大写 URL，
 *     保证每家公司只有唯一 URL（CDN 缓存 key 不分裂）。
 *   - 合法规范形式：放行进页面，由业务层查询（命中 CDN/缓存则更省）。
 *
 * 公司号格式规则见 lib/crn.ts（8 位数字，或 SC/NI/OC/SO 等 2 位前缀 + 6 位数字）。
 */
const COMPANY_PATH_PATTERN = /^\/company\/([^/]+?)\/?$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = COMPANY_PATH_PATTERN.exec(pathname);
  // 非 /company/<crn> 形态（含 /company 本身、多级路径）：交给 Next.js 正常处理
  if (!match) return NextResponse.next();

  const raw = match[1];

  // ---- 1) 非法格式：边缘端 404 + 缓存，从根上解决源站 404 穿透 ----
  if (!isValidCrn(raw)) {
    const res = NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
    // 格式不合法 = 确定性 404：浏览器缓存 5 分钟、CDN 缓存 1 天。
    // Googlebot 反复抓同一批坏 URL 时直接命中 CDN 404，不再打源站。
    res.headers.set("Cache-Control", "public, max-age=300, s-maxage=86400");
    res.headers.set("CDN-Cache-Control", "public, max-age=300, s-maxage=86400");
    return res;
  }

  // ---- 2) 合法但非规范形式：308 到规范 URL（缓存 key 唯一化）----
  const canonical = normalizeCrn(raw);
  if (canonical !== raw) {
    const url = request.nextUrl.clone();
    url.pathname = `/company/${canonical}`;
    return NextResponse.redirect(url, 308);
  }

  // ---- 3) 规范合法：放行进页面 ----
  return NextResponse.next();
}

export const config = {
  // 只拦截 /company 下的请求，避免给其余流量带来中间层开销
  matcher: ["/company/:path*"],
};