import type { Lang } from "@/lib/i18n-dict";
import { getDict } from "@/lib/i18n-dict";

/** SEO 友好 FAQ 区（原生 details/summary，零 JS） */
export function FaqSection({
  heading,
  items,
}: {
  heading?: string;
  items: { question: string; answer: string }[];
}) {
  return (
    <section aria-label="FAQ" className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-6 space-y-3">
        {items.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            open={i === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 marker:hidden">
              {item.question}
              <span
                className="shrink-0 text-slate-400 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * 页面级 FAQ 内容（按语言返回）。
 * 动态子项（如公司/VAT 定制问题）由各详情页自行构造后合并。
 */
export function getFaqData(lang: Lang) {
  const d = getDict(lang).faq;
  return {
    heading: d.heading,
    dataSources: { question: d.dataSourcesQ, answer: d.dataSourcesA },
    vatFormat: { question: d.vatFormatQ, answer: d.vatFormatA },
    freeToUse: { question: d.freeToUseQ, answer: d.freeToUseA },
    officialStatus: { question: d.officialStatusQ, answer: d.officialStatusA },
    howFresh: { question: d.howFreshQ, answer: d.howFreshA },
    vatHow: { question: d.vatHowQ, answer: d.vatHowA },
    postcodeWhat: { question: d.postcodeWhatQ, answer: d.postcodeWhatA },
    postcodeUlez: { question: d.postcodeUlezQ, answer: d.postcodeUlezA },
  };
}