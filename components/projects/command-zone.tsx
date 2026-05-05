"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Paperclip, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import type { Project } from "@/types";
import { STYLE_PRESETS } from "@/lib/styles";
import type { StylePresetId } from "@/lib/styles";

function extractProjectName(description: string): string {
  const cleaned = description.trim().replace(/[，。！？、：；""''（）\[\]{}…—·\s]+$/g, "");
  const name = cleaned.slice(0, 20);
  return name || "未命名项目";
}

type SubmitState = "idle" | "creating" | "success" | "error";

export function CommandZone({ onProjectCreated }: { onProjectCreated?: (project: Project) => void }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [description, setDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePresetId>("modern-minimal");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPreset = STYLE_PRESETS.find((p) => p.id === selectedStyle) ?? STYLE_PRESETS[0];
  const isCreating = submitState === "creating";

  const triggerError = useCallback((message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = description.trim();
    if (!text) return;

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
        router.push(`/projects/${body.project!.id}`);
      }, 700);
    } catch (e) {
      setSubmitState("error");
      triggerError(e instanceof Error ? e.message : "创建失败");
      setTimeout(() => setSubmitState("idle"), 300);
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
        router.push(`/projects/${body.project!.id}`);
      }, 700);
    } catch (e) {
      setSubmitState("error");
      triggerError(e instanceof Error ? e.message : "上传失败");
      setTimeout(() => setSubmitState("idle"), 300);
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

  return (
    <section className="text-center">
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

      <motion.div
        key={shakeKey}
        animate={submitState === "error" && !shouldReduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 dark:bg-[#292524] ${
          isDragOver
            ? "border-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.15)] ring-2 ring-[#3B82F6]/20"
            : submitState === "success"
              ? "border-emerald-400/50 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
              : isFocused
                ? "border-[#3B82F6]/50 shadow-[0_0_0_3px_rgba(59,130,246,0.08)] dark:border-[#60A5FA]/40"
                : "border-[#E7E5E4] shadow-warm-sm dark:border-[#44403C]"
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
          placeholder="例如：一个 SaaS 产品的定价页面，需要展示三个套餐方案、功能对比表和常见问题..."
          rows={3}
          disabled={isCreating || submitState === "success"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full resize-none border-0 bg-transparent px-5 pt-4 pb-2 text-sm text-[#1C1917] outline-none placeholder:text-[#A8A29E] disabled:opacity-50 dark:text-[#FAFAF9] dark:placeholder:text-[#78716C]"
        />
        <div className="flex items-center gap-2 border-t border-[#F5F5F4] px-4 py-2.5 dark:border-[#44403C]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCreating || submitState === "success"}
            className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 dark:text-[#78716C] dark:hover:bg-[#1C1917] dark:hover:text-[#D6D3D1]"
            title="上传文件"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf,.docx"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void handleFileDrop(e.target.files); }}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStylePicker((v) => !v)}
              disabled={isCreating || submitState === "success"}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[#78716C] transition-colors hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 dark:text-[#A8A29E] dark:hover:bg-[#1C1917]"
            >
              <span className="inline-flex gap-0.5">
                {currentPreset.palette.slice(0, 3).map((c, i) => (
                  <span key={i} className="h-2 w-2 rounded-full ring-1 ring-black/5" style={{ backgroundColor: c }} />
                ))}
              </span>
              {currentPreset.name}
            </button>
            <AnimatePresence>
              {showStylePicker && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-lg border border-[#E7E5E4] bg-white p-1.5 shadow-warm-md dark:border-[#44403C] dark:bg-[#292524]"
                >
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => { setSelectedStyle(preset.id); setShowStylePicker(false); }}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                        selectedStyle === preset.id
                          ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1e3a8a]/20 dark:text-[#60A5FA]"
                          : "text-[#44403C] hover:bg-[#F5F5F4] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
                      }`}
                    >
                      <span className="inline-flex gap-0.5">
                        {preset.palette.slice(0, 3).map((c, i) => (
                          <span key={i} className="h-2 w-2 rounded-full ring-1 ring-black/5" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                      <span>
                        <span className="font-medium">{preset.name}</span>
                        <span className="ml-1.5 text-[#A8A29E] dark:text-[#78716C]">{preset.recommendedFor[0]}</span>
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={(!description.trim() || isCreating) && submitState !== "success"}
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

      <p className="mt-3 text-xs text-[#A8A29E] dark:text-[#78716C]">
        Cmd+Enter 发送 · 支持 .md .txt .pdf .docx 和原型图
      </p>
    </section>
  );
}
