"use client";

import { useState, type FormEvent } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";

/** 申报临期邮件提醒订阅（Accountant Pro 亮点；免费可监控 3 家） */
export function AlertOptIn() {
  const [email, setEmail] = useState("");
  const [crns, setCrns] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const crnList = crns
      .split(/[\s,]+/)
      .map((c) => c.replace(/\D/g, ""))
      .filter((c) => /^\d{6,8}$/.test(c))
      .slice(0, 5000);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (crnList.length === 0) {
      setError("Enter at least one company number (6-8 digits).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, crns: crnList }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Could not subscribe.");
        return;
      }
      setDone(
        `Monitoring ${json.data.monitoredCrns.length} companies for ${json.data.notifiedLeadDays} days' lead — you'll be emailed before Accounts / Confirmation Statement deadlines.`
      );
      setEmail("");
      setCrns("");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <BellRing className="h-4 w-4 text-blue-700" aria-hidden="true" />
        Filing deadline alerts (Accountant Pro)
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Get an email before Accounts / Confirmation Statement deadlines. Free plan
        monitors up to 3 companies.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@firm.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <textarea
          value={crns}
          onChange={(e) => setCrns(e.target.value)}
          rows={4}
          placeholder="Company numbers to watch, one per line — e.g. 00445790"
          className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {done && (
          <p className="flex items-start gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {done}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
        >
          {busy ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
    </div>
  );
}