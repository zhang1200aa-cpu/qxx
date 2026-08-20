/**
 * 免费/付费产品矩阵与定价阶梯
 *
 * 基线原则：
 *   - "数据本身"面向公众免费（Open Government Licence 要求公共数据可自由访问）
 *   - 付费卖的是效率（批量）、自动化（API）、合规凭证（报告/导出）
 *
 * 4 类核心付费人群：
 *   1. 电商卖家 / 开发者   → API Token（实时计税、买家 VAT 真伪）
 *   2. 会计师 / 财税代办   → Accountant Pro（CSV 批量、申报临期提醒）
 *   3. 采购 / 风控人员     → Credit Pack（正式 PDF 合规报告）
 *   4. 外贸销售            → Lead Export（SIC / 地址 / 成立年限数据导出）
 */

export type PlanId =
  | "free"
  | "member"
  | "api-starter"
  | "accountant-pro"
  | "credit-pack"
  | "lead-export";

export type BillingPeriod = "month" | "one-time";

export interface Plan {
  id: PlanId;
  name: string;
  audience: string;
  priceUsd: number | null; // null = 免费
  priceLabel: string;
  period: BillingPeriod;
  // 权益清单（页面展示用）
  features: string[];
  // 硬配额（引擎强制执行）
  limits: {
    apiCallsPerMonth: number; // x-api-key 月配额（0 = 无 API）
    bulkRowLimitPerBatch: number; // 批量查询单次最大行数
    csvExportRows: number; // 数据导出最多行数
    creditReports: number; // 可用无印 PDF 报告点数
    emailAlerts: boolean; // 申报临期邮件提醒
    highPriorityApi: boolean; // 是否享受独立速率预算
    bulkDailyCap: number; // 每日批量行数上限（防滥用）
    webDailyApiCalls: number; // 网页会话每日 API 次数（0 = 不限制/无）
  };
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    audience: "个人 · 偶尔查一家公司 / 一个 VAT",
    priceUsd: 0,
    priceLabel: "£0",
    period: "one-time",
    features: [
      "网页单次查询 · 无需注册",
      "公司状态 / 地址 / 申报截止期",
      "VAT 有效性验证（HMRC 实时）",
      "邮编 / 行政区 / ULEZ 信息",
      "PDF 报告（免费版含水印）",
      "API 体验端点（每 IP 60 次/分）",
    ],
    limits: {
      apiCallsPerMonth: 0,
      bulkRowLimitPerBatch: 5,
      csvExportRows: 0,
      creditReports: 0,
      emailAlerts: false,
      highPriorityApi: false,
      bulkDailyCap: 50,
      webDailyApiCalls: 0,
    },
  },
  member: {
    id: "member",
    name: "Free Member",
    audience: "注册用户 · 免费解锁每日 API 额度与收藏",
    priceUsd: 0,
    priceLabel: "£0",
    period: "one-time",
    features: [
      "每天 50 次免费 API 调用",
      "保存常用关注公司清单",
      "个人主页：用量 / 关注管理",
      "弃用后数据保留 30 天",
      "注册仅需邮箱（免密登录）",
    ],
    limits: {
      apiCallsPerMonth: 0, // 走每日配额（见 lib/api-auth.ts）
      bulkRowLimitPerBatch: 50,
      csvExportRows: 0,
      creditReports: 0,
      emailAlerts: false,
      highPriorityApi: false,
      bulkDailyCap: 200,
      webDailyApiCalls: 50,
    },
  },
  "api-starter": {
    id: "api-starter",
    name: "API Starter",
    audience: "独立站 / 电商卖家 / 开发者 · 结算实时验税、买家 VAT 真伪",
    priceUsd: 9.99,
    priceLabel: "$9.99",
    period: "month",
    features: [
      "REST API：公司 / VAT / 邮编端点",
      "月度配额 10,000 次 API 调用",
      "毫秒级响应 · 官方数据直连",
      "独立速率预算（不挤免费额度）",
      "JSON 兼容任何购物车 / CRM",
      "邮件支持",
    ],
    limits: {
      apiCallsPerMonth: 10_000,
      bulkRowLimitPerBatch: 200,
      csvExportRows: 0,
      creditReports: 0,
      emailAlerts: false,
      highPriorityApi: true,
      bulkDailyCap: 100_000,
      webDailyApiCalls: 1_000,
    },
  },
  "accountant-pro": {
    id: "accountant-pro",
    name: "Accountant Pro",
    audience: "会计所 / 公司注册代办 · 批量维护几十上百家客户公司",
    priceUsd: 29,
    priceLabel: "$29",
    period: "month",
    features: [
      "CSV 批量查询（一次最多 5,000 行）",
      "公司状态月度状态监控",
      "申报截止（Accounts / CS）临期邮件提醒",
      "到期日前 30/14/7/3 天自动提醒",
      "Pro 网页仪表盘",
      "导出 CSV / 结构化 JSON",
    ],
    limits: {
      apiCallsPerMonth: 50_000,
      bulkRowLimitPerBatch: 5_000,
      csvExportRows: 50_000,
      creditReports: 0,
      emailAlerts: true,
      highPriorityApi: true,
      bulkDailyCap: 100_000,
      webDailyApiCalls: 1_000,
    },
  },
  "credit-pack": {
    id: "credit-pack",
    name: "Credit Pack",
    audience: "采购 / 风控 · 供应商尽职调查，向管理层提交合规证明",
    priceUsd: 3,
    priceLabel: "$3 / 份",
    period: "one-time",
    features: [
      "正式 PDF 尽职调查报告（无水印）",
      "时间戳 + 官方数据源水印认证",
      "覆盖：状态 / 成立 / 申报期 / 董事链接",
      "购买后 12 个月有效",
      "存档至内部风控系统",
      "按份计费，无需订阅",
    ],
    limits: {
      apiCallsPerMonth: 0,
      bulkRowLimitPerBatch: 5,
      csvExportRows: 0,
      creditReports: 10, // 每份 $3 = 1 credit（按包叠加）
      emailAlerts: false,
      highPriorityApi: false,
      bulkDailyCap: 50,
      webDailyApiCalls: 0,
    },
  },
  "lead-export": {
    id: "lead-export",
    name: "Lead Export",
    audience: "外贸销售 / BD · 用公司名单做客户开发",
    priceUsd: 29,
    priceLabel: "$29 / 5,000 条",
    period: "one-time",
    features: [
      "5,000 行公司数据导出",
      "字段：名称 / CRN / SIC / 地址 / 成立年份",
      "Active 公司过滤",
      "CSV 下载 · 适合邮件开发",
      "合规：仅官方公开数据",
    ],
    limits: {
      apiCallsPerMonth: 0,
      bulkRowLimitPerBatch: 5_000,
      csvExportRows: 5_000,
      creditReports: 0,
      emailAlerts: false,
      highPriorityApi: false,
      bulkDailyCap: 100_000,
      webDailyApiCalls: 1_000,
    },
  },
};

export const PLAN_ORDER: PlanId[] = [
  "free",
  "api-starter",
  "accountant-pro",
  "credit-pack",
  "lead-export",
];

/** 免费匿名（无 API Key）请求的批量行数上限 */
export const FREE_BULK_ROWS = 5;

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

/** 价格格式化 */
export function formatPrice(plan: Plan): string {
  if (plan.priceUsd === null || plan.priceUsd === 0) return "Free";
  return `${plan.priceLabel}`;
}