"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { AgentDirectionCards } from "@/components/workbench/agent-direction-card";
import { ReactPreview } from "@/components/workbench/react-preview";
import type { ReactSelectedElement } from "@/lib/dd-preview";
import type { AgentDesignDirection, DesignSpec, ProductSpec } from "@/types/multi-agent";

type Phase =
  | "input"
  | "analyzing"
  | "planning"
  | "choosing"
  | "confirming"
  | "generating"
  | "done"
  | "error";

const PHASE_HINT: Record<Phase, string> = {
  input: "描述你要做的应用，AI 会先理解需求、再给出设计方向。",
  analyzing: "正在分析需求，提炼产品定位与视图…",
  planning: "正在推导 2–3 个差异化设计方向…",
  choosing: "选择一个方向，开始生成多文件 React 应用。",
  confirming: "已确认方向，准备生成…",
  generating: "正在生成应用代码，完成后将自动预览…",
  done: "已生成。可在右侧交互预览，或重新开始一次。",
  error: "出错了，可重试。",
};

type ReactWorkbenchProps = {
  projectId: string;
  initialText?: string | null;
};

export function ReactWorkbench({ projectId, initialText }: ReactWorkbenchProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [requirement, setRequirement] = useState(initialText ?? "");
  const [product, setProduct] = useState<ProductSpec | null>(null);
  const [design, setDesign] = useState<DesignSpec | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genLog, setGenLog] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEl, setSelectedEl] = useState<ReactSelectedElement | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const busy = phase === "analyzing" || phase === "planning" || phase === "confirming" || phase === "generating";

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase("error");
  }, []);

  const runGenerate = useCallback(async () => {
    setPhase("generating");
    setGenLog("");
    try {
      const res = await fetch("/api/agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.error ?? "生成请求失败");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          let evt: { type: string; text?: string; error?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === "chunk" && evt.text) {
            acc += evt.text;
            setGenLog(acc.slice(-4000));
            requestAnimationFrame(() => {
              if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
            });
          } else if (evt.type === "error") {
            throw new Error(evt.error ?? "生成失败");
          }
        }
      }

      setRefreshKey((k) => k + 1);
      setPhase("done");
    } catch (e) {
      fail(e instanceof Error ? e.message : "生成失败");
    }
  }, [projectId, fail]);

  const startPipeline = useCallback(async () => {
    const text = requirement.trim();
    if (!text || busy) return;
    setError(null);
    setProduct(null);
    setDesign(null);
    setSelectedId(null);

    try {
      setPhase("analyzing");
      const aRes = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, extractedText: text }),
      });
      const aJson = await aRes.json();
      if (!aRes.ok) throw new Error(aJson?.error ?? "需求分析失败");
      setProduct(aJson.product as ProductSpec);

      setPhase("planning");
      const pRes = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const pJson = await pRes.json();
      if (!pRes.ok) throw new Error(pJson?.error ?? "设计规划失败");
      setDesign(pJson.design as DesignSpec);
      setPhase("choosing");
    } catch (e) {
      fail(e instanceof Error ? e.message : "处理失败");
    }
  }, [requirement, busy, projectId, fail]);

  const selectDirection = useCallback(
    async (dir: AgentDesignDirection) => {
      if (busy) return;
      setSelectedId(dir.id);
      setPhase("confirming");
      try {
        const res = await fetch("/api/agent/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, directionId: dir.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "确认方向失败");
        await runGenerate();
      } catch (e) {
        fail(e instanceof Error ? e.message : "确认失败");
      }
    },
    [busy, projectId, runGenerate, fail],
  );

  const reset = useCallback(() => {
    setPhase("input");
    setProduct(null);
    setDesign(null);
    setSelectedId(null);
    setGenLog("");
    setError(null);
  }, []);

  return (
    <div className="grid gap-4 py-6 lg:grid-cols-[400px_1fr]">
      {/* 控制面板 */}
      <section className="flex flex-col gap-4">
        <div className="rounded-lg border border-warm-gray-200 bg-white p-4 shadow-warm-sm dark:border-warm-gray-700 dark:bg-warm-gray-800">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warm-gray-900 dark:text-warm-gray-100">
            <Sparkles className="h-4 w-4 text-primary-500" />
            需求描述
          </label>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            disabled={busy}
            rows={5}
            placeholder="例如：给独立开发者做一个极简的待办与时间块管理工具，要有今日视图和周视图。"
            className="w-full resize-none rounded-md border border-warm-gray-200 bg-white px-3 py-2 text-sm text-warm-gray-900 placeholder:text-warm-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 dark:border-warm-gray-700 dark:bg-warm-gray-900 dark:text-warm-gray-100 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={startPipeline}
              disabled={busy || !requirement.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              {phase === "analyzing" || phase === "planning" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              开始分析
            </button>
            {(phase === "done" || phase === "error" || phase === "choosing") && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-warm-gray-200 bg-white px-3 py-2 text-sm text-warm-gray-700 transition-colors duration-150 hover:bg-warm-gray-100 motion-reduce:transition-none dark:border-warm-gray-700 dark:bg-warm-gray-800 dark:text-warm-gray-200 dark:hover:bg-warm-gray-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新开始
              </button>
            )}
          </div>
        </div>

        {/* 阶段提示 */}
        <p className="flex items-center gap-2 px-1 text-xs text-warm-gray-500 dark:text-warm-gray-400">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />}
          {PHASE_HINT[phase]}
        </p>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 产品概要 */}
        {product && (
          <div className="rounded-lg border border-warm-gray-200 bg-white p-4 shadow-warm-sm dark:border-warm-gray-700 dark:bg-warm-gray-800">
            <h3 className="mb-1.5 text-sm font-semibold text-warm-gray-900 dark:text-warm-gray-100">
              产品概要
            </h3>
            <p className="text-xs leading-relaxed text-warm-gray-600 dark:text-warm-gray-300">
              {product.summary}
            </p>
            {product.views.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {product.views.map((v) => (
                  <span
                    key={v.id}
                    className="rounded-sm bg-warm-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-warm-gray-600 dark:bg-warm-gray-700 dark:text-warm-gray-300"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 设计方向选择 */}
        {design && design.directions.length > 0 && (
          <AgentDirectionCards
            directions={design.directions}
            onSelect={selectDirection}
            selectedId={selectedId}
            disabled={phase === "confirming" || phase === "generating"}
          />
        )}

        {/* 生成日志 */}
        {(phase === "generating" || (phase === "done" && genLog)) && (
          <div
            ref={logRef}
            className="max-h-48 overflow-auto rounded-md border border-warm-gray-200 bg-warm-gray-50 p-3 font-mono text-[11px] leading-relaxed text-warm-gray-600 dark:border-warm-gray-700 dark:bg-warm-gray-900 dark:text-warm-gray-400"
          >
            <pre className="whitespace-pre-wrap break-words">{genLog || "等待生成…"}</pre>
          </div>
        )}

        {/* 选中元素的精准来源 */}
        {selectedEl && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3 dark:border-emerald-800/60 dark:bg-emerald-900/15">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              已选中
              <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {`<${selectedEl.tagName}>`}
              </span>
            </div>
            {selectedEl.file ? (
              <p className="mt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                {selectedEl.file}:{selectedEl.line}:{selectedEl.column}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-warm-gray-500 dark:text-warm-gray-400">
                未命中 data-dd-id（构建期标记未生效，降级到 DOM 定位）
              </p>
            )}
            {selectedEl.text && (
              <p className="mt-1 line-clamp-2 text-[11px] text-warm-gray-500 dark:text-warm-gray-400">
                “{selectedEl.text}”
              </p>
            )}
          </div>
        )}
      </section>

      {/* 预览面板 */}
      <section className="min-h-[480px] overflow-hidden rounded-lg border border-warm-gray-200 bg-white dark:border-warm-gray-700 dark:bg-warm-gray-800">
        {phase === "done" || refreshKey > 0 ? (
          <ReactPreview projectId={projectId} refreshKey={refreshKey} onElementSelected={setSelectedEl} />
        ) : (
          <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-2 text-center text-warm-gray-400 dark:text-warm-gray-500">
            <Sparkles className="h-8 w-8 opacity-40" />
            <p className="text-sm">生成完成后将在此交互预览</p>
          </div>
        )}
      </section>
    </div>
  );
}
