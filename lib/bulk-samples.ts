/**
 * bulk-samples.ts — 批量查询「示例数据」常量
 *
 * 供两层使用：
 *  - app/bulk-guide/page.tsx      教程示例页（展示可一键复制/跳转的示例）
 *  - components/features/BulkTool.tsx  “加载示例数据”按钮（?sample=xxx 预填）
 *
 * 示例数据全部采用真实英国公司 / 常用格式样例，保证演示成功率高：
 *  - company: 来自 lib/seed.ts 的真实知名公司 CRN
 *  - postcode: 来自 lib/seed.ts 热门邮编
 *  - vat: 标准 9 位格式号（HMRC 校验会返回有效/无效两种结果，便于展示两种输出样式）
 */

export type SampleType = "company" | "vat" | "postcode";

export interface SampleSet {
  type: SampleType;
  /** 格式说明（英文，页面按语言再翻译） */
  formatHintEn: string;
  /** 示例数据（每行一个查询项，直接可粘贴） */
  items: string[];
}

export const SAMPLES: SampleSet[] = [
  {
    type: "company",
    formatHintEn: "One Companies House number per line — 6–8 digits or 2-letter prefix + 6 digits.",
    items: [
      "00445790",
      "00048839",
      "00214436",
      "04190816",
      "02723534",
      "00966425",
    ],
  },
  {
    type: "vat",
    formatHintEn: "One 9-digit UK VAT number per line — 'GB' prefix optional.",
    items: ["GB123456789", "GB234567890", "GB345678901", "GB456789012", "GB567890123"],
  },
  {
    type: "postcode",
    formatHintEn: "One full UK postcode per line — space optional.",
    items: ["SW1A 1AA", "SW1A 0AA", "EC2R 8AH", "EC1A 1BB", "E14 5AB", "M2 4BG"],
  },
];

export function getSample(type: SampleType): SampleSet {
  return SAMPLES.find((s) => s.type === type) ?? SAMPLES[0];
}

/** 示例数据文本（供复制/预填） */
export function sampleText(type: SampleType): string {
  return getSample(type).items.join("\n");
}

/** 示例别名：?sample=company / vat / postcode → SampleType */
export function parseSampleParam(value: string | null | undefined): SampleType | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "vat" || v === "company" || v === "postcode") return v;
  return null;
}