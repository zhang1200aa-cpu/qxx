/**
 * plan-copy.ts — 英文套餐展示文案（与 billing.ts 的硬编码数值解耦）
 *
 * 用途：/pricing 与 /account 等客户可见页面共用。
 * 说明：套餐的「权益清单 features」目前仍由代码维护（未纳入 /admin/plans 动态覆盖），
 *       但 name/audience/price 等已从 plan-config 动态读取；后台改限额后，
 *       这里展示的 features 文案可能与动态限额略有出入，属可接受的最低成本方案。
 */
import type { PlanId } from "./billing";

export const PLAN_EN: Record<
  PlanId,
  { name: string; audience: string; features: string[]; cta: string; priceLabel: string }
> = {
  free: {
    name: "Free",
    audience: "For individuals occasionally checking a company or a VAT number",
    features: [
      "Single web lookups · no sign-up",
      "Company status / address / filing deadlines",
      "VAT validity check (live HMRC)",
      "Postcode / council / ULEZ details",
      "PDF verification report (watermarked)",
      "API trial endpoints (60 req/min per IP)",
    ],
    cta: "Start free",
    priceLabel: "£0",
  },
  member: {
    name: "Free Member",
    audience:
      "Registered users — unlock a daily API quota, watchlists and a usage dashboard",
    features: [
      "50 free API calls per day",
      "Save companies to your watchlist",
      "Usage dashboard & watchlist management",
      "Email-only sign up (passwordless)",
    ],
    cta: "Sign up free",
    priceLabel: "£0",
  },
  "api-starter": {
    name: "API Starter",
    audience: "Online sellers / developers — validate VAT in real time at checkout",
    features: [
      "REST API: company / VAT / postcode endpoints",
      "10,000 API calls per month",
      "Millisecond responses · official data feeds",
      "Dedicated rate budget (off the free queue)",
      "JSON ready for any cart / CRM",
      "Email support",
    ],
    cta: "Get API key",
    priceLabel: "$9.99",
  },
  "accountant-pro": {
    name: "Accountant Pro",
    audience:
      "Accountants & formation agents maintaining hundreds of client companies",
    features: [
      "CSV batch lookups (up to 5,000 rows per run)",
      "Monthly company status monitoring",
      "Filing deadline (Accounts / CS) email alerts",
      "Automatic reminders at 30/14/7/3 days",
      "Pro web dashboard",
      "Export CSV / structured JSON",
    ],
    cta: "Start Pro",
    priceLabel: "$29",
  },
  "credit-pack": {
    name: "Credit Pack",
    audience: "Procurement / risk teams — supplier due diligence with official proof",
    features: [
      "Official PDF due-diligence reports (no watermark)",
      "Timestamp + official data-source authentication",
      "Covers status / incorporation / filing dates",
      "Valid for 12 months after purchase",
      "Archive-ready for internal risk systems",
      "Pay per report — no subscription",
    ],
    cta: "Buy credits",
    priceLabel: "$3 / report",
  },
  "lead-export": {
    name: "Lead Export",
    audience:
      "Export sales / BD teams building prospect lists from company data",
    features: [
      "5,000-row company data export",
      "Fields: name / CRN / SIC / address / incorporation year",
      "Active-company filter",
      "CSV download · ready for outreach",
      "Compliant: official public data only",
    ],
    cta: "Export contacts",
    priceLabel: "$29 / 5,000 rows",
  },
};