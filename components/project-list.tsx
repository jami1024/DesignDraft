"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpDown, ChevronDown, Clock, FileText, FolderOpen, Layers, Loader2, Play, Plus, Search, Trash2, X } from "lucide-react";
import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Variants } from "framer-motion";

import type { Project, ProjectCreationContext } from "@/types";
import { ProjectCreationContextDialog } from "@/components/projects/project-creation-context-dialog";

const DemoPlayer = dynamic(
  () => import("@/components/remotion/demo-player").then((m) => m.DemoPlayer),
  { ssr: false },
);

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

function getAvatarColor(name: string) {
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function formatRelativeTime(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-warm-xs dark:border-[#44403C] dark:bg-[#292524]">
      <div className="flex items-start gap-3.5">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="flex-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#F5F5F4] dark:bg-[#3a3533]" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-[0_16px_48px_rgba(28,25,23,0.16)] dark:border-[#44403C] dark:bg-[#292524]">
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
            <h3 className="text-[15px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
              确认删除项目
            </h3>
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500"
          >
            删除项目
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors duration-150 hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-inset dark:hover:bg-[#1C1917]"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
          <Play className="h-3.5 w-3.5 text-[#3B82F6]" />
          看看怎么用
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#A8A29E] transition-transform duration-200 dark:text-[#78716C] ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-[#E7E5E4] dark:border-[#44403C]">
          <DemoPlayer />
        </div>
      )}
    </div>
  );
}

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingRequirement, setPendingRequirement] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "name">("updatedAt");
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : undefined;

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "zh-CN");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [projects, searchQuery, sortBy]);

  const projectCountLabel = useMemo(() => {
    if (projects.length === 0) return "暂无";
    if (searchQuery.trim() && filteredProjects.length !== projects.length) {
      return `${filteredProjects.length} / ${projects.length} 个`;
    }
    return `${projects.length} 个`;
  }, [projects.length, filteredProjects.length, searchQuery]);

  async function loadProjects() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects");
      const body = (await response.json()) as { projects?: Project[]; error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "项目列表加载失败");
      }

      setProjects(body.projects ?? []);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "项目列表加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请先描述你想做的产品或页面");
      return;
    }

    setError(null);
    setPendingRequirement(trimmedName);
  }

  async function confirmCreateProject(context: ProjectCreationContext) {
    if (!pendingRequirement) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pendingRequirement.slice(0, 32),
          textInput: pendingRequirement,
          creationContext: context,
        }),
      });
      const body = (await response.json()) as { project?: Project; error?: string };

      if (!response.ok || !body.project) {
        throw new Error(body.error ?? "项目创建失败");
      }

      setProjects((currentProjects) => [body.project as Project, ...currentProjects]);
      setName("");
      setPendingRequirement(null);
      router.push(`/projects/${body.project.id}`);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "项目创建失败");
    } finally {
      setIsCreating(false);
    }
  }

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    setDeletingProjectId(projectToDelete.id);
    setProjectToDelete(null);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "项目删除失败");
      }

      setProjects((currentProjects) => currentProjects.filter((item) => item.id !== projectToDelete.id));
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "项目删除失败");
    } finally {
      setDeletingProjectId(null);
    }
  }, [projectToDelete]);

  return (
    <div className="space-y-10">
      {pendingRequirement ? (
        <ProjectCreationContextDialog
          requirement={pendingRequirement}
          onCancel={() => setPendingRequirement(null)}
          onConfirm={(context) => void confirmCreateProject(context)}
        />
      ) : null}

      {projectToDelete && (
        <DeleteConfirmModal
          projectName={projectToDelete.name}
          onConfirm={() => void confirmDeleteProject()}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

      {/* 新建项目 */}
      <motion.div
        initial={initial ?? { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">新建项目</h2>
        </div>
        <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">描述你想做的产品或页面，AI 会先帮你分析并推荐原型方案</p>

        <div className="mt-4 rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateProject}>
            <div className="flex-1">
              <label className="sr-only" htmlFor="project-name">
                项目需求
              </label>
              <input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：做一个校园活动报名小程序，给学生和社团负责人使用"
                className="h-10 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3.5 py-2 text-sm text-[#1C1917] outline-none transition-all duration-150 motion-reduce:transition-none placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 dark:border-[#44403C] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#78716C] dark:focus:border-[#60A5FA] dark:focus:bg-[#292524] dark:focus:ring-[#60A5FA]/20"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1C1917] px-5 py-2 text-sm font-semibold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-[#44403C] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Plus className="h-4 w-4" />}
              开始
            </button>
          </form>

          {error ? (
            <div role="alert" className="mt-3 rounded-lg border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error">
              {error}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* 我的项目 */}
      <motion.div
        initial={initial ?? { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        <div className="mb-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2.5">
              <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">我的项目</h2>
              <span className="text-sm text-[#78716C] dark:text-[#A8A29E]">{projectCountLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadProjects()}
              className="rounded-md text-sm font-medium text-[#78716C] transition-colors duration-150 motion-reduce:transition-none hover:text-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:text-[#A8A29E] dark:hover:text-[#60A5FA]"
            >
              刷新
            </button>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A8A29E] dark:text-[#78716C]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目…"
                  className="h-9 w-full rounded-lg border border-[#E7E5E4] bg-white pl-9 pr-3 text-sm text-[#1C1917] outline-none transition-colors duration-150 placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#FAFAF9] dark:placeholder:text-[#78716C] dark:focus:border-[#60A5FA] dark:focus:ring-[#60A5FA]/20"
                />
              </div>
              <button
                type="button"
                onClick={() => setSortBy((v) => (v === "updatedAt" ? "name" : "updatedAt"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E7E5E4] bg-white px-3 text-xs font-medium text-[#57534E] transition-colors duration-150 hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
                title={sortBy === "updatedAt" ? "按更新时间排序" : "按名称排序"}
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortBy === "updatedAt" ? "最近更新" : "名称"}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredProjects.length === 0 && !searchQuery.trim() ? (
          <motion.div
            className="rounded-xl border border-dashed border-[#D6D3D1] bg-white px-6 py-10 text-center dark:border-[#57534E] dark:bg-[#292524]"
            initial={initial ?? { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F4] text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">
              <FolderOpen className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-[15px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">还没有项目</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#78716C] dark:text-[#A8A29E]">
              在上方描述产品或页面，创建你的第一个原型项目
            </p>
          </motion.div>
        ) : filteredProjects.length === 0 && searchQuery.trim() ? (
          <div className="rounded-xl border border-dashed border-[#D6D3D1] bg-white px-6 py-10 text-center dark:border-[#57534E] dark:bg-[#292524]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F5F4] text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">未找到匹配项目</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-[#57534E] dark:text-[#A8A29E]">
              试试其他关键词，或清空搜索查看全部项目
            </p>
          </div>
        ) : (
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={shouldReduceMotion ? undefined : containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredProjects.map((project) => {
              const color = getAvatarColor(project.name);
              return (
              <motion.div key={project.id} variants={shouldReduceMotion ? undefined : cardVariants} className="h-full">
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex h-full flex-col rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-warm-xs transition-all duration-150 motion-reduce:transition-none hover:border-[#D6D3D1] hover:shadow-warm-md focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 dark:border-[#44403C] dark:bg-[#292524] dark:hover:border-[#57534E]"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${color.bg} ${color.text}`}>
                      {getInitial(project.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                        {project.name}
                      </h3>
                      {project.textInput ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#78716C] dark:text-[#A8A29E]">
                          {project.textInput}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-[#78716C] dark:text-[#A8A29E]">
                          {formatRelativeTime(project.updatedAt)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`删除 ${project.name}`}
                      onClick={(e) => { e.preventDefault(); setProjectToDelete(project); }}
                      disabled={deletingProjectId === project.id}
                      className="rounded-md p-1.5 text-[#D6D3D1] opacity-0 transition-all duration-150 motion-reduce:opacity-100 group-hover:opacity-100 hover:bg-status-error-bg hover:text-status-error focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 dark:text-[#57534E]"
                    >
                      {deletingProjectId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-[#78716C] dark:text-[#A8A29E]">
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
                    {project.textInput ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-[#78716C] dark:text-[#A8A29E]">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex items-center border-t border-[#F5F5F4] pt-3.5 text-xs font-medium text-[#78716C] transition-colors duration-150 group-hover:text-[#2563EB] dark:border-[#44403C] dark:text-[#A8A29E] dark:group-hover:text-[#60A5FA]">
                    进入工作台
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" />
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* 产品演示 */}
      <motion.div
        initial={initial ?? { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        <DemoSection />
      </motion.div>
    </div>
  );
}
