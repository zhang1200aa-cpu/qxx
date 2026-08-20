import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isValidCrn, normalizeCrn } from "@/lib/crn";

/**
 * Edge proxy — company CRN validation + Clerk auth.
 *
 * Handles two responsibilities:
 *   1. Clerk auth session injection (required for auth() in Server Components)
 *   2. Company CRN format validation (blocks Googlebot from hammering the API)
 */
const COMPANY_PATH_PATTERN = /^\/company\/([^/]+?)\/?$/;

export default clerkMiddleware((_auth, request) => {
  const { pathname } = request.nextUrl;

  const match = COMPANY_PATH_PATTERN.exec(pathname);
  // Non-/company/<crn> paths: pass through
  if (!match) return NextResponse.next();

  const raw = match[1];

  // ---- 1) Invalid format: edge-level 404 + cache ----
  if (!isValidCrn(raw)) {
    const res = NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
    res.headers.set("Cache-Control", "public, max-age=300, s-maxage=86400");
    res.headers.set("CDN-Cache-Control", "public, max-age=300, s-maxage=86400");
    return res;
  }

  // ---- 2) Valid but non-canonical: 308 to canonical URL ----
  const canonical = normalizeCrn(raw);
  if (canonical !== raw) {
    const url = request.nextUrl.clone();
    url.pathname = `/company/${canonical}`;
    return NextResponse.redirect(url, 308);
  }

  // ---- 3) Canonical valid: pass through ----
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
