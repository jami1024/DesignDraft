"use client";

import React from "react";

type PrototypePreviewPanelProps = {
  html: string | null;
  previewPath: string | null;
};

export function PrototypePreviewPanel({ html, previewPath }: PrototypePreviewPanelProps) {
  if (!html && !previewPath) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[#D6D3D1] bg-white text-sm text-[#78716C] dark:border-[#57534E] dark:bg-[#292524] dark:text-[#A8A29E]">
        原型生成后会显示在这里
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
      <iframe
        title="原型预览"
        src={previewPath ?? undefined}
        srcDoc={previewPath ? undefined : html ?? undefined}
        sandbox="allow-scripts"
        className="h-[720px] w-full bg-white"
      />
    </div>
  );
}
