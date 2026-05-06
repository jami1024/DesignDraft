"use client";

import React from "react";
import { Check } from "lucide-react";

import type { Complexity, PageSuggestion } from "@/types";

type SuggestionListProps = {
  suggestions: PageSuggestion[];
  selectedId: string | null;
  onSelect: (suggestion: PageSuggestion) => void;
};

const complexityLabel: Record<Complexity, string> = {
  low: "轻量",
  medium: "标准",
  high: "复杂",
};

export function SuggestionList({ suggestions, selectedId, onSelect }: SuggestionListProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul className="space-y-3">
      {suggestions.map((suggestion) => {
        const isSelected = selectedId === suggestion.id;
        return (
          <li key={suggestion.id}>
            <button
              type="button"
              onClick={() => onSelect(suggestion)}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-[#2563EB]/30 bg-[#EFF6FF] shadow-[0_0_0_2px_rgba(37,99,235,0.1)] dark:border-[#60A5FA]/30 dark:bg-[#1e3a8a]/10"
                  : "border-warm-border bg-warm-panel hover:border-warm-border-strong hover:shadow-warm-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-warm-text">{suggestion.name}</h3>
                    {isSelected && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-warm-text-soft">{suggestion.purpose}</p>
                </div>
                <span className="shrink-0 rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-warm-text-faint">
                  {complexityLabel[suggestion.complexity]}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1">
                <span className="rounded-md bg-warm-subtle px-1.5 py-0.5 text-[11px] font-medium text-warm-text-muted">{suggestion.visualDirection}</span>
                <span className="rounded-md bg-warm-subtle px-1.5 py-0.5 text-[11px] text-warm-text-soft">受众：{suggestion.audience}</span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {suggestion.modules.map((module) => (
                  <span key={module} className="rounded bg-warm-subtle px-1.5 py-0.5 text-[11px] text-warm-text-faint">
                    {module}
                  </span>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
