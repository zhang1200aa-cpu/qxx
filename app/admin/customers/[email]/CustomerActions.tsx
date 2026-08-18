"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

const PLAN_OPTIONS = [
  "free",
  "member",
  "api-starter",
  "accountant-pro",
  "credit-pack",
  "lead-export",
];
const STATUS_OPTIONS = ["active", "trialing", "cancelled", "expired"];

type Props = {
  email: string;
  initial: {
    plan: string;
    status?: string;
    credits?: number;
    alertsEnabled?: boolean;
    apiKey?: string;
  };
};

/** 客户操作表单：改套餐/状态/额度/提醒、发放/重置/撤销 API Key */
export function CustomerActions({ email, initial }: Props) {
  const [plan, setPlan] = useState(initial.plan);
  const [status, setStatus] = useState(initial.status ?? "active");
  const [credits, setCredits] = useState(String(initial.credits ?? 0));
  const [alerts, setAlerts] = useState(Boolean(initial.alertsEnabled));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(patch: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "操作失败" });
        return;
      }
      if (json.data?.issuedApiKey) {
        setMsg({ ok: true, text: `新 Key：${json.data.issuedApiKey}` });
        navigator.clipboard?.writeText(json.data.issuedApiKey).catch(() => undefined);
      } else {
        setMsg({ ok: true, text: "已保存。" });
      }
    } catch {
      setMsg({ ok: false, text: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Actions</h2>

      <form
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          run({ plan, status, credits: Number(credits), alertsEnabled: alerts });
        }}
      >
        <label className="text-xs font-medium text-slate-500">
          Plan
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Credits (PDF reports)
          <input
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={alerts}
            onChange={(e) => setAlerts(e.target.checked)}
          />
          Email alerts enabled
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            保存（套餐 / 状态 / 额度）
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ apiKeyAction: "issue" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <KeyRound className="h-3.5 w-3.5" /> 发放 API Key
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ apiKeyAction: "reset" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 disabled:opacity-50"
        >
          重置 Key（旧 Key 立即失效）
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ apiKeyAction: "revoke" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          撤销 Key
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ status: "cancelled" })}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          停用账户
        </button>
      </div>

      {msg && (
        <p className={`mt-3 text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>
      )}
    </div>
  );
}