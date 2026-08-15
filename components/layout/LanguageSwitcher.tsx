"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import {
  clientLang,
  setLang,
  LANGS,
  langLabel,
  type Lang,
} from "@/lib/i18n-client";

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  zh: "中文",
  de: "Deutsch",
};

const LANG_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  zh: "🇨🇳",
  de: "🇩🇪",
};

/** 右上角语言切换：EN / 中文 / Deutsch（下拉选择，整站刷新） */
export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const lang: Lang = clientLang();

  function choose(next: Lang) {
    if (next === lang) {
      setOpen(false);
      return;
    }
    setLang(next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Language"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{langLabel(lang)}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close language menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <ul
            role="listbox"
            aria-label="Select language"
            className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {LANGS.map((l) => (
              <li key={l} role="option" aria-selected={l === lang}>
                <button
                  type="button"
                  onClick={() => choose(l)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 ${
                    l === lang ? "font-semibold text-blue-700" : "text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{LANG_FLAGS[l]}</span>
                    {LANG_NAMES[l]}
                  </span>
                  {l === lang && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}