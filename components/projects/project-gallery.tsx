"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import type { Project } from "@/types";
import { deriveProjectStatus } from "./status-badge";
import type { ProjectStatus } from "./status-badge";
import { ProjectCard } from "./project-card";
import { GalleryToolbar } from "./gallery-toolbar";
import type { StatusFilter } from "./gallery-toolbar";
import { EmptyCanvas } from "./empty-canvas";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" as const } },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-warm-xs dark:border-[#44403C] dark:bg-[#292524]">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="flex-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#F5F5F4] dark:bg-[#3a3533]" />
        </div>
      </div>
      <div className="mt-3 flex gap-3 border-t border-[#F5F5F4] pt-3 dark:border-[#44403C]">
        <div className="h-3 w-16 animate-pulse rounded bg-[#F5F5F4] dark:bg-[#3a3533]" />
        <div className="h-3 w-16 animate-pulse rounded bg-[#F5F5F4] dark:bg-[#3a3533]" />
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  projectName,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <motion.div
        className="relative w-full max-w-sm rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-[0_16px_48px_rgba(28,25,23,0.16)] dark:border-[#44403C] dark:bg-[#292524]"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-md p-1 text-[#A8A29E] transition-colors hover:text-[#1C1917] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:text-[#78716C] dark:hover:text-[#FAFAF9]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">确认删除项目</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#57534E] dark:text-[#A8A29E]">
              确定删除「<span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">{projectName}</span>」吗？项目内的所有文档和页面将被永久删除，且无法恢复。
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#E7E5E4] bg-white px-4 py-2 text-sm font-medium text-[#44403C] transition-colors hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            删除项目
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProjectGallery({ onSuggestionClick, onProjectCountChange }: { onSuggestionClick: (text: string) => void; onProjectCountChange?: (count: number) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "name">("updatedAt");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const body = (await res.json()) as { projects?: Project[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "加载失败");
      setProjects(body.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!isLoading) onProjectCountChange?.(projects.length);
  }, [projects.length, isLoading, onProjectCountChange]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (statusFilter !== "all") {
      result = result.filter((p) => deriveProjectStatus(p.sourceDocumentIds.length, p.pageIds.length) === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "zh-CN");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [projects, searchQuery, sortBy, statusFilter]);

  const confirmDelete = useCallback(async () => {
    if (!projectToDelete) return;
    setDeletingProjectId(projectToDelete.id);
    setProjectToDelete(null);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "删除失败");
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeletingProjectId(null);
    }
  }, [projectToDelete]);

  const hasAnyProjects = projects.length > 0;

  return (
    <section>
      <AnimatePresence>
        {projectToDelete && (
          <DeleteConfirmModal
            projectName={projectToDelete.name}
            onConfirm={() => void confirmDelete()}
            onCancel={() => setProjectToDelete(null)}
          />
        )}
      </AnimatePresence>

      <GalleryToolbar
        projectCount={projects.length}
        filteredCount={filteredProjects.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortToggle={() => setSortBy((v) => (v === "updatedAt" ? "name" : "updatedAt"))}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={isLoading}
      />

      <div className="mt-4">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !hasAnyProjects ? (
          <EmptyCanvas onSuggestionClick={onSuggestionClick} />
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D6D3D1] bg-white px-6 py-10 text-center dark:border-[#57534E] dark:bg-[#292524]">
            <Search className="mx-auto h-6 w-6 text-[#A8A29E] dark:text-[#78716C]" />
            <h3 className="mt-3 text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">未找到匹配项目</h3>
            <p className="mt-1 text-xs text-[#78716C] dark:text-[#A8A29E]">试试其他关键词或清空筛选</p>
          </div>
        ) : (
          <motion.div
            className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredProjects.map((project) => (
              <motion.div key={project.id} variants={shouldReduceMotion ? undefined : cardVariants} layout className="h-full">
                <ProjectCard
                  project={project}
                  onDelete={setProjectToDelete}
                  isDeleting={deletingProjectId === project.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && hasAnyProjects && (
          <div className="mt-6 flex items-center justify-between border-t border-[#E7E5E4] pt-4 text-xs text-[#A8A29E] dark:border-[#44403C] dark:text-[#78716C]">
            <div className="flex items-center gap-4">
              <span>共 <span className="font-medium text-[#57534E] dark:text-[#D6D3D1]">{projects.reduce((s, p) => s + p.sourceDocumentIds.length, 0)}</span> 份文档</span>
              <span>共 <span className="font-medium text-[#57534E] dark:text-[#D6D3D1]">{projects.reduce((s, p) => s + p.pageIds.length, 0)}</span> 个页面</span>
            </div>
            <span>
              {projects.length > 0 && `最近活跃：${new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].updatedAt))}`}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
