"use client";

import React from "react";

import type { PrototypeDirection } from "@/types";

const COMPLEXITY_LABEL: Record<PrototypeDirection["complexity"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

type PrototypeDirectionCardProps = {
  direction: PrototypeDirection;
  selected: boolean;
  onSelect: (directionId: string) => void;
};

export function PrototypeDirectionCard({ direction, selected, onSelect }: PrototypeDirectionCardProps) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-warm-sm transition dark:bg-[#292524] ${
        selected
          ? "border-[#2563EB] ring-2 ring-[#3B82F6]/20"
          : "border-[#E7E5E4] dark:border-[#44403C]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">{direction.name}</h3>
          <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8A29E]">{direction.scenario}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#F5F5F4] px-2.5 py-1 text-xs font-medium text-[#57534E] dark:bg-[#1C1917] dark:text-[#D6D3D1]">
          复杂度 {COMPLEXITY_LABEL[direction.complexity]}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-[#57534E] dark:text-[#A8A29E]">
        <p className="flex gap-1">
          <span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">视觉方向：</span>
          <span>{direction.visualDirection}</span>
        </p>
        <p className="flex gap-1">
          <span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">预计范围：</span>
          <span>预计 {direction.estimatedScreens} 个页面</span>
        </p>
        <div>
          <div className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">页面清单</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {direction.screenList.map((screen) => (
              <span
                key={screen}
                className="rounded-full bg-blue-50 px-2 py-1 text-xs text-[#2563EB] dark:bg-blue-950/30 dark:text-[#60A5FA]"
              >
                {screen}
              </span>
            ))}
          </div>
        </div>
        <p className="leading-relaxed">{direction.recommendationReason}</p>
      </div>

      <button
        type="button"
        onClick={() => onSelect(direction.id)}
        className="mt-5 w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
      >
        选择这个方案
      </button>
    </article>
  );
}
