"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

/** 退出演示会话（生产用 Clerk 的 <UserButton>） */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/demo-logout", { method: "POST" });
    } finally {
      setBusy(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}