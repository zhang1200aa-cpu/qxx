/**
 * common.js — CH 数据管道公共工具
 * 字段清洗 / SIC 提取 / 日期归一化 / 公司数据→数据库行映射
 * 供 snapshot.js（快照导入）与 streaming.js（增量更新）共用。
 */

/** 官方 CSV 中表示"无值"的占位文本（大小写不敏感） */
const BLANK_WORDS = new Set([
  "", "none", "none supplied", "n/a", "na", "-", "null", "unknown",
]);

/** 把"疑似空值"归一为 null */
export function blank(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const low = s.toLowerCase();
  // 官方常写 "None Supplied" / "Total Exemption Full"（account category 里出现，但此处不拦）
  if (BLANK_WORDS.has(low)) return null;
  return s;
}

/**
 * 从 Companies House 文本字段提取 SIC 5 位行业代码。
 * 快照 CSV 中形如：
 *   "62020 - Information technology consultancy activities"
 *   "None Supplied"
 *   "99999"
 * 返回 5 位数字字符串，无法识别返回 null。
 */
export function extractSicCode(text) {
  const s = blank(text);
  if (!s) return null;
  const m = s.match(/^(\d{5})\b/);
  return m ? m[1] : null;
}

/** 从 1~4 个 SIC 字段提取去重后的代码数组（可能为空）。 */
export function extractSicCodes(...fields) {
  const out = [];
  for (const f of fields) {
    const code = extractSicCode(f);
    if (code && !out.includes(code)) out.push(code);
    if (out.length >= 4) break;
  }
  return out;
}

/** 日期字段：空值 → null，返回 yyyy-mm-dd 原样 */
export function parseDate(v) {
  const s = blank(v);
  return s ?? null;
}

/**
 * JSON 序列化辅助：null / undefined → null；对象 → JSON 字符串（SQLite 无专用 JSON 列时存文本）
 */
export function toJson(v) {
  if (v === null || v === undefined) return null;
  return JSON.stringify(v);
}

/** 简单时间戳日志 */
export function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

/** 进度显示：num → 1.2M */
export function fmtNum(n) {
  return n.toLocaleString("en-GB");
}

// ---------------------------------------------------------------------------
// 数据映射：CSV 行 / Streaming 事件 → companies 表行（db.js 的 COMPANY_COLUMNS）
// ---------------------------------------------------------------------------

/**
 * 快照 CSV 行 → 数据库行对象
 * @param {string[]} row CSV 值数组
 * @param {Record<string, number>} idx 列名 → 下标
 * @param {"snapshot"} source
 */
export function snapshotToRow(row, idx, source = "snapshot") {
  const g = (name) => {
    const i = idx[name];
    return i === undefined ? undefined : row[i];
  };
  const sicCodes = extractSicCodes(
    g("SICCode.SicText_1"),
    g("SICCode.SicText_2"),
    g("SICCode.SicText_3"),
    g("SICCode.SicText_4")
  );
  const previousNames = [];
  for (let i = 1; i <= 10; i++) {
    const nm = blank(g(`PreviousName_${i}.CompanyName`));
    if (nm) previousNames.push({ name: nm, effective_from: parseDate(g(`PreviousName_${i}.CONDate`)) });
  }
  return {
    company_number: blank(g("CompanyNumber")) ?? "",
    company_name: blank(g("CompanyName")) ?? "",
    company_category: blank(g("CompanyCategory")),
    company_status: blank(g("CompanyStatus")),
    country_of_origin: blank(g("CountryOfOrigin")),
    incorporation_date: parseDate(g("IncorporationDate")),
    dissolution_date: parseDate(g("DissolutionDate")),
    reg_address_line1: blank(g("RegAddress.AddressLine1")),
    reg_address_line2: blank(g("RegAddress.AddressLine2")),
    reg_address_post_town: blank(g("RegAddress.PostTown")),
    reg_address_county: blank(g("RegAddress.County")),
    reg_address_country: blank(g("RegAddress.Country")),
    reg_address_postcode: blank(g("RegAddress.PostCode")),
    accounts_next_due: parseDate(g("Accounts.NextDueDate")),
    accounts_last_made_up_to: parseDate(g("Accounts.LastMadeUpDate")),
    confirmation_statement_next_due: parseDate(g("ConfStmtNextDueDate")),
    confirmation_statement_last_made_up_to: parseDate(g("ConfStmtLastMadeUpDate")),
    sic_codes: sicCodes.length ? toJson(sicCodes) : null,
    primary_sic_code: sicCodes[0] ?? null,
    uri: blank(g("URI")) ? `https://find-and-update.company-information.service.gov.uk${g("URI")}` : null,
    previous_names: previousNames.length ? toJson(previousNames) : null,
    source,
    last_event_timepoint: null,
    synced_at: new Date().toISOString(),
  };
}

/**
 * Streaming API company-profile 事件 → 数据库行对象
 * @param {Record<string, any>} data 官方事件内的 data 字段
 * @param {number|null} eventTimepoint
 */
export function profileToRow(data, eventTimepoint) {
  const a = data.registered_office_address ?? {};
  const sicCodes = Array.isArray(data.sic_codes) ? data.sic_codes.slice(0, 4) : [];
  return {
    company_number: blank(data.company_number) ?? "",
    company_name: blank(data.company_name) ?? "",
    company_category: blank(data.type) ?? blank(data.company_category),
    company_status: blank(data.company_status) ?? "unknown",
    country_of_origin: blank(data.country_of_origin),
    incorporation_date: parseDate(data.date_of_creation),
    dissolution_date: parseDate(data.date_of_cessation),
    reg_address_line1: blank(a.address_line_1),
    reg_address_line2: blank(a.address_line_2),
    reg_address_post_town: blank(a.locality),
    reg_address_county: blank(a.region),
    reg_address_country: blank(a.country),
    reg_address_postcode: blank(a.postal_code),
    accounts_next_due: parseDate(data.accounts?.next_due),
    accounts_last_made_up_to: parseDate(data.accounts?.last_made_up_to),
    confirmation_statement_next_due: parseDate(data.confirmation_statement?.next_due),
    confirmation_statement_last_made_up_to: parseDate(data.confirmation_statement?.last_made_up_to),
    sic_codes: sicCodes.length ? toJson(sicCodes) : null,
    primary_sic_code: sicCodes[0] ?? null,
    uri: blank(data.links?.self)
      ? `https://find-and-update.company-information.service.gov.uk${data.links.self.replace(/^\//, "/")}`
      : null,
    previous_names:
      Array.isArray(data.previous_company_names) && data.previous_company_names.length
        ? toJson(data.previous_company_names)
        : null,
    source: "stream",
    last_event_timepoint: eventTimepoint ?? null,
    synced_at: new Date().toISOString(),
  };
}