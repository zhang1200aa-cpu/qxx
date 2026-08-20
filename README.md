# 🚀 qxx.uk — 快速操作手册（上线 & 日常运维）

> 本文件是「面向站长的操作指南」。下半部分是完整 PRD。
> 最近更新：2026-08-15 · 前端完成三语（EN / 中文 / Deutsch）i18n 重构、移动端适配与细节美化，并已部署上线。

---

## 0. 我（AI）已经帮你在 VPS 上做了什么

| 项目 | 状态 |
|---|---|
| 三语国际化（英 / 中 / 德）词典与切换器 | ✅ 已完成 |
| Header / Footer / 搜索框 / 首页 / 详情页 / 合规页全部接入词典 | ✅ 已完成 |
| 移动端汉堡菜单（替换原来的截断缩写导航） | ✅ 已完成 |
| 前端细节美化（卡片悬浮、字体、滚动、选中色、移动端字段堆叠） | ✅ 已完成 |
| 本地 `next build` 编译验证（零错误） | ✅ 已验证 |
| VPS 生产部署脚本与生产构建 | ✅ 已执行 |
| Nginx 80→443 + SSL 反向代理（已存在，无需改动） | ✅ 已确认 |

---

## 1. 部署 / 更新到 VPS（以后每次改完代码都这样做）

```bash
# 先在本地构建验证
npm run build

# 准备部署凭据（一次性）：复制 deploy/.env.example 为 deploy/.env 并填写 VPS 信息
# （deploy/.env 已被忽略，不会进入 Git 仓库；也可用 VPS_HOST/VPS_USER/VPS_PASS 环境变量）

# 一键部署（脚本自动：上传源码 → npm install → npm run build → 重启 systemd 服务）
cd deploy
node deploy.js
```

部署脚本依赖 `deploy/package.json` 中的 `ssh2`（部署前先在 deploy 目录 `npm install`），
VPS 信息通过 `deploy/.env` 或环境变量读取，避免把密码写进代码仓库。

生产服务由 **systemd** 守护（服务名 `qxx.service`，端口 3000），系统重启后自动拉起。

```bash
systemctl status qxx.service        # 查看状态
journalctl -u qxx.service -n 50     # 看日志
systemctl restart qxx.service       # 手动重启
```
# qxx.uk — UK Corporate & Tax Intelligence

> 英国本土垂直合规 / 数据查询站。
> 商业模型：**免费对接官方开放数据 + 程序化 SEO（pSEO）收割长尾词 +
> UK 本地高单价广告与企业服务佣金**（海外称 Data Arbitrage / 数据套利）。

---

# 第一部分 · 项目需求

## 1.1 项目背景与定位

在英国，Companies House、HMRC、ONS（国家统计局）等政府机构公开了大量高质量、
可自由使用的官方数据，且全部提供免费 API。由于这些数据零散、需要去不同官网分别
查询，用户体验很差——这正是 qxx.uk 的机会：**用工程化方式把官方数据整合成一个
极速、好用、对 SEO 友好的查询站，把普通查询流量变现，把批量/自动化能力卖给 B2B
客户。**

- 目标用户：跨境电商卖家、外贸采购/风控、会计师与财税代办、外贸销售、B2B 开发者
- 运营地区：英国本土（英文内容 + 英镑/美元定价）
- 数据合规：Open Government Licence v3.0（数据可自由使用，需标注来源）

## 1.2 商业模式与业务需求

### 三个免费官方数据源
---

## 2. ⚠️ 需要你本人手动操作的事项（按优先级）

### 2.1 Companies House API Key（已确认线上可用，若将来报 401 再看这里）
上线验证时 `https://qxx.uk/company/00445790` 已能实时返回 Tesco PLC 数据，说明当前 Key
（存放于 VPS 的 `/root/qxx/.env.local`，见 `.env.local.example` 注释）正常工作。

