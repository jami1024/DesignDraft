"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
} from "@codesandbox/sandpack-react";

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
 * (vite-react-ts). NOTE: Tailwind-in-Sandpack requires the postcss/tailwind
 * deps to resolve in Nodebox — verify visually when running the app.
 */
export function ReactPreview({ projectId, refreshKey = 0 }: { projectId: string; refreshKey?: number }) {
  const [data, setData] = useState<FilesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <SandpackProvider
      template="vite-react-ts"
      files={sandpackFiles}
      customSetup={{ dependencies }}
      options={{ recompileMode: "delayed", recompileDelay: 500 }}
    >
      <SandpackLayout>
        <SandpackPreview showOpenInCodeSandbox={false} style={{ height: "100%", minHeight: 480 }} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
