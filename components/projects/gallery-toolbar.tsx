"use client";

import { ArrowUpDown, Plus, Search, X } from "lucide-react";

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
  onNewProject,
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
  onNewProject?: () => void;
  isLoading?: boolean;
}) {
  const countLabel = isLoading
    ? ""
    : searchQuery.trim() && filteredCount !== projectCount
      ? `${filteredCount} / ${projectCount} 个`
      : projectCount === 0 ? "暂无" : `${projectCount} 个`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">我的项目</h2>
          <span className="text-sm text-[#78716C] dark:text-[#A8A29E]">{countLabel}</span>
          {onNewProject && !isLoading && (
            <button
              type="button"
              onClick={onNewProject}
              className="ml-1 inline-flex h-6 items-center gap-1 rounded-md border border-[#E7E5E4] bg-white px-2 text-[11px] font-semibold text-[#57534E] transition-all duration-150 hover:border-[#D6D3D1] hover:bg-[#F5F5F4] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 motion-reduce:active:scale-100 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#D6D3D1] dark:hover:border-[#57534E] dark:hover:bg-[#1C1917]"
            >
              <Plus className="h-3 w-3" />
              新建
            </button>
          )}
        </div>

        {!isLoading && <div className="ml-auto flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusFilterChange(tab.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 ${
                statusFilter === tab.value
                  ? "bg-[#1C1917] text-white dark:bg-[#FAFAF9] dark:text-[#1C1917]"
                  : "text-[#78716C] hover:bg-[#F5F5F4] dark:text-[#A8A29E] dark:hover:bg-[#1C1917]"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onSortToggle}
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-[#E7E5E4] px-2.5 py-1 text-xs font-medium text-[#57534E] transition-colors duration-150 hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:border-[#44403C] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
          >
            <ArrowUpDown className="h-3 w-3" />
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
