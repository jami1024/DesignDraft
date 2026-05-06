"use client";

import { ArrowUpDown, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type { ProjectStatus } from "./status-badge";

type StatusFilter = "all" | ProjectStatus;

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "analyzing", label: "分析中" },
  { value: "generated", label: "已生成" },
];

export function GalleryToolbar({
  projectCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortToggle,
  statusFilter,
  onStatusFilterChange,
  isLoading,
}: {
  projectCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: "updatedAt" | "name";
  onSortToggle: () => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
  isLoading?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  const countLabel = isLoading
    ? ""
    : searchQuery.trim() && filteredCount !== projectCount
      ? `${filteredCount} / ${projectCount} 个`
      : projectCount === 0 ? "暂无" : `${projectCount} 个`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">我的项目</h2>
          <span className="text-xs text-[#A8A29E] dark:text-[#78716C]">{countLabel}</span>
        </div>

        {!isLoading && <div className="ml-auto flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 ${
                statusFilter === tab.value
                  ? "text-white dark:text-[#1C1917]"
                  : "text-[#78716C] hover:text-[#44403C] dark:text-[#A8A29E] dark:hover:text-[#D6D3D1]"
              }`}
            >
              {statusFilter === tab.value && (
                <motion.span
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-md bg-[#1C1917] dark:bg-[#FAFAF9]"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onSortToggle}
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-[#E7E5E4] px-2.5 py-1 text-xs font-medium text-[#57534E] transition-colors duration-150 hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:border-[#44403C] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
          >
            <ArrowUpDown className="h-3 w-3 transition-transform duration-200" style={{ transform: sortBy === "name" ? "rotate(180deg)" : "rotate(0deg)" }} />
            {sortBy === "updatedAt" ? "最近更新" : "名称"}
          </button>
        </div>}
      </div>

      {!isLoading && projectCount > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A8A29E] dark:text-[#78716C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索项目…"
            className="h-9 w-full rounded-lg border border-[#E7E5E4] bg-white pl-9 pr-8 text-sm text-[#1C1917] outline-none transition-colors duration-150 placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#FAFAF9] dark:placeholder:text-[#78716C] dark:focus:border-[#60A5FA] dark:focus:ring-[#60A5FA]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-[#A8A29E] hover:text-[#57534E] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:text-[#78716C] dark:hover:text-[#D6D3D1]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type { StatusFilter };
