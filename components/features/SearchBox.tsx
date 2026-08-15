"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Building2, Landmark, MapPin, Loader2, Search } from "lucide-react";
import { clientLang } from "@/lib/i18n-client";
import { getDict } from "@/lib/i18n-dict";

export type SearchTab = "company" | "vat" | "postcode";

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
    route: (value) =>
      /^\d{6,8}$/.test(value.replace(/\D/g, ""))
        ? `/company/${value.replace(/\D/g, "")}`
        : `/search?q=${encodeURIComponent(value.trim())}`,
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

  const meta = useMemo(() => TAB_META[tab], [tab]);
  const placeholder = dict.search[meta.placeholderKey];
  const label = tabs.find((t) => t.key === tab)?.label ?? meta.placeholderKey;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
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
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            inputMode={tab === "vat" ? "numeric" : "text"}
            autoComplete="off"
            className="h-13 w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
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