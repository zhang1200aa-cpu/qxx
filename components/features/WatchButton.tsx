"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

/**
 * 公司页"关注"按钮。
 * 不依赖 Clerk hook：统一通过 /api/me 判断登录态，
 * 与 demo 模式、Clerk 模式均兼容。游客看到轻引导而非强制弹窗。
 */
export function WatchButton({ crn }: { crn: string }) {
  const [state, setState] = useState<"loading" | "guest" | "saved" | "unsaved">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!active) return;
        const tier = json?.data?.user?.tier;
        if (!tier || tier === "guest") {
          setState("guest");
          return;
        }
        const wl = await fetch("/api/watchlist");
        const wj = await wl.json();
        if (!active) return;
        setState(wj.success && wj.data.crns.includes(String(crn)) ? "saved" : "unsaved");
      } catch {
        if (active) setState("guest");
      }
    })();
    return () => {
      active = false;
    };
  }, [crn]);

  if (state === "loading") {
    return <span className="inline-block h-9 w-32 rounded-lg bg-slate-100" aria-hidden="true" />;
  }

  if (state === "guest") {
    return (
      <a
        href="/sign-up"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-700"
      >
        <Star className="h-4 w-4" aria-hidden="true" />
        Save to watchlist
      </a>
    );
  }

  return (
    <button
      onClick={async () => {
        if (state === "saved") {
          await fetch(`/api/watchlist?crn=${crn}`, { method: "DELETE" });
          setState("unsaved");
        } else {
          await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crn }),
          });
          setState("saved");
        }
      }}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        state === "saved"
          ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
          : "border border-slate-300 bg-white text-slate-700 hover:border-blue-400"
      }`}
    >
      <Star
        className={`h-4 w-4 ${state === "saved" ? "fill-amber-500 text-amber-500" : ""}`}
        aria-hidden="true"
      />
      {state === "saved" ? "Saved" : "Save to watchlist"}
    </button>
  );
}