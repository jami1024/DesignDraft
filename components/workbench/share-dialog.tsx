"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, Lock, Trash2, X } from "lucide-react";

type ShareInfo = {
  id: string;
  shareToken: string;
  shareUrl: string;
  versionId: string;
  hasPassword: boolean;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
};

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  pageId: string;
  currentVersionId: string;
};

const EXPIRY_OPTIONS = [
  { label: "1 小时", value: 3600 },
  { label: "24 小时", value: 86400 },
  { label: "7 天", value: 604800 },
  { label: "30 天", value: 2592000 },
];

export function ShareDialog({ open, onClose, projectId, pageId, currentVersionId }: ShareDialogProps) {
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState(604800);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/share`);
      const data = (await res.json()) as { shares?: ShareInfo[] };
      setShares(data.shares ?? []);
    } catch {
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) void fetchShares();
  }, [open, fetchShares]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          versionId: currentVersionId,
          expiresIn,
          password: password.trim() || undefined,
        }),
      });
      if (res.ok) {
        setPassword("");
        void fetchShares();
      }
    } finally {
      setCreating(false);
    }
  }, [pageId, projectId, currentVersionId, expiresIn, password, fetchShares]);

  const handleRevoke = useCallback(async (shareId: string) => {
    await fetch(`/api/pages/${pageId}/shares/${shareId}`, { method: "DELETE" });
    void fetchShares();
  }, [pageId, fetchShares]);

  const handleCopy = useCallback(async (share: ShareInfo) => {
    const url = `${window.location.origin}${share.shareUrl}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-xl dark:border-[#44403C] dark:bg-[#1C1917]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1C1917] dark:text-[#FAFAF9]">分享链接</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#A8A29E] hover:bg-[#F5F5F4] dark:hover:bg-[#292524]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 创建新分享 */}
        <div className="mt-4 space-y-3 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-3 dark:border-[#44403C] dark:bg-[#292524]">
          <div className="flex items-center gap-2">
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
              className="rounded-md border border-[#E7E5E4] bg-white px-2 py-1.5 text-xs text-[#1C1917] outline-none dark:border-[#44403C] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="relative flex-1">
              <Lock className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#A8A29E]" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（可选）"
                className="w-full rounded-md border border-[#E7E5E4] bg-white py-1.5 pl-7 pr-2 text-xs text-[#1C1917] outline-none placeholder:text-[#A8A29E] dark:border-[#44403C] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
              创建
            </button>
          </div>
          <p className="text-[11px] text-[#A8A29E]">
            当前版本：{currentVersionId}
          </p>
        </div>

        {/* 已有分享列表 */}
        <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#A8A29E]" />
            </div>
          ) : shares.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#A8A29E]">暂无分享链接</p>
          ) : (
            shares.map((share) => {
              const expired = new Date(share.expiresAt) < new Date();
              return (
                <div
                  key={share.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    expired
                      ? "border-[#E7E5E4]/50 bg-[#F5F5F4]/50 opacity-60 dark:border-[#44403C]/50"
                      : "border-[#E7E5E4] bg-white dark:border-[#44403C] dark:bg-[#292524]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium text-[#1C1917] dark:text-[#FAFAF9]">
                        {share.versionId}
                      </span>
                      {share.hasPassword && <Lock className="h-2.5 w-2.5 text-[#A8A29E]" />}
                      {expired && (
                        <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] text-red-600">已过期</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#A8A29E]">
                      访问 {share.accessCount} 次 · 过期 {new Date(share.expiresAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    title="复制链接"
                    onClick={() => void handleCopy(share)}
                    className="rounded p-1 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:hover:bg-[#1C1917]"
                  >
                    {copiedId === share.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="撤销分享"
                    onClick={() => void handleRevoke(share.id)}
                    className="rounded p-1 text-[#A8A29E] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
