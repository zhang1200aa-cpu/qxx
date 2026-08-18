export type Lang = "en" | "zh" | "de";

export interface TranslationDict {
  langName: string;
  flag: string;
  nav: {
    companySearch: string;
    vatValidator: string;
    postcodeLookup: string;
    pricing: string;
    apiDocs: string;
    account: string;
    watchlist: string;
    signIn: string;
    signUp: string;
    dashboard: string;
    bulkTools: string;
    status: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    priceStart: string;
    signUpTitle: string;
    signUpSubtitle: string;
    alreadyMember: string;
    guestsAlwaysFree: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    verifyBtn: string;
    quickTry: string;
  };
  search: {
    tabCompany: string;
    tabVat: string;
    tabPostcode: string;
    placeholderCompany: string;
    placeholderVat: string;
    placeholderPostcode: string;
    exampleCompany: string;
    exampleVat: string;
    examplePostcode: string;
  };
  trust: {
    official: string;
    liveSync: string;
    noSignup: string;
  };
  why: {
    title: string;
    subtitle: string;
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
    f4Title: string;
    f4Desc: string;
  };
  cards: {
    companyOverview: string;
    vatOverview: string;
    postcodeOverview: string;
    filingDeadlines: string;
    relatedSearches: string;
    companyName: string;
    crn: string;
    companyType: string;
    incorporationDate: string;
    registeredAddress: string;
    sicCodes: string;
    nextAccountsDue: string;
    confirmationDue: string;
    dateOfCessation: string;
    accountsStatus: string;
    accountsMadeUpTo: string;
    confirmationStatus: string;
    onTime: string;
    overdue: string;
    overdueWarning: string;
    upToDate: string;
    vatNumber: string;
    businessName: string;
    officialAddress: string;
    verificationTime: string;
    consultationId: string;
    postcodeDistrict: string;
    postcode: string;
    council: string;
    region: string;
    constituency: string;
    ulezStatus: string;
    coordinates: string;
    nutsCode: string;
    nhsArea: string;
    notAvailable: string;
  };
  badges: {
    active: string;
    dissolved: string;
    liquidation: string;
    receivership: string;
    administration: string;
    validVat: string;
    invalidVat: string;
  };
  actions: {
    copySummary: string;
    copyVatCert: string;
    copied: string;
    downloadPdf: string;
    downloadPdfGuide: string;
    viewGov: string;
    addToWatchlist: string;
    inWatchlist: string;
    searchSimilar: string;
  };
  cta: {
    title: string;
    desc: string;
    viewPricing: string;
    tryBatch: string;
  };
  footer: {
    tools: string;
    account: string;
    pricingApi: string;
    legal: string;
    aboutText: string;
    disclaimerLabel: string;
    disclaimerText: string;
    rights: string;
    oglText: string;
  };
  quickLinks: {
    popularCompanies: string;
    popularPostcodes: string;
    searchAll: string;
    lookupPostcode: string;
  };
  faq: {
    heading: string;
    dataSourcesQ: string;
    dataSourcesA: string;
    vatFormatQ: string;
    vatFormatA: string;
    freeToUseQ: string;
    freeToUseA: string;
    officialStatusQ: string;
    officialStatusA: string;
    howFreshQ: string;
    howFreshA: string;
    vatHowQ: string;
    vatHowA: string;
    postcodeWhatQ: string;
    postcodeWhatA: string;
    postcodeUlezQ: string;
    postcodeUlezA: string;
  };
  ad: {
    label: string;
  };
  affiliate: {
    title: string;
    subtitle: string;
    badges: {
      banking: string;
      fx: string;
      formation: string;
      accounting: string;
    };
  };
  misc: {
    home: string;
    backToSearch: string;
    reportIssue: string;
    notAvailable: string;
    notApplicable: string;
    notDisclosed: string;
    generatedAt: string;
    noMatches: string;
    searchHint: string;
    registeredCompany: string;
    incorporated: string;
    dataSourceNote: string;
    formerly: string;
    formerHistoryUnavailable: string;
    searchSimilar: string;
    disclaimerCta: string;
    trustedBy: string;
  };
}

import { DICT_EN } from "./i18n-en";
import { DICT_ZH } from "./i18n-zh";
import { DICT_DE } from "./i18n-de";

export const DICT: Record<Lang, TranslationDict> = {
  en: DICT_EN,
  zh: DICT_ZH,
  de: DICT_DE,
};

/** 获取某语言的完整词典（缺省回退英文） */
export function getDict(lang: Lang): TranslationDict {
  return DICT[lang] ?? DICT.en;
}
