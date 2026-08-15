/**
 * HMRC VAT 税号有效性验证 API 封装
 *
 * 文档: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api
 * 端点: GET /organisations/vat/check-vat-number/lookup/{vatNumber}
 * 说明: vatNumber 为 9 位数字（不带 GB 前缀）；
 *       HTTP 200 = 有效注册, HTTP 404 = 无效/未注册
 */
import { getCache, CACHE_TTL } from "./cache";
import { rateLimitAllow, HMRC_LIMIT } from "./rate-limit";
import type { VatLookupResult } from "./types";

const HMRC_BASE = "https://api.service.hmrc.gov.uk";

export class HmrcError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** 提取 VRN：把 "GB123 4567 89" / "gb123456789" 归一化为 9 位数字 */
export function normalizeVatNumber(input: string): string {
  return input.replace(/^GB/gi, "").replace(/[\s-]/g, "");
}

/** 校验 UK VAT 号格式：9 位数字 */
export function validVatNumber(value: string): boolean {
  return /^\d{9}$/.test(normalizeVatNumber(value));
}

/** 格式化展示：GB123 4567 89 */
export function formatVatNumber(vatNumber: string): string {
  const digits = normalizeVatNumber(vatNumber);
  if (!/^\d{9}$/.test(digits)) return vatNumber.toUpperCase();
  return `GB${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

interface HmrcLookupResponse {
  target?: {
    vatNumber?: string;
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      line3?: string;
      line4?: string;
      line5?: string;
      postcode?: string;
    };
    registrationReason?: string;
  };
  processingDate?: string;
  requested?: { vatNumber?: string };
}

/** 实时验证 VAT 号（结果缓存 7 天） */
export async function checkVatNumber(vatNumber: string): Promise<VatLookupResult> {
  const digits = normalizeVatNumber(vatNumber);
  if (!validVatNumber(digits)) {
    throw new HmrcError("Invalid UK VAT number format (expected 9 digits).", 400);
  }

  const cache = getCache();
  const cacheKey = `hmrc:vat:${digits}`;
  const cached = await cache.get<VatLookupResult>(cacheKey);
  if (cached) return cached;

  const allowed = await rateLimitAllow("hmrc:global", HMRC_LIMIT.max, HMRC_LIMIT.windowSeconds);
  if (!allowed) {
    throw new HmrcError("HMRC rate limit reached, please retry shortly.", 429);
  }

  const res = await fetch(`${HMRC_BASE}/organisations/vat/check-vat-number/lookup/${digits}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  let body: HmrcLookupResponse | null = null;
  try {
    body = (await res.json()) as HmrcLookupResponse;
  } catch {
    body = null;
  }

  if (res.status === 429) {
    throw new HmrcError("HMRC rate limit reached.", 429);
  }

  // 404 = 该税号未注册 / 已注销（业务上仍然是一个"有效回答"）
  const valid = res.status === 200 && Boolean(body?.target);

  const result: VatLookupResult = {
    vat_number: digits,
    requestDate: body?.processingDate ?? new Date().toISOString().slice(0, 10),
    valid,
    name: body?.target?.name ?? (res.status === 404 ? null : null),
    address: body?.target?.address
      ? {
          line1: body.target.address.line1 ?? null,
          line2: body.target.address.line2 ?? null,
          line3: body.target.address.line3 ?? null,
          line4: body.target.address.line4 ?? null,
          line5: body.target.address.line5 ?? null,
          postcode: body.target.address.postcode ?? null,
        }
      : null,
    registrationReason: body?.target?.registrationReason,
    countryCode: null,
  };

  await cache.set(cacheKey, result, CACHE_TTL.vat);
  return result;
}

/** 把地址各字段拼接成单行 */
export function joinAddress(lines: (string | null)[]): string {
  return lines.filter((l) => l && l.trim()).map((l) => l!.trim()).join(", ");
}