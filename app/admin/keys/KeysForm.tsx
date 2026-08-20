"use client";

import { useState } from "react";
import { Save, RotateCcw, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface KeyItem {
  name: string;
  label: string;
  secret: boolean;
  restartHint?: string;
  configuredValue: string;
  effectiveValue: string;
}

export function KeysForm({ initial }: { initial: KeyItem[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((k) => [k.name, k.configuredValue]))
  );
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setVal = (name: string, v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const toggleReveal = (name: string) =>
    setRevealed((prev) => ({ ...prev, [name]: !prev[name] }));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const resp = await fetch("/api/admin/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "保存失败" });
        return;
      }
      setMsg({
        ok: true,
        text: "Key 已保存到运行时配置。已生效的 KEY 立即更新；需重启的请在方便时重启服务。",
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
      const resp = await fetch("/api/admin/keys?action=reset", {
        method: "POST",
      });
      const json = await resp.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? "重置失败" });
        return;
      }
      setValues(Object.fromEntries(initial.map((k) => [k.name, ""])));
      setMsg({ ok: true, text: "已清空所有运行时 KEY 覆盖，回退到 .env.local。" });
    } catch {
      setMsg({ ok: false, text: "网络错误" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        运行时 Key 配置
      </h2>

      <div className="mt-4 divide-y divide-slate-100">

        {initial.map((k) => {
          const val = values[k.name] ?? "";
          const masked = k.secret && !revealed[k.name];
          const isOverride = k.configuredValue !== "";
          return (
            <div key={k.name} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{k.label}</p>
                  <p className="font-mono text-[11px] text-slate-400">{k.name}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    isOverride
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isOverride ? "已覆盖" : "使用 env"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type={masked ? "password" : "text"}
                  value={val}
                  onChange={(e) => setVal(k.name, e.target.value)}
                  placeholder={k.effectiveValue ? "••••••••（当前已配置）" : "空"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
                {k.secret && (
                  <button
                    type="button"
                    onClick={() => toggleReveal(k.name)}
                    className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:text-slate-800"
                    title={revealed[k.name] ? "隐藏" : "显示"}
                  >
                    {revealed[k.name] ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                当前生效:{" "}
                {k.effectiveValue
                  ? k.secret
                    ? "••••" + k.effectiveValue.slice(-4)
                    : k.effectiveValue
                  : "未配置"}
                {k.restartHint ? ` · ${k.restartHint}` : ""}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          保存 Key
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          清空覆盖
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