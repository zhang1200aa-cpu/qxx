import type { ReactNode } from "react";

/**
 * 统一页面容器 —— 提供一致的响应式内边距与最大宽度。
 * 用于替换各页面手写的 `mx-auto max-w-* px-4 py-* sm:px-6` 模式，
 * 保持全站视觉一致性，也便于未来统一调整间距策略。
 */
export function PageContainer({
  children,
  className = "",
  maxW = "max-w-7xl",
  py = "py-10",
}: {
  children: ReactNode;
  className?: string;
  maxW?: "max-w-3xl" | "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl";
  py?: string;
}) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxW} ${py} ${className}`}>
      {children}
    </div>
  );
}

/** 页面标题区（h1 + 副标题） */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** 统一卡片容器 */
export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const hoverCls = hover ? "card-hover hover:border-blue-300 hover:shadow-md" : "";
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${hoverCls} ${className}`}
    >
      {children}
    </div>
  );
}

/** 统一 Section 容器（带标题） */
export function Section({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-12 ${className}`}>
      {title && <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>}
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      {children && <div className={title || subtitle ? "mt-5" : ""}>{children}</div>}
    </section>
  );
}