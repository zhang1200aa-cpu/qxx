"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

/**
 * 开发/演示环境登录表单（无密码，仅本地验证权限边界）。
 * 生产环境使用 Clerk 托管页面（/sign-in）。
 */
export function DemoLoginForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Login failed.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-3">
      <div>
        <label htmlFor="demo-email" className="mb-1 block text-xs font-semibold text-slate-600">
          Email (demo — no password)
        </label>
        <input
          id="demo-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !email}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {busy ? "Signing in..." : "Continue as demo member"}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Development preview only — production uses Clerk (Google / email magic link).
      </p>
    </form>
  );
}