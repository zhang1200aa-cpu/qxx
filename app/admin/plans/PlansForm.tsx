"use client";

import { useState } from "react";
import { Save, RotateCcw, CheckCircle2 } from "lucide-react";
import type { Plan } from "@/lib/billing";
import type { PlanPatch } from "@/lib/plan-config";

interface Row {
  plan: Plan;
  defaultPlan: Plan;
}

/** 每个套餐的可编辑状态 */
interface Draft {
  id: string;
  name: string;
  audience: string;
  priceUsd: string;
  priceLabel: string;
  apiCallsPerMonth: string;
  bulkRowLimitPerBatch: string;
  csvExportRows: string;
  creditReports: string;
  bulkDailyCap: string;
  webDailyApiCalls: string;
  emailAlerts: boolean;
  highPriorityApi: boolean;
}

function toDraft(r: Row): Draft {
  return {
    id: r.plan.id,
    name: r.plan.name,
    audience: r.plan.audience,
    priceUsd: r.plan.priceUsd === null ? "" : String(r.plan.priceUsd),
    priceLabel: r.plan.priceLabel,
    apiCallsPerMonth: String(r.plan.limits.apiCallsPerMonth),
    bulkRowLimitPerBatch: String(r.plan.limits.bulkRowLimitPerBatch),
    csvExportRows: String(r.plan.limits.csvExportRows),
    creditReports: String(r.plan.limits.creditReports),
    bulkDailyCap: String(r.plan.limits.bulkDailyCap),
    webDailyApiCalls: String(r.plan.limits.webDailyApiCalls),
    emailAlerts: r.plan.limits.emailAlerts,
    highPriorityApi: r.plan.limits.highPriorityApi,
  };
}

// 数字输入框组件（受控）
function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        {suffix ? <span className="text-xs text-slate-600">{suffix}</span> : null}
      </div>
    </label>
  );
}
export function PlansForm({ initial }: { initial: Row[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(initial.map((r) => [r.plan.id, toDraft(r)]))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const patches: PlanPatch[] = Object.values(drafts).map((d) => ({
        id: d.id as PlanPatch["id"],
        name: d.name,
        audience: d.audience,
        priceUsd: d.priceUsd === "" ? null : Number(d.priceUsd),
        priceLabel: d.priceLabel,
        limits: {
          apiCallsPerMonth: Number(d.apiCallsPerMonth) || 0,
          bulkRowLimitPerBatch: Number(d.bulkRowLimitPerBatch) || 0,
          csvExportRows: Number(d.csvExportRows) || 0,
          creditReports: Number(d.creditReports) || 0,
          bulkDailyCap: Number(d.bulkDailyCap) || 0,
          webDailyApiCalls: Number(d.webDailyApiCalls) || 0,
          emailAlerts: d.emailAlerts,
          highPriorityApi: d.highPriorityApi,
        },
      }));
      const resp = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patches),
      });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "保存失败" });
        return;
      }
      const next = json.data as Record<string, Plan>;
      setDrafts((prev) => {
        const out = { ...prev };
        for (const [id, plan] of Object.entries(next)) {
          if (out[id]) out[id] = toDraft({ plan, defaultPlan: plan });
        }
        return out;
      });
      setMsg({ ok: true, text: "套餐设置已保存并即时生效。" });
    } catch {
      setMsg({ ok: false, text: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setMsg(null);
    try {
      const resp = await fetch("/api/admin/plans?action=reset", {
        method: "POST",
      });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "重置失败" });
        return;
      }
      const next = json.data as Record<string, Plan>;
      setDrafts((prev) => {
        const out = { ...prev };
        for (const [id, plan] of Object.entries(next)) {
          if (out[id]) out[id] = toDraft({ plan, defaultPlan: plan });
        }
        return out;
      });
      setMsg({ ok: true, text: "已重置为默认值。" });
    } catch {
      setMsg({ ok: false, text: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      {initial.map((r) => {
        const d = drafts[r.plan.id];
        if (!d) return null;
        const changed = JSON.stringify(toDraft(r)) !== JSON.stringify(d);
        return (
          <div
            key={d.id}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {d.name}
                <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {d.id}
                </span>
                {changed && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    未保存
                  </span>
                )}
              </h2>
              {r.defaultPlan.priceUsd !== r.plan.priceUsd ? (
                <span className="text-[10px] text-slate-400">
                  默认价: ${r.defaultPlan.priceUsd ?? 0}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className="block text-xs font-medium text-slate-500">
                名称
                <input
                  type="text"
                  value={d.name}
                  onChange={(e) => setDraft(d.id, { name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500 sm:col-span-2">
                描述
                <input
                  type="text"
                  value={d.audience}
                  onChange={(e) => setDraft(d.id, { audience: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </label>
              <NumField
                label="价格 (USD, 空=免费)"
                value={d.priceUsd}
                onChange={(v) => setDraft(d.id, { priceUsd: v })}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumField
                label="API 月配额 (次)"
                value={d.apiCallsPerMonth}
                onChange={(v) => setDraft(d.id, { apiCallsPerMonth: v })}
                suffix="次/月"
              />
              <NumField
                label="批量行数/次"
                value={d.bulkRowLimitPerBatch}
                onChange={(v) => setDraft(d.id, { bulkRowLimitPerBatch: v })}
                suffix="行"
              />
              <NumField
                label="CSV 导出行数"
                value={d.csvExportRows}
                onChange={(v) => setDraft(d.id, { csvExportRows: v })}
                suffix="行"
              />
              <NumField
                label="报告点数"
                value={d.creditReports}
                onChange={(v) => setDraft(d.id, { creditReports: v })}
                suffix="credits"
              />
              <NumField
                label="每日批量上限"
                value={d.bulkDailyCap}
                onChange={(v) => setDraft(d.id, { bulkDailyCap: v })}
                suffix="行/天"
              />
              <NumField
                label="网页 API 日配额"
                value={d.webDailyApiCalls}
                onChange={(v) => setDraft(d.id, { webDailyApiCalls: v })}
                suffix="次/天"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={d.emailAlerts}
                  onChange={(e) => setDraft(d.id, { emailAlerts: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                申报临期邮件提醒
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={d.highPriorityApi}
                  onChange={(e) =>
                    setDraft(d.id, { highPriorityApi: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                优先 API 速率预算
              </label>
              <span className="text-[11px] text-slate-400">
                默认: {r.defaultPlan.limits.apiCallsPerMonth.toLocaleString()} 次/月 ·{" "}
                {r.defaultPlan.limits.bulkRowLimitPerBatch.toLocaleString()} 行/批
              </span>
            </div>
          </div>
        );
      })}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          保存所有套餐
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          恢复默认
        </button>
      </div>

      {msg && (
        <p
          className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            msg.ok
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-600 ring-1 ring-red-200"
          }`}
        >
          {msg.ok && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          {msg.text}
        </p>
      )}
    </div>
  );
}