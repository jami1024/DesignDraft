"use client";

import React, { useState } from "react";
import { FileText, Layers3, Sparkles, Zap } from "lucide-react";

import type { StylePresetId } from "@/lib/styles";
import { DocumentUpload } from "./document-upload";
import { SuggestionList } from "./suggestion-list";
import { StyleSelector } from "./style-selector";

type WorkbenchLayoutProps = {
  projectId: string;
  initialLatestDocumentId: string | null;
};

const STEPS = [
  { icon: FileText, label: "输入需求", description: "描述你想要的演示页面" },
  { icon: Layers3, label: "分析文档", description: "AI 生成 3-5 个页面方向" },
  { icon: Sparkles, label: "选择方案", description: "挑选最合适的页面方案" },
  { icon: Zap, label: "生成页面", description: "一键生成可交互演示页" },
];

export function WorkbenchLayout({ projectId, initialLatestDocumentId }: WorkbenchLayoutProps) {
  const [latestDocumentId, setLatestDocumentId] = useState<string | null>(initialLatestDocumentId);
  const [stylePresetId, setStylePresetId] = useState<StylePresetId>("modern-minimal");

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:gap-6">
      <aside aria-label="项目侧边栏" className="space-y-4 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:pr-1">
        <DocumentUpload projectId={projectId} onDocumentSaved={setLatestDocumentId} />
        <StyleSelector value={stylePresetId} onChange={setStylePresetId} />
        <SuggestionList projectId={projectId} latestDocumentId={latestDocumentId} />
      </aside>

      <section aria-label="页面预览" className="flex min-h-[420px] flex-col rounded-xl border border-warm-border bg-warm-panel shadow-warm-xs lg:min-h-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-80px)]">
        <div className="flex items-center justify-between border-b border-warm-border-soft px-5 py-3">
          <h2 className="text-sm font-semibold text-warm-text">预览</h2>
          <span className="rounded-full bg-warm-subtle px-2.5 py-0.5 text-[11px] font-medium text-warm-text-faint">待生成</span>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-subtle text-warm-text-soft">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-base font-semibold text-warm-text">按步骤创建你的演示页面</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-warm-text-soft">
              在左侧完成以下步骤，页面将在这里实时预览
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {STEPS.map((step, index) => (
                <div key={step.label} className="flex items-start gap-2.5 rounded-lg bg-warm-subtle p-3 text-left">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warm-panel text-[11px] font-bold text-warm-text-muted shadow-warm-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-warm-text">{step.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-warm-text-soft">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
