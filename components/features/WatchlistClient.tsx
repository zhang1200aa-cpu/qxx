"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Trash2 } from "lucide-react";

/** 关注清单客户端交互：展示、删除 */
export function WatchlistClient({ initialCrns }: { initialCrns: string[] }) {
  const router = useRouter();
  const [crns, setCrns] = useState(initialCrns);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(crn: string) {
    setBusy(crn);
    try {
      await fetch(`/api/watchlist?crn=${crn}`, { method: "DELETE" });
      setCrns((prev) => prev.filter((c) => c !== crn));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (crns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No companies saved yet. Search a company and add it from its page.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {crns.map((crn) => (
        <li
          key={crn}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <Link
            href={`/company/${crn}`}
            className="flex items-center gap-3 text-sm font-semibold text-slate-800 hover:text-blue-700"
          >
            <Building2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="font-mono">CRN {crn}</span>
          </Link>
          <button
            onClick={() => remove(crn)}
            disabled={busy === crn}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {busy === crn ? "..." : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}