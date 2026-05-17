"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, Download, History, Loader2, RotateCcw } from "lucide-react";

import type { PageVersion } from "@/types";

type VersionHistoryProps = {
  projectId: string;
  pageId: string;
  currentVersionId: string;
  onRollback?: (version: PageVersion, html: string) => void;
};

const SOURCE_LABELS: Record<string, string> = {
  "initial-generation": "初始生成",
  "selection-optimization": "点选优化",
  "chat-optimization": "对话优化",
  rollback: "版本回退",
};

export function VersionHistory({ projectId, pageId, currentVersionId, onRollback }: VersionHistoryProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/versions?projectId=${projectId}`);
      const data = (await res.json()) as { versions: PageVersion[] };
      setVersions(data.versions ?? []);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, pageId]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions, currentVersionId]);

  const handleRollback = useCallback(async (versionId: string) => {
    if (!onRollback) return;
    setRollingBack(versionId);
    try {
      const res = await fetch(`/api/pages/${pageId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, targetVersionId: versionId }),
      });
      const data = (await res.json()) as { version?: PageVersion };
      if (data.version) {
        const htmlRes = await fetch(`/previews/${projectId}/${pageId}/${data.version.id}`);
        const html = await htmlRes.text();
        onRollback(data.version, html);
        void fetchVersions();
      }
    } finally {
      setRollingBack(null);
    }
  }, [projectId, pageId, onRollback, fetchVersions]);

  const handleDownload = useCallback((versionId: string) => {
    window.open(`/api/pages/${pageId}/versions/${versionId}/download?projectId=${projectId}`, "_blank");
  }, [projectId, pageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-[#A8A29E]" />
      </div>
    );
  }

  if (versions.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-1 py-1">
        <History className="h-3.5 w-3.5 text-[#A8A29E] dark:text-[#78716C]" />
        <span className="text-xs font-medium text-[#78716C] dark:text-[#A8A29E]">版本历史</span>
      </div>

      <div className="space-y-0.5">
        {versions.map((v) => {
          const isCurrent = v.id === currentVersionId;
          return (
            <div
              key={v.id}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                isCurrent
                  ? "bg-[#EFF6FF] dark:bg-[#1E3A8A]/20"
                  : "hover:bg-[#F5F5F4] dark:hover:bg-[#1C1917]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isCurrent ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#1C1917] dark:text-[#FAFAF9]"}`}>
                    v{v.versionNumber}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-[#2563EB] px-1 py-0.5 text-[9px] font-medium text-white">
                      当前
                    </span>
                  )}
                  <span className="rounded bg-[#F5F5F4] px-1 py-0.5 text-[9px] text-[#78716C] dark:bg-[#292524] dark:text-[#A8A29E]">
                    {SOURCE_LABELS[v.source] ?? v.source}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                  {v.changeSummary}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#D6D3D1] dark:text-[#57534E]">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(v.createdAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!isCurrent && (
                  <button
                    type="button"
                    title="回退到此版本"
                    disabled={rollingBack !== null}
                    onClick={() => void handleRollback(v.id)}
                    className="rounded p-1 text-[#A8A29E] transition-colors hover:bg-[#E7E5E4] hover:text-[#1C1917] disabled:opacity-50 dark:text-[#78716C] dark:hover:bg-[#292524]"
                  >
                    {rollingBack === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  </button>
                )}
                <button
                  type="button"
                  title="下载此版本"
                  onClick={() => handleDownload(v.id)}
                  className="rounded p-1 text-[#A8A29E] transition-colors hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#292524]"
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
