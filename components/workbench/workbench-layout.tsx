"use client";

import React, { useCallback, useState } from "react";
import { Layers3, Loader2, Sparkles, Zap } from "lucide-react";

import type { PageSuggestion } from "@/types";
import type { StylePresetId } from "@/lib/styles";
import { DocumentUpload } from "./document-upload";
import { SuggestionList } from "./suggestion-list";
import { StyleSelector } from "./style-selector";
import { PreviewPanel } from "./preview-panel";
import { ChatInput } from "./chat-input";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type VersionRecord = {
  id: string;
  number: number;
  summary: string;
  createdAt: string;
  source: string;
};

const MOCK_SUGGESTIONS: PageSuggestion[] = [
  {
    id: "landing-page",
    projectId: "",
    name: "产品介绍落地页",
    purpose: "面向客户的产品介绍页面，突出核心价值、功能和行动按钮。",
    audience: "潜在客户、内部评审人员",
    modules: ["Hero", "核心价值", "功能说明", "使用流程", "行动按钮"],
    recommendedSkillIds: ["web-landing"],
    visualDirection: "Modern Minimal",
    complexity: "medium",
  },
  {
    id: "dashboard",
    projectId: "",
    name: "数据看板页面",
    purpose: "展示关键指标、状态和操作入口。",
    audience: "运营人员、管理者",
    modules: ["指标卡", "趋势图", "任务列表", "状态筛选"],
    recommendedSkillIds: ["dashboard"],
    visualDirection: "Tech Utility",
    complexity: "high",
  },
  {
    id: "executive-summary",
    projectId: "",
    name: "汇报摘要页",
    purpose: "凝练的结构呈现背景、方案、收益和后续计划。",
    audience: "管理层、客户决策人",
    modules: ["背景", "核心方案", "关键收益", "时间线", "结论"],
    recommendedSkillIds: ["pitch-page"],
    visualDirection: "Editorial",
    complexity: "low",
  },
];

