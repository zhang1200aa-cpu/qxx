"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { clientLang, type Lang } from "@/lib/i18n-client";

/**
 * 客户端账号徽章（Header 右侧）
 *
 * 实现：
 *  - Clerk 已配置时用 useUser() 实时感知登录/登出：登录成功右上角立即变为"我的账户"
 *    （会员等级由 /api/me 提供：subscriber → 绿点，member → 蓝点）
 *  - 未配置 Clerk（演示环境）时退回 /api/me 判定，游客显示"登录 / 注册"
 */
function fetchMeTier(): Promise<"member" | "subscriber" | null> {
  return fetch("/api/me")
    .then((r) => r.json())
    .then((j) => {
      const t = j?.data?.user?.tier;
      if (t === "guest") return null;
      return t === "subscriber" ? "subscriber" : "member";
    })
    .catch(() => null);
}

function Skeleton() {
  return (
    <span
      className="ml-2 hidden h-8 w-24 rounded-lg bg-slate-100 sm:inline-block"
      aria-hidden="true"
    />
  );
}

function useI18n() {
  const lang: Lang = clientLang();
  return {
    signIn: lang === "zh" ? "登录" : lang === "de" ? "Anmelden" : "Sign in",
    signUp: lang === "zh" ? "免费注册" : lang === "de" ? "Kostenlos Registrieren" : "Free Sign up",
    account: lang === "zh" ? "我的账户" : lang === "de" ? "Mein Konto" : "My account",
    accountTitle:
      lang === "zh" ? "我的账户 / 套餐" : lang === "de" ? "Mein Konto / Plan" : "My account & plan",
  };
}

function GuestLinks({ text }: { text: ReturnType<typeof useI18n> }) {
  return (
    <div className="ml-2 flex items-center gap-2">
      <Link
        href="/sign-in"
        className="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 sm:inline-flex"
      >
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        {text.signIn}
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 sm:px-3"
      >
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{text.signUp}</span>
        <span className="sm:hidden">{text.signIn}</span>
      </Link>
    </div>
  );
}

function AccountLink({
  text,
  tier,
}: {
  text: ReturnType<typeof useI18n>;
  tier: "member" | "subscriber" | null;
}) {
  return (
    <div className="ml-2 flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${tier === "subscriber" ? "bg-emerald-500" : "bg-blue-500"}`}
        aria-hidden="true"
      />
      <Link
        href="/account"
        title={text.accountTitle}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 sm:px-3"
      >
        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{text.account}</span>
      </Link>
    </div>
  );
}

/** 有 Clerk Provider 的账户徽章（登录态实时） */
function ClerkAccountBadge() {
  const { isLoaded, isSignedIn } = useUser();
  const text = useI18n();
  const [tier, setTier] = useState<"member" | "subscriber" | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    // 登录/登出都从服务端取最新等级；isSignedIn=false 时 /api/me 返回 guest → null
    fetchMeTier().then((t) => {
      if (active) setTier(t);
    });
    return () => {
      active = false;
    };
  }, [isLoaded]);

  if (!isLoaded) return <Skeleton />;
  if (!isSignedIn) return <GuestLinks text={text} />;
  return <AccountLink text={text} tier={tier} />;
}

/** 无 Clerk（演示环境）时退回 /api/me 判定 */
function LegacyAccountBadge() {
  const [state, setState] = useState<"loading" | "guest" | "member" | "subscriber">("loading");
  const text = useI18n();

  useEffect(() => {
    let active = true;
    fetchMeTier().then((t) => {
      if (!active) return;
      setState(t === null ? "guest" : t);
    });
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return <Skeleton />;
  if (state === "guest") return <GuestLinks text={text} />;
  return <AccountLink text={text} tier={state === "subscriber" ? "subscriber" : "member"} />;
}

export function AccountBadge() {
  // NEXT_PUBLIC 前缀在构建时内联；有 Key 才走 Clerk 实时会话
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (clerkEnabled) return <ClerkAccountBadge />;
  return <LegacyAccountBadge />;
}