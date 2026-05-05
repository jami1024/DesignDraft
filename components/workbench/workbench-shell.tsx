"use client";

import React, { useState } from "react";

import type { StylePresetId } from "@/lib/styles";
import { DocumentUpload } from "./document-upload";
import { StyleSelector } from "./style-selector";
import { SuggestionList } from "./suggestion-list";

type WorkbenchShellProps = {
  projectId: string;
  initialLatestDocumentId: string | null;
};

export function WorkbenchShell({ projectId, initialLatestDocumentId }: WorkbenchShellProps) {
  const [latestDocumentId, setLatestDocumentId] = useState<string | null>(initialLatestDocumentId);
  const [stylePresetId, setStylePresetId] = useState<StylePresetId>("modern-minimal");

  return (
    <aside aria-label="项目侧边栏" className="space-y-4">
      <DocumentUpload projectId={projectId} onDocumentSaved={setLatestDocumentId} />
      <SuggestionList projectId={projectId} latestDocumentId={latestDocumentId} />
      <StyleSelector value={stylePresetId} onChange={setStylePresetId} />
      <div className="rounded-lg border border-warm-border bg-warm-bg px-3 py-2.5 text-xs text-warm-text-muted">
        当前视觉方向：<span className="font-semibold text-warm-text">{stylePresetId}</span>
      </div>
    </aside>
  );
}
