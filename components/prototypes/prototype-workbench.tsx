"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ArrowRight, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";

import type { Project, PrototypeDirection, PrototypeManifest, PrototypeProductSpec, PrototypeVersion } from "@/types";
import { PrototypeDirectionCard } from "./prototype-direction-card";
import { PrototypePreviewPanel } from "./prototype-preview-panel";
import { PrototypeVersionHistory } from "./prototype-version-history";

type PrototypeWorkbenchProps = {
  project: Project;
};

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; prototypeId: string; versionId: string; versionNumber: number; previewPath: string }
  | { type: "error"; error?: string }
  | { type: "end" };

const PLATFORM_LABELS: Record<NonNullable<Project["creationContext"]>["platform"], string> = {
  website: "网站",
  mobile: "移动端",
  miniapp: "小程序",
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ({ error?: string; message?: string } & T) | null;
  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? "请求失败");
  }
  if (!body) throw new Error("响应内容为空");
  return body as T;
}

function parseStreamEvent(raw: string): StreamEvent | null {
  const line = raw.replace(/^data:\s*/, "").trim();
  if (!line) return null;

  const value = JSON.parse(line) as Partial<StreamEvent>;
  if (value.type === "chunk" && typeof value.text === "string") return { type: "chunk", text: value.text };
  if (
    value.type === "done" &&
    typeof value.prototypeId === "string" &&
    typeof value.versionId === "string" &&
    typeof value.versionNumber === "number" &&
    typeof value.previewPath === "string"
  ) {
    return {
      type: "done",
      prototypeId: value.prototypeId,
      versionId: value.versionId,
      versionNumber: value.versionNumber,
      previewPath: value.previewPath,
    };
  }
  if (value.type === "error") return { type: "error", error: typeof value.error === "string" ? value.error : undefined };
  if (value.type === "end") return { type: "end" };
  return null;
}

