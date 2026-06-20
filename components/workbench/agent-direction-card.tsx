"use client";

import { Check } from "lucide-react";
import type { AgentDesignDirection } from "@/types/multi-agent";

type AgentDirectionCardsProps = {
  directions: AgentDesignDirection[];
  onSelect: (direction: AgentDesignDirection) => void;
  selectedId?: string | null;
  disabled?: boolean;
};

const STRATEGY_LABEL: Record<AgentDesignDirection["colorStrategy"], string> = {
  Restrained: "克制",
  Committed: "笃定",
  "Full palette": "全色板",
  Drenched: "浸染",
};

export function AgentDirectionCards({
  directions,
  onSelect,
  selectedId,
  disabled,
}: AgentDirectionCardsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400">
        推荐以下 {directions.length} 个设计方向，选择一个开始生成：
      </p>
      <div className="space-y-2">
        {directions.map((dir) => {
          const isSelected = selectedId === dir.id;
          const swatches = [
            dir.tokens.paletteOklch.primary,
            dir.tokens.paletteOklch.accent,
            dir.tokens.paletteOklch.neutral,
            dir.tokens.paletteOklch.background,
            dir.tokens.paletteOklch.foreground,
          ];
          return (
            <button
              key={dir.id}
              type="button"
              disabled={disabled || (!!selectedId && !isSelected)}
              onClick={() => onSelect(dir)}
              className={`group relative w-full rounded-lg border p-3 text-left transition-all duration-150 motion-reduce:transition-none ${
                isSelected
                  ? "border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20 dark:border-primary-400 dark:bg-primary-900/20 dark:ring-primary-400/20"
                  : "border-warm-gray-200 bg-white hover:border-warm-gray-300 hover:shadow-sm dark:border-warm-gray-700 dark:bg-warm-gray-800 dark:hover:border-warm-gray-600"
              } ${disabled || (!!selectedId && !isSelected) ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {isSelected && (
                <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white dark:bg-primary-400">
                  <Check className="h-3 w-3" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-warm-gray-900 dark:text-warm-gray-100">
                  {dir.name}
                </span>
                <span className="rounded-sm bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {STRATEGY_LABEL[dir.colorStrategy]}
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-warm-gray-500 dark:text-warm-gray-400">
                {dir.themeRationale}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {swatches.map((color, i) => (
                    <span
                      key={i}
                      className="h-5 w-5 rounded-full border border-warm-gray-200 dark:border-warm-gray-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="h-3 w-px bg-warm-gray-200 dark:bg-warm-gray-600" />
                <span className="text-[10px] text-warm-gray-400 dark:text-warm-gray-500">
                  {dir.tokens.fonts.display} · {dir.tokens.fonts.body}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-warm-gray-400 dark:text-warm-gray-500">
                {dir.layoutPlan}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
