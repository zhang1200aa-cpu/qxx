"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { clientLang, type Lang } from "@/lib/i18n-client";

/**
 * 客户端账号徽章（Header 右侧）
 * 通过 /api/me 获取登录状态，兼容 Clerk 与 demo 会话。
 * 游客显示轻量 "Sign in"，不弹窗、不阻塞。
 */
export function AccountBadge() {
  const [state, setState] = useState<"loading" | "guest" | "member" | "subscriber">("loading");
  const lang: Lang = clientLang();
  const zh = lang === "zh";
  const de = lang === "de";

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!active) return;
        const tier = json?.data?.user?.tier ?? "guest";
        setState(tier === "subscriber" ? "subscriber" : tier === "guest" ? "guest" : "member");
      } catch {
        if (active) setState("guest");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return <span className="ml-2 hidden h-8 w-24 rounded-lg bg-slate-100 sm:inline-block" aria-hidden="true" />;
  }

  if (state === "guest") {
    return (
      <div className="ml-2 flex items-center gap-2">
        <Link
          href="/sign-in"
          className="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 sm:inline-flex"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          {zh ? "登录" : de ? "Anmelden" : "Sign in"}
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{zh ? "免费" : de ? "Kostenlos" : "Free"}</span> {zh ? "注册" : de ? "Registrieren" : "Sign up"}
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-2 flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          state === "subscriber" ? "bg-emerald-500" : "bg-blue-500"
        }`}
        aria-hidden="true"
      />
      <Link
        href="/account"
        title={zh ? "我的账户 / 套餐" : de ? "Mein Konto / Plan" : "My account & plan"}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 sm:px-3"
      >
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">
          {zh ? "我的账户" : de ? "Mein Konto" : "My account"}
        </span>
      </Link>
    </div>
  );
}