/**
 * registry.ts — 会员注册索引与客户档案聚合（Admin 后台数据源）
 *
 * 背景：站点没有独立用户表；注册用户散落在 Clerk（身份）+ 缓存层（账户/用量）。
 * 本模块维护一个轻量"会员索引"：
 *   idx:members               → { emails: string[], updatedAt }（全量邮箱列表）
 *   member:{email}            → MemberRecord（email/name/tier/plan/lastSeen/registeredAt/userId）
 * 账户/用量/关注/提醒仍读原有缓存键（acct:、usage:api:、watchlist:、alert:）。
 *
 * 注意：Admin 数据与运行缓存同寿命（生产建议配 Redis 持久化）。
 */
import { getCache } from "./cache";
import { getAccountByEmail } from "./subscription";
import { getSearchStats } from "./search-stats";

const MEMBER_INDEX_KEY = "idx:members";
const MEMBER_TTL = 90 * 24 * 3600; // 90 天
const TOUCH_TTL = 300; // 防抖窗口（秒）

export interface MemberRecord {
  email: string;
  name: string | null;
  userId?: string;
  tier: "guest" | "member" | "subscriber";
  planId: string;
  registeredAt: string;
  lastSeen: string;
}

interface MemberIndex {
  emails: string[];
  updatedAt: string;
}

/** 当前月份键（与 subscription 的用量键一致） */
function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * 登录用户活跃时登记到索引（5 分钟防抖）。
 * 在 lib/auth/getCurrentUser 的非 guest 分支调用。
 */
export async function touchUser(input: {
  email: string;
  name?: string | null;
  userId?: string;
  tier: MemberRecord["tier"];
  planId: string;
}): Promise<void> {
  const email = String(input.email || "").toLowerCase().trim();
  if (!email) return;
  const cache = getCache();

  const seen = await cache.get(`touch:${email}`);
  if (seen) return;
  await cache.set(`touch:${email}`, 1, TOUCH_TTL);

  const now = new Date().toISOString();
  const prev = await cache.get<MemberRecord>(`member:${email}`);
  const rec: MemberRecord = {
    email,
    name: input.name ?? prev?.name ?? null,
    userId: input.userId ?? prev?.userId,
    tier: input.tier ?? prev?.tier ?? "member",
    planId: input.planId ?? prev?.planId ?? "member",
    registeredAt: prev?.registeredAt ?? now,
    lastSeen: now,
  };
  await cache.set(`member:${email}`, rec, MEMBER_TTL);

  const idx = (await cache.get<MemberIndex>(MEMBER_INDEX_KEY)) ?? {
    emails: [],
    updatedAt: "",
  };
  if (!idx.emails.includes(email)) {
    idx.emails.push(email);
    idx.updatedAt = now;
    await cache.set(MEMBER_INDEX_KEY, idx, MEMBER_TTL);
  }
}

/** 客户档案聚合（账户 + 当月 API 用量 + 关注 + 提醒） */
export interface MemberProfile {
  rec: MemberRecord;
  subscription: Awaited<ReturnType<typeof getAccountByEmail>>;
  apiUsageMonth: number;
  watchlist?: string[];
  watchlistCount: number;
  alerts?: { email: string; crns: string[] } | null;
}

export async function getMemberProfile(email: string): Promise<MemberProfile | null> {
  const cache = getCache();
  const e = email.toLowerCase().trim();
  const rec = await cache.get<MemberRecord>(`member:${e}`);
  if (!rec) return null;
  const subscription = await getAccountByEmail(e);
  const apiUsageMonth = (await cache.get<number>(`usage:api:${e}:${monthKey()}`)) ?? 0;
  const watchlist = rec.userId
    ? ((await cache.get<string[]>(`watchlist:${rec.userId}`)) ?? [])
    : [];
  const alert = await cache.get<{ email: string; crns: string[] }>(`alert:${e}`);
  return {
    rec,
    subscription,
    apiUsageMonth,
    watchlist,
    watchlistCount: watchlist.length,
    alerts: alert ?? null,
  };
}

/** 客户列表（可按邮箱搜索 + 分页 + 排序） */
export async function listMembers(options: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: MemberProfile[]; total: number }> {
  const cache = getCache();
  const idx = (await cache.get<MemberIndex>(MEMBER_INDEX_KEY)) ?? { emails: [], updatedAt: "" };
  const q = (options.q ?? "").toLowerCase().trim();
  let emails = idx.emails;
  if (q) emails = emails.filter((e) => e.includes(q));

  // 最近活跃优先
  const recs: { rec: MemberRecord; email: string }[] = [];
  for (const e of emails) {
    const rec = await cache.get<MemberRecord>(`member:${e}`);
    if (rec) recs.push({ rec, email: e });
  }
  recs.sort((a, b) => (a.rec.lastSeen < b.rec.lastSeen ? 1 : -1));

  const total = recs.length;
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  const slice = recs.slice(start, start + pageSize);

  const items: MemberProfile[] = [];
  for (const { email } of slice) {
    const p = await getMemberProfile(email);
    if (p) items.push(p);
  }
  return { items, total };
}

/** 总体统计（仪表盘） */
export async function adminStats(): Promise<{
  members: number;
  subscribers: number;
  apiCallsMonth: number;
  watchlists: number;
  search: Awaited<ReturnType<typeof getSearchStats>>;
}> {
  const cache = getCache();
  const idx = (await cache.get<MemberIndex>(MEMBER_INDEX_KEY)) ?? { emails: [], updatedAt: "" };
  let subscribers = 0;
  let apiCallsMonth = 0;
  let watchlists = 0;
  for (const e of idx.emails) {
    const rec = await cache.get<MemberRecord>(`member:${e}`);
    if (!rec) continue;
    if (rec.tier === "subscriber") subscribers += 1;
    apiCallsMonth += (await cache.get<number>(`usage:api:${e}:${monthKey()}`)) ?? 0;
    if (rec.userId) {
      watchlists += ((await cache.get<string[]>(`watchlist:${rec.userId}`)) ?? []).length;
    }
  }
  const search = await getSearchStats();
  return { members: idx.emails.length, subscribers, apiCallsMonth, watchlists, search };
}