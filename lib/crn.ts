/**
 * 英国公司号（Companies House CRN）共享校验与规范化模块
 *
 * 集中统一全站对 CRN 格式的判断口径（此前 middleware.ts / lib/companies-house.ts /
 * 前端快捷路由各自维护了一份不完全一致的正则）。后续模块（批量入库、Meilisearch 索引）
 * 也复用本模块。
 *
 * 合法格式（大小写不敏感）：
 *  - 纯数字：8 位（老公司号的 6/7 位在官方登记中补零为 8 位）
 *  - 2 位字母前缀 + 6 位数字：
 *      SC 苏格兰公司              NI 北爱尔兰公司
 *      OC 威尔士 LLP              SO 苏格兰 LLP               NC 北爱尔兰 LLP
 *      R0 境外注册公司            FC 外国公司(英格兰&威尔士)  SF 外国公司(苏格兰)
 *      NF 外国公司(北爱)          LP 有限合伙                  SL 苏格兰有限合伙
 *      NL 北爱有限合伙            IP 互助社(英格兰&威尔士)     SP 互助社(苏格兰)
 *      CE 社区利益公司(威尔士)    CS 大陆架公司                GE EEIG(苏格兰)
 *      SE 欧洲公众有限公司        BR 分行(海外)
 */

export const CRN_PREFIXES = [
  "SC", "NI", "OC", "SO", "NC", "R0", "FC", "SF", "NF", "LP", "SL", "NL",
  "IP", "SP", "CE", "CS", "GE", "SE", "BR",
] as const;

/** 完整合法模式（忽略大小写），共 19 种 2 位前缀 */
export const CRN_PATTERN = new RegExp(
  `^(?:\\d{8}|(?:${CRN_PREFIXES.join("|")})\\d{6})$`,
  "i"
);

/** 严格校验 CRN 格式（8 位数字，或 2 位前缀 + 6 位数字），不修改输入 */
export function isValidCrn(value: string): boolean {
  return CRN_PATTERN.test(value.trim().replace(/\/+$/, ""));
}

/**
 * 规范化 CRN：去除首尾空白 / 内部连字符与空格 / 尾部斜杠，转大写；
 * 纯数字自动补前导零到 8 位（把 6/7 位老号转成官方形制）。
 * 非法格式不会在此报错，由调用方用 isValidCrn / cleanCrn 判断。
 */
export function normalizeCrn(value: string): string {
  let s = value.trim().replace(/[\s-]+/g, "").replace(/\/+$/, "").toUpperCase();
  if (/^\d+$/.test(s)) s = s.padStart(8, "0");
  return s;
}

/** 规范化 + 校验合一体：合法返回规范 CRN，非法返回 null */
export function cleanCrn(value: string): string | null {
  const norm = normalizeCrn(value);
  return isValidCrn(norm) ? norm : null;
}