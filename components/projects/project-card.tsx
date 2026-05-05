"use client";

import Link from "next/link";
import { ArrowRight, Clock, FileText, Layers, Loader2, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { Project } from "@/types";
import { StatusBadge, deriveProjectStatus } from "./status-badge";
import { StyleDots } from "./style-dots";

const AVATAR_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-600 dark:text-cyan-400" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(value));
}

const CTA_MAP = {
  draft: "继续编辑",
  analyzing: "查看进度",
  generated: "打开工作台",
} as const;

export function ProjectCard({
  project,
  onDelete,
  isDeleting,
}: {
  project: Project;
  onDelete: (project: Project) => void;
  isDeleting: boolean;
}) {
  const status = deriveProjectStatus(project.sourceDocumentIds.length, project.pageIds.length);
  const color = AVATAR_COLORS[hashString(project.name) % AVATAR_COLORS.length];
  const initial = project.name.trim().charAt(0).toUpperCase() || "P";
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <Link
      ref={cardRef}
      href={`/projects/${project.id}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block overflow-hidden rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-warm-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3B82F6]/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 dark:border-[#44403C] dark:bg-[#292524] dark:hover:border-[#60A5FA]/30 dark:hover:shadow-[0_4px_20px_rgba(96,165,250,0.1)]"
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            background: `radial-gradient(250px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(59,130,246,0.10), transparent 70%)`,
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${color.bg} ${color.text}`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                {project.name}
              </h3>
              <StatusBadge status={status} />
            </div>
            {project.textInput && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#78716C] dark:text-[#A8A29E]">
                {project.textInput}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`删除 ${project.name}`}
            onClick={(e) => { e.preventDefault(); onDelete(project); }}
            disabled={isDeleting}
            className="shrink-0 rounded-md p-1.5 text-[#D6D3D1] opacity-0 transition-all duration-150 motion-reduce:opacity-100 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 dark:text-[#57534E] dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-3 border-t border-[#F5F5F4] pt-3 text-xs text-[#78716C] dark:border-[#44403C] dark:text-[#A8A29E]">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="font-medium text-[#44403C] dark:text-[#D6D3D1]">{project.sourceDocumentIds.length}</span>
            文档
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span className="font-medium text-[#44403C] dark:text-[#D6D3D1]">{project.pageIds.length}</span>
            页面
          </span>
          <StyleDots presetId={project.currentSkillId} showName={false} />
          <span className="ml-auto inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        <div className="mt-3 flex items-center text-xs font-medium text-[#78716C] transition-colors duration-150 group-hover:text-[#2563EB] dark:text-[#A8A29E] dark:group-hover:text-[#60A5FA]">
          {CTA_MAP[status]}
          <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" />
        </div>
      </div>
    </Link>
  );
}
