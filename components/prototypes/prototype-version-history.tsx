"use client";

import React from "react";

import type { PrototypeVersion } from "@/types";

type PrototypeVersionHistoryProps = {
  versions: PrototypeVersion[];
  currentVersionId: string | null;
};

const SOURCE_LABELS: Record<PrototypeVersion["source"], string> = {
  "initial-generation": "初始生成",
  "chat-optimization": "对话修改",
  "selection-optimization": "点选修改",
  rollback: "版本回退",
};

export function PrototypeVersionHistory({ versions, currentVersionId }: PrototypeVersionHistoryProps) {
  if (versions.length === 0) return null;

  return (
    <aside className="rounded-2xl border border-[#E7E5E4] bg-white p-4 dark:border-[#44403C] dark:bg-[#292524]">
      <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">版本历史</h3>
      <div className="mt-3 space-y-2">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          return (
            <div
              key={version.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                isCurrent
                  ? "border-[#2563EB] bg-blue-50 dark:border-[#60A5FA] dark:bg-blue-950/30"
                  : "border-[#E7E5E4] dark:border-[#44403C]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">v{version.versionNumber}</span>
                {isCurrent ? <span className="rounded bg-[#2563EB] px-1 py-0.5 text-[10px] text-white">当前</span> : null}
                <span className="rounded bg-[#F5F5F4] px-1 py-0.5 text-[10px] text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">
                  {SOURCE_LABELS[version.source]}
                </span>
              </div>
              <div className="mt-1 text-[#78716C] dark:text-[#A8A29E]">{version.changeSummary}</div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
