/**
 * 展示格式化工具
 */

/** 日期 -> 友好格式（en-GB） */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** ISO 时间戳 -> 中欧时间友好显示 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

/** 地址对象 -> 单行 */
export function formatAddress(a: {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  care_of?: string;
} | null): string {
  if (!a) return "Not available";
  const parts = [
    a.care_of ? `c/o ${a.care_of}` : "",
    a.address_line_1,
    a.address_line_2,
    a.locality,
    a.region,
    a.postal_code,
    a.country,
  ];
  return parts.filter(Boolean).join(", ");
}

/** SIC 描述（常见大类映射，未知则原样返回编号） */
const SIC_COMMON: Record<string, string> = {
  "62020": "Information technology consultancy activities",
  "62012": "Business and domestic software development",
  "70100": "Activities of head offices",
  "70229": "Management consultancy activities (other)",
  "41100": "Development of building projects",
  "68209": "Other letting and operating of own or leased real estate",
  "68100": "Buying and selling of own real estate",
  "47110": "Retail sale in non-specialised stores with food, beverages or tobacco",
  "47910": "Retail sale via mail order houses or via Internet",
  "82990": "Other business support service activities n.e.c.",
  "96090": "Other personal service activities n.e.c.",
  "86900": "Other human health activities",
  "70221": "Financial management",
  "69201": "Accounting and auditing activities",
  "49410": "Freight transport by road",
  "62090": "Other information technology and computer service activities",
};

/** 生成 SIC 说明（有映射返回映射，否则返回编号本身） */
export function sicLabel(code: string): string {
  return SIC_COMMON[code] ?? code;
}

/** 大写首字母 */
export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}