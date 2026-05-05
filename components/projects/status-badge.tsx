export type ProjectStatus = "draft" | "analyzing" | "generated";

const STATUS_CONFIG = {
  draft: {
    label: "草稿",
    dotClass: "h-1.5 w-1.5 rounded-full ring-1 ring-[#A8A29E] dark:ring-[#78716C]",
    badgeClass: "bg-[#F5F5F4] text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]",
  },
  analyzing: {
    label: "分析中",
    dotClass: "h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse motion-reduce:animate-none dark:bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  },
  generated: {
    label: "已生成",
    dotClass: "h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
} as const;

export function deriveProjectStatus(docCount: number, pageCount: number): ProjectStatus {
  if (pageCount > 0) return "generated";
  if (docCount > 0) return "analyzing";
  return "draft";
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${config.badgeClass}`}>
      <span className={config.dotClass} />
      {config.label}
    </span>
  );
}
