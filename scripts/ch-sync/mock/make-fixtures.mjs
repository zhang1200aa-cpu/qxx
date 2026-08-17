/**
 * make-fixtures.mjs — 生成模块 2 调试用 fixture（覆盖真实边界场景）
 *   mock/sample-snapshot.csv  : UTF-8 BOM + CRLF + 引号转义 + 字段内换行 + SC/NI 前缀公司
 *   mock/sample-events.ndjson : Streaming API 事件样例（含被过滤的 filing-history 事件）
 *
 * 用法：node scripts/ch-sync/mock/make-fixtures.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 快照 CSV 列（= 官方 Free Company Data Product 完整表头） */
const HEADER = [
  "CompanyNumber", "CompanyName",
  "RegAddress.CareOf", "RegAddress.POBox", "RegAddress.AddressLine1", "RegAddress.AddressLine2",
  "RegAddress.PostTown", "RegAddress.County", "RegAddress.Country", "RegAddress.PostCode",
  "CompanyCategory", "CompanyStatus", "CountryOfOrigin", "DissolutionDate", "IncorporationDate",
  "Accounts.AccountRefDay", "Accounts.AccountRefMonth", "Accounts.NextDueDate", "Accounts.LastMadeUpDate",
  "Accounts.AccountCategory", "Returns.NextDueDate", "Returns.LastMadeUpDate",
  "Mortgages.NumMortCharges", "Mortgages.NumMortOutstanding", "Mortgages.NumMortPartSatisfied", "Mortgages.NumMortSatisfied",
  "SICCode.SicText_1", "SICCode.SicText_2", "SICCode.SicText_3", "SICCode.SicText_4",
  "LimitedPartnerships.NumGenPartners", "LimitedPartnerships.NumLimPartners", "URI",
  "PreviousName_1.CompanyName", "PreviousName_1.CONDate",
  "PreviousName_2.CompanyName", "PreviousName_2.CONDate",
  "ConfStmtNextDueDate", "ConfStmtLastMadeUpDate",
];

/** CSV 字段转义（含逗号/引号/换行的字段用双引号包裹并 "" 转义） */
function esc(v) {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 快照数据行（仅填需要验证的列，其余列缺省为空） */
const SNAPSHOT_ROWS = [
  {
    CompanyNumber: "00445790",
    CompanyName: "TESCO PLC",
    "RegAddress.AddressLine1": "Tesco House",
    "RegAddress.AddressLine2": "Shire Park",
    "RegAddress.PostTown": "Welwyn Garden City",
    "RegAddress.County": "Hertfordshire",
    "RegAddress.Country": "England",
    "RegAddress.PostCode": "AL7 1GA",
    CompanyCategory: "plc",
    CompanyStatus: "active",
    CountryOfOrigin: "United Kingdom",
    IncorporationDate: "1947-12-04",
    "Accounts.NextDueDate": "2025-05-22",
    "Accounts.LastMadeUpDate": "2025-02-22",
    "Accounts.AccountCategory": "Group",
    "SICCode.SicText_1":
      "47110 - Retail sale in non-specialised stores with food, beverages or tobacco predominating",
    "SICCode.SicText_2": "99999 - Dormant Company",
    URI: "/company/00445790",
    "PreviousName_1.CompanyName": "TESCO STORES LIMITED",
    "PreviousName_1.CONDate": "1997-07-08",
    "PreviousName_2.CompanyName": "TESCO HOLDINGS LIMITED",
    "PreviousName_2.CONDate": "1991-03-05",
    ConfStmtNextDueDate: "2025-11-11",
    ConfStmtLastMadeUpDate: "2025-11-11",
  },
  {
    CompanyNumber: "SC123456",
    CompanyName: "ACME SCOTLAND LTD",
    "RegAddress.AddressLine1": "1 High Street",
    "RegAddress.PostTown": "Edinburgh",
    "RegAddress.County": "Scotland",
    "RegAddress.Country": "Scotland",
    "RegAddress.PostCode": "EH1 1AA",
    CompanyCategory: "ltd",
    CompanyStatus: "active",
    CountryOfOrigin: "Scotland",
    IncorporationDate: "2010-05-14",
    "Accounts.NextDueDate": "2025-03-31",
    "Accounts.LastMadeUpDate": "2025-03-31",
    "Accounts.AccountCategory": "Total Exemption Full",
    "SICCode.SicText_1": "62020 - Information technology consultancy activities",
    URI: "/company/SC123456",
  },
  {
    CompanyNumber: "NI000001",
    CompanyName: 'NORTHERN "MART" TRADING CO LTD',
    "RegAddress.AddressLine2": 'Unit "5" Quay Road',
    "RegAddress.PostTown": "Belfast",
    "RegAddress.County": "Antrim",
    "RegAddress.Country": "Northern Ireland",
    "RegAddress.PostCode": "BT1 1AA",
    CompanyCategory: "private-limited-company",
    CompanyStatus: "dissolved",
    CountryOfOrigin: "Northern Ireland",
    DissolutionDate: "2024-01-15",
    IncorporationDate: "2001-07-01",
    "Accounts.NextDueDate": "2024-07-31",
    "Accounts.LastMadeUpDate": "2023-12-31",
    "Accounts.AccountCategory": "Total Exemption Full",
    "SICCode.SicText_1": "None Supplied",
    URI: "/company/NI000001",
    "PreviousName_2.CompanyName": "OLD NORTHERN LTD",
    "PreviousName_2.CONDate": "2015-06-30",
    ConfStmtNextDueDate: "2024-06-30",
    ConfStmtLastMadeUpDate: "2024-06-30",
  },
  {
    CompanyNumber: "08778890",
    CompanyName: "WEIRD\nNAMES LTD",
    "RegAddress.PostTown": "Milton Keynes",
    "RegAddress.County": "Buckinghamshire",
    "RegAddress.Country": "England",
    "RegAddress.PostCode": "MK1 1AA",
    CompanyCategory: "private-limited-company",
    CompanyStatus: "active",
    CountryOfOrigin: "United Kingdom",
    IncorporationDate: "2020-03-02",
    "Accounts.AccountCategory": "No Accounts Filed",
    "SICCode.SicText_1": "62020 - Information technology consultancy activities",
    URI: "/company/08778890",
    "PreviousName_1.CompanyName": "OLD WEIRD LTD",
    "PreviousName_1.CONDate": "2019-01-01",
    ConfStmtNextDueDate: "2023-03-01",
  },
];

// ---------------------------------------------------------------------------
// 生成 CSV：BOM + CRLF 行级 + 字段级转义
// ---------------------------------------------------------------------------
const csv =
  "\ufeff" +
  HEADER.join(",") +
  "\r\n" +
  SNAPSHOT_ROWS.map((r) => HEADER.map((h) => esc(r[h])).join(",")).join("\r\n") +
  "\r\n";

// ---------------------------------------------------------------------------
// Streaming 事件 NDJSON（第三个事件无地址/无 SIC，验证稀疏 data）
// ---------------------------------------------------------------------------
const EVENTS = [
  {
    event: { timepoint: 1308345, date: "2026-08-01T09:00:00.000Z", type: "company-profile" },
    data: {
      company_number: "SC123456",
      company_name: "ACME SCOTLAND UPDATED LTD",
      company_status: "active",
      type: "ltd",
      date_of_creation: "2010-05-14",
      registered_office_address: {
        address_line_1: "10 Princes Street",
        locality: "Edinburgh",
        postal_code: "EH2 2AD",
        country: "Scotland",
      },
      sic_codes: ["62020"],
      links: { self: "/company/SC123456" },
    },
    resource_id: "SC123456",
    resource_kind: "company-profile",
    resource_uri: "/company/SC123456",
  },
  {
    event: { timepoint: 1308346, date: "2026-08-01T09:01:00.000Z", type: "company-profile" },
    data: {
      company_number: "00445790",
      company_name: "TESCO PLC",
      company_status: "active",
      type: "plc",
      date_of_creation: "1947-12-04",
      registered_office_address: {
        address_line_1: "Tesco House",
        address_line_2: "Shire Park",
        locality: "Welwyn Garden City",
        region: "Hertfordshire",
        postal_code: "AL7 1GA",
        country: "England",
      },
      sic_codes: ["47110"],
      links: { self: "/company/00445790" },
    },
    resource_id: "00445790",
    resource_kind: "company-profile",
    resource_uri: "/company/00445790",
  },
  {
    event: { timepoint: 1308347, date: "2026-08-01T09:02:00.000Z", type: "company-profile" },
    data: {
      company_number: "NI000001",
      company_name: "NORTHERN DISSOLVED LTD",
      company_status: "dissolved",
      type: "private-limited-company",
      date_of_cessation: "2025-01-20",
      links: { self: "/company/NI000001" },
    },
    resource_id: "NI000001",
    resource_kind: "company-profile",
    resource_uri: "/company/NI000001",
  },
  {
    event: { timepoint: 1308348, date: "2026-08-01T09:03:00.000Z", type: "accounts" },
    data: { company_number: "00445790" },
    resource_id: "00445790",
    resource_kind: "filing-history",
    resource_uri: "/company/00445790/filing-history/abc123",
  },
];

fs.writeFileSync(path.join(__dirname, "sample-snapshot.csv"), csv, "utf8");
fs.writeFileSync(
  path.join(__dirname, "sample-events.ndjson"),
  EVENTS.map((e) => JSON.stringify(e)).join("\n") + "\n",
  "utf8"
);

console.log(`[fixtures] 已生成 mock/sample-snapshot.csv（${csv.length} 字节，BOM+CRLF+转义+嵌入换行）`);
console.log(`[fixtures] 已生成 mock/sample-events.ndjson（${EVENTS.length} 个事件，含被过滤的 filing-history）`);
