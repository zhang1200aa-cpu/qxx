import { statusLabel } from "@/lib/companies-house";
import { getDict, type Lang } from "@/lib/i18n-dict";

/** 公司注册状态徽章：Active(绿) / Dissolved(红) / 其他(琥珀) */
export function StatusBadge({ status, lang = "en" }: { status: string; lang?: Lang }) {
  const b = getDict(lang).badges;
  const ok = status === "active";
  const dead = status === "dissolved";
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold";
  const style = ok
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : dead
      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  const dot = ok
    ? "bg-emerald-500"
    : dead
      ? "bg-red-500"
      : "bg-amber-500";
  return (
    <span className={`${base} ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {ok ? b.active : dead ? b.dissolved : statusLabel(status)}
    </span>
  );
}

/** VAT 验证徽章 */
export function VatStatusBadge({ valid, lang = "en" }: { valid: boolean; lang?: Lang }) {
  const b = getDict(lang).badges;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        valid
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${valid ? "bg-emerald-500" : "bg-red-500"}`}
        aria-hidden="true"
      />
      {valid ? b.validVat : b.invalidVat}
    </span>
  );
}