# qxx.uk 商业化方案 — 免费/付费边界、定价阶梯与收款接入

> 一句话：**数据按 OGL 要求永远免费；我们卖的是效率（批量）、自动化（API）与
> 合规凭证（报告/导出）。**

---

## 1. 产品与定价阶梯

| 计划 | 价格 | 目标人群 | 卖点 | 核心配额 |
|---|---|---|---|---|
| Free | £0 | 个人，偶尔查一次 | 网页单次查询、带水印 PDF | 批量 5 行/次 · 每日 50 行 |
| API Starter | $9.99/月 | 电商卖家 / 开发者 | 结账实时验 VAT、购物车/CRM 集成 | 10,000 次/月 API · 批量 200 行/次 |
| Accountant Pro | $29/月 | 会计所 / 财税代办 | CSV 批量 5,000 行、申报临期提醒 | 50,000 次/月 API · 批量 5,000 行/次 |
| Credit Pack | $3/份 | 采购 / 风控 | 无水印正式 PDF 尽职调查报告 | 10 credits/包 |
| Lead Export | $29/5,000 条 | 外贸销售 / BD | SIC/地址/成立年份结构化导出 | 5,000 行 CSV |

### 免费 → 付费的核心触发点（页面上的“痛点对价”）

| 用户类型 | 痛点 | 付费功能 | 页面位置 |
|---|---|---|---|
| 独立站/开发者 | 没精力维护官方鉴权与接口 | 极速 REST API + key 一键开通 | `/api-docs`、`/pricing` |
| 会计师/财税代办 | 人工逐家查几百家公司 | CSV 批量 + 临期邮件提醒 | `/dashboard`（BulkTool + AlertOptIn） |
| 采购/风控 | 要向管理层证明供应商合规 | 无水印 PDF 报告（时间戳水印） | 详情页「Download PDF」 |
| 外贸销售 | 缺结构化线索数据 | 5,000 条数据导出（CSV） | `/api-docs`、`/pricing` |

---

## 2. 功能边界（引擎已实现，`lib/billing.ts` + `lib/subscription.ts`）

- **匿名请求**（网页 & 免费 API）：IP 限流 60 req/min；`/api/v1/bulk` ≤5 行/次。
- **付费请求**（`x-api-key` 头）：跳过 IP 限流，按月度配额扣减，超限返回
  `429 { code: "quota_exceeded" }`。
- **PDF 报告分级**：`components/PdfWatermark.tsx` — 免费打印叠加水印；
  `qx_plan` cookie 命中付费档位时无印（Credit Pack 提供无印导出）。
- **批量行数 / 每日行数**：`authorizeBulk()` 按套餐限额 + 每日防滥用上限。

### 配额记账（无数据库最小实现）

```
key:{apiKey}          → email        （API key → 账户索引）
acct:{email}          → 账户 JSON     （套餐/信用点数/提醒开关）
usage:api:{email}:MM  → 当月 API 次数 （月度配额扣减）
usage:bulk:{id}:YYYY-MM-DD → 当日批量行数
alert:{email}         → 提醒订阅
alert-crns:{crn}      → [email,...] （临期扫描索引）
```

> 生产环境建议把这些映射落进 Postgres / Turso，`lib/subscription.ts` 已是横切逻辑，
> 迁移只需替换存取实现。

---

## 3. 收款接入（代码已就绪，只差配置）

### 方案 A：Lemon Squeezy（推荐，零月费 + 直接支持 UK/EU/US 卡）

**1. 建店铺与商品**
- Lemon Squeezy → 创建 Store。
- Products → 创建 4 个订阅/商品：
  - API Starter（$9.99/月，Subscription）
  - Accountant Pro（$29/月，Subscription）
  - Credit Pack（$3 一次性，可叠加 Quantity）
  - Lead Export（$29 一次性）
- 记录每个商品的 **Variant ID**。

**2. 配置环境变量**
```env
LEMONSQUEEZY_CHECKOUT_PREFIX=https://qxxuk.lemonsqueezy.com
LEMONSQUEEZY_STORE_ID=xxxx
LEMONSQUEEZY_WEBHOOK_SECRET=xxxx
LEMONSQUEEZY_VARIANT_API_STARTER=10001
LEMONSQUEEZY_VARIANT_ACCOUNTANT_PRO=10002
LEMONSQUEEZY_VARIANT_CREDIT_PACK=10003
LEMONSQUEEZY_VARIANT_LEAD_EXPORT=10004
# 可选：用 API 动态创建 checkout
LEMONSQUEEZY_API_KEY=xxxx
```

