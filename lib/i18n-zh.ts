/**
 * 中文内容包（订阅/计费相关界面）
 * 用于 lang=zh 时替换英文文案；英文保持 lib/billing.ts 原文。
 */
import type { PlanId } from "./billing";

export const PLAN_ZH: Record<
  PlanId,
  { name: string; audience: string; features: string[]; cta: string }
> = {
  free: {
    name: "免费版",
    audience: "个人 · 偶尔查一家公司 / 一个 VAT",
    features: [
      "网页单次查询 · 无需注册",
      "公司状态 / 地址 / 申报截止期",
      "VAT 有效性验证（HMRC 实时）",
      "邮编 / 行政区 / ULEZ 信息",
      "PDF 报告（免费版含水印）",
      "API 体验接口（每 IP 60 次/分）",
    ],
    cta: "免费使用",
  },
  member: {
    name: "免费会员",
    audience: "注册用户 · 免费解锁每日 API 额度与收藏",
    features: [
      "每天 50 次免费 API 调用",
      "保存常用关注公司清单",
      "个人主页：用量 / 关注管理",
      "注册仅需邮箱（免密登录）",
    ],
    cta: "免费注册",
  },
  "api-starter": {
    name: "API 起步版",
    audience: "独立站 / 电商卖家 / 开发者 · 结算实时验税、买家 VAT 真伪",
    features: [
      "REST API：公司 / VAT / 邮编接口",
      "月度配额 10,000 次 API 调用",
      "毫秒级响应 · 官方数据直连",
      "独立速率预算（不挤免费额度）",
      "兼容任何购物车 / CRM 的 JSON",
      "邮件支持",
    ],
    cta: "获取 API Key",
  },
  "accountant-pro": {
    name: "会计师专业版",
    audience: "会计所 / 公司注册代办 · 批量维护上百家客户公司",
    features: [
      "CSV 批量查询（一次最多 5,000 行）",
      "公司状态月度监控",
      "申报截止（Accounts / CS）临期邮件提醒",
      "到期前 30/14/7/3 天自动提醒",
      "Pro 网页仪表盘",
      "导出 CSV / 结构化 JSON",
    ],
    cta: "开通专业版",
  },
  "credit-pack": {
    name: "合规报告点数",
    audience: "采购 / 风控 · 供应商尽调，向管理层提交合规证明",
    features: [
      "正式 PDF 尽调报告（无水印）",
      "时间戳 + 官方数据源认证标示",
      "覆盖：状态 / 成立 / 申报期",
      "购买后 12 个月有效",
      "按份计费，无需订阅",
    ],
    cta: "购买点数",
  },
  "lead-export": {
    name: "线索数据导出",
    audience: "外贸销售 / BD · 用公司名单做客户开发",
    features: [
      "5,000 行公司数据导出",
      "字段：名称 / CRN / SIC / 地址 / 成立年份",
      "Active 公司过滤",
      "CSV 下载 · 适合邮件开发",
      "合规：仅官方公开数据",
    ],
    cta: "导出数据",
  },
};

/** 订阅页中文标题文案 */
export const PRICING_ZH = {
  badge: "简单定价 · 随时取消",
  title: "官方数据免费；",
  title2: "你为速度、规模与合规凭证付费",
  sub:
    "数据依据 Open Government Licence 免费开放，个人查询始终免费。我们在帮你节省时间的地方收费：批量自动化、API 集成、合规报告与线索补全。",
  freeCardTitle: "免费版 — 个人查询",
  freeCardDesc:
    "无需注册，无需信用卡。公司 / VAT / 邮编网页查询；PDF 报告带验证水印；免费 API 每 IP 限流。",
  useFree: "开始免费查询",
  tableTitle: "免费 vs 付费 —— 功能边界",
  tableCols: ["能力", "免费", "API 起步", "会计师专业版", "报告点数", "线索导出"],
  pricingQ: "订阅常见问题",
  customerTitle: "为每个岗位打造的版本",
};

import type { TranslationDict } from "./i18n-dict";

