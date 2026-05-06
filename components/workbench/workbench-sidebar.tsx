"use client";

import React from "react";
import { ArrowLeft, Clock, GitBranch, MessageSquare, Sparkles } from "lucide-react";

import type { PageSuggestion } from "@/types";

type VersionRecord = {
  id: string;
  number: number;
  summary: string;
  createdAt: string;
  source: string;
};

type WorkbenchSidebarProps = {
  projectName: string;
  suggestion: PageSuggestion | null;
  versions: VersionRecord[];
  onBackToInput: () => void;
  onStartIteration: () => void;
  isIterating: boolean;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

const SOURCE_LABELS: Record<string, string> = {
  generation: "初始生成",
  chat: "对话修改",
  selection: "点选修改",
};

export function WorkbenchSidebar({
  projectName,
  suggestion,
  versions,
  onBackToInput,
  onStartIteration,
  isIterating,
}: WorkbenchSidebarProps) {
  return (
    <aside className="flex flex-col border-r border-warm-border-soft bg-warm-panel">
      <div className="border-b border-warm-border-soft px-4 py-3">
        <button
          type="button"
          onClick={onBackToInput}
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-warm-text-soft transition-colors hover:text-warm-text"
        >
          <ArrowLeft className="h-3 w-3" />
          返回修改需求
        </button>
        <h2 className="font-serif text-sm font-bold text-warm-text">{projectName}</h2>
      </div>

      {suggestion && (
        <div className="border-b border-warm-border-soft px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-warm-text-soft">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">当前方案</span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-warm-text">{suggestion.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-warm-text-soft">{suggestion.purpose}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestion.modules.slice(0, 4).map((m) => (
              <span key={m} className="rounded bg-warm-subtle px-1.5 py-0.5 text-[11px] text-warm-text-faint">{m}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-warm-text-soft">
          <GitBranch className="h-3.5 w-3.5" />
          <span className="font-medium">版本历史</span>
          <span className="ml-auto text-warm-text-faint">{versions.length} 个版本</span>
        </div>

        <div className="mt-3 space-y-1">
          {versions.map((v, i) => (
            <div
              key={v.id}
              className={`rounded-lg px-3 py-2 text-xs transition-colors ${
                i === 0
                  ? "border border-[#2563EB]/20 bg-[#EFF6FF] dark:border-[#60A5FA]/20 dark:bg-[#1e3a8a]/10"
                  : "hover:bg-warm-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${i === 0 ? "text-[#2563EB]" : "text-warm-text"}`}>
                  v{v.number}
                </span>
                <span className="inline-flex items-center gap-1 text-warm-text-faint">
                  <Clock className="h-3 w-3" />
                  {formatTime(v.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-warm-text-soft">{v.summary}</p>
              <span className="mt-1 inline-block rounded bg-warm-subtle px-1.5 py-0.5 text-[10px] text-warm-text-faint">
                {SOURCE_LABELS[v.source] ?? v.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isIterating && (
        <div className="border-t border-warm-border-soft p-4">
          <button
            type="button"
            onClick={onStartIteration}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
          >
            <MessageSquare className="h-4 w-4" />
            开始迭代优化
          </button>
        </div>
      )}
    </aside>
  );
}
