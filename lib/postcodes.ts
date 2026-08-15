/**
 * Postcodes.io 邮编查询 API 封装
 *
 * 文档: https://postcodes.io
 * 说明: 100% 免费开源，无需 API Key，支持批量查询。
 *       数据来自 ONS 国家统计局，更新频率低 -> 缓存 30 天。
 */
import { getCache, CACHE_TTL } from "./cache";
import type { PostcodeLookupResult } from "./types";

const POSTCODES_BASE = "https://api.postcodes.io";

export class PostcodeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** 归一化邮编：转大写、去空格 */
export function normalizePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** 校验英国邮编格式（宽松） */
export function validPostcode(value: string): boolean {
  const p = normalizePostcode(value);
  return (
    /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(p) ||
    /^GIR0AA$/.test(p) || // GIR 0AA 特例
    /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(value.trim())
  );
}

/** 查询单个邮编 */
export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult> {
  const code = normalizePostcode(postcode);
  if (!validPostcode(code)) {
    throw new PostcodeError("Invalid UK postcode format.", 400);
  }

  const cache = getCache();
  const cacheKey = `postcode:${code}`;
  const cached = await cache.get<PostcodeLookupResult>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${POSTCODES_BASE}/postcodes/${encodeURIComponent(code)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) {
    throw new PostcodeError("Postcode not found.", 404);
  }
  if (!res.ok) {
    throw new PostcodeError(`Postcodes.io error (${res.status}).`, res.status);
  }

  const data = (await res.json()) as PostcodeLookupResult;
  if (data.status !== 200 || !data.result) {
    throw new PostcodeError("Postcode not found.", 404);
  }
  await cache.set(cacheKey, data, CACHE_TTL.postcode);
  return data;
}

/** 判断是否属于伦敦 ULEZ / 拥堵费区域（依据 postcode district 前缀做粗判） */
export function londonChargeZones(postcode: string): {
  ulezZonePrefixes: string[];
  inUlez: boolean;
} {
  // ULEZ 覆盖伦敦绝大部分区域，这里给出一个供展示用的判断（结合 lat/lng 更精确）
  const londonPrefixes = [
    "E", "EC", "N", "NW", "SE", "SW", "W", "WC", "BR", "CR", "DA", "EN", "HA",
    "IG", "KT", "RM", "SM", "TW", "UB", "WD",
  ];
  const district = normalizePostcode(postcode).match(/^[A-Z]{1,2}\d[A-Z]?/)?.[0] ?? "";
  const prefix = district.replace(/\d.*$/, "");
  const inUlez = londonPrefixes.includes(prefix);
  return { ulezZonePrefixes: londonPrefixes, inUlez };
}

/** 伦敦行政区（32 boroughs + City of London） */
export const LONDON_BOROUGHS = [
  "Barking and Dagenham", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
  "City of London", "Croydon", "Ealing", "Enfield", "Greenwich", "Hackney",
  "Hammersmith and Fulham", "Haringey", "Harrow", "Havering", "Hillingdon",
  "Hounslow", "Islington", "Kensington and Chelsea", "Kingston upon Thames",
  "Lambeth", "Lewisham", "Merton", "Newham", "Redbridge",
  "Richmond upon Thames", "Southwark", "Sutton", "Tower Hamlets",
  "Waltham Forest", "Wandsworth", "Westminster",
];

/** 伦敦拥堵费区（CCZ）核心邮编区（近似覆盖市中心） */
const CCZ_DISTRICTS = new Set([
  "E1", "EC1", "EC2", "EC3", "EC4", "N1", "N1C", "SE1", "SE11", "SW1", "SW1A",
  "SW1E", "SW1H", "SW1P", "SW1V", "SW1W", "SW1X", "SW1Y", "W1", "W1B", "W1C",
  "W1D", "W1G", "W1H", "W1J", "W1K", "W1S", "W1T", "W1U", "W1W", "W2", "W8",
  "W9", "W11", "W14", "WC1", "WC2", "NW1", "NW8",
]);

/**
 * 基于 Postcodes.io 结果判断伦敦 ULEZ / 拥堵费（比纯邮编前缀更准确：
 * ULEZ = 属于任意伦敦行政区；CCZ = 邮编区命中市中心区）
 */
export function londonZoneInfo(result: {
  postcode: string;
  admin_district: string | null;
}) {
  const district = normalizePostcode(result.postcode).match(/^[A-Z]{1,2}\d[A-Z]?/)?.[0] ?? "";
  const inUlez = LONDON_BOROUGHS.includes(result.admin_district ?? "");
  const inCcz = CCZ_DISTRICTS.has(district);
  const status = !inUlez
    ? "Outside London" as const
    : (inCcz ? "Congestion Charge Zone + ULEZ" as const : "ULEZ only" as const);
  return { inUlez, inCcz, status };
}