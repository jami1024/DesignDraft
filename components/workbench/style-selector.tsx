"use client";

import React from "react";
import { Palette } from "lucide-react";

import { listStylePresets, type StylePresetId } from "@/lib/styles";

type StyleSelectorProps = {
  value: StylePresetId;
  onChange: (value: StylePresetId) => void;
};

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const presets = listStylePresets();

  return (
    <div className="rounded-xl border border-warm-border bg-warm-panel shadow-warm-xs">
      <div className="flex items-center gap-2.5 border-b border-warm-border-soft px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warm-subtle text-warm-text-muted">
          <Palette className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-warm-text">视觉方向</h2>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {presets.map((preset) => {
          const isSelected = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              title={`${preset.description}\n适合：${preset.recommendedFor.join("、")}`}
              aria-label={`选择 ${preset.name}`}
              aria-pressed={isSelected}
              onClick={() => onChange(preset.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
                isSelected
                  ? "bg-warm-text text-white shadow-warm-xs"
                  : "bg-warm-subtle text-warm-text-muted hover:bg-warm-muted hover:text-warm-text"
              }`}
            >
              <span className="flex gap-px">
                {preset.palette.slice(0, 3).map((color) => (
                  <span
                    key={color}
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