**若以后出现 `Companies House API error (401)`**（去 [Companies House 开发者门户](https://developer.company-information.service.gov.uk)）：
1. 确认该 Key 的类型是 **REST**（不是 Web / Streaming）。
2. 必要时**重新生成一个 REST Key**，填入 VPS 上的 `/root/qxx/.env.local`：
   ```bash
   nano /root/qxx/.env.local
   # 修改 COMPANIES_HOUSE_API_KEY=新key
   pm2 restart qxx-uk
   ```
3. 验证：浏览器打开 `https://qxx.uk/company/00445790`，能显示公司信息即成功。
   （可选）先用沙箱测试：在 `.env.local` 加 `COMPANIES_HOUSE_ENV=sandbox`。

### 2.2 Google AdSense 变现（拿到流量后申请）
1. 站内 4 个合规页已就绪：`/privacy` `/terms` `/about` `/contact`。
2. 必须配置 UK GDPR 合规 Cookie 弹窗：注册 [Cookie-Script](https://cookie-script.com)（免费版），
   拿到 Group ID 后填入 VPS 的 `.env.local` 的 `NEXT_PUBLIC_COOKIESCRIPT_ID=xxxx`，然后 `pm2 restart qxx-uk`。
3. 提交 [Google AdSense](https://adsense.google.com) 审核，通过后把
   `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxx` 填入并重启。全站广告位（首页 / 详情页 / 搜索结果页）会自动出现。

### 2.3 B2B 联盟营销佣金（Affiliate）
申请以下推广链接，填到 `.env.local`（留空则推荐模块自动隐藏）：
```
NEXT_PUBLIC_TIDE_AFFILIATE=你的Tide推广链接
NEXT_PUBLIC_WISE_AFFILIATE=你的Wise推广链接
NEXT_PUBLIC_REVOLUT_AFFILIATE=
NEXT_PUBLIC_1ST_FORMATIONS_AFFILIATE=
NEXT_PUBLIC_FREEAGENT_AFFILIATE=
```

### 2.4 登录与付费（Post-MVP 阶段再开）
- 登录：Clerk（[dashboard.clerk.com](https://dashboard.clerk.com)）→ 填
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` 到 `.env.local`。
- 收款：Lemon Squeezy（推荐）或 Stripe，参数见 `.env.local.example` 注释。

### 2.5 Google Search Console（上线第 1 周做）
1. [search.google.com/search-console](https://search.google.com/search-console) 添加 `qxx.uk`。
2. 用 DNS TXT 验证（在域名商后台加记录）。
3. 提交 Sitemap：`https://qxx.uk/sitemap.xml`。

### 2.6 （可选）Redis 缓存
默认用进程内缓存（单实例够用）。多人部署可配 Upstash：
`.env.local` 里填 `REDIS_URL=redis://...` 后重启即可。

---

## 3. 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产编译验证
```

语言切换：右上角 🌐 球图标（EN / 中文 / Deutsch），选择后写 `qxx_lang` cookie 并整站刷新。
SEO 元信息（title/description/JSON-LD）刻意保持英文，以保证 Google 长尾词收录优先级最高。

---
---

| 数据源 | 入口 | 提供内容 | 官方限制 |
|---|---|---|---|
| Companies House | developer.company-information.service.gov.uk | 公司名称、CRN、注册状态、成立日期、地址、申报期 | 600 req / 5 min |
| HMRC VAT | api.service.hmrc.gov.uk | VAT 号真伪、注册企业名称与官方地址 | 按 key 限流 |
| Postcodes.io | api.postcodes.io | 经纬度、行政区、选区、NUTS、ULEZ | 免费开源 |

### 三层变现漏斗

1. **Google AdSense（UK 高单价广告）**：合规/财税类关键词 CPC 常达 £1–£5
2. **B2B 联盟佣金**：Tide / Wise / Revolut / 1st Formations / FreeAgent 等
3. **SaaS 订阅 + API Token**：面向 4 类 B2B 人群，$3–$49

### 4 类付费人群（产品需求的出发点）

| 用户类型 | 核心痛点 | 付费功能 | 定价 |
|---|---|---|---|
| 电商卖家/开发者 | 结算需实时验买家 VAT、不想维护官方案口 | 极速 REST API | $9.99–$29/月 |
| 会计师/财税代办 | 手动逐家查几百家、申报临期易漏 | CSV 批量 + 临期提醒 | $19–$49/月 |
| 采购/风控 | 需向管理层证明供应商合规 | 无水印正式 PDF 报告 | $3–$5/份 |
| 外贸销售 | 缺结构化线索数据 | 数据导出（CSV） | $29/5,000 条 |

## 1.3 功能需求

### 基础查询（全站免费公开，面向搜索引擎与游客）

- 公司详情：状态（Active / Dissolved / In Liquidation）、地址、SIC、申报截止期、
  一键复制摘要 / 导出 PDF / 跳转 Companies House
- VAT 验证：HMRC 实时返回有效/无效、注册名、官方地址、验证时间戳
- 邮编查询：行政区 / 选区 / 区域 / ULEZ / 坐标 / NUTS 编码
- 公司名搜索（`/search?q=`，可索引的搜索结果页）

### 用户分层（分阶段、按需启用，绝不对游客设卡）

| 层级 | 登录 | 能力 |
|---|---|---|
| 游客 Guest（90% 流量） | ❌ | 单次查询、IP 限流、批量 5 行、带水印 PDF、广告曝光 |
| 注册用户 Free Member | ✅ 邮箱免密（Clerk） | 每天 50 次 API、关注清单、批量 50 行、用量仪表盘 |
| 付费 Subscriber | ✅ + 订阅 | API Key、月度配额、CSV 批量、无水印 PDF、申报提醒 |

### 付费产品线

- **API Starter $9.99/月**：REST API 10,000 次/月，独立速率预算
- **Accountant Pro $29/月**：批量 5,000 行/次、状态监控、申报 30/14/7/3 天提醒
- **Credit Pack $3/份**：无水印 PDF 尽职调查报告（时间戳 + 数据源水印）
- **Lead Export $29/5,000 条**：SIC / 地址 / 成立年份 CSV 导出

### 运营合规需求

- 全站 **UK GDPR 合规 CMP** Cookie 弹窗（Cookie-Script）
- Privacy / Terms / About / Contact 页面齐全（AdSense 审核前置）
- 页脚免责声明："not affiliated with Companies House or HMRC · OGL v3.0"

## 1.4 非功能需求（NFR）

| 类别 | 要求 |
|---|---|
| SEO | 页面直出 HTML（SSR/静态）；动态路由 `/company/[crn]` `/vat/[vrn]` `/postcode/[code]`；每个查询页注入 JSON-LD（Organization / FAQPage / Place）；动态 sitemap.xml；无登录墙 |
| 性能 | 首屏毫秒级；查询结果 7–30 天缓存；命中缓存毫秒返回 |
| 成本 | 极低运维（Cloudflare 免费层 + Vercel/轻量 VPS）；避免超官方限频被封 |
| 安全 | Companies House 全局 600/5min 限频预算；API 每 IP 60 req/min；x-api-key 配额记账；webhook 签名校验 |
| 可用性 | 无 Redis 时内存缓存兜底；未配置 API Key 时页面优雅降级提示 |

## 1.5 技术选型（已落地）

| 模块 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 16（App Router）+ TypeScript | 原生 SSR/SSG，前端后端一体化，SEO 友好 |
| 样式 | Tailwind CSS v4 + Lucide Icons | 极轻、零冗余 |
| 缓存 | Redis（可选）/ 进程内缓存 | 毫秒响应，缓解官方限频 |
| 认证 | Clerk（可选，未配置自动游客模式） | 5 分钟接入，前 10,000 MAU 免费 |
| 收款 | Lemon Squeezy（主）/ Stripe（备） | 独立开发者友好，支持 UK/EU/US 卡 |
| 边缘 | Cloudflare CDN / SSL / WAF | 免费 + 防恶意爬虫 |

---

# 第二部分 · 项目使用方法

## 2.1 环境要求

- Node.js ≥ 20（推荐 22 / 24）
- npm ≥ 10
- （可选）Redis 服务或 Upstash Redis
- （可选）Companies House 免费 API Key
- （可选）Clerk / Lemon Squeezy / Stripe 账号（用于生产变现）

## 2.2 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
#   免费申请 Key：https://developer.company-information.service.gov.uk

# 3. 本地开发（自动开启"演示登录模式"）
npm run dev
# → http://localhost:3000

# 4. 生产构建与运行
npm run build
npm run start
```

> 无 Key / 无 Clerk / 无 Redis 也能完整构建和访问：
> - VAT / 邮编查询直接可用（官方接口免 Key）；公司查询显示友好的配置引导
> - 登录入口自动降级为"即将开放"或开发演示模式
> - 缓存自动使用进程内内存实现

## 2.3 环境变量说明

| 变量 | 必填 | 说明 |
|---|---|---|
| `COMPANIES_HOUSE_API_KEY` | 建议 | 公司数据源，免费申请 |
| `NEXT_PUBLIC_SITE_URL` | 生产 | canonical / sitemap / OG 用站点地址 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 否 | 页脚联系邮箱（默认 ai@qxx.uk） |
| `REDIS_URL` | 否 | Redis 连接串，留空用内存缓存 |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 否 | AdSense 发布商 ID |
| `NEXT_PUBLIC_COOKIESCRIPT_ID` | 否 | Cookie-Script CMP 站点 ID（UK GDPR） |
| `NEXT_PUBLIC_TIDE_AFFILIATE` 等 | 否 | 联盟推广链接，留空自动隐藏 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | 否 | 启用 Clerk 登录 |
| `AUTH_DEMO_MODE` | 否 | `1` 时开放开发演示登录 |
| `LEMONSQUEEZY_*` / `STRIPE_*` | 否 | 收款渠道 |
| `RESEND_API_KEY` / `EMAIL_FROM` | 否 | 申报临期提醒邮件 |

完整模板见 `.env.local.example`。

## 2.4 页面与功能地图

| URL | 功能 | 权限 |
|---|---|---|
| `/` | 首页三合一搜索 + 热门快捷入口 | 公开 |
| `/company/[crn]` | 公司详情（状态/地址/SIC/申报期/关注/PDF） | 公开 |
| `/vat/[vrn]` | VAT 验证详情 | 公开 |
| `/postcode/[code]` | 邮编详情（选区/ULEZ/坐标） | 公开 |
| `/search?q=` | 公司名搜索结果（可索引） | 公开 |
| `/pricing` | 免费/付费边界与定价阶梯 | 公开 |
| `/dashboard` | 批量查询工具 + 申报提醒订阅 | 公开（登录用户额度更高） |
| `/api-docs` | API 文档与订阅入口 | 公开 |
| `/sign-in` `/sign-up` | 登录 / 注册（Clerk 托管） | 公开 · noindex |
| `/account` | 个人中心：API 用量 / 关注 / 计划 | 需登录 |
| `/watchlist` | 关注公司清单 | 需登录 |
| `/about` `/contact` `/privacy` `/terms` | 合规与联系 | 公开 |

SEO 文件：`app/sitemap.ts`（动态 sitemap）、`app/robots.ts`（抓取规则）。

## 2.5 API 接口使用（REST JSON）

统一返回：`{ "success": true, "data": ..., "meta": {...} }`；
失败：`{ "success": false, "error": { "code", "message" } }`。

```bash
# 公司档案 / 名称搜索
curl "http://localhost:3000/api/v1/company?crn=00445790"
curl "http://localhost:3000/api/v1/company?q=Tesco"

# VAT 验证（data.valid = true/false）
curl "http://localhost:3000/api/v1/vat?vat=123456789"

# 邮编查询
curl "http://localhost:3000/api/v1/postcode?postcode=SW1A1AA"

# 批量查询（付费核心）
curl -X POST "http://localhost:3000/api/v1/bulk" \
  -H "Content-Type: application/json" \
  -d '{"type":"company","items":["00445790","00488639"]}'

# 订阅 API Key（付费后由 webhook 自动发放）
curl -H "x-api-key: qx_live_xxx" "http://localhost:3000/api/v1/company?crn=00445790"
```

其他端点：

| 端点 | 说明 |
|---|---|
| `GET /api/me` | 当前用户 / tier / 今日额度（游客返回 guest） |
| `GET/POST/DELETE /api/watchlist` | 关注公司增删查（需登录） |
| `POST /api/notifications/opt-in` | 申报临期提醒订阅 |
| `GET /api/health` | 服务与上游状态 |
| `GET /api/billing/checkout?plan=api-starter` | 获取支付链接 |
| `POST /api/billing/lemon-squeezy/webhook` | Lemon Squeezy 回调（验签） |
| `POST /api/billing/stripe/webhook` | Stripe 回调（验签） |
| `POST /api/auth/demo-login` / `demo-logout` | 开发演示登录（生产 403） |

**限流与配额**：游客每 IP 60 req/min · 注册用户 50 次/日 · 订阅按 x-api-key 月度配额。
状态码：`401` 无效 key · `402` 订阅失效 · `429` 限流/配额超限 · `404` 未找到。

## 2.6 认证与用户分层（游客优先 / 登录按需）

> 原则：**游客免登录极速查 + 仅高级/付费功能要求登录**，绝不给游客/爬虫设墙
> （登录墙会导致 80% 用户跳出、Google 降权）。详细设计见 `docs/auth.md`。

| 层级 | 登录 | 能力 |
|---|---|---|
| 游客 Guest | ❌ | 单次查询、IP 限流、批量 5 行、带水印 PDF |
| 注册用户 Free Member | ✅ 邮箱免密（Clerk） | 每天 50 次 API、关注清单、批量 50 行 |
| 付费 Subscriber | ✅ + 订阅 | API Key、月度配额、CSV 批量、无印 PDF、申报提醒 |

**启用真实登录（Clerk，约 5 分钟）**：
1. 注册 clerk.com → 创建应用 → 复制两个 Key
2. 写入 `.env.local`：
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. 重启：`/sign-in`、`/sign-up` 自动变为 Google / GitHub / 邮箱免密登录页

**开发演示**：`npm run dev` 默认开启无密码演示登录，用于本地验证权限边界；
生产默认关闭。换用 NextAuth / Supabase 时只替换 `lib/auth/clerk.ts` 适配层。

## 2.7 变现配置

### 1) AdSense 广告

```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxx
NEXT_PUBLIC_COOKIESCRIPT_ID=your_cookie_script_id   # UK GDPR CMP
```
首页 Leaderboard、详情卡矩形广告位由 `components/AdSlot.tsx` 渲染。
审核前置：Privacy/Terms 页面（已内置）+ CMP + 积累 20+ 索引页。

### 2) B2B 联盟佣金

```env
NEXT_PUBLIC_TIDE_AFFILIATE=https://tide.co/...?ref=xxx
NEXT_PUBLIC_WISE_AFFILIATE=...
NEXT_PUBLIC_1ST_FORMATIONS_AFFILIATE=...
NEXT_PUBLIC_FREEAGENT_AFFILIATE=...
```
查询结果底部自动出现「Recommended Services」模块。

### 3) SaaS 订阅 + API Token（核心增量）

| 计划 | 价格 | 卖点 |
|---|---|---|
| Free Member | £0 | 每天 50 次 API + 关注清单 |
| API Starter | $9.99/月 | REST API 10,000 次/月 |
| Accountant Pro | $29/月 | 批量 5,000 行 + 临期提醒 |
| Credit Pack | $3/份 | 无水印 PDF 报告 |
| Lead Export | $29/5,000 条 | 数据导出 |

- 定价/配额引擎：`lib/billing.ts` + `lib/subscription.ts` + `lib/api-auth.ts`
- 收款：**Lemon Squeezy（主）/ Stripe（备）**，checkout 与 webhook 已实现，
  配置步骤见 `docs/monetization.md` 与 `.env.local.example`
- 邮件提醒：`POST /api/notifications/opt-in` + Resend/Postmark（预留）

## 2.8 生产部署

```bash
# 构建（standalone 产物：.next/standalone）
npm run build
```

1. **域名**：解析到 Cloudflare（橙云 = CDN + SSL + WAF/Bot 防护）
2. **托管**：
   - Vercel：导入仓库，配置环境变量即可
   - VPS：`node .next/standalone/server.js`（软链 `public` / `.next/static`）
3. **环境变量**：按 `.env.local.example` 填全，`NEXT_PUBLIC_SITE_URL=https://qxx.uk`
4. **SEO**：Google Search Console 提交 `https://qxx.uk/sitemap.xml`
5. **变现**：AdSense 审核 → Clerk 登录 → Lemon Squeezy 商品与 webhook

## 2.9 目录结构

```
app/
├── layout.tsx                  # 全局布局：Header/Footer/Clerk/AdSense/CMP
├── page.tsx                    # 首页（三合一搜索）
├── company/[crn]/page.tsx      # 公司详情（pSEO）
├── vat/[vrn]/page.tsx          # VAT 验证详情
├── postcode/[code]/page.tsx    # 邮编详情
├── search/page.tsx             # 公司名搜索
├── pricing|dashboard|account|watchlist/page.tsx
├── sign-in/ sign-up/           # Clerk 登录页（含演示降级）
├── api/v1/{company,vat,postcode,bulk}/route.ts
├── api/me | watchlist | auth/* | billing/* | notifications/*
├── api/health/route.ts
└── sitemap.ts | robots.ts | privacy|terms|about|contact|api-docs
components/                     # 搜索/卡片/广告/批量/账号等 UI
lib/
├── companies-house.ts          # 官方 API 封装（缓存 + 限频保护）
├── hmrc-vat.ts / postcodes.ts
├── cache.ts / rate-limit.ts    # 缓存与限流引擎
├── billing.ts / subscription.ts / api-auth.ts   # 计费与配额
├── auth/                       # 认证抽象（clerk / demo）
└── schema.ts / format.ts / seed.ts / site.ts / types.ts
docs/
├── monetization.md             # 定价阶梯 + 收款接入
└── auth.md                     # 用户分层 + Clerk 接入
.env.local.example
```

## 2.10 常见问题

**Q：没有 Companies House Key 能跑起来吗？**
能。VAT / 邮编查询直接可用；公司查询页显示配置引导；生产填 Key 即生效。

**Q：不配置 Redis 会怎样？**
自动使用进程内内存缓存（单实例足够）；多实例/Serverless 建议配 Redis/Upstash。
VPS 生产推荐配置 `REDIS_URL`（当前 qxx.uk 已配置 `redis://127.0.0.1:6379`），
缓存与搜索统计均持久化到 Redis RDB，服务重启后数据不丢失。

**Q：前台搜索统计（游客 / 注册会员）怎么查看？**
管理后台 `/admin` 新增「Frontend Search Analytics」面板：
- 今日搜索总量 / 今日游客搜索 / 今日注册会员搜索 / 本月搜索总量
- 按类型（公司 / VAT / 邮编）拆分的游客与会员计数
统计通过 `lib/search-stats.ts` 写入 Redis（`search:d:*` 日键、`search:m:*` 月键），
自动过滤搜索引擎/社交爬虫，仅统计真实用户；统计失败静默降级、绝不阻塞页面渲染。

**Q：游客会被强制注册吗？**
不会。全站公开查询，登录只出现在账户/批量/关注等高级功能入口。

**Q：数据来源与授权？**
Companies House / HMRC / ONS 官方公开数据，遵循 Open Government Licence v3.0，
页脚与 About 均有标注与免责声明。

**Q：如何验证订阅/登录已生效？**
`GET /api/me` 返回 `tier`（guest/member/subscriber）与今日额度；
`curl -H "x-api-key: ..." /api/v1/company?crn=...` 走订阅配额。

---

## 免责声明

qxx.uk 独立运营，与英国政府、Companies House、HMRC 无隶属关系。
公开数据依据 Open Government Licence v3.0 使用；本站信息仅供参考，不构成法律或
财税建议，重要商业决策请以官方注册记录为准。