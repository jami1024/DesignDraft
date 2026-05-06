"use client";

import React, { useMemo } from "react";
import { Download, ExternalLink, Monitor } from "lucide-react";

type PreviewPanelProps = {
  html: string | null;
  pageName: string;
  versionNumber: number;
};

export function PreviewPanel({ html, pageName, versionNumber }: PreviewPanelProps) {
  const srcDoc = useMemo(() => html ?? "", [html]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-warm-border-soft bg-warm-panel px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-warm-text-soft" />
          <h2 className="text-sm font-semibold text-warm-text">{pageName}</h2>
          <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-warm-text-faint">
            v{versionNumber}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="在新窗口预览"
            className="rounded-md p-1.5 text-warm-text-soft transition-colors hover:bg-warm-subtle hover:text-warm-text"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="下载 HTML"
            className="rounded-md p-1.5 text-warm-text-soft transition-colors hover:bg-warm-subtle hover:text-warm-text"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F5F4] dark:bg-[#1C1917]">
        {html ? (
          <iframe
            title="页面预览"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-warm-text-faint">正在生成…</p>
          </div>
        )}
      </div>
    </div>
  );
}
