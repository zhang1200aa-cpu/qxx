"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Building2, Landmark, MapPin, Loader2, Search } from "lucide-react";
import { clientLang } from "@/lib/i18n-client";
import { getDict } from "@/lib/i18n-dict";
import { cleanCrn } from "@/lib/crn";

export type SearchTab = "company" | "vat" | "postcode";

/** Meilisearch 补全项（/api/search 返回） */
type Suggestion = {
  company_number: string;
  company_name: string;
  company_status: string | null;
  highlighted?: string;
};

const TAB_META: Record<
  SearchTab,
  {
    placeholderKey: "placeholderCompany" | "placeholderVat" | "placeholderPostcode";
    icon: typeof Building2;
    route: (value: string) => string;
  }
> = {
  company: {
    placeholderKey: "placeholderCompany",
    icon: Building2,
    route: (value) => {
      const crn = cleanCrn(value);
      return crn
        ? `/company/${crn}`
        : `/search?q=${encodeURIComponent(value.trim())}`;
    },
  },
  vat: {
    placeholderKey: "placeholderVat",
    icon: Landmark,
    route: (value) => {
      const digits = value.replace(/^GB/gi, "").replace(/[\s-]/g, "").replace(/\D/g, "");
      return `/vat/${digits}`;
    },
  },
  postcode: {
    placeholderKey: "placeholderPostcode",
    icon: MapPin,
    route: (value) => `/postcode/${value.trim().toUpperCase().replace(/\s+/g, "")}`,
  },
};

export function SearchBox({
  initialTab = "company",
  compact = false,
}: {
  initialTab?: SearchTab;
  compact?: boolean;
}) {
  const router = useRouter();
  const lang = clientLang();
  const dict = getDict(lang);
  const tabs = [
    { key: "company" as SearchTab, label: dict.search.tabCompany },
    { key: "vat" as SearchTab, label: dict.search.tabVat },
    { key: "postcode" as SearchTab, label: dict.search.tabPostcode },
  ];
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- 毫秒级自动补全（Meilisearch，仅公司 tab）----
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showList, setShowList] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  /** 防抖 150ms 拉取 Top 8 补全 */
  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    if (tab !== "company") return; // 仅公司补全；VAT/邮编维持原提交逻辑
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = v.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      // 竞态控制：新请求发出前中断仍在途的旧请求，避免慢响应覆盖新输入结果
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ac.signal }
        );
        if (!res.ok) {
          setSuggestions([]);
          setShowList(false);
          return;
        }
        const json = await res.json();
        if (json.success && json.data?.configured) {
          setSuggestions(json.data.items);
          setShowList(true);
        } else {
          // 未配置 Meilisearch：保持既有"提交到结果页"行为
          setSuggestions([]);
          setShowList(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSuggestions([]);
        setShowList(false);
      }
    }, 150);
  }

  function closeSuggestions() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setSuggestions([]);
    setShowList(false);
  }

  function goToCrn(crn: string) {
    closeSuggestions();
    router.push(`/company/${crn}`);
  }

  const meta = useMemo(() => TAB_META[tab], [tab]);
  const placeholder = dict.search[meta.placeholderKey];
  const label = tabs.find((t) => t.key === tab)?.label ?? meta.placeholderKey;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    closeSuggestions();
    const v = value.trim();
    if (!v) return;
    setLoading(true);
    router.push(meta.route(v));
  }

  const Icon = meta.icon;

  return (
    <div className={compact ? "w-full" : "w-full max-w-3xl"}>
      {/* Tab 切换 */}
      <div
        role="tablist"
        aria-label={dict.search.tabCompany}
        className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5"
      >
        {tabs.map((t) => {
          const TabIcon = TAB_META[t.key].icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TabIcon className="h-4 w-4" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 搜索输入区 */}
      <form
        onSubmit={onSubmit}
        className="mt-3 flex flex-col gap-3 sm:flex-row"
        role="search"
      >
        <div className="relative flex-1">
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={value}
            onChange={onInputChange}
            onBlur={() => setTimeout(() => setShowList(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeSuggestions();
            }}
            placeholder={placeholder}
            aria-label={label}
            role="combobox"
            aria-expanded={showList}
            aria-controls="company-suggestions"
            aria-autocomplete="list"
            inputMode={tab === "vat" ? "numeric" : "text"}
            autoComplete="off"
            className="h-13 w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          {/* Meilisearch 前缀补全下拉（Top 8，防抖 150ms） */}
          {showList && (
            <div
              id="company-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              {suggestions.length === 0 ? (
                <div className="px-3.5 py-3 text-sm text-slate-500">
                  No matching companies
                </div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s.company_number}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => goToCrn(s.company_number)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors hover:bg-blue-50"
                  >
                    <span className="truncate text-sm font-medium text-slate-800">
                      {s.highlighted ?? s.company_name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400">
                        {s.company_number}
                      </span>
                      {s.company_status && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500">
                          {s.company_status}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          {dict.hero.verifyBtn}
        </button>
      </form>
    </div>
  );
}