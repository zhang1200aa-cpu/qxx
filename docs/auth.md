# 用户权限与注册分层（分阶段、按需启用）

> 核心原则：**游客免登录极速查 + 仅针对高级/付费功能要求登录。**
> 绝不在首屏对游客/爬虫设卡 —— Google 会因为"内容需要登录才能查看"而降低整站 SEO 权重。

---

## 1. 权限分层

| 层级 | 是否需要登录 | 免费可用的能力 | 对你的收益 |
|---|---|---|---|
| 游客 Guest（~90% 流量） | ❌ 否 | 单次公司/VAT/邮编查询、基础数据、IP 限流 60 req/min、批量 5 行、带水印 PDF | AdSense 广告 + Affiliate 点击 |
| 注册用户 Free Member | ✅ 邮箱免密（Clerk） | **每天 50 次 API**、关注公司清单（50 家）、批量 50 行、用量仪表盘 | 沉淀 B2B 邮箱 → 后续营销 |
| 付费用户 Subscriber | ✅ 登录并付费 | 专属 API Key、月度配额、CSV 批量、无水印 PDF、申报提醒 | $9.99 ~ $49/月 订阅 |

**工程实现**（`lib/auth/index.ts`）：
- `getCurrentUser()` → 返回 `{ tier: guest|member|subscriber, planId, subscription }`
- 付费状态由 billing 账户（`acct:{email}`）驱动；Clerk 只负责"身份"，不重复维护订阅
- 所有查询页面都是纯静态/SSR 公开渲染，登录判断只出现在**高级功能入口**（账户、API、批量、关注）

## 2. 身份 Provider 策略

### 方案 A：Clerk（⭐ 推荐，代码已就绪）

**为什么选它**：专为 Next.js 设计，自带 Google/GitHub 一键登录、邮箱免密
（Magic Link）UI，前 10,000 MAU 免费；无需自建用户表/密码/找回/验证码。

**启用步骤**（约 5 分钟）：
1. 注册 clerk.com → 创建应用
2. Dashboard → API Keys 复制两个值
3. 写入 `.env.local`：
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. 重启服务即可 —— `/sign-in`、`/sign-up` 自动变为 Clerk 托管登录页
   （Google / GitHub / 邮箱免密），Header 右侧自动出现账号入口

**已有代码**：
- `lib/auth/clerk.ts` — 适配器（未配置 key 时安全降级，不影响游客）
- `app/layout.tsx` — 条件包裹 `<ClerkProvider>`（有 key 才启用）
- `app/sign-in/[[...sign-in]]`、`app/sign-up/[[...sign-up]]` — Clerk 托管页面
- `components/AccountBadge.tsx` — 客户端账号徽章（统一兼容 Clerk/demo）

### 方案 B：NextAuth (Auth.js) / Supabase Auth（开源，数据自控）

若要求用户数据完全自持（PostgreSQL），替换方案：
- 用 `@auth/nextjs` + 自建 users 表，`lib/auth/clerk.ts` 替换为 Credentials/OAuth
  Provider 实现，`lib/auth/index.ts` 接口不变
- 或 Supabase Auth + `@supabase/ssr`，同样只改 `lib/auth/*` 适配层

> 无论选哪个 IdP，**业务层（tier/配额/订阅）已经与身份解耦**，
> 切换 Provider 只动适配层。

### 演示模式（仅开发）

`lib/auth/demo.ts` — 无密码 cookie 会话，`NODE_ENV=development` 自动可用，
用于本地验证"注册后解锁高级功能"的边界。**生产环境默认关闭**
（`AUTH_DEMO_MODE=0`），且 `POST /api/auth/demo-login` 在非 demo 模式返回 403。

## 3. 配额矩阵（引擎执行，`lib/api-auth.ts`）

| 请求来源 | 免费 | 注册用户 | 订阅用户 |
|---|---|---|---|
| 网页 API（无 key） | IP 60 req/min | **50 次/天** | 1,000 次/天 |
| x-api-key API | 401 | 无 key | 月度配额（10k~50k） |
| 批量行数/次 | 5 | 50 | 200~5,000 |
| 批量每日行数 | 50 | 200 | 100,000 |

## 4. 页面与路由索引

| 功能 | 路径 | 权限 |
|---|---|---|
| 登录 / 注册 | `/sign-in` `/sign-up` | 公开（noindex） |
| 个人中心 | `/account` | 需登录（force-dynamic） |
| 关注清单 | `/watchlist` | 需登录（force-dynamic） |
| 当前用户/配额 | `GET /api/me` | 公开（游客返回 guest） |
| 关注增删 | `GET/POST/DELETE /api/watchlist` | 需登录 |
| 演示登录 | `POST /api/auth/demo-login` | 仅开发 |
| 公司页关注按钮 | 详情页操作栏 `<WatchButton>` | 游客→sign-up 引导 |

## 5. SEO 合规要点

- 首页/工具页/详情页 **全部静态或 SSR 公开渲染**，无登录墙
- `/account`、`/watchlist`、`/sign-in`、`/sign-up` 均 `robots: noindex`
- Header 静态生成 + 客户端徽章：缓存页面不含登录态，不会污染爬虫快照
- robots.txt 不屏蔽搜索；详情页继续靠 pSEO 收割长尾