"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Code, Copy, Download, ExternalLink, Eye, Link2, Loader2, MousePointer2 } from "lucide-react";

import { ELEMENT_SELECTOR_MESSAGE_TYPE, getElementSelectorScript } from "@/lib/element-selector";
import type { SelectedElementInfo } from "@/lib/element-selector";

export type GenerationPhase = "idle" | "analyzing" | "generating" | "optimizing" | "done";

type PreviewPanelProps = {
  html: string | null;
  pageName: string;
  versionNumber: number;
  previewPath?: string | null;
  generationPhase?: GenerationPhase;
  selectionMode?: boolean;
  onSelectionModeToggle?: (enabled: boolean) => void;
  onElementSelected?: (info: SelectedElementInfo) => void;
  onShareClick?: () => void;
  onScreenshot?: () => void;
};

const PHASE_LABELS: Record<GenerationPhase, string> = {
  idle: "",
  analyzing: "分析需求中…",
  generating: "生成页面中…",
  optimizing: "优化页面中…",
  done: "完成",
};

const PHASE_STEPS: { key: GenerationPhase; label: string }[] = [
  { key: "analyzing", label: "分析" },
  { key: "generating", label: "生成" },
  { key: "done", label: "完成" },
];

function phaseIndex(phase: GenerationPhase): number {
  if (phase === "optimizing") return 1;
  const idx = PHASE_STEPS.findIndex((s) => s.key === phase);
  return idx === -1 ? -1 : idx;
}

function formatHtml(raw: string): string {
  let indent = 0;
  const lines: string[] = [];
  const tokens = raw.replace(/></g, ">\n<").split("\n");
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + trimmed);
    if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.startsWith("<!") && !trimmed.endsWith("/>") && !trimmed.includes("</")) {
      indent++;
    }
  }
  return lines.join("\n");
}

function ProgressIndicator({ phase }: { phase: GenerationPhase }) {
  const current = phaseIndex(phase);
  if (phase === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-[#F5F5F4] px-2.5 py-1 dark:bg-[#1C1917]">
      {phase !== "done" && <Loader2 className="h-3 w-3 animate-spin text-[#2563EB]" />}
      <span className="text-xs font-medium text-[#57534E] dark:text-[#A8A29E]">
        {PHASE_LABELS[phase]}
      </span>
      <div className="ml-1 flex items-center gap-1">
        {PHASE_STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`h-1 w-4 rounded-full transition-colors duration-300 ${
              i <= current
                ? "bg-[#2563EB] dark:bg-[#3B82F6]"
                : "bg-[#E7E5E4] dark:bg-[#44403C]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function injectSelectorScript(html: string): string {
  const script = `<script>${getElementSelectorScript()}</script>`;
  const bodyCloseIdx = html.lastIndexOf("</body>");
  if (bodyCloseIdx !== -1) {
    return html.slice(0, bodyCloseIdx) + script + html.slice(bodyCloseIdx);
  }
  return html + script;
}

export function PreviewPanel({
  html,
  pageName,
  versionNumber,
  previewPath,
  generationPhase = "idle",
  selectionMode = false,
  onSelectionModeToggle,
  onElementSelected,
  onShareClick,
  onScreenshot,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    if (!html) return "";
    return selectionMode ? injectSelectorScript(html) : html;
  }, [html, selectionMode]);

  const formattedHtml = useMemo(() => html ? formatHtml(html) : "", [html]);

  useEffect(() => {
    if (!selectionMode || !onElementSelected) return;

    function handleMessage(e: MessageEvent) {
      if (e.data?.type === ELEMENT_SELECTOR_MESSAGE_TYPE) {
        onElementSelected!(e.data.payload as SelectedElementInfo);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectionMode, onElementSelected]);

  const handleCopy = useCallback(async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const handleDownload = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageName || "page"}-v${versionNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, pageName, versionNumber]);

  const handleOpenPreview = useCallback(() => {
    if (previewPath) {
      window.open(previewPath, "_blank");
    } else if (html) {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  }, [previewPath, html]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E7E5E4] bg-white px-4 py-2 dark:border-[#44403C] dark:bg-[#292524]">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-[#F5F5F4] p-0.5 dark:bg-[#1C1917]">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-white text-[#1C1917] shadow-sm dark:bg-[#292524] dark:text-[#FAFAF9]"
                  : "text-[#78716C] hover:text-[#57534E] dark:text-[#A8A29E]"
              }`}
            >
              <Eye className="h-3 w-3" />
              预览
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "code"
                  ? "bg-white text-[#1C1917] shadow-sm dark:bg-[#292524] dark:text-[#FAFAF9]"
                  : "text-[#78716C] hover:text-[#57534E] dark:text-[#A8A29E]"
              }`}
            >
              <Code className="h-3 w-3" />
              代码
            </button>
          </div>

          <div className="h-4 w-px bg-[#E7E5E4] dark:bg-[#44403C]" />

          <h2 className="text-sm font-medium text-[#1C1917] dark:text-[#FAFAF9]">{pageName}</h2>
          <span className="rounded bg-[#F5F5F4] px-1.5 py-0.5 text-[10px] font-medium text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">
            v{versionNumber}
          </span>

          <ProgressIndicator phase={generationPhase} />
        </div>

        <div className="flex items-center gap-1">
          {viewMode === "preview" && html && onSelectionModeToggle && (
            <button
              type="button"
              title={selectionMode ? "退出点选模式" : "点选元素修改"}
              onClick={() => onSelectionModeToggle(!selectionMode)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                selectionMode
                  ? "bg-[#2563EB] text-white"
                  : "text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:bg-[#1C1917]"
              }`}
            >
              <MousePointer2 className="h-3 w-3" />
              {selectionMode ? "点选中" : "点选"}
            </button>
          )}
          {viewMode === "preview" && html && onScreenshot && (
            <button
              type="button"
              title="截图到对话"
              onClick={onScreenshot}
              className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
          {viewMode === "code" && (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#78716C] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:bg-[#1C1917]"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          )}
          <button
            type="button"
            title="在新窗口预览"
            onClick={handleOpenPreview}
            className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="下载 HTML"
            onClick={handleDownload}
            className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {onShareClick && (
            <button
              type="button"
              title="分享链接"
              onClick={onShareClick}
              className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-hidden p-4 ${selectionMode ? "bg-[#EFF6FF] dark:bg-[#172554]/20" : "bg-[#F5F5F4] dark:bg-[#0C0A09]"}`}>
        {viewMode === "preview" ? (
          html ? (
            <div className="relative h-full w-full">
              <iframe
                ref={iframeRef}
                title="页面预览"
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                className={`h-full w-full rounded-lg border bg-white shadow-warm-sm dark:border-[#44403C] ${
                  selectionMode
                    ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/20"
                    : "border-[#E7E5E4]"
                }`}
              />
              {selectionMode && (
                <div className="absolute left-3 top-3 rounded-md bg-[#2563EB] px-2 py-1 text-[10px] font-medium text-white shadow-sm">
                  点击页面元素进行修改
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[#A8A29E]">正在生成…</p>
            </div>
          )
        ) : (
          <div className="h-full overflow-auto rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4 shadow-warm-sm dark:border-[#44403C] dark:bg-[#0C0A09]">
            <pre className="text-xs leading-6">
              <code className="font-mono text-[#1C1917] dark:text-[#D6D3D1]">
                {formattedHtml.split("\n").map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 inline-block w-8 select-none text-right text-[#D6D3D1] dark:text-[#57534E]">{i + 1}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
