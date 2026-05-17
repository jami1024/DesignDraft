"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Image, MousePointer2, Paperclip, Square, X } from "lucide-react";

import type { SelectedElementInfo } from "@/lib/element-selector";
import type { ChatAttachment } from "@/types";

export type ComposerState =
  | "idle"
  | "typing"
  | "analyzing"
  | "structuring"
  | "generating"
  | "done";

type RequirementComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  composerState: ComposerState;
  placeholder?: string;
  selectedElement?: SelectedElementInfo | null;
  onClearElement?: () => void;
  pendingAttachments: ChatAttachment[];
  onRemoveAttachment: (index: number) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteImage: (file: File) => void;
};

const STATUS_TEXT: Record<ComposerState, string> = {
  idle: "准备好了，描述你的页面需求",
  typing: "继续说，我会帮你整理成页面方案",
  analyzing: "正在理解你的需求…",
  structuring: "正在推导页面结构…",
  generating: "正在生成演示页面…",
  done: "已生成，你可以继续补充修改",
};

const isProcessing = (s: ComposerState) =>
  s === "analyzing" || s === "structuring" || s === "generating";

function AiStatusIcon({ state }: { state: ComposerState }) {
  const processing = isProcessing(state);
  const animClass = processing ? `composer-icon-${state}` : "";
  const breathe = state === "typing" ? "composer-icon-breathe" : "";

  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 ${animClass} ${breathe}`}
      aria-hidden="true"
    >
      {/* 中心点 */}
      <circle
        cx="12" cy="12" r="1.5"
        className="fill-[#1C1917] dark:fill-[#FAFAF9]"
        style={{
          transition: "r 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      {/* 上 */}
      <line
        x1="12" y1="4" x2="12" y2="9"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* 下 */}
      <line
        x1="12" y1="15" x2="12" y2="20"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* 左 */}
      <line
        x1="4" y1="12" x2="9" y2="12"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* 右 */}
      <line
        x1="15" y1="12" x2="20" y2="12"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* 对角线1 (左上-中心方向) */}
      <line
        x1="6.5" y1="6.5" x2="9.5" y2="9.5"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.2" strokeLinecap="round"
        opacity={state === "done" ? "0.3" : "0.5"}
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* 对角线2 (右下-中心方向) */}
      <line
        x1="14.5" y1="14.5" x2="17.5" y2="17.5"
        className="stroke-[#1C1917] dark:stroke-[#FAFAF9]"
        strokeWidth="1.2" strokeLinecap="round"
        opacity={state === "done" ? "0.3" : "0.5"}
        style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

export function RequirementComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  composerState,
  placeholder,
  selectedElement,
  onClearElement,
  pendingAttachments,
  onRemoveAttachment,
  onImageSelect,
  onFileSelect,
  onPasteImage,
}: RequirementComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const processing = isProcessing(composerState);
  const canSend = (value.trim().length > 0 || pendingAttachments.length > 0) && !processing;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) onSubmit();
      }
    },
    [canSend, onSubmit],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      if (!processing) {
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
      }
    },
    [onChange, processing],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) onPasteImage(file);
          return;
        }
      }
    },
    [onPasteImage],
  );

  const wrapperStateClass = (() => {
    if (reducedMotion) return "";
    switch (composerState) {
      case "analyzing":
        return "composer-analyzing";
      case "structuring":
        return "composer-structuring";
      case "generating":
        return "composer-generating";
      case "done":
        return "composer-done";
      default:
        return "";
    }
  })();

  const defaultPlaceholder = selectedElement
    ? "描述你想要的修改…"
    : "描述你想生成的页面，例如：为一个 AI 客服产品做首页演示…";

  return (
    <div className="shrink-0 border-t border-[#E7E5E4] px-4 py-3 dark:border-[#44403C]">
      {/* 选中元素提示 */}
      {selectedElement && (
        <div className="msg-pop mb-2 flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1.5 dark:border-[#1E40AF]/40 dark:bg-[#1E3A8A]/20">
          <MousePointer2 className="h-3 w-3 shrink-0 text-[#2563EB]" />
          <span className="flex-1 truncate text-xs text-[#1E40AF] dark:text-[#93C5FD]">
            &lt;{selectedElement.tagName}&gt;{" "}
            {selectedElement.text ? `"${selectedElement.text.slice(0, 40)}"` : ""}
          </span>
          <button
            type="button"
            onClick={onClearElement}
            className="shrink-0 rounded p-0.5 text-[#93C5FD] hover:bg-[#BFDBFE]/30 hover:text-[#2563EB]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 附件预览 */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((a, i) => (
            <div key={i} className="group relative">
              {a.type === "image" ? (
                <img
                  src={a.url}
                  alt={a.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F5F4] px-2.5 py-1.5 text-xs text-[#57534E] dark:bg-[#1C1917] dark:text-[#A8A29E]">
                  <FileText className="h-3 w-3" />
                  {a.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveAttachment(i)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C1917] text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#FAFAF9] dark:text-[#1C1917]"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 主输入容器 */}
      <div
        className={`composer-wrapper relative overflow-hidden rounded-2xl border transition-all duration-500 ${
          processing
            ? "border-[#3B82F6]/30 dark:border-[#60A5FA]/20"
            : composerState === "done"
              ? "border-[#10B981]/40 dark:border-[#34D399]/30"
              : "border-[#E7E5E4] dark:border-[#44403C]"
        } ${wrapperStateClass}`}
      >
        {/* 扫描线 / 高光 伪元素由 CSS 控制 */}

        <div className="relative flex items-start gap-3 bg-white px-4 py-3 dark:bg-[#1C1917]">
          {/* AI 状态图标 */}
          <div className="mt-1 shrink-0">
            <AiStatusIcon state={composerState} />
          </div>

          {/* 中间区域 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder ?? defaultPlaceholder}
              rows={1}
              disabled={processing}
              style={processing ? { height: "40px" } : undefined}
              className="w-full resize-none overflow-hidden border-0 bg-transparent text-sm leading-relaxed text-[#1C1917] outline-none placeholder:text-[#A8A29E] disabled:opacity-60 dark:text-[#FAFAF9]"
            />

            {/* 上传按钮行 — 仅 idle/typing 可见 */}
            <div
              className={`mt-1 flex items-center gap-0.5 transition-all duration-300 ${
                processing || composerState === "done"
                  ? "h-0 overflow-hidden opacity-0"
                  : "opacity-100"
              }`}
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={processing}
                className="rounded-md p-1 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] dark:text-[#78716C] dark:hover:bg-[#292524]"
                title="上传图片"
              >
                <Image className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="rounded-md p-1 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] dark:text-[#78716C] dark:hover:bg-[#292524]"
                title="上传文件"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.pdf,.docx"
                className="hidden"
                onChange={onFileSelect}
              />
            </div>
          </div>

          {/* 右侧按钮 */}
          <div className="mt-1 shrink-0">
            {processing ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C1917] text-white transition-all hover:bg-[#292524] active:scale-90 dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
                title="停止"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSend}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white transition-all hover:bg-[#1D4ED8] active:scale-90 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 状态文案 */}
      <p
        className={`mt-2 text-center text-[11px] transition-all duration-300 ${
          composerState === "done"
            ? "text-[#10B981] dark:text-[#34D399]"
            : processing
              ? "text-[#3B82F6] dark:text-[#60A5FA]"
              : "text-[#A8A29E] dark:text-[#78716C]"
        }`}
      >
        {STATUS_TEXT[composerState]}
      </p>
    </div>
  );
}
