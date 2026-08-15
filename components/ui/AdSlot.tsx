"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/lib/site";
import { clientLang } from "@/lib/i18n-client";
import { getDict } from "@/lib/i18n-dict";

/**
 * Google AdSense 响应式广告位
 * - 未配置 NEXT_PUBLIC_ADSENSE_CLIENT 时不渲染任何内容（本地开发零干扰）
 * - 使用 ins.adsbygoogle push 触发加载
 * - adSlot 参数对应 AdSense 后台创建的广告单元 ID（数字）
 */
export function AdSlot({
  slot,
  format = "auto",
  className = "",
  label,
}: {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const enabled = Boolean(siteConfig.adsenseClient);
  const dict = getDict(clientLang());
  const resolvedLabel = label ?? dict.ad.label;

  useEffect(() => {
    if (!enabled || !ref.current) return;
    try {
      const ins = ref.current;
      if (ins.dataset.loaded === "true") return;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      ins.dataset.loaded = "true";
    } catch {
      // 忽略 AdSense 初始化异常
    }
  }, [enabled]);

  if (!enabled) {
    // 开发/未配置时的占位（便于排版预览，部署前删除）
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 ${className}`}
      >
        Ad Slot ({resolvedLabel})
      </div>
    );
  }

  return (
    <div className={`ad-slot ${className}`}>
      <span className="mb-1 block text-center text-[10px] uppercase tracking-widest text-slate-400">
        {resolvedLabel}
      </span>
      <ins
        ref={ref}
        className="adsbygoogle block h-full w-full"
        style={{ display: "block" }}
        data-ad-client={siteConfig.adsenseClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}