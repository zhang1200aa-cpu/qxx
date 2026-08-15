import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCache } from "@/lib/cache";
import { WatchlistClient } from "@/components/features/WatchlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watchlist — qxx.uk",
  robots: { index: false, follow: true },
};

export default async function WatchlistPage() {
  const user = await getCurrentUser();
  let crns: string[] = [];
  if (user.tier !== "guest") {
    crns = (await getCache().get<string[]>(`watchlist:${user.id}`)) ?? [];
  }

  if (user.tier === "guest") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Star className="mx-auto h-10 w-10 text-blue-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          Save companies you care about
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Create a free account to build a watchlist of up to 50 UK companies and
          check them at a glance.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Create free account
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Company Watchlist
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {crns.length} saved · up to 50
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          Add more →
        </Link>
      </div>
      <div className="mt-6">
        <WatchlistClient initialCrns={crns} />
      </div>
    </div>
  );
}