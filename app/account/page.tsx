import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, KeyRound, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCache } from "@/lib/cache";
import { MEMBER_DAILY_API, SUBSCRIBER_DAILY_WEB_API, getWebDailyApiForUser } from "@/lib/api-auth";
import { PLANS, type PlanId } from "@/lib/billing";
import { getPlan } from "@/lib/plan-config";
import { PLAN_EN } from "@/lib/plan-copy";
import { demoMode } from "@/lib/auth/demo";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { getLang, t } from "@/lib/i18n";
import { PLAN_ZH } from "@/lib/i18n-zh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account — qxx.uk",
  description: "Manage your qxx.uk membership, API quota, watchlist and plan.",
  robots: { index: false, follow: true },
};

export default async function AccountPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  const cache = getCache();
  const day = new Date().toISOString().slice(0, 10);

  if (user.tier === "guest") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Star className="mx-auto h-10 w-10 text-blue-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          {t(lang, "Your account is one step away", "账户就在一步之遥")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          {t(
            lang,
            "Create a free account to unlock 50 API calls/day, a company watchlist and your usage dashboard — no credit card required.",
            "注册免费账户即可解锁：每天 50 次 API、公司关注清单与用量仪表盘 —— 无需信用卡。"
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            {t(lang, "Create free account", "免费注册")}
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
          >
            {t(lang, "See paid plans", "查看付费方案")}
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          {t(
            lang,
            "Searching stays free for guests — signing up only adds member perks.",
            "游客查询始终免费 —— 注册只是解锁更多会员权益。"
          )}
        </p>
      </div>
    );
  }

  const dailyUsed =
    (await cache.get<number>(`usage:webapi:${user.id}:${day}`)) ?? 0;
  const dailyCap =
    user.tier === "subscriber" ? SUBSCRIBER_DAILY_WEB_API : MEMBER_DAILY_API;
  const dynamicDailyCap = await getWebDailyApiForUser(user);
  const watchlist = (await cache.get<string[]>(`watchlist:${user.id}`)) ?? [];
  const sub = user.subscription;
  const activePlan = await getPlan(user.planId as PlanId);
  const planName = activePlan?.name ?? user.planId;

  const planId = user.planId as PlanId;
  // 当前套餐权益清单（多语言；文案来自共享的套餐展示文案）
  const activePlanFeatures =
    activePlan && activePlan.features && activePlan.features.length > 0
      ? (lang === "zh"
          ? (PLAN_ZH[planId]?.features ?? activePlan.features)
          : (PLAN_EN[planId]?.features ?? activePlan.features))
      : lang === "zh"
        ? (PLAN_ZH[planId]?.features ?? [])
        : (PLAN_EN[planId]?.features ?? []);

  // 中文名：后台覆盖过套餐名则显示后台名，否则显示中文本地化名
  const planZhName = (id: string) => {
    const pid = id as PlanId;
    const overridden = activePlan && activePlan.name !== PLANS[pid]?.name;
    if (overridden) return activePlan!.name;
    return PLAN_ZH[id as keyof typeof PLAN_ZH]?.name ?? id;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t(lang, "My Account", "我的账户")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            user.tier === "subscriber"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {user.tier === "subscriber"
            ? (lang === "zh" ? planZhName(user.planId) : planName)
            : t(lang, "Free Member", "免费会员")}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          label={t(lang, "API quota today", "今日 API 额度")}
          value={`${dailyUsed} / ${dynamicDailyCap}`}
          sub={t(lang, "resets daily", "每日重置")}
        />
        <StatCard
          icon={<Star className="h-5 w-5" aria-hidden="true" />}
          label={t(lang, "Watchlist", "关注清单")}
          value={String(watchlist.length)}
          sub={<Link href="/watchlist" className="text-blue-700 hover:underline">{t(lang, "manage →", "管理 →")}</Link>}
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
          label={t(lang, "Plan", "当前方案")}
          value={user.tier === "subscriber" ? (lang === "zh" ? planZhName(user.planId) : planName) : t(lang, "Free Member", "免费会员")}
          sub={
            user.tier === "subscriber" ? (
              <Link href="/pricing" className="text-blue-700 hover:underline">{t(lang, "manage plan →", "管理方案 →")}</Link>
            ) : (
              <Link href="/pricing" className="text-blue-700 hover:underline">{t(lang, "upgrade →", "升级 →")}</Link>
            )
          }
        />
      </div>
{/* API Key（订阅用户） */}
      {sub?.apiKey && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <KeyRound className="h-5 w-5 text-blue-700" aria-hidden="true" /> API Key
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Your subscription includes an API key. Send it in the{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">x-api-key</code>{" "}
            header. The key is stored securely in your account — contact support to
            rotate it.
          </p>
          <p className="mt-3 font-mono text-xs text-slate-500">qx_live_••••••••••••••••••••••••</p>
        </section>
      )}

      {/* 当前套餐权益（按用户套餐动态展示） */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          {t(lang, "Your plan benefits", "当前套餐权益")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {user.tier === "subscriber"
            ? t(lang, "Included with your current plan.", "以下权益已包含在你的当前方案中。")
            : t(lang, "Included with your free membership.", "以下权益已包含在你的免费会员资格中。")}
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
          {activePlanFeatures.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {user.isDemo && demoMode() && <LogoutButton />}
        <Link href="/api-docs" className="text-sm font-semibold text-blue-700 hover:underline">
          API docs →
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Data retention: public lookups are not linked to your account. Watchlist and
        usage data are kept for up to 30 days.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-blue-600">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}