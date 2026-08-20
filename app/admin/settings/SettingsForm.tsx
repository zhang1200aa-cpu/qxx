"use client";

import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import type { SearchLimits } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: SearchLimits }) {
  const [guestHours, setGuestHours] = useState(String(initial.guestIntervalSeconds / 3600));
  const [memberDaily, setMemberDaily] = useState(String(initial.memberDailySearchLimit));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const hours = Math.max(0.0167, Math.min(Number(guestHours) || 2, 24));
      const resp = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIntervalSeconds: Math.round(hours * 3600),
          memberDailySearchLimit: Math.max(0, Math.min(Number(memberDaily) || 10, 1000)),
        }),
      });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "保存失败" });
        return;
      }
      // 用后端返回的实际生效值刷新表单，并回显给用户
      const d = json.data as SearchLimits;
      setGuestHours(String((d.guestIntervalSeconds ?? 0) / 3600));
      setMemberDaily(String(d.memberDailySearchLimit ?? 0));
      setMsg({
        ok: true,
        text: `设置已保存并即时生效。当前：游客每 ${Math.round(
          ((d.guestIntervalSeconds ?? 0) / 3600) * 100
        ) / 100} 小时 ${d.guestMaxPerWindow ?? 1} 次 / 会员每天 ${
          d.memberDailySearchLimit ?? 0
        } 次`,
      });
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
      const resp = await fetch("/api/admin/settings?action=reset", { method: "POST" });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "重置失败" });
        return;
      }
      setGuestHours(String(2));
      setMemberDaily(String(10));
      setMsg({ ok: true, text: "已重置为默认值（游客每2小时1次 / 会员每天10次）。" });
    } catch {
      setMsg({ ok: false, text: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        限额配置
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">游客（未登录）</h3>
          <p className="mt-1 text-xs text-slate-500">
            按 IP 限流。防止未登录用户频繁查询。
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-500">
            每几小时允许 1 次查询？
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={0.017}
                max={24}
                step={0.5}
                value={guestHours}
                onChange={(e) => setGuestHours(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-slate-600">小时</span>
            </div>
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">注册会员</h3>
          <p className="mt-1 text-xs text-slate-500">
            每天最多可进行多少次前台搜索查询？
          </p>
          <label className="mt-3 block text-xs font-medium text-slate-500">
            每天最多
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={1000}
                step={1}
                value={memberDaily}
                onChange={(e) => setMemberDaily(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-slate-600">次</span>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          保存设置
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          恢复默认
        </button>
      </div>

      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}