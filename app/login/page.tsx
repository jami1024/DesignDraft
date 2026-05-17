"use client";

import React, { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "登录失败");
        return;
      }

      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }, [token, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09]">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[#E7E5E4] bg-white p-8 shadow-lg dark:border-[#44403C] dark:bg-[#1C1917]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30">
            <Lock className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[#1C1917] dark:text-[#FAFAF9]">DesignDraft</h1>
          <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">请输入访问令牌</p>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleLogin(); }}
            placeholder="访问令牌"
            className="w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#FAFAF9]"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={!token.trim() || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            登录
          </button>
        </div>
      </div>
    </main>
  );
}
