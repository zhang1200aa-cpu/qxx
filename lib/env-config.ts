/**
 * env-config.ts — 运行时环境变量配置层（Key 配置界面数据源）
 *
 * 背景：.env.local 里的 KEY 在进程启动时一次性加载进 process.env，
 *       运行时改 .env.local 需要重启 Next.js 服务才能生效。
 *
 * 本模块提供"运行时覆盖层"：
 *   - 管理后台在 /admin/keys 可视化编辑 KEY，保存到 data/env-config.json（落盘）
 *   - 读取时优先取运行时配置，未配置才回退 process.env
 *   - 这样保存 KEY 后**无需重启**也能在下次访问时读到新值
 *
 * 注意：对于必须在启动时初始化、无法热读的真实运行参数（如 REDIS_URL /
 *       某些 SDK 初始化），仍需手动重启。本层适用于可热读的 API Key/token。
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR =
  process.env.QXX_DATA_DIR || path.join(process.cwd(), "data");
const ENV_FILE = path.join(DATA_DIR, "env-config.json");

export type EnvConfig = Record<string, string>;

/** 允许在后台编辑 / 展示的 KEY 清单（name, label, secret） */
export const MANAGEABLE_KEYS: {
  name: string;
  label: string;
  secret: boolean;
  restartHint?: string;
}[] = [
  {
    name: "GOOGLE_SEARCH_CONSOLE_TOKEN",
    label: "Google Search Console OAuth Token",
    secret: true,
  },
  {
    name: "GOOGLE_SEARCH_CONSOLE_API_KEY",
    label: "Google Search Console API Key",
    secret: true,
  },
  {
    name: "COMPANIES_HOUSE_API_KEY",
    label: "Companies House API Key",
    secret: true,
  },
  {
    name: "GEMINI_API_KEY",
    label: "Google Gemini API Key (品牌图)",
    secret: true,
  },
  {
    name: "MEILISEARCH_KEY",
    label: "Meilisearch Key",
    secret: true,
  },
  {
    name: "NEXT_PUBLIC_MEILISEARCH_KEY",
    label: "Meilisearch Public Key",
    secret: false,
  },
  {
    name: "NEXT_PUBLIC_ADSENSE_CLIENT",
    label: "Google AdSense Client ID",
    secret: false,
  },
  {
    name: "NEXT_PUBLIC_COOKIESCRIPT_ID",
    label: "Cookie-Script Site ID",
    secret: false,
  },
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    label: "Clerk Publishable Key",
    secret: false,
  },
  {
    name: "CLERK_SECRET_KEY",
    label: "Clerk Secret Key",
    secret: true,
  },
  {
    name: "LEMONSQUEEZY_API_KEY",
    label: "Lemon Squeezy API Key",
    secret: true,
    restartHint: "需重启生效",
  },
  {
    name: "STRIPE_SECRET_KEY",
    label: "Stripe Secret Key",
    secret: true,
    restartHint: "需重启生效",
  },
  {
    name: "RESEND_API_KEY",
    label: "Resend API Key",
    secret: true,
  },
];

function ensureDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/** 读取全部运行时覆盖的 KEY 值 */
export function getAllEnvConfig(): EnvConfig {
  try {
    if (!fs.existsSync(ENV_FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(ENV_FILE, "utf-8")) as EnvConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** 读取单个 KEY 的运行时值（未覆盖返回 undefined） */
export function getEnvValue(name: string): string | undefined {
  const cfg = getAllEnvConfig();
  return cfg[name];
}

/** 读取某个 KEY 的"当前生效值"（运行时配置优先，否则 process.env） */
export function getEffectiveValue(name: string): string {
  return getEnvValue(name) ?? process.env[name] ?? "";
}

/**
 * 批量保存运行时 KEY 覆盖（只更新清单内的可管理 KEY）。
 * storeEmpty 为 true 时允许保存为空字符串（用于清空该 key）。
 */
export function saveEnvConfig(
  values: Record<string, string>,
  { storeEmpty = false }: { storeEmpty?: boolean } = {}
): { saved: EnvConfig; matched: string[] } {
  const names = new Set(MANAGEABLE_KEYS.map((k) => k.name));
  const cfg = getAllEnvConfig();
  const matched: string[] = [];

  for (const [k, v] of Object.entries(values)) {
    if (!names.has(k)) continue;
    const val = typeof v === "string" ? v.trim() : "";
    matched.push(k);
    if (val === "" && !storeEmpty) {
      delete cfg[k]; // 空值且未要求存储 → 清除覆盖，回退 process.env
    } else {
      cfg[k] = val;
    }
  }

  // 移除空串（保持一致，避免读到空覆盖）
  for (const k of Object.keys(cfg)) {
    if (cfg[k] === "") delete cfg[k];
  }

  ensureDir();
  fs.writeFileSync(ENV_FILE, JSON.stringify(cfg, null, 2), "utf-8");
  return { saved: cfg, matched };
}

/** 重置运行时 KEY 覆盖（清空文件） */
export function resetEnvConfig(): void {
  try {
    if (fs.existsSync(ENV_FILE)) fs.unlinkSync(ENV_FILE);
  } catch (err) {
    console.error("[env-config] 删除配置失败", err);
  }
}

/** 列出所有可管理 KEY 的"配置值 + 生效值"（用于后台回显） */
export function describeKeys(): {
  name: string;
  label: string;
  secret: boolean;
  restartHint?: string;
  configuredValue: string;
  effectiveValue: string;
}[] {
  const cfg = getAllEnvConfig();
  return MANAGEABLE_KEYS.map((k) => ({
    ...k,
    configuredValue: cfg[k.name] ?? "",
    effectiveValue: getEffectiveValue(k.name),
  }));
}