const MOCK_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>产品介绍</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Noto Sans SC", system-ui, sans-serif; background: #FAFAF9; color: #1C1917; }
    .hero { max-width: 800px; margin: 0 auto; padding: 80px 24px; text-align: center; }
    h1 { font-size: 48px; font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; }
    .subtitle { margin-top: 16px; font-size: 18px; color: #57534E; line-height: 1.6; }
    .cta { display: inline-block; margin-top: 32px; padding: 14px 32px; background: #2563EB; color: white; border-radius: 12px; font-weight: 600; text-decoration: none; font-size: 16px; }
    .features { max-width: 800px; margin: 0 auto; padding: 0 24px 80px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .card { padding: 24px; border: 1px solid #E7E5E4; border-radius: 16px; background: white; }
    .card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .card p { font-size: 14px; color: #78716C; line-height: 1.6; }
  </style>
</head>
<body>
  <section class="hero" data-designdraft-id="hero">
    <h1>让创意快速落地</h1>
    <p class="subtitle">输入你的需求，AI 帮你生成可交互的演示页面。无需设计经验，几分钟内完成。</p>
    <a href="#features" class="cta">开始使用</a>
  </section>
  <section class="features" id="features" data-designdraft-id="features">
    <div class="card" data-designdraft-id="feature-1">
      <h3>智能分析</h3>
      <p>上传文档或输入需求，AI 自动理解并给出页面建议。</p>
    </div>
    <div class="card" data-designdraft-id="feature-2">
      <h3>实时预览</h3>
      <p>生成的页面即时展示，所见即所得。</p>
    </div>
    <div class="card" data-designdraft-id="feature-3">
      <h3>精细迭代</h3>
      <p>点选元素或对话式修改，快速打磨到满意为止。</p>
    </div>
  </section>
</body>
</html>`;

type WorkbenchLayoutProps = {
  projectId: string;
  projectName: string;
  initialLatestDocumentId: string | null;
  initialTextInput: string | null;
};

export function WorkbenchLayout({ projectId, projectName, initialLatestDocumentId, initialTextInput }: WorkbenchLayoutProps) {
  const [latestDocumentId, setLatestDocumentId] = useState<string | null>(initialLatestDocumentId);
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PageSuggestion | null>(null);
  const [stylePresetId, setStylePresetId] = useState<StylePresetId>("modern-minimal");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!latestDocumentId) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, documentId: latestDocumentId }),
      });
      const body = (await res.json()) as { suggestions?: PageSuggestion[] };
      const result = body.suggestions ?? MOCK_SUGGESTIONS;
      setSuggestions(result.map((s) => ({ ...s, projectId })));
    } catch {
      setSuggestions(MOCK_SUGGESTIONS.map((s) => ({ ...s, projectId })));
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, latestDocumentId]);

  const handleGenerate = useCallback(() => {
    if (!selectedSuggestion) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedHtml(MOCK_HTML);
      setVersions([{ id: "v1", number: 1, summary: "初始生成", createdAt: new Date().toISOString(), source: "generation" }]);
      setIsGenerating(false);
    }, 1500);
  }, [selectedSuggestion]);

  const handleSendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content };
    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `已根据你的意见修改：「${content}」。页面已更新到新版本。`,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setVersions((prev) => [{
        id: `v${prev.length + 1}`,
        number: prev.length + 1,
        summary: content.slice(0, 30),
        createdAt: new Date().toISOString(),
        source: "chat",
      }, ...prev]);
    }, 1200);
  }, []);

  return (
    <div className="grid h-[calc(100vh-57px)] grid-cols-1 lg:grid-cols-[360px_1fr]">
      {/* 左侧栏 */}
      <aside className="flex flex-col border-r border-[#E7E5E4] bg-[#FAFAF9] dark:border-[#44403C] dark:bg-[#1C1917] lg:overflow-y-auto">
        {/* 需求输入 */}
        <div className="border-b border-[#E7E5E4]/60 p-4 dark:border-[#44403C]/60">
          <DocumentUpload projectId={projectId} initialText={initialTextInput} onDocumentSaved={setLatestDocumentId} />
        </div>

        {/* 分析按钮 */}
        <div className="border-b border-[#E7E5E4]/60 px-4 py-3 dark:border-[#44403C]/60">
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={!latestDocumentId || isAnalyzing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                分析中…
              </>
            ) : (
              <>
                <Layers3 className="h-4 w-4" />
                分析需求
              </>
            )}
          </button>
        </div>

        {/* 方案列表 */}
        {suggestions.length > 0 && (
          <div className="border-b border-[#E7E5E4]/60 p-4 dark:border-[#44403C]/60">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#78716C] dark:text-[#A8A29E]">
              <Sparkles className="h-3.5 w-3.5" />
              页面方案
            </h3>
            <SuggestionList
              suggestions={suggestions}
              selectedId={selectedSuggestion?.id ?? null}
              onSelect={(s) => setSelectedSuggestion(s)}
            />
          </div>
        )}

        {/* 风格选择 + 生成按钮 */}
        {selectedSuggestion && (
          <div className="border-b border-[#E7E5E4]/60 p-4 dark:border-[#44403C]/60">
            <StyleSelector value={stylePresetId} onChange={setStylePresetId} />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#44403C] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  生成页面
                </>
              )}
            </button>
          </div>
        )}

        {/* 版本历史 */}
        {versions.length > 0 && (
          <div className="flex-1 p-4">
            <h3 className="mb-3 text-xs font-semibold text-[#78716C] dark:text-[#A8A29E]">
              版本历史 · {versions.length} 个版本
            </h3>
            <div className="space-y-1.5">
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className={`rounded-lg px-3 py-2 text-xs ${
                    i === 0
                      ? "border border-[#2563EB]/20 bg-[#EFF6FF] dark:border-[#60A5FA]/20 dark:bg-[#1e3a8a]/10"
                      : "text-[#78716C] hover:bg-[#F5F5F4] dark:text-[#A8A29E] dark:hover:bg-[#292524]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${i === 0 ? "text-[#2563EB] dark:text-[#60A5FA]" : ""}`}>v{v.number}</span>
                    <span className="text-[#A8A29E] dark:text-[#78716C]">
                      {new Date(v.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[#57534E] dark:text-[#A8A29E]">{v.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* 右侧预览区 */}
      <div className="relative flex flex-col overflow-hidden bg-[#F5F5F4] dark:bg-[#0C0A09]">
        {generatedHtml ? (
          <>
            <PreviewPanel
              html={generatedHtml}
              pageName={selectedSuggestion?.name ?? "预览"}
              versionNumber={versions.length}
            />
            <div className="absolute inset-x-0 bottom-0 z-10">
              <ChatInput messages={chatMessages} onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-xs text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7E5E4]/50 text-[#A8A29E] dark:bg-[#292524] dark:text-[#78716C]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-base font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                {isGenerating ? "正在生成页面…" : "页面预览"}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#A8A29E] dark:text-[#78716C]">
                {isGenerating
                  ? "AI 正在根据你选择的方案生成页面，请稍候"
                  : "在左侧输入需求 → 分析 → 选择方案 → 生成页面"
                }
              </p>
              {isGenerating && (
                <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-[#2563EB]" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
