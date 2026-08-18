import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { DemoLoginForm } from "@/components/features/DemoLoginForm";
import { demoMode } from "@/lib/auth/demo";
import { getLang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n-dict";

export const metadata: Metadata = {
  title: "Sign In — qxx.uk",
  description: "Sign in to qxx.uk for free member API quota, watchlists and account access.",
  robots: { index: false, follow: true },
};

const enabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default async function SignInPage() {
  const lang = await getLang();
  const a = getDict(lang).auth;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{a.signInTitle}</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        {a.signInSubtitle}{" "}
        <Link href="/pricing" className="font-medium text-blue-700 hover:underline">
          {a.priceStart} $9.99
        </Link>
        .
      </p>
      <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {enabled ? (
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                cardBox: "shadow-none border border-slate-200 rounded-2xl mx-auto w-full",
              },
            }}
          />
        ) : demoMode() ? (
          <div className="flex flex-col items-center gap-5">
            <p className="text-center text-3xl" aria-hidden="true">
              🔐
            </p>
            <DemoLoginForm />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-3xl" aria-hidden="true">
              🚧
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Member accounts are opening soon
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Free member perks (50 API calls/day, watchlist) will be enabled once
              authentication is configured. Guests can keep using all lookups
              without an account.
            </p>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        {a.guestsAlwaysFree}
      </p>
    </div>
  );
}