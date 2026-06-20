"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
} from "@codesandbox/sandpack-react";
import { MousePointerSquareDashed } from "lucide-react";

import { DD_PREVIEW_SOURCE, type ReactSelectedElement } from "@/lib/dd-preview";

type FilesResponse = {
  ready: boolean;
  files: Record<string, string>;
  packageJson?: string | null;
};

function parseDeps(packageJson?: string | null): Record<string, string> {
  if (!packageJson) return {};
  try {
    const pkg = JSON.parse(packageJson) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return {};
  }
}

/**
 * Renders the project's generated React file tree in an in-browser Sandpack
 * (vite-react-ts). Selection mode toggles the in-preview element selector
 * (src/dd-selector.ts) which reports the precise source location (data-dd-id)
 * of a clicked element back via postMessage.
 */
export function ReactPreview({
  projectId,
  refreshKey = 0,
  onElementSelected,
}: {
  projectId: string;
  refreshKey?: number;
  onElementSelected?: (el: ReactSelectedElement | null) => void;
}) {
  const [data, setData] = useState<FilesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/agent/files?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((json: FilesResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  const postToPreview = useCallback((action: "enable" | "disable") => {
    const iframe = containerRef.current?.querySelector("iframe");
    iframe?.contentWindow?.postMessage({ source: DD_PREVIEW_SOURCE, action }, "*");
  }, []);

  // selection messages from the in-preview selector
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as
        | { source?: string; type?: string; payload?: ReactSelectedElement }
        | null;
      if (!msg || msg.source !== DD_PREVIEW_SOURCE) return;
      if (msg.type === "ready" && selectingRef.current) {
        postToPreview("enable"); // re-arm after a recompile/reload
      } else if (msg.type === "select" && msg.payload) {
        onElementSelected?.(msg.payload);
      } else if (msg.type === "clear") {
        onElementSelected?.(null);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postToPreview, onElementSelected]);

  const toggleSelecting = useCallback(() => {
    setSelecting((prev) => {
      const next = !prev;
      selectingRef.current = next;
      postToPreview(next ? "enable" : "disable");
      if (!next) onElementSelected?.(null);
      return next;
    });
  }, [postToPreview, onElementSelected]);

  const sandpackFiles = useMemo<SandpackFiles>(() => {
    if (!data?.files) return {};
    const files: SandpackFiles = {};
    for (const [path, code] of Object.entries(data.files)) files[path] = { code };
    return files;
  }, [data]);

  const dependencies = useMemo(() => parseDeps(data?.packageJson), [data]);

  if (error) return <div className="p-4 text-sm text-red-500">预览加载失败:{error}</div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">加载中…</div>;
  if (!data.ready) return <div className="p-4 text-sm text-muted-foreground">尚未生成内容。</div>;

  return (
    <div ref={containerRef} className="flex h-full min-h-[480px] flex-col">
      <div className="flex items-center justify-end gap-2 border-b border-warm-gray-200 bg-warm-gray-50 px-3 py-1.5 dark:border-warm-gray-700 dark:bg-warm-gray-900">
        <button
          type="button"
          onClick={toggleSelecting}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none ${
            selecting
              ? "bg-primary-600 text-white dark:bg-primary-500"
              : "border border-warm-gray-200 bg-white text-warm-gray-700 hover:bg-warm-gray-100 dark:border-warm-gray-700 dark:bg-warm-gray-800 dark:text-warm-gray-200 dark:hover:bg-warm-gray-700"
          }`}
        >
          <MousePointerSquareDashed className="h-3.5 w-3.5" />
          {selecting ? "选择中…点元素" : "选择元素"}
        </button>
      </div>
      <div className="flex-1">
        <SandpackProvider
          template="vite-react-ts"
          files={sandpackFiles}
          customSetup={{ dependencies }}
          options={{ recompileMode: "delayed", recompileDelay: 500 }}
        >
          <SandpackLayout>
            <SandpackPreview showOpenInCodeSandbox={false} style={{ height: "100%", minHeight: 440 }} />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