**3. 注册 Webhook**
- Settings → Webhooks → URL：`https://qxx.uk/api/billing/lemon-squeezy/webhook`
- 事件：`subscription_created`、`subscription_updated`、`subscription_cancelled`、`order_created`
- 签名校验由 `app/api/billing/lemon-squeezy/webhook/route.ts` 用 `X-Signature`
  (HMAC-SHA256) 完成；事件 → 发 API Key / 加 credits / 降级。

**4. 验证**
```bash
curl "https://qxx.uk/api/billing/checkout?plan=api-starter&email=test@example.com"
# → { checkoutUrl: "https://qxxuk.lemonsqueezy.com/buy/10001?...", provider: "lemon-squeezy" }
```

### 方案 B：Stripe（已有 Stripe 账户的团队）

**最简单**：Dashboard 创建 4 个 Payment Link → 填环境变量，无需服务端：
```env
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_API_STARTER=...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ACCOUNTANT_PRO=...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CREDIT_PACK=...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_LEAD_EXPORT=...
```

**要自动发 key/credits**：创建 Webhook Endpoint
`https://qxx.uk/api/billing/stripe/webhook`，事件 `checkout.session.completed`、
`customer.subscription.created/updated/deleted`，填 `STRIPE_WEBHOOK_SECRET` +
`STRIPE_PRICE_*`。签名校验用标准库实现（`t=.../v1=...` HMAC）。

> 若未来需要服务端创建 Checkout Session，加 `stripe-node` SDK 即可；当前框架
> 用 Payment Link 足够覆盖全部 4 个套餐。

---

## 4. 邮件提醒（申报临期）— Accountant Pro

- 订阅：`POST /api/notifications/opt-in`（`{ email, crns[], leadDays }`）。
- 免费用户监控 ≤3 家公司（其余提示升级）。
- 正式版补齐调度循环：Vercel Cron（`vercel.json` 或 Next 16 `unstable_after`）
  每 6 小时遍历 `alert-crns:{crn}` → 拉 `accounts.next_due` → 命中 30/14/7/3 天
  窗口 → Resend/Postmark 发信 → 写入 `alert-sent:{email}:{crn}:{date}` 去重。
- `RESEND_API_KEY` / `EMAIL_FROM` 已在 `.env.local.example` 预留。

---

## 5. 运营建议（上线清单）

1. **先免费跑量**：提交 sitemap、AdSense 审核（需 Privacy/Terms + Cookie CMP 就绪）。
2. **第 2-3 周上付费**：Lemon Squeezy 店铺 + webhook 配置好后，把 `/pricing`
   的按钮从 `mailto:` 换成真实 checkout URL。
3. **关键路径数据埋点**：`/api/v1/bulk` 用量、PDF 下载次数、`/pricing` 转化。
4. **定价验证**：$9.99/月 API Starter 对标同类工具（如 Companies House API 代理）
   定价区间合理；若转化低，优先做 14 天试用 + 邮件触达留存。
5. **合规红线**：所有页面保留「非政府机构」免责声明；数据标注 OGL v3.0；
   批量导出不含董事个人敏感字段（或按 HMRC/CH 政策过滤）。

---

## 6. 代码位置索引

| 功能 | 文件 |
|---|---|
| 产品矩阵 / 配额定义 | `lib/billing.ts` |
| 账户 / API Key / 配额引擎 | `lib/subscription.ts` |
| API 鉴权中间件 | `lib/api-auth.ts` |
| 三个数据端点（鉴权接入） | `app/api/v1/{company,vat,postcode}/route.ts` |
| 批量端点 | `app/api/v1/bulk/route.ts` |
| 定价页 | `app/pricing/page.tsx` |
| 批量工具 + 提醒（仪表盘） | `app/dashboard/page.tsx`、`components/BulkTool.tsx`、`components/AlertOptIn.tsx` |
| 收款 checkout 分发 | `app/api/billing/checkout/route.ts` |
| Lemon Squeezy webhook | `app/api/billing/lemon-squeezy/webhook/route.ts` |
| Stripe webhook | `app/api/billing/stripe/webhook/route.ts` |
| PDF 水印分级 | `components/PdfWatermark.tsx` |
| 申报提醒订阅 | `app/api/notifications/opt-in/route.ts` |