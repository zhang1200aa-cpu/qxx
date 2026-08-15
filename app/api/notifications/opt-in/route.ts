/**
 * POST /api/notifications/opt-in
 *
 * 申报临期提醒（Accountant Pro 功能）
 * body: { email, crns: string[], leadDays?: number }
 *
 * 说明：
 *   - 订阅写缓存（key: alert:{email}），由定时任务扫描触发提醒
 *   - 生产环境接邮件服务（Resend / Postmark / SES）：
 *     建议用 Vercel Cron 或 worker 每 6 小时跑一次提醒轮询
 *   - 去重：每公司每天最多提醒一次（key: alert-sent:{email}:{crn}:{date}）
 */
import { NextResponse } from "next/server";
import { getCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AlertSubscription {
  email: string;
  crns: string[];
  leadDays: number;
  createdAt: string;
  updatedAt: string;
}

export async function POST(req: Request) {
  let body: { email?: string; crns?: string[]; leadDays?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const crns = (body.crns ?? [])
    .map((c) => String(c))
    .map((c) => c.replace(/\D/g, ""))
    .filter((c) => /^\d{6,8}$/.test(c));
  const leadDays = Math.min(Math.max(Number(body.leadDays) || 30, 3), 60);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: { code: "bad_email", message: "Invalid email address." } },
      { status: 400 }
    );
  }
  if (crns.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "bad_crns", message: "Provide at least one valid CRN." } },
      { status: 400 }
    );
  }

  // 权益检查：免费用户最多监控 3 家公司
  const FREE_CRN_CAP = 3;
  const limited = crns.slice(0, FREE_CRN_CAP);
  const subscription: AlertSubscription = {
    email,
    crns: limited,
    leadDays,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const cache = getCache();
  await cache.set(`alert:${email}`, subscription, 60 * 60 * 24 * 30);

  // 记录该用户关注的 CRN -> email 反向索引（供扫描任务使用）
  for (const crn of limited) {
    const index = (await cache.get<string[]>(`alert-crns:${crn}`)) ?? [];
    if (!index.includes(email)) {
      index.push(email);
      await cache.set(`alert-crns:${crn}`, index, 60 * 60 * 24 * 30);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      email,
      monitoredCrns: limited,
      notifiedLeadDays: leadDays,
      note:
        "Monitoring 3 companies on the free plan. Upgrade to Accountant Pro to monitor up to 5,000.",
      upgradeHint: "/pricing#accountant-pro",
    },
  });
}

/**
 * 说明：正式版在此处上方增加调度循环（localhost/测试可手动调用）：
 * GET /api/notifications/send-due —— 遍历 alert-crns 索引，取公司 accounts.next_due，
 * 命中 leadDays 窗口内 → 调用邮件 provider（RESEND_API_KEY / POSTMARK_SERVER_TOKEN）
 * 并写入 alert-sent:{email}:{crn}:{yyyy-mm-dd} 去重。
 */