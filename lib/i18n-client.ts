/**
 * 轻量三语（en/zh/de）支持 —— 客户端部分
 * 与 lib/i18n.ts（服务端）配套；客户端组件只 import 本文件，避免引入 next/headers。
 */
export type Lang = "en" | "zh" | "de";

export const LANG_COOKIE = "qxx_lang";

export const LANGS: Lang[] = ["en", "zh", "de"];

/** 客户端读取语言（cookie，缺省 en） */
export function clientLang(): Lang {
  if (typeof window === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)qxx_lang=([^;]+)/);
  const v = m?.[1];
  return v === "zh" || v === "de" ? v : "en";
}

/** 设置/切换语言（客户端调用后刷新） */
export function setLang(lang: Lang): void {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

/** 下一个要切换的语言（en → zh → de → en） */
export function nextLang(lang: Lang): Lang {
  const idx = LANGS.indexOf(lang);
  return LANGS[(idx + 1) % LANGS.length];
}

/** 语言的展示名（切换按钮用） */
export function langLabel(lang: Lang): string {
  return lang === "zh" ? "中文" : lang === "de" ? "DE" : "EN";
}