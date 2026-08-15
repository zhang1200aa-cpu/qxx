import { cookies } from "next/headers";

export type Lang = "en" | "zh" | "de";

export const LANG_COOKIE = "qxx_lang";

export const LANGS: Lang[] = ["en", "zh", "de"];

/** 服务端读取当前语言（cookie 或默认 en） */
export async function getLang(): Promise<Lang> {
  try {
    const store = await cookies();
    const v = store.get(LANG_COOKIE)?.value;
    return v === "zh" || v === "de" ? v : "en";
  } catch {
    return "en";
  }
}

/**
 * 三语切换辅助：t(lang, en, zh, de?)
 * 顺序固定为 en / zh / de，避免各组件参数顺序不一致。
 */
export function t(lang: Lang, en: string, zh: string, de?: string): string {
  if (lang === "zh") return zh;
  if (lang === "de") return de ?? en;
  return en;
}