"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Paperclip, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import type { Project } from "@/types";

function extractProjectName(description: string): string {
  const cleaned = description.trim().replace(/[，。！？、：；""''（）\[\]{}…—·\s]+$/g, "");
  const name = cleaned.slice(0, 20);
  return name || "未命名项目";
}

type SubmitState = "idle" | "creating" | "success" | "error";

export function CommandZone({
  compact = false,
  onProjectCreated,
}: {
  compact?: boolean;
  onProjectCreated?: (project: Project) => void;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [description, setDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCreating = submitState === "creating";
  const showExpanded = !compact || isExpanded || !!description.trim();

  const triggerError = useCallback((message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = description.trim();
    if (!text) {
      triggerError("请先输入需求描述");
      textareaRef.current?.focus();
      return;
    }

    setSubmitState("creating");
    setError(null);

    try {
      const name = extractProjectName(text);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !body.project) throw new Error(body.error ?? "项目创建失败");

      await fetch("/api/documents/text-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: body.project.id, text }),
      });

      onProjectCreated?.(body.project);
      setSubmitState("success");

      setTimeout(() => {
        setDescription("");
        setSubmitState("idle");
        setIsExpanded(false);
        router.push(`/projects/${body.project!.id}`);
      }, 700);
    } catch (e) {
      setSubmitState("error");
      triggerError(e instanceof Error ? e.message : "创建失败");
      setTimeout(() => setSubmitState("idle"), 3000);
    }
  }, [description, onProjectCreated, router, triggerError]);

  const handleFileDrop = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setSubmitState("creating");
    setError(null);

    try {
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 20) || "未命名项目";
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !body.project) throw new Error(body.error ?? "项目创建失败");

      const formData = new FormData();
      formData.append("projectId", body.project.id);
      formData.append("file", file);
      await fetch("/api/documents/upload", { method: "POST", body: formData });

      onProjectCreated?.(body.project);
      setSubmitState("success");

      setTimeout(() => {
        setSubmitState("idle");
        setIsExpanded(false);
        router.push(`/projects/${body.project!.id}`);
      }, 700);
    } catch (e) {
      setSubmitState("error");
      triggerError(e instanceof Error ? e.message : "上传失败");
      setTimeout(() => setSubmitState("idle"), 3000);
    } finally {
      setIsDragOver(false);
    }
  }, [onProjectCreated, router, triggerError]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    if (!description.trim() && compact) {
      setIsExpanded(false);
    }
  }, [description, compact]);

  const buttonContent = () => {
    switch (submitState) {
      case "creating":
        return (
          <motion.span
            key="creating"
            className="inline-flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            创建中
          </motion.span>
        );
      case "success":
        return (
          <motion.span
            key="success"
            className="inline-flex items-center gap-1.5"
            initial={shouldReduceMotion ? {} : { scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Check className="h-3.5 w-3.5" />
            已创建
          </motion.span>
        );
      default:
        return (
          <motion.span
            key="idle"
            className="inline-flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            开始
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.span>
        );
    }
  };

  const buttonClass = submitState === "success"
    ? "inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition-all duration-200"
    : "inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1C1917] px-4 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#44403C] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:active:scale-100 dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]";

  if (compact && !showExpanded) {
    return (
      <section ref={containerRef} onBlur={handleBlur}>
        <div
          className={`flex cursor-text items-center gap-2.5 border-b py-3 transition-colors ${
            isDragOver
              ? "border-[#3B82F6]"
              : "border-[#E7E5E4] hover:border-[#D6D3D1] dark:border-[#44403C] dark:hover:border-[#57534E]"
          }`}
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => textareaRef.current?.focus(), 50);
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); void handleFileDrop(e.dataTransfer.files); }}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-[#3B82F6]" />
          <span className="flex-1 text-sm text-[#A8A29E] dark:text-[#78716C]">
            描述你想要的演示页面…
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="shrink-0 rounded-md p-1 text-[#D6D3D1] transition-colors hover:text-[#A8A29E] dark:text-[#57534E] dark:hover:text-[#78716C]"
            title="上传文件"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf,.docx"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void handleFileDrop(e.target.files); }}
          />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className={compact ? "" : "text-center"}
      onBlur={handleBlur}
    >
      {!compact && (
        <div className="mb-4 inline-flex items-center gap-2">
          <motion.div
            animate={shouldReduceMotion ? {} : { rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5 text-[#3B82F6]" />
          </motion.div>
          <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">
            描述你想要的演示页面
          </h2>
        </div>
      )}

      <motion.div
        key={shakeKey}
        animate={submitState === "error" && !shouldReduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={`overflow-hidden rounded-xl border bg-white shadow-[0_2px_12px_rgba(28,25,23,0.06)] transition-all duration-200 dark:bg-[#292524] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${
          isDragOver
            ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/20"
            : submitState === "success"
              ? "border-emerald-400/50"
              : isExpanded || !compact
                ? "border-[#E7E5E4] dark:border-[#44403C]"
                : "border-[#E7E5E4] dark:border-[#44403C]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); void handleFileDrop(e.dataTransfer.files); }}
      >
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "描述你想要的演示页面…" : "例如：一个 SaaS 产品的定价页面，需要展示三个套餐方案、功能对比表和常见问题..."}
          rows={compact ? 1 : 2}
          disabled={isCreating || submitState === "success"}
          onFocus={() => setIsExpanded(true)}
          className="w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-2 text-sm leading-relaxed text-[#1C1917] outline-none placeholder:text-[#A8A29E] disabled:opacity-50 dark:text-[#FAFAF9] dark:placeholder:text-[#78716C]"
        />
        <div className="flex items-center gap-1 px-3 pb-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCreating || submitState === "success"}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 dark:text-[#78716C] dark:hover:bg-[#1C1917] dark:hover:text-[#D6D3D1]"
            title="上传文件"
          >
            <Paperclip className="h-3.5 w-3.5" />
            附件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf,.docx"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void handleFileDrop(e.target.files); }}
          />

          <span className="text-[11px] text-[#D6D3D1] dark:text-[#57534E]">
            .md .txt .pdf .docx
          </span>

          <div className="ml-auto flex items-center gap-2">
            {!compact && (
              <span className="text-[11px] text-[#D6D3D1] dark:text-[#57534E]">
                ⌘↵
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isCreating || submitState === "success"}
              className={buttonClass}
            >
              <AnimatePresence mode="wait">
                {buttonContent()}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={shouldReduceMotion ? {} : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-3 text-left text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
