"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Check, Code, Copy, Download, ExternalLink, Eye } from "lucide-react";

type PreviewPanelProps = {
  html: string | null;
  pageName: string;
  versionNumber: number;
};

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

export function PreviewPanel({ html, pageName, versionNumber }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html ?? "", [html]);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const formattedHtml = useMemo(() => html ? formatHtml(html) : "", [html]);

  const handleCopy = useCallback(async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E7E5E4] bg-white px-4 py-2 dark:border-[#44403C] dark:bg-[#292524]">
        <div className="flex items-center gap-3">
          {/* 视图切换 */}
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
        </div>

        <div className="flex items-center gap-1">
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
          <button type="button" title="在新窗口预览" className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="下载 HTML" className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#1C1917] dark:text-[#78716C] dark:hover:bg-[#1C1917]">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#F5F5F4] p-4 dark:bg-[#0C0A09]">
        {viewMode === "preview" ? (
          html ? (
            <iframe title="页面预览" srcDoc={srcDoc} sandbox="allow-scripts" className="h-full w-full rounded-lg border border-[#E7E5E4] bg-white shadow-warm-sm dark:border-[#44403C]" />
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
