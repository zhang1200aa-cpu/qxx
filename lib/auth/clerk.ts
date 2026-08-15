/**
 * Clerk 适配器（主认证方案 A）
 *
 * 未配置 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY 时，
 * 所有函数安全返回 "未启用"，站点自动退化为"游客模式"，游客与爬虫零影响。
 * 配置后：Google / 邮箱免密登录即生效（Clerk 自带 UI 与托管页面）。
 */
export function clerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  );
}

interface ClerkSession {
  userId: string;
}

export async function getClerkSession(): Promise<ClerkSession | null> {
  if (!clerkConfigured()) return null;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ? { userId } : null;
  } catch (err) {
    // Clerk 会话读取失败不阻塞游客流程
    console.warn("[auth/clerk] session read failed", err);
    return null;
  }
}

interface ClerkUserRecord {
  email: string;
  name: string | null;
}

export async function clerkUserRecord(
  userId: string
): Promise<ClerkUserRecord | null> {
  if (!clerkConfigured()) return null;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      "";
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null;
    return { email, name };
  } catch (err) {
    console.warn("[auth/clerk] user fetch failed", err);
    return null;
  }
}