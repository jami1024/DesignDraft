"use client";

import React, { useCallback, useState } from "react";
import { Eye, Loader2, Lock } from "lucide-react";

type SharePageClientProps = {
  token: string;
  needsPassword?: boolean;
  initialHtml?: string;
};

export function SharePageClient({ token, needsPassword, initialHtml }: SharePageClientProps) {
  const [html, setHtml] = useState(initialHtml ?? null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!password.trim()) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/share/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "验证失败");
        return;
      }

      const pageRes = await fetch(`/api/share/${token}/html`);
      if (pageRes.ok) {
        setHtml(await pageRes.text());
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setVerifying(false);
    }
  }, [token, password]);

  if (html) {
    return (
      <main className="h-screen w-screen">
        <iframe
          title="分享页面"
          srcDoc={html}
          sandbox="allow-scripts"
          className="h-full w-full border-0"
        />
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09]">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-[#E7E5E4] bg-white p-8 shadow-lg dark:border-[#44403C] dark:bg-[#1C1917]">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30">
              <Lock className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-[#1C1917] dark:text-[#FAFAF9]">需要访问密码</h1>
            <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">此页面受密码保护，请输入密码查看。</p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleVerify(); }}
              placeholder="输入密码"
              className="w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-2.5 text-sm text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#FAFAF9]"
            />

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!password.trim() || verifying}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              查看页面
            </button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
