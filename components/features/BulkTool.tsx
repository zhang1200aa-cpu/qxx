"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  FileDown,
  Loader2,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { FREE_BULK_ROWS } from "@/lib/billing";

type BulkType = "company" | "vat" | "postcode";
type Row = { input: string; data?: unknown; error?: string };

const TYPE_LABEL: Record<BulkType, { label: string; hint: string }> = {
  company: {
    label: "Companies (CRN)",
    hint: "One 6-8 digit Companies House number per line, e.g. 00445790",
  },
  vat: {
    label: "UK VAT numbers",
    hint: "One 9-digit VAT number per line (GB prefix optional)",
  },
  postcode: {
    label: "Postcodes",
    hint: "One full UK postcode per line, e.g. SW1A 1AA",
  },
};

export function BulkTool() {
  const [type, setType] = useState<BulkType>("company");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(FREE_BULK_ROWS);
  const [tier, setTier] = useState<string>("guest");

  // 登录用户解锁更高批量额度（member 50 / subscriber 5,000）
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!active) return;
        const t = json?.data?.user?.tier;
        setTier(t ?? "guest");
        if (t === "member") setLimit(50);
        else if (t === "subscriber") setLimit(5_000);
      } catch {
        // 保持默认
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const parsed = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10_000),
    [text]
  );
  const overLimit = parsed.length > limit;

  async function run(e: FormEvent) {
    e.preventDefault();
    if (parsed.length === 0 || overLimit || busy) return;
    setBusy(true);
    setError(null);
    setRows([]);
    try {
      const res = await fetch("/api/v1/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, items: parsed }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Bulk lookup failed.");
        return;
      }
      setRows(
        (json.data.results as Row[]).concat(
          (json.data.errors as { input: string; error: string }[]).map((r) => ({
            input: r.input,
            error: r.error,
          }))
        )
      );
    } catch {
      setError("Network error while running the batch.");
    } finally {
      setBusy(false);
    }
  }
function exportCsv() {
    if (rows.length === 0) return;
    const lines: string[] = [];
    for (const row of rows) {
      if (row.error) {
        lines.push(`${row.input}`);
        continue;
      }
      if (type === "company") {
        const d = row.data as {
          company_number?: string;
          company_name?: string;
          company_status?: string;
          date_of_creation?: string;
        };
        lines.push(
          `${d.company_number ?? ""},${d.company_status ?? ""},${d.date_of_creation ?? ""},"${(d.company_name ?? "").replace(/"/g, '""')}"`
        );
      } else if (type === "vat") {
        const d = row.data as {
          vat_number?: string;
          valid?: boolean;
          name?: string | null;
        };
        lines.push(
          `${d.vat_number ?? ""},${d.valid ? "VALID" : "INVALID"},"${(d.name ?? "").replace(/"/g, '""')}"`
        );
      } else {
        const d = row.data as {
          result?: {
            postcode?: string;
            admin_district?: string | null;
            latitude?: number | null;
            longitude?: number | null;
          } | null;
        };
        const r = d.result;
        lines.push(
          `${r?.postcode ?? ""},${r?.admin_district ?? ""},${r?.latitude ?? ""},${r?.longitude ?? ""}`
        );
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qxx-bulk-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const meta = TYPE_LABEL[type];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900">
          Bulk Company / VAT / Postcode Check
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {tier === "guest"
            ? `Guests: up to ${FREE_BULK_ROWS} rows per run — free sign-in unlocks 50.`
            : `You can run up to ${limit.toLocaleString()} rows per run.`}{" "}
          <a href={tier === "guest" ? "/sign-up" : "/pricing"} className="font-semibold text-blue-600 hover:underline">
            {tier === "guest" ? "Create free account →" : "Upgrade for more →"}
          </a>
        </p>
      </div>

      <form onSubmit={run} className="space-y-4 px-6 py-5">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABEL) as BulkType[]).map((t) => {
            const Icon = t === "vat" ? ShieldAlert : t === "postcode" ? MapPin : Building2;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setRows([]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  type === t
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {TYPE_LABEL[t].label}
              </button>
            );
          })}
        </div>
<div>
          <label htmlFor="bulk-input" className="mb-1 block text-xs font-semibold text-slate-600">
            {meta.label} — {meta.hint}
          </label>
          <textarea
            id="bulk-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={meta.hint}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="mt-1 text-xs text-slate-400">
            {parsed.length} valid line{parsed.length === 1 ? "" : "s"}{" "}
            {overLimit && (
              <span className="font-semibold text-amber-600">
                — your plan allows {limit} rows per run.{" "}
                <a href={tier === "guest" ? "/sign-up" : "/pricing"} className="underline">
                  {tier === "guest" ? "Sign in free" : "Upgrade"}
                </a>
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={parsed.length === 0 || overLimit || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            )}
            Run batch ({parsed.length})
          </button>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </button>
          )}
        </div>
      </form>

      {rows.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Results ({rows.length})
          </h3>
          <div className="mt-2 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Input</th>
                  <th className="px-3 py-2 font-semibold">Key fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-slate-700">{row.input}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.error ? (
                        <span className="text-red-600">{row.error}</span>
                      ) : (
                        <SummaryCell type={type} data={row.data} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ type, data }: { type: BulkType; data?: unknown }) {
  if (type === "company") {
    const d = data as {
      company_name?: string;
      company_status?: string;
      registered_office_address?: { postal_code?: string } | null;
    };
    return (
      <>
        <span className="font-semibold text-slate-800">{d.company_name ?? "—"}</span>
        <span className="ml-2 capitalize text-slate-500">{d.company_status}</span>
        <span className="ml-2 text-slate-400">
          {d.registered_office_address?.postal_code}
        </span>
      </>
    );
  }
  if (type === "vat") {
    const d = data as { valid?: boolean; name?: string | null };
    return (
      <>
        <span
          className={
            d.valid ? "font-semibold text-emerald-600" : "font-semibold text-red-600"
          }
        >
          {d.valid ? "VALID" : "INVALID"}
        </span>
        <span className="ml-2">{d.name ?? "—"}</span>
      </>
    );
  }
  const d = data as { result?: { admin_district?: string | null } | null };
  return <>{d.result?.admin_district ?? "—"}</>;
}