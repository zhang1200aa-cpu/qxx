"use client";

import { useEffect, useState } from "react";

interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface GscData {
  success: boolean;
  error?: string;
  startDate?: string;
  endDate?: string;
  rows?: GscRow[];
  totalClicks?: number;
  totalImpressions?: number;
  avgPosition?: number;
  avgCtr?: number;
}

/** 客户端 GSC 数据分析组件（管理后台） */
export function SeoAnalytics() {
  const [data, setData] = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seo/analytics?dimensions=query&limit=10")
      .then((r) => r.json())
      .then((j: GscData) => {
        setData(j);
        setLoading(false);
      })
      .catch(() => {
        setData({
          success: false,
          error: "Failed to load GSC data (network error).",
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-10 w-24 rounded bg-slate-100" />
          <div className="h-28 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Google Search Console</h2>
        <p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
          ⚠️ {data?.error ?? "Not configured"}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          需设置 <code className="rounded bg-slate-100 px-1">GOOGLE_SEARCH_CONSOLE_API_KEY</code> 环境变量,
          并授予 Search Console API 访问权限后方可加载。
        </p>
      </div>
    );
  }

  const totalClicks = data.totalClicks ?? 0;
  const totalImpressions = data.totalImpressions ?? 0;
  const avgPosition = data.avgPosition ?? 0;
  const avgCtr = data.avgCtr ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Google Search Console</h2>
        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-200">
          Last 30 days
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-lg font-extrabold text-blue-900">{totalClicks.toLocaleString()}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Clicks</p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3">
          <p className="text-lg font-extrabold text-indigo-900">{totalImpressions.toLocaleString()}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600">Impressions</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-3">
          <p className="text-lg font-extrabold text-purple-900">{avgCtr}%</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-purple-600">Avg. CTR</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-3">
          <p className="text-lg font-extrabold text-teal-900">{avgPosition.toFixed(1)}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-teal-600">Avg. Position</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Top queries</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          {(data.rows ?? []).slice(0, 10).map((row, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate text-xs font-medium text-slate-700">
                {row.keys?.[0] ?? "—"}
              </span>
              <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                <span>{((row.clicks ?? 0)).toLocaleString()} clicks</span>
                <span>{((row.impressions ?? 0)).toLocaleString()} impr.</span>
                <span className="font-mono">{(((row.position ?? 0)).toFixed(1))}</span>
              </div>
            </li>
          ))}
          {(data.rows ?? []).length === 0 && (
            <li className="py-2 text-xs text-slate-400">No search data available yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}