export function PrototypeWorkbench({ project }: PrototypeWorkbenchProps) {
  const [product, setProduct] = useState<PrototypeProductSpec | null>(null);
  const [directions, setDirections] = useState<PrototypeDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [prototype, setPrototype] = useState<PrototypeManifest | null>(null);
  const [versions, setVersions] = useState<PrototypeVersion[]>([]);
  const [html, setHtml] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState("等待开始分析");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const creationContext = project.creationContext;
  const selectedDirection = useMemo(
    () => directions.find((direction) => direction.id === selectedDirectionId) ?? null,
    [directions, selectedDirectionId],
  );

  const loadPrototypeAndVersions = useCallback(async (prototypeId: string) => {
    const [prototypeBody, versionsBody] = await Promise.all([
      readJson<{ prototype: PrototypeManifest }>(await fetch(`/api/prototypes/${prototypeId}?projectId=${project.id}`)),
      readJson<{ versions: PrototypeVersion[] }>(await fetch(`/api/prototypes/${prototypeId}/versions?projectId=${project.id}`)),
    ]);
    setPrototype(prototypeBody.prototype);
    setVersions(versionsBody.versions);
  }, [project.id]);

  const streamPrototype = useCallback(async (url: string, payload: unknown) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      throw new Error(body?.message ?? body?.error ?? "生成请求失败");
    }
    if (!response.body) throw new Error("没有收到生成流");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let nextHtml = "";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const event = parseStreamEvent(frame);
        if (!event) continue;

        if (event.type === "chunk") {
          nextHtml += event.text;
          setHtml(nextHtml);
        } else if (event.type === "done") {
          setPreviewPath(event.previewPath);
          setStatus("原型已生成，可以继续讨论修改");
          await loadPrototypeAndVersions(event.prototypeId);
        } else if (event.type === "error") {
          throw new Error(event.error ?? "生成失败");
        }
      }
    }
  }, [loadPrototypeAndVersions]);

  const analyzeAndPlan = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setProduct(null);
    setDirections([]);
    setPrototype(null);
    setVersions([]);
    setHtml(null);
    setPreviewPath(null);
    setSelectedDirectionId(null);

    try {
      setStatus("正在分析需求…");
      const analyzeBody = await readJson<{ product: PrototypeProductSpec }>(await fetch("/api/prototypes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      }));
      setProduct(analyzeBody.product);

      setStatus("正在推荐原型方案…");
      const planBody = await readJson<{ directions: PrototypeDirection[] }>(await fetch("/api/prototypes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      }));
      setDirections(planBody.directions);
      setStatus(planBody.directions.length > 0 ? "请选择一套原型方案" : "没有返回可选方案，请重试");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败");
      setStatus("分析失败，请重试");
    } finally {
      setBusy(false);
    }
  }, [busy, project.id]);

  const confirmAndGenerate = useCallback(async (directionId: string) => {
    if (busy) return;
    setBusy(true);
    setSelectedDirectionId(directionId);
    setError(null);
    setHtml(null);
    setPreviewPath(null);

    try {
      setStatus("正在确认方案…");
      await readJson(await fetch("/api/prototypes/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, directionId }),
      }));
      setStatus("正在生成原型方案板…");
      await streamPrototype("/api/prototypes/generate", { projectId: project.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成失败");
      setStatus("生成失败，请重试");
    } finally {
      setBusy(false);
    }
  }, [busy, project.id, streamPrototype]);

  const optimize = useCallback(async () => {
    const nextInstruction = instruction.trim();
    if (!prototype || !nextInstruction || busy) return;

    setBusy(true);
    setError(null);
    try {
      setStatus("正在修改原型…");
      await streamPrototype(`/api/prototypes/${prototype.id}/optimize`, {
        projectId: project.id,
        versionId: prototype.currentVersionId,
        instruction: nextInstruction,
      });
      setInstruction("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "修改失败");
      setStatus("修改失败，请重试");
    } finally {
      setBusy(false);
    }
  }, [busy, instruction, project.id, prototype, streamPrototype]);

  const reset = useCallback(() => {
    setProduct(null);
    setDirections([]);
    setSelectedDirectionId(null);
    setPrototype(null);
    setVersions([]);
    setHtml(null);
    setPreviewPath(null);
    setInstruction("");
    setStatus("等待开始分析");
    setError(null);
  }, []);

  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">原型生成</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#57534E] dark:text-[#A8A29E]">
            {project.textInput ?? "这个项目还没有文字需求。"}
          </p>

          {creationContext ? (
            <div className="mt-4 space-y-2 rounded-xl bg-[#F5F5F4] p-3 text-xs text-[#57534E] dark:bg-[#1C1917] dark:text-[#A8A29E]">
              <div>类型：{PLATFORM_LABELS[creationContext.platform]}</div>
              <div>受众：{[...creationContext.audiences, creationContext.audienceNote].filter(Boolean).join("、")}</div>
              <div>用途：{[...creationContext.useCases, creationContext.useCaseNote].filter(Boolean).join("、")}</div>
              {creationContext.keywords ? <div>关键词：{creationContext.keywords}</div> : null}
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void analyzeAndPlan()}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && !prototype ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              开始分析
            </button>
            {(product || directions.length > 0 || prototype) ? (
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-lg border border-[#E7E5E4] bg-white px-3 py-2 text-sm text-[#57534E] transition hover:bg-[#F5F5F4] disabled:opacity-60 dark:border-[#44403C] dark:bg-[#292524] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]"
                aria-label="重新开始"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-[#78716C] dark:text-[#A8A29E]">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" /> : null}
            {status}
          </p>
          {error ? <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
        </div>

        {product ? (
          <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 text-sm shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
            <div className="font-semibold text-[#1C1917] dark:text-[#FAFAF9]">AI 分析</div>
            <p className="mt-2 leading-relaxed text-[#57534E] dark:text-[#A8A29E]">{product.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.requiredScreens.map((screen) => (
                <span key={screen} className="rounded-full bg-[#F5F5F4] px-2 py-1 text-xs text-[#57534E] dark:bg-[#1C1917] dark:text-[#D6D3D1]">
                  {screen}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <PrototypeVersionHistory versions={versions} currentVersionId={prototype?.currentVersionId ?? null} />
      </aside>

      <section className="space-y-5">
        {directions.length > 0 && !prototype ? (
          <div className="space-y-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">推荐原型方案</h2>
              <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">先选一套方向，系统会生成可讨论和可修改的原型画板。</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              {directions.map((direction) => (
                <PrototypeDirectionCard
                  key={direction.id}
                  direction={direction}
                  selected={direction.id === selectedDirectionId}
                  onSelect={(id) => void confirmAndGenerate(id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {prototype && selectedDirection ? (
          <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
            <div className="text-xs font-medium text-[#78716C] dark:text-[#A8A29E]">当前方案</div>
            <div className="mt-1 font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">{selectedDirection.name}</div>
            <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8A29E]">{selectedDirection.recommendationReason}</p>
          </div>
        ) : null}

        <PrototypePreviewPanel html={html} previewPath={previewPath} />

        {prototype ? (
          <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
            <label htmlFor="prototype-instruction" className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
              继续讨论修改
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="prototype-instruction"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void optimize();
                }}
                disabled={busy}
                placeholder="例如：把风格改得更年轻"
                className="h-10 flex-1 rounded-lg border border-[#E7E5E4] bg-white px-3 text-sm outline-none transition focus:border-[#3B82F6] disabled:opacity-60 dark:border-[#44403C] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
              />
              <button
                type="button"
                onClick={() => void optimize()}
                disabled={busy || !instruction.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#292524] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#FAFAF9] dark:text-[#1C1917]"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                发送
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
