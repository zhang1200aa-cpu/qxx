/**
 * 全站共享数据类型
 */

// ---------- Companies House ----------

/** Companies House /company/{crn} 返回的标准化公司档案 */
export interface CompanyProfile {
  company_number: string;
  company_name: string;
  company_status: string; // active | dissolved | liquidation | receivership | ...
  company_type: string;
  date_of_creation: string | null;
  date_of_cessation: string | null;
  registered_office_address: {
    address_line_1: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    care_of?: string;
  } | null;
  sic_codes?: string[];
  accounts: {
    next_due: string | null;
    next_made_up_to: string | null;
    overdue: boolean;
  } | null;
  confirmation_statement: {
    next_due: string | null;
    next_made_up_to: string | null;
    overdue: boolean;
  } | null;
  previous_company_names?: { name: string; effective_from: string | null }[];
  links: {
    filing_history?: string;
    officers?: string;
    persons_with_significant_control?: string;
  } | null;
}

/** Companies House 搜索结果条目 */
export interface CompanySearchHit {
  company_number: string;
  title: string;
  description?: string;
  company_status: string;
  company_type?: string;
  date_of_creation?: string;
  address_snippet?: string;
  links?: { self?: string };
}

export interface CompanySearchResult {
  total_results: number;
  items: CompanySearchHit[];
  query: string;
}

// ---------- HMRC VAT ----------

/** HMRC VAT 验证返回（标准化） */
export interface VatLookupResult {
  vat_number: string; // 9 位，不带 GB 前缀
  requestDate: string; // yyyy-MM-dd
  valid: boolean;
  name: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    line3: string | null;
    line4: string | null;
    line5: string | null;
    postcode: string | null;
  } | null;
  registrationReason?: string; // 官方口径：seller / intra-community / ...
  countryCode: string | null; // 仅 EU 查询返回
}

// ---------- Postcodes.io ----------

/** Postcodes.io lookup 返回（标准化） */
export interface PostcodeLookupResult {
  postcode: string;
  status: number;
  result: {
    postcode: string;
    quality: number;
    eastings: number | null;
    northings: number | null;
    country: string | null; // England / Scotland / Wales / Northern Ireland
    region: string | null;
    nhs_ha: string | null;
    admin_county: string | null;
    admin_district: string | null;
    admin_ward: string | null;
    parish: string | null;
    parliamentary_constituency: string | null;
    ccg: string | null;
    nuts: string | null; // 三级 NUTS 编码，如 UKI32
    lsoa: string | null;
    msoa: string | null;
    latitude: number | null;
    longitude: number | null;
    longitude_normalised: number | null;
    codes: {
      admin_district: string | null;
      admin_county: string | null;
      admin_ward: string | null;
      parish: string | null;
      parliamentary_constituency: string | null;
      ccg: string | null;
      nuts: string | null;
      lsoa: string | null;
      msoa: string | null;
    } | null;
  } | null;
}

// ---------- 派生业务数据结构 ----------

export interface CompanyVatInfo {
  checked: boolean;
  valid: boolean | null;
  registered_name: string | null;
  error?: string;
}

/** 公司详情页聚合数据（Companies House 档案 + 可选 VAT 关联） */
export interface CompanyDetail {
  profile: CompanyProfile;
  vat?: CompanyVatInfo;
  sourcedAt: string;
  cached: boolean;
}