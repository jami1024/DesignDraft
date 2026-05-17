"use client";

import { Check } from "lucide-react";
import type { DesignDirection } from "@/types";

type DesignDirectionCardsProps = {
  directions: DesignDirection[];
  onSelect: (direction: DesignDirection) => void;
  selectedId?: string;
  disabled?: boolean;
};

export function DesignDirectionCards({
  directions,
  onSelect,
  selectedId,
  disabled,
}: DesignDirectionCardsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-warm-gray-500 dark:text-warm-gray-400">
        为你的项目推荐以下设计方向，请选择一个：
      </p>
      <div className="space-y-2">
        {directions.map((dir) => {
          const isSelected = selectedId === dir.id;
          return (
            <button
              key={dir.id}
              type="button"
              disabled={disabled || !!selectedId}
              onClick={() => onSelect(dir)}
              className={`group relative w-full rounded-lg border p-3 text-left transition-all duration-150 ${
                isSelected
                  ? "border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20 dark:border-primary-400 dark:bg-primary-900/20 dark:ring-primary-400/20"
                  : "border-warm-gray-200 bg-white hover:border-warm-gray-300 hover:shadow-sm dark:border-warm-gray-700 dark:bg-warm-gray-800 dark:hover:border-warm-gray-600"
              } ${disabled && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
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
                <span className="rounded-sm bg-warm-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-gray-500 dark:bg-warm-gray-700 dark:text-warm-gray-400">
                  {dir.register === "brand" ? "Brand" : "Product"}
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-warm-gray-500 dark:text-warm-gray-400">
                {dir.description}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {dir.palette.map((color, i) => (
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
                  {dir.typography.display} · {dir.typography.body}
                </span>
              </div>

              {dir.visualCharacteristics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {dir.visualCharacteristics.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
