import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, SignUp } from "@clerk/nextjs";
import { DemoLoginForm } from "@/components/features/DemoLoginForm";
import { demoMode } from "@/lib/auth/demo";

export const metadata: Metadata = {
  title: "Create Account — qxx.uk",
  description: "Create a free qxx.uk account: 50 API calls/day, watchlists and usage dashboard.",
  robots: { index: false, follow: true },
};

const enabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Create your free account
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        No credit card. Unlocks 50 API calls/day, a company watchlist and your usage
        dashboard.
      </p>
      <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {enabled ? (
          <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
            <SignUp
              appearance={{ elements: { rootBox: "mx-auto w-full", cardBox: "shadow-none border border-slate-200 rounded-2xl mx-auto w-full" } }}
            />
          </ClerkProvider>
        ) : demoMode() ? (
          <div className="flex flex-col items-center gap-5">
            <p className="text-center text-3xl" aria-hidden="true">
              📋
            </p>
            <DemoLoginForm redirectTo="/account" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-3xl" aria-hidden="true">
              🚧
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Account creation is opening soon
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Once authentication is configured, you can create a free account to
              unlock member perks. Guests keep full access to all lookups.
            </p>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        Already a member?{" "}
        <Link href="/sign-in" className="font-medium text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}