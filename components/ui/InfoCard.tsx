import type { ReactNode } from "react";

/** 详情卡片外壳：标题 + 可选的右上角徽章 */
export function InfoCard({
  title,
  badge,
  actions,
  children,
}: {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          {title}
        </h2>
        {badge}
      </div>
      <dl className="divide-y divide-slate-100 px-5">{children}</dl>
      {actions && (
        <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          {actions}
        </div>
      )}
    </section>
  );
}

/** 单个数据字段行 */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="field-row flex flex-col gap-1 py-3.5 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-48 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}