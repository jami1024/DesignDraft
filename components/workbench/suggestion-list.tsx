"use client";

import React, { useState } from "react";
import { Check, Layers3, Loader2, Sparkles } from "lucide-react";

import type { Complexity, PageSuggestion } from "@/types";

type SuggestionListProps = {
  projectId: string;
  latestDocumentId: string | null;
};

type AnalyzeResponse = {
  suggestions?: PageSuggestion[];
  error?: string;
};

const complexityLabel: Record<Complexity, string> = {
  low: "轻量",
  medium: "标准",
  high: "复杂",
};

export function SuggestionList({ projectId, latestDocumentId }: SuggestionListProps) {
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PageSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (isAnalyzing) return;
    if (!latestDocumentId) {
      setError("请先保存需求描述或上传文档");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, documentId: latestDocumentId }),
      });
      const body = (await response.json()) as AnalyzeResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "文档分析失败");
      }

      setSuggestions(body.suggestions ?? []);
      setSelectedSuggestion(null);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "文档分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section aria-label="页面建议" className="rounded-xl border border-warm-border bg-warm-panel shadow-warm-xs">
      <div className="flex items-center justify-between gap-3 border-b border-warm-border-soft px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warm-subtle text-warm-text-muted">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-warm-text">页面建议</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={isAnalyzing}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Layers3 className="h-3.5 w-3.5" />}
          分析文档
        </button>
      </div>

      <div className="px-4 py-3">
        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error">
            {error}
          </div>
        )}

        {selectedSuggestion && (
          <div role="status" className="mb-3 rounded-lg border border-status-success-border bg-status-success-bg px-3 py-2 text-sm font-medium text-status-success">
            已选择：{selectedSuggestion.name}
          </div>
        )}

        {suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-warm-border bg-warm-subtle px-4 py-4 text-center text-xs leading-relaxed text-warm-text-soft">
            分析需求内容，生成 3–5 个页面方向。
            <br />
            先保存需求，然后点击上方「分析文档」。
          </div>
        ) : (
          <ul className="space-y-2.5">
            {suggestions.map((suggestion) => {
              const isSelected = selectedSuggestion?.id === suggestion.id;
              return (
                <li key={suggestion.id}>
                  <article
                    className={`rounded-xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? "border-[#2563EB]/30 bg-[#EFF6FF] dark:border-[#60A5FA]/30 dark:bg-[#1e3a8a]/10"
                        : "border-warm-border bg-warm-subtle hover:border-warm-border-strong"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-warm-text">{suggestion.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-warm-text-soft">{suggestion.purpose}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-warm-panel px-2 py-0.5 text-[11px] font-medium text-warm-text-faint shadow-warm-xs">
                        {complexityLabel[suggestion.complexity]}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1">
                      <span className="rounded-md bg-warm-panel px-1.5 py-0.5 text-[11px] font-medium text-warm-text-muted">{suggestion.visualDirection}</span>
                      <span className="rounded-md bg-warm-panel px-1.5 py-0.5 text-[11px] text-warm-text-soft">受众：{suggestion.audience}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {suggestion.modules.map((module) => (
                        <span key={module} className="rounded bg-warm-panel px-1.5 py-0.5 text-[11px] text-warm-text-faint">
                          {module}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      aria-label={`选择 ${suggestion.name}`}
                      onClick={() => setSelectedSuggestion(suggestion)}
                      className={`mt-3 inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
                        isSelected
                          ? "bg-[#2563EB] text-white"
                          : "bg-warm-text text-white hover:bg-warm-text/80"
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : null}
                      {isSelected ? "已选择" : "选择方案"}
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
