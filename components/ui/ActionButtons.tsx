"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { clientLang } from "@/lib/i18n-client";
import { getDict } from "@/lib/i18n-dict";

/** 一键复制合规摘要 */
export function CopyButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const dict = getDict(clientLang());

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 降级：创建隐藏 textarea 复制
      const ta = document.createElement("textarea");
      ta.value = text;
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
    <button
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-700 ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? dict.actions.copied : label ?? dict.actions.copySummary}
    </button>
  );
}

/** 触发浏览器打印（另存为 PDF = 验证报告导出） */
export function PrintReportButton({
  label,
  children,
  className = "",
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const dict = getDict(clientLang());
  return (
    <button
      onClick={() => window.print()}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 ${className}`}
    >
      {children}
      {label ?? dict.actions.downloadPdf}
    </button>
  );
}