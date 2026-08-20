/**
 * plan-config.ts — 动态套餐配置引擎
 *
 * 把 billing.ts 里的硬编码 PLANS（默认模板）与"后台可改的动态覆盖"分离。
 *
 * 数据流：
 *   - 默认模板：lib/billing.ts 的 PLANS（代码内硬编码，零改动向后兼容）
 *   - 用户覆盖：data/plans-config.json（落盘持久化，重启不丢）
 *       同时写入缓存键 settings:plans（进程热读，保存后即时生效）
 *   - 读取：getPlans() 合并 默认 + 覆盖 + 兜底默认值
 *
 * 管理后台通过 /admin/plans + /api/admin/plans 来读写本模块。
 */

import * as fs from "fs";
import * as path from "path";
import { getCache } from "./cache";
import { PLANS, PLAN_ORDER, type Plan, type PlanId } from "./billing";

/** 运行时配置目录（已被 .gitignore 忽略；生产用 QXX_DATA_DIR 固定指向 /root/qxx/data） */
const DATA_DIR =
  process.env.QXX_DATA_DIR || path.join(process.cwd(), "data");
const PLANS_FILE = path.join(DATA_DIR, "plans-config.json");
const CACHE_KEY = "settings:plans";

export interface PlanLimits {
  apiCallsPerMonth: number;
  bulkRowLimitPerBatch: number;
  csvExportRows: number;
  creditReports: number;
  emailAlerts: boolean;
  highPriorityApi: boolean;
  bulkDailyCap: number;
  webDailyApiCalls: number;
}

/** 存档时为每个套餐保存的一组可覆盖字段（数字/布尔/价格/名称） */
export interface PlanPatch {
  id: PlanId;
  name?: string;
  audience?: string;
  priceUsd?: number | null;
  priceLabel?: string;
  limits?: Partial<PlanLimits>;
}

export type PlansConfig = Partial<Record<PlanId, PlanPatch>>;

/** 确保 data/ 目录存在 */
function ensureDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function readFileConfig(): PlansConfig {
  try {
    if (!fs.existsSync(PLANS_FILE)) return {};
    const raw = fs.readFileSync(PLANS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PlansConfig;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
async function writeCacheConfig(cfg: PlansConfig): Promise<void> {
  try {
    const cache = getCache();
    await cache.set(CACHE_KEY, cfg, 365 * 24 * 3600); // 1 年
  } catch {
    /* 缓存失败不影响文件持久化 */
  }
}

/** 读取当前全部套餐覆盖配置（文件优先，缓存兜底） */
async function readPlansConfig(): Promise<PlansConfig> {
  const fileCfg = readFileConfig();
  if (fileCfg && Object.keys(fileCfg).length > 0) return fileCfg;
  const cacheCfg = await readCacheConfig();
  return cacheCfg ?? {};
}

/** 同步读取文件中的覆盖配置（供 updatePlans 合并基础） */
function readPlansConfigSync(): PlansConfig {
  return readFileConfig();
}

/** 用无限深合并把覆盖值应用到默认套餐 */
function mergePatch(base: Plan, patch?: PlanPatch): Plan {
  if (!patch) return base;
  return {
    ...base,
    name: patch.name ?? base.name,
    audience: patch.audience ?? base.audience,
    priceUsd: patch.priceUsd !== undefined ? patch.priceUsd : base.priceUsd,
    priceLabel: patch.priceLabel ?? base.priceLabel,
    limits: {
      ...base.limits,
      ...(patch.limits ?? {}),
    },
  };
}

/** 读取全部套餐（默认 + 覆盖），返回动态套餐表 */
export async function getPlans(): Promise<Record<PlanId, Plan>> {
  const cfg = await readPlansConfig();
  const out = {} as Record<PlanId, Plan>;
  for (const id of Object.keys(PLANS) as PlanId[]) {
    out[id] = mergePatch(PLANS[id], cfg[id]);
  }
  return out;
}

/** 读取单个套餐动态值（找不到时回退默认） */
export async function getPlan(id: PlanId): Promise<Plan> {
  const cfg = await readPlansConfig();
  return mergePatch(PLANS[id], cfg[id]);
}

/** 获取套餐列表顺序 */
export function getPlanOrder(): PlanId[] {
  return PLAN_ORDER;
}

function writeFileConfig(cfg: PlansConfig): boolean {
  try {
    if (!ensureDir()) return false;
    fs.writeFileSync(PLANS_FILE, JSON.stringify(cfg, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[plan-config] 写入 plans-config.json 失败", err);
    return false;
  }
}

async function readCacheConfig(): Promise<PlansConfig | null> {
  try {
    const cache = getCache();
    const raw = await cache.get<PlansConfig>(CACHE_KEY);
    return raw && typeof raw === "object" ? raw : null;
  } catch {
    return null;
  }
}
/** 批量保存套餐覆盖（服务端已做过字段校验）。返回合并后的最新套餐表 */
export async function updatePlans(
  patches: PlanPatch[]
): Promise<Record<PlanId, Plan>> {
  if (!Array.isArray(patches)) {
    throw new Error("patches must be an array");
  }
  // 读取已有覆盖作为基础，避免局部更新时丢失其它字段
  const cfg: PlansConfig = { ...readPlansConfigSync() };
  for (const p of patches) {
    if (!p || !(p.id in PLANS)) continue;
    const pid = p.id as PlanId;
    const prev = cfg[pid];
    const item: PlanPatch = { id: pid, ...prev };
    if (p.name !== undefined) item.name = String(p.name);
    if (p.audience !== undefined) item.audience = String(p.audience);
    if (p.priceUsd !== undefined) item.priceUsd = Number(p.priceUsd);
    if (p.priceLabel !== undefined) item.priceLabel = String(p.priceLabel);
    if (p.limits && typeof p.limits === "object") {
      const l: Partial<PlanLimits> = { ...(prev?.limits ?? {}) };
      if (p.limits.apiCallsPerMonth !== undefined)
        l.apiCallsPerMonth = Math.max(0, Math.floor(Number(p.limits.apiCallsPerMonth)));
      if (p.limits.bulkRowLimitPerBatch !== undefined)
        l.bulkRowLimitPerBatch = Math.max(0, Math.floor(Number(p.limits.bulkRowLimitPerBatch)));
      if (p.limits.csvExportRows !== undefined)
        l.csvExportRows = Math.max(0, Math.floor(Number(p.limits.csvExportRows)));
      if (p.limits.creditReports !== undefined)
        l.creditReports = Math.max(0, Math.floor(Number(p.limits.creditReports)));
      if (p.limits.bulkDailyCap !== undefined)
        l.bulkDailyCap = Math.max(0, Math.floor(Number(p.limits.bulkDailyCap)));
      if (p.limits.webDailyApiCalls !== undefined)
        l.webDailyApiCalls = Math.max(0, Math.floor(Number(p.limits.webDailyApiCalls)));
      if (p.limits.emailAlerts !== undefined)
        l.emailAlerts = Boolean(p.limits.emailAlerts);
      if (p.limits.highPriorityApi !== undefined)
        l.highPriorityApi = Boolean(p.limits.highPriorityApi);
      item.limits = l;
    }
    cfg[pid] = item;
  }

  writeFileConfig(cfg);
  await writeCacheConfig(cfg);
  return getPlans();
}

/** 重置全部套餐为默认值（清空覆盖配置） */
export async function resetPlans(): Promise<Record<PlanId, Plan>> {
  try {
    if (fs.existsSync(PLANS_FILE)) fs.unlinkSync(PLANS_FILE);
  } catch (err) {
    console.error("[plan-config] 删除配置失败", err);
  }
  try {
    const cache = getCache();
    await cache.del(CACHE_KEY);
  } catch {
    /* 忽略 */
  }
  return getPlans();
}

/** 供管理后台展示：每个套餐返回"默认值 + 当前生效值"（方便对比与调试） */
export async function getPlansWithDefaults(): Promise<
  { plan: Plan; defaultPlan: Plan }[]
> {
  const active = await getPlans();
  return (Object.keys(PLANS) as PlanId[]).map((id) => ({
    plan: active[id],
    defaultPlan: PLANS[id],
  }));
}