export const DICT_ZH: TranslationDict = {
  langName: "中文",
  flag: "🇨🇳",
  nav: {
    companySearch: "公司查询",
    vatValidator: "VAT 核验",
    postcodeLookup: "邮编查询",
    pricing: "定价方案",
    apiDocs: "API 文档",
    account: "我的账户",
    watchlist: "关注列表",
    signIn: "登录",
    signUp: "创建账户",
    dashboard: "批量工具与提醒",
    bulkTools: "批量工具",
    bulkGuide: "批量查询指南",
    status: "服务状态",
  },
  auth: {
    signInTitle: "登录以解锁免费会员功能",
    signInSubtitle: "免费权益：每天 50 次 API、公司关注清单、用量仪表盘。",
    priceStart: "付费方案低至",
    signUpTitle: "创建您的免费账户",
    signUpSubtitle: "无需信用卡，解锁每天 50 次 API、公司关注清单与用量仪表盘。",
    alreadyMember: "已经是会员？",
    guestsAlwaysFree:
      "游客始终可免费查询公司、VAT 与邮编，无需注册；注册只解锁更多会员权益。",
  },
  hero: {
    badge: "英国官方公开数据 · 实时同步",
    title: "英国公司与 VAT 即时核验",
    subtitle:
      "直接对接 Companies House 与 HMRC 官方记录，一键核验企业注册状态、申报档案与 VAT 税号有效性。",
    verifyBtn: "立即核验",
    quickTry: "快速示例",
  },
  search: {
    tabCompany: "公司查询",
    tabVat: "VAT 核验",
    tabPostcode: "邮编查询",
    placeholderCompany: "输入公司名称或 8 位注册号（如 02050399）...",
    placeholderVat: "输入 9 位英国 VAT 税号（如 GB 123 4567 89）...",
    placeholderPostcode: "输入完整英国邮编（如 SW1A 1AA）...",
    exampleCompany: "Tesco PLC (00445790)",
    exampleVat: "GB 123 4567 89",
    examplePostcode: "SW1A 1AA",
  },
  trust: {
    official: "官方公开数据",
    liveSync: "HMRC 与 Companies House 实时同步",
    noSignup: "无需注册即可查询",
  },
  why: {
    title: "为什么选择 qxx.uk",
    subtitle: "完全基于英国政府开放数据构建的合规级查询工具。",
    f1Title: "直连政府数据源",
    f1Desc: "对接 Companies House 与 HMRC 官方 API，每一次查询都实时准确。",
    f2Title: "即时风险筛查",
    f2Desc: "签合同、付款之前，快速识别已注销企业与无效税号，规避商业风险。",
    f3Title: "开发者优先",
    f3Desc: "提供干净的 JSON 接口，方便自动化供应商准入与合规流程集成。",
    f4Title: "永远新鲜 · 永远极速",
    f4Desc: "智能缓存让响应保持毫秒级，同时不触碰官方接口的频次限制。",
  },
  cards: {
    companyOverview: "公司概览",
    vatOverview: "HMRC VAT 状态",
    postcodeOverview: "位置与物流信息",
    filingDeadlines: "申报截止期",
    relatedSearches: "相关搜索",
    companyName: "公司名称",
    crn: "公司注册号（CRN）",
    companyType: "公司类型",
    incorporationDate: "成立日期",
    registeredAddress: "注册办公地址",
    sicCodes: "经营范围（SIC 代码）",
    nextAccountsDue: "下期财报到期日",
    confirmationDue: "年报确认声明到期日",
    dateOfCessation: "注销日期",
    accountsStatus: "财报申报状态",
    accountsMadeUpTo: "财报截至日期",
    confirmationStatus: "年度确认声明",
    onTime: "按期申报",
    overdue: "已逾期",
    overdueWarning: "已逾期 —— 请立即申报",
    upToDate: "状态正常",
    vatNumber: "VAT 税号（VRN）",
    businessName: "注册企业名称",
    officialAddress: "官方注册地址",
    verificationTime: "核验时间戳",
    consultationId: "核验流水号",
    postcodeDistrict: "邮编区段",
    postcode: "邮政编码",
    council: "地方政府 / 行政区",
    region: "地区 / 国家",
    constituency: "国会选区",
    ulezStatus: "伦敦 ULEZ / 拥堵费状态",
    coordinates: "地理坐标",
    nutsCode: "NUTS 编码",
    nhsArea: "NHS 辖区",
    notAvailable: "暂无数据",
  },
  badges: {
    active: "存续中",
    dissolved: "已注销",
    liquidation: "清算中",
    receivership: "接管中",
    administration: "托管中",
    validVat: "VAT 注册有效",
    invalidVat: "VAT 无效 / 已注销",
  },
  actions: {
    copySummary: "复制摘要",
    copyVatCert: "复制 VAT 凭证",
    copied: "已复制！",
    downloadPdf: "下载核验 PDF 报告",
    downloadPdfGuide: "下载 PDF 指南",
    viewGov: "在 Companies House 查看 ↗",
    addToWatchlist: "加入关注",
    inWatchlist: "已在关注列表",
    searchSimilar: "搜索相似公司名称 →",
  },
  cta: {
    title: "免费查询 · 低价自动化",
    desc: "个人查询始终免费。当团队需要规模 —— 10,000 次 API、5,000 行 CSV 批量、合规 PDF 或线索数据 —— 方案从每月 $9.99 起。",
    viewPricing: "查看方案与 API 定价",
    tryBatch: "免费试用批量工具",
  },
  footer: {
    tools: "查询工具",
    account: "账户",
    pricingApi: "定价与开发者",
    legal: "法律与合规",
    aboutText:
      "独立的英国企业与税务情报查询平台，数秒内检索 Companies House 记录并核验英国 VAT 税号。",
    disclaimerLabel: "免责声明",
    disclaimerText:
      "qxx.uk 是独立的查询工具，与英国政府、Companies House 或英国税务海关总署（HMRC）无任何隶属或授权关系。公开数据依据 Open Government Licence v3.0 提供。信息按“原样”提供，仅供一般参考，不构成法律或财务建议。",
    rights: "版权所有。",
    oglText: "Open Government Licence v3.0",
  },
  quickLinks: {
    popularCompanies: "热门公司查询",
    popularPostcodes: "热门邮编指南",
    searchAll: "搜索全部",
    lookupPostcode: "查询邮编",
  },
  faq: {
    heading: "常见问题",
    dataSourcesQ: "数据来源是什么？",
    dataSourcesA:
      "所有企业数据均来自英国政府公共登记系统：Companies House 与英国税务海关总署（HMRC）。邮编数据来自国家统计局（ONS），经 Postcodes.io 提供。",
    vatFormatQ: "英国 VAT 税号的格式是怎样的？",
    vatFormatA:
      "标准英国 VAT 税号由 9 位数字组成，通常以“GB”开头（例如 GB 123 4567 89）。首位数字可能为 0，部分历史号码较短 —— 请按发票上的完整号码输入。",
    freeToUseQ: "B2B 核验免费吗？",
    freeToUseA:
      "是的。通过网页进行的单次核验完全免费，无需注册。面向开发者和风控团队的自动化批量查询可通过高速 API 完成。",
    officialStatusQ: "这里的结果能替代官方 Companies House 记录吗？",
    officialStatusA:
      "不能。本站为方便使用而镜像公开登记信息。涉及法律或合同决策时，请务必在 gov.uk 官方 Companies House 或 HMRC 记录上再次确认。",
    howFreshQ: "数据有多新？",
    howFreshA:
      "首次查询时从官方 API 实时拉取，随后缓存一段时间以保证速度并在官方频次限制内运行。公司数据 30 天内刷新，VAT 数据 7 天内刷新。",
    vatHowQ: "英国 VAT 税号核验是怎么工作的？",
    vatHowA:
      "输入发票上显示的 9 位 VAT 税号（GB 前缀可选）。我们查询官方 HMRC VAT 核验服务，返回该税号当前是否注册有效，以及注册企业名称和地址。",
    postcodeWhatQ: "英国邮编查询能获得哪些信息？",
    postcodeWhatA:
      "输入完整邮编即可查看邮编区段、地方政府/行政区、地区、国家、国会选区、NHS 辖区、NUTS 编码以及来自官方 ONS 登记处的精确地理坐标。",
    postcodeUlezQ: "如何判断一个邮编是否属于伦敦 ULEZ 区？",
    postcodeUlezA:
      "超低排放区（ULEZ）覆盖大伦敦大部分区域。查询邮编后，在结果页查看“伦敦 ULEZ”字段。关于确切边界，请以官方 TfL ULEZ 地图为准。",
  },
  ad: {
    label: "广告",
  },
  affiliate: {
    title: "推荐服务",
    subtitle: "为页面上提到的企业精挑细选的工具。",
    badges: {
      banking: "B2B 银行",
      fx: "跨境汇款",
      formation: "公司注册",
      accounting: "会计软件",
    },
  },
  misc: {
    home: "首页",
    backToSearch: "返回搜索",
    reportIssue: "问题反馈",
    notAvailable: "暂无数据",
    notApplicable: "不适用",
    notDisclosed: "未披露",
    generatedAt: "生成时间",
    noMatches: "未找到匹配结果。请尝试减少关键词或检查拼写。",
    searchHint: "输入公司名称开始搜索。例如：",
    registeredCompany: "注册企业",
    incorporated: "成立于",
    dataSourceNote: "数据来自 Companies House，依据 Open Government Licence v3.0。",
    formerly: "曾用名：",
    formerHistoryUnavailable: "暂无曾用名记录",
    searchSimilar: "搜索相似公司名称 →",
    disclaimerCta: "重要记录请务必与官方登记系统再次核对。",
    trustedBy:
      "被跨境电商 B2B 核验、电商 VAT 验证与会计师日常工作广泛信赖。",
  },
};
