"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { getSample, sampleText, type SampleType } from "@/lib/bulk-samples";

/**
 * 示例数据卡片：显示格式提示 + 示例数据，一键复制或跳转到批量工具。
 * 供 /bulk-guide 教程示例页使用；跳转时通过 ?sample= 预填批量工具。
 */
export function SampleDataCard({ type }: { type: SampleType }) {
  const s = getSample(type);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(sampleText(type));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = sampleText(type);
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Badge type={type} />
            <span>{s.type === "company" ? "Companies" : s.type === "vat" ? "VAT numbers" : "Postcodes"}</span>
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.formatHintEn}</p>
        </div>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-emerald-300">
        {sampleText(type)}
      </pre>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? "Copied!" : "Copy sample data"}
        </button>
        <a
          href={`/dashboard?sample=${type}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          Open in bulk tool
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function Badge({ type }: { type: SampleType }) {
  const styles: Record<SampleType, string> = {
    company: "bg-blue-50 text-blue-700 ring-blue-200",
    vat: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    postcode: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${styles[type]}`}
    >
      {type}
    </span>
  );
}