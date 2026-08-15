/**
 * 种子数据：首页"快捷查询"入口 & sitemap 预收录 URL
 *
 * ⚠️ 上线前请按实际 PSEO 策略替换为真实热门实体
 * （可以用 /api/status/metrics 或数据库统计 top 查询来动态维护）
 * 公司 CRN 均为真实英国知名公司（可在 Companies House 验证）。
 */

export const POPULAR_COMPANIES: {
  crn: string;
  name: string;
}[] = [
  { crn: "00445790", name: "Tesco PLC" },
  { crn: "00048839", name: "Barclays PLC" },
  { crn: "00214436", name: "Marks and Spencer PLC" },
  { crn: "04190816", name: "BT Group PLC" },
  { crn: "01833679", name: "Vodafone Group PLC" },
  { crn: "02723534", name: "AstraZeneca PLC" },
  { crn: "00966425", name: "Standard Chartered PLC" },
  { crn: "00041424", name: "Unilever PLC" },
  { crn: "03888792", name: "GSK plc" },
];

export const POPULAR_POSTCODES: { postcode: string; hint: string }[] = [
  { postcode: "SW1A 1AA", hint: "Buckingham Palace" },
  { postcode: "SW1A 0AA", hint: "Downing Street" },
  { postcode: "EC2R 8AH", hint: "Bank of England" },
  { postcode: "EC1A 1BB", hint: "Farringdon" },
  { postcode: "E14 5AB", hint: "Canary Wharf" },
  { postcode: "W1A 1AA", hint: "BBC - Central London" },
  { postcode: "M2 4BG", hint: "Manchester City Centre" },
  { postcode: "EH2 2LE", hint: "Edinburgh City Centre" },
];