"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ChevronRight, Clock, Eye, FileText, Loader2, MessageSquare, MousePointer2, Sparkles, X } from "lucide-react";

import html2canvas from "html2canvas";
import type { SelectedElementInfo } from "@/lib/element-selector";
import type { ChatAttachment, ChatMessage, DesignDirection, PageSuggestion, PageVersion } from "@/types";
import { DesignDirectionCards } from "./design-direction-card";
import { GenerationAnimation } from "./generation-animation";
import { PreviewPanel } from "./preview-panel";
import { RequirementComposer } from "./requirement-composer";
import type { ComposerState } from "./requirement-composer";
import { ShareDialog } from "./share-dialog";
import { VersionHistory } from "./version-history";

async function captureElementScreenshot(
  htmlContent: string,
  currentPreviewPath: string | null,
  currentPageId: string | null,
  box: { x: number; y: number; width: number; height: number },
): Promise<string | null> {
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:1280px;height:800px;overflow:hidden;";
  document.body.appendChild(container);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "width:1280px;height:800px;border:none;";
  if (currentPreviewPath && currentPageId) {
    iframe.src = currentPreviewPath;
  } else {
    iframe.srcdoc = htmlContent;
  }
  container.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.addEventListener("load", () => resolve(), { once: true });
      setTimeout(() => reject(new Error("timeout")), 8000);
    });
    await new Promise((r) => setTimeout(r, 600));

    const doc = iframe.contentDocument;
    if (!doc) return null;

    const fullCanvas = await html2canvas(doc.documentElement, {
      width: 1280,
      height: 800,
      useCORS: true,
      scale: 1,
      logging: false,
      allowTaint: true,
    });

    const pad = 20;
    const cx = Math.max(0, Math.round(box.x - pad));
    const cy = Math.max(0, Math.round(box.y - pad));
    const cw = Math.min(fullCanvas.width - cx, Math.round(box.width + pad * 2));
    const ch = Math.min(fullCanvas.height - cy, Math.round(box.height + pad * 2));

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cw;
    cropCanvas.height = ch;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(fullCanvas, cx, cy, cw, ch, 0, 0, cw, ch);

    return cropCanvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(container);
  }
}

type WorkbenchLayoutProps = {
  projectId: string;
  projectName: string;
  initialLatestDocumentId: string | null;
  initialTextInput: string | null;
  initialPageId: string | null;
  initialPageName: string | null;
  initialHtml: string | null;
  initialVersionCount: number;
  initialPreviewPath: string | null;
  initialSuggestion: PageSuggestion | null;
};

export function WorkbenchLayout({ projectId, projectName, initialLatestDocumentId, initialTextInput, initialPageId, initialPageName, initialHtml, initialVersionCount, initialPreviewPath, initialSuggestion }: WorkbenchLayoutProps) {
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(initialHtml);
  const [versionCount, setVersionCount] = useState(initialVersionCount);
  const [pageName, setPageName] = useState(initialPageName ?? "预览");
  const [extractedText, setExtractedText] = useState(initialTextInput ?? "");
  const [selectedSuggestion, setSelectedSuggestion] = useState<PageSuggestion | null>(initialSuggestion);
  const [pageId, setPageId] = useState<string | null>(initialPageId);
  const [previewPath, setPreviewPath] = useState<string | null>(initialPreviewPath);
  const [generationPhase, setGenerationPhase] = useState<"idle" | "analyzing" | "generating" | "optimizing" | "done">(initialPageId ? "done" : "idle");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [needsAnalysis, setNeedsAnalysis] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSuggestionsRef = useRef<PageSuggestion[]>([]);

  const composerState: ComposerState = useMemo(() => {
    if (isThinking) {
      if (generationPhase === "analyzing") return "analyzing";
      if (generationPhase === "generating") return "structuring";
      if (generationPhase === "optimizing") return "generating";
      return "analyzing";
    }
    if (generationPhase === "done") return "done";
    if (inputText.length > 0) return "typing";
    return "idle";
  }, [isThinking, generationPhase, inputText]);

  const [displayComposerState, setDisplayComposerState] = useState<ComposerState>("idle");
  useEffect(() => {
    setDisplayComposerState(composerState);
    if (composerState === "done") {
      const t = setTimeout(() => setDisplayComposerState("idle"), 1500);
      return () => clearTimeout(t);
    }
  }, [composerState]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(gap > 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const persistMessages = useCallback((msgs: ChatMessage[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
    }, 1000);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`);
        const data = (await res.json()) as { messages?: ChatMessage[] };
        if (cancelled) return;
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else if (initialTextInput) {
          const initMsg: ChatMessage = { id: "init-user", role: "user", content: initialTextInput, timestamp: Date.now() };
          setMessages([initMsg]);
          if (!initialLatestDocumentId && !initialPageId) {
            setNeedsAnalysis(true);
          }
        }
      } catch {
        if (initialTextInput) {
          setMessages([{ id: "init-user", role: "user", content: initialTextInput, timestamp: Date.now() }]);
          if (!initialLatestDocumentId && !initialPageId) {
            setNeedsAnalysis(true);
          }
        }
      } finally {
        if (!cancelled) setMessagesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, initialTextInput, initialLatestDocumentId, initialPageId]);

  const skipNextPersistRef = useRef(true);
  useEffect(() => {
    if (!messagesLoaded) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    if (messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, messagesLoaded, persistMessages]);

  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const analyzeText = useCallback(async (text: string) => {
    setIsThinking(true);
    setGenerationPhase("analyzing");
    try {
      let docId = initialLatestDocumentId;
      if (text.trim()) {
        const saveRes = await fetch("/api/documents/text-input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, text }),
        });
        const saveBody = (await saveRes.json()) as { document?: { id: string } };
        if (saveBody.document) docId = saveBody.document.id;
      }
      if (!docId) { setIsThinking(false); return; }
      setExtractedText(text);
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, documentId: docId }),
      });
      const body = (await res.json()) as { designDirections?: DesignDirection[]; suggestions?: PageSuggestion[] };
      const directions = body.designDirections ?? [];
      const suggestions = body.suggestions ?? [];
      if (directions.length > 0) {
        pendingSuggestionsRef.current = suggestions;
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "我分析了你的需求，先为项目选择一个设计方向吧：",
          thinking: "分析需求中…",
          designDirections: directions,
          timestamp: Date.now(),
        }]);
      } else if (suggestions.length > 0) {
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "我分析了你的需求，推荐以下页面方案。点击选择一个，我来帮你生成。",
          thinking: "分析需求中…",
          suggestions,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "分析完成，但没有生成方案。请尝试提供更详细的需求描述。",
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "分析过程中出错了，请稍后重试。",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsThinking(false);
      setGenerationPhase("idle");
    }
  }, [projectId, initialLatestDocumentId]);

  useEffect(() => {
    if (needsAnalysis && initialTextInput) {
      setNeedsAnalysis(false);
      void analyzeText(initialTextInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAnalysis, initialTextInput]);

  const generateFromSuggestion = useCallback(async (suggestion: PageSuggestion) => {
    setSelectedSuggestion(suggestion);
    setPageName(suggestion.name);
    setIsThinking(true);
    setGenerationPhase("generating");
    setMessages((prev) => [...prev, {
      id: `sys-gen-${Date.now()}`,
      role: "assistant",
      content: "",
      thinking: `正在生成「${suggestion.name}」…`,
      timestamp: Date.now(),
    }]);

    try {
      const res = await fetch("/api/pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, extractedText, suggestion }),
      });

      let html = "";
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const data = JSON.parse(line.slice(6)) as { chunk?: string; error?: string; done?: boolean; pageId?: string; versionId?: string; versionNumber?: number; previewPath?: string };
              if (data.chunk) {
                html += data.chunk;
                const cleaned = stripMarkdownFences(html);
                if (cleaned) setGeneratedHtml(cleaned);
              }
              if (data.done && data.pageId) {
                setPageId(data.pageId);
                setPreviewPath(data.previewPath ?? null);
                setVersionCount(data.versionNumber ?? 1);
              }
              if (data.error) throw new Error(data.error);
            } catch (e) {
              if (e instanceof Error && e.message !== "生成失败") throw e;
            }
          }
        }
      }

      setGenerationPhase("done");
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("sys-gen-"));
        return [...filtered, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `已生成「${suggestion.name}」。你可以告诉我需要修改什么。`,
          generatedVersion: versionCount || 1,
          timestamp: Date.now(),
        }];
      });
    } catch {
      setGenerationPhase("idle");
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("sys-gen-"));
        return [...filtered, { id: `a-${Date.now()}`, role: "assistant", content: "页面生成失败，请重试。", timestamp: Date.now() }];
      });
    } finally {
      setIsThinking(false);
    }
  }, [projectId, extractedText, versionCount]);

  const optimizePage = useCallback(async (instruction: string, imageUrls: string[] = []) => {
    if (!generatedHtml || !selectedSuggestion) return;
    setIsThinking(true);
    setGenerationPhase("optimizing");

    try {
      const attachmentImages: string[] = [];
      for (const url of imageUrls) {
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          attachmentImages.push(dataUrl);
        } catch { /* ignore */ }
      }

      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const payload: Record<string, unknown> = {
        projectId, pageId, extractedText,
        versionId: `v${versionCount}`,
        suggestion: selectedSuggestion,
        currentHtml: generatedHtml,
        instruction,
        history,
        ...(attachmentImages.length > 0 ? { attachmentImages } : {}),
      };
      if (selectedElement) {
        const selPayload: Record<string, unknown> = {
          html: selectedElement.html,
          path: selectedElement.path,
          text: selectedElement.text,
          stableId: selectedElement.stableId,
          parentStableId: selectedElement.parentStableId,
        };

        let marked = false;
        const parser = new DOMParser();
        const doc = parser.parseFromString(generatedHtml, "text/html");

        // 策略 1: 用 data-designdraft-id 精确定位
        if (!marked && selectedElement.stableId) {
          try {
            const target = doc.querySelector(`[data-designdraft-id="${CSS.escape(selectedElement.stableId)}"]`);
            if (target) {
              target.setAttribute("data-dd-target", "true");
              payload.currentHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
              marked = true;
            }
          } catch { /* ignore */ }
        }

        // 策略 2: 用 CSS path 定位
        if (!marked) {
          try {
            const target = doc.querySelector(selectedElement.path);
            if (target) {
              target.setAttribute("data-dd-target", "true");
              payload.currentHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
              marked = true;
            }
          } catch { /* ignore */ }
        }

        // 策略 3: 用完整 opening tag 做字符串匹配
        if (!marked && selectedElement.html) {
          const tagEnd = selectedElement.html.indexOf(">");
          if (tagEnd > 0) {
            const openingTag = selectedElement.html.slice(0, tagEnd);
            const markedTag = openingTag + ' data-dd-target="true"';
            const replaced = generatedHtml.replace(openingTag, markedTag);
            if (replaced !== generatedHtml) {
              payload.currentHtml = replaced;
              marked = true;
            }
          }
        }

        if (!marked) {
          selPayload.markingFailed = true;
        }

        try {
          const shot = await captureElementScreenshot(generatedHtml, previewPath, pageId, selectedElement.boundingBox);
          if (shot) selPayload.screenshot = shot;
        } catch { /* 截图失败不阻塞优化 */ }

        payload.selectedElement = selPayload;
      }
      const res = await fetch("/api/pages/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let rawOutput = "";
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const data = JSON.parse(line.slice(6)) as { chunk?: string; error?: string; done?: boolean; pageId?: string; versionId?: string; versionNumber?: number; previewPath?: string };
              if (data.chunk) {
                rawOutput += data.chunk;
                if (!rawOutput.trimStart().startsWith("[TEXT]")) {
                  const cleaned = stripMarkdownFences(rawOutput);
                  if (cleaned) setGeneratedHtml(cleaned);
                }
              }
              if (data.done && data.previewPath) {
                setPreviewPath(data.previewPath);
                setVersionCount(data.versionNumber ?? versionCount + 1);
              }
              if (data.error) throw new Error(data.error);
            } catch (e) {
              if (e instanceof Error && e.message !== "优化失败") throw e;
            }
          }
        }
      }

      setGenerationPhase("done");
      const isTextResponse = rawOutput.trimStart().startsWith("[TEXT]");
      if (isTextResponse) {
        const textContent = rawOutput.trimStart().replace(/^\[TEXT\]\s*/, "");
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: textContent,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `已修改：「${instruction}」。`,
          generatedVersion: versionCount + 1,
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setGenerationPhase("done");
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: "修改失败，请重试。", timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  }, [projectId, pageId, extractedText, generatedHtml, selectedSuggestion, versionCount, messages]);

  const handleScreenshot = useCallback(async () => {
    if (!generatedHtml) return;
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:1280px;height:800px;overflow:hidden;";
    document.body.appendChild(container);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "width:1280px;height:800px;border:none;";

    const usePreviewUrl = previewPath && pageId;
    if (usePreviewUrl) {
      iframe.src = previewPath;
    } else {
      iframe.srcdoc = generatedHtml;
    }
    container.appendChild(iframe);

    try {
      await new Promise<void>((resolve, reject) => {
        iframe.addEventListener("load", () => resolve(), { once: true });
        setTimeout(() => reject(new Error("timeout")), 8000);
      });
      await new Promise((r) => setTimeout(r, 800));

      const doc = iframe.contentDocument;
      if (!doc) throw new Error("无法访问页面内容");

      const canvas = await html2canvas(doc.documentElement, {
        width: 1280,
        height: 800,
        useCORS: true,
        scale: 1,
        logging: false,
        allowTaint: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPendingAttachments((prev) => [...prev, { name: "截图.png", url, type: "image" }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: "截图失败，请使用系统截图工具代替。",
        timestamp: Date.now(),
      }]);
    } finally {
      document.body.removeChild(container);
    }
  }, [generatedHtml, previewPath, pageId]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingAttachments((prev) => [...prev, { name: file.name, url, type: "image" }]);
    e.target.value = "";
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    setPendingAttachments((prev) => [...prev, { name: file.name, url: "", type: "file", size }]);
    e.target.value = "";
  }, []);

  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text && pendingAttachments.length === 0) return;
    if (isThinking) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined, timestamp: Date.now() };
    setPendingAttachments([]);
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    const imageUrls = userMsg.attachments?.filter((a) => a.type === "image").map((a) => a.url) ?? [];
    if (!generatedHtml && !selectedSuggestion) {
      void analyzeText(text);
    } else if (generatedHtml) {
      void optimizePage(text, imageUrls);
      setSelectedElement(null);
    }
  }, [inputText, isThinking, pendingAttachments, generatedHtml, selectedSuggestion, analyzeText, optimizePage]);

  const handleElementSelected = useCallback((info: SelectedElementInfo) => {
    setSelectedElement(info);
    setSelectionMode(false);
    setMessages((prev) => [...prev, {
      id: `sys-sel-${Date.now()}`,
      role: "system",
      content: `已选中元素：<${info.tagName}> ${info.text ? `"${info.text.slice(0, 60)}"` : ""}`,
      timestamp: Date.now(),
    }]);
  }, []);

  const handleRollback = useCallback((version: PageVersion, html: string) => {
    setGeneratedHtml(html);
    setVersionCount(version.versionNumber);
    setPreviewPath(version.previewPath);
    setMessages((prev) => [...prev, {
      id: `a-rb-${Date.now()}`,
      role: "assistant",
      content: `已回退到 v${version.versionNumber}。`,
      generatedVersion: version.versionNumber,
      timestamp: Date.now(),
    }]);
  }, []);

  const handleDirectionSelect = useCallback(async (direction: DesignDirection) => {
    setSelectedDirectionId(direction.id);
    setMessages((prev) => [...prev, {
      id: `u-dir-${Date.now()}`,
      role: "user",
      content: `选择了「${direction.name}」`,
      timestamp: Date.now(),
    }]);

    try {
      await fetch(`/api/projects/${projectId}/design-direction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
    } catch { /* non-critical */ }

    const suggestions = pendingSuggestionsRef.current;
    if (suggestions.length > 0) {
      setMessages((prev) => [...prev, {
        id: `a-sug-${Date.now()}`,
        role: "assistant",
        content: "设计方向已确定，选择一个页面方案开始生成：",
        suggestions,
        timestamp: Date.now(),
      }]);
      pendingSuggestionsRef.current = [];
    }
  }, [projectId]);

  const handleSuggestionClick = useCallback((suggestion: PageSuggestion) => {
    setMessages((prev) => [...prev, { id: `u-pick-${Date.now()}`, role: "user", content: `生成「${suggestion.name}」`, timestamp: Date.now() }]);
    void generateFromSuggestion(suggestion);
  }, [generateFromSuggestion]);

  function stripMarkdownFences(raw: string): string {
    let html = raw.replace(/```(?:html|HTML)?\s*\n?/g, "").replace(/\n?```/g, "");
    const doctype = html.search(/<!doctype\b/i);
    const htmlTag = html.indexOf("<html");
    const start = doctype !== -1 ? doctype : htmlTag;
    if (start > 0) return html.slice(start);
    if (start === 0) return html;
    return "";
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function dayKey(ts: number) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* 移动端 tab 栏 */}
      <div className="flex shrink-0 border-b border-[#E7E5E4] bg-white lg:hidden dark:border-[#44403C] dark:bg-[#292524]">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            mobileTab === "chat"
              ? "border-b-2 border-[#2563EB] text-[#2563EB] dark:border-[#60A5FA] dark:text-[#60A5FA]"
              : "text-[#78716C] dark:text-[#A8A29E]"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          对话
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            mobileTab === "preview"
              ? "border-b-2 border-[#2563EB] text-[#2563EB] dark:border-[#60A5FA] dark:text-[#60A5FA]"
              : "text-[#78716C] dark:text-[#A8A29E]"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          预览
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
      {/* 对话侧栏 */}
      <aside className={`${mobileTab === "chat" ? "flex" : "hidden"} h-full flex-col overflow-hidden border-r border-[#E7E5E4] bg-white lg:flex dark:border-[#44403C] dark:bg-[#292524]`}>
        {/* 消息区 */}
        <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Sparkles className="h-8 w-8 text-[#D6D3D1] dark:text-[#57534E]" />
              <p className="mt-4 text-sm font-medium text-[#1C1917] dark:text-[#FAFAF9]">描述你想要的页面</p>
              <p className="mt-1 text-xs text-[#A8A29E] dark:text-[#78716C]">例如：一个 SaaS 产品定价页面</p>
            </div>
          )}

          <div className="relative space-y-1 px-4 py-4">
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDateSep = idx === 0 || (prevMsg && dayKey(prevMsg.timestamp) !== dayKey(msg.timestamp));
              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-5">
                      <div className="h-px flex-1 bg-[#E7E5E4] dark:bg-[#44403C]" />
                      <span className="text-[10px] font-medium text-[#A8A29E] dark:text-[#78716C]">{formatDate(msg.timestamp)}</span>
                      <div className="h-px flex-1 bg-[#E7E5E4] dark:bg-[#44403C]" />
                    </div>
                  )}
                  <div className={`py-2 ${msg.role === "user" ? "msg-slide-right" : msg.role === "system" ? "msg-pop" : "msg-fade-up"}`}>
                    {msg.role === "system" ? (
                      <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 dark:border-[#1E40AF]/40 dark:bg-[#1E3A8A]/20">
                        <MousePointer2 className="h-3.5 w-3.5 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
                        <span className="text-xs text-[#1E40AF] dark:text-[#93C5FD]">{msg.content}</span>
                      </div>
                    ) : msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] space-y-2">
                          {msg.attachments?.filter((a) => a.type === "image").map((a, i) => (
                            <div key={i} className="flex justify-end">
                              <img src={a.url} alt={a.name} className="max-h-32 rounded-lg" />
                            </div>
                          ))}
                          {msg.attachments?.filter((a) => a.type === "file").map((a, i) => (
                            <div key={i} className="flex justify-end">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#292524] px-3 py-1.5 text-xs text-[#D6D3D1] dark:bg-[#44403C]">
                                <FileText className="h-3 w-3" />{a.name}<span className="text-[#78716C]">{a.size}</span>
                              </span>
                            </div>
                          ))}
                          {msg.content && (
                            <div className="rounded-2xl rounded-br-md bg-[#1C1917] px-3.5 py-2 text-sm leading-relaxed text-white dark:bg-[#FAFAF9] dark:text-[#1C1917]">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {msg.thinking && (
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-[#A8A29E] dark:text-[#78716C]">
                              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                              <Sparkles className="h-3 w-3" />
                              <span className="truncate">{msg.thinking.length > 60 ? `${msg.thinking.slice(0, 60)}…` : msg.thinking}</span>
                            </summary>
                            <p className="mt-1 rounded-md bg-[#FAFAF9] px-3 py-2 text-xs leading-relaxed text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">{msg.thinking}</p>
                          </details>
                        )}

                        {msg.generatedVersion && (
                          <div className="version-card-enter flex items-stretch gap-0 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] dark:border-[#44403C] dark:bg-[#1C1917]">
                            <div className="version-accent-grow w-1 shrink-0 rounded-l-lg bg-[#3B82F6]" />
                            <div className="flex items-center gap-2 px-3 py-2">
                              <FileText className="h-3.5 w-3.5 text-[#3B82F6]" />
                              <span className="text-xs font-medium text-[#1C1917] dark:text-[#FAFAF9]">{pageName}</span>
                              <span className="rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB] dark:bg-[#1E3A8A] dark:text-[#93C5FD]">v{msg.generatedVersion}</span>
                            </div>
                          </div>
                        )}

                        <p className="text-sm leading-relaxed text-[#1C1917] dark:text-[#FAFAF9]">{msg.content}</p>

                        {msg.designDirections && msg.designDirections.length > 0 && (
                          <div className="mt-1">
                            <DesignDirectionCards
                              directions={msg.designDirections}
                              onSelect={handleDirectionSelect}
                              selectedId={selectedDirectionId ?? undefined}
                            />
                          </div>
                        )}

                        {msg.suggestions && (
                          <div className="mt-1 space-y-1.5">
                            {msg.suggestions.map((s, sIdx) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSuggestionClick(s)}
                                style={{ animationDelay: `${sIdx * 0.08}s` }}
                                className="msg-fade-up w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-left transition-colors hover:bg-[#F5F5F4] dark:border-[#44403C] dark:hover:bg-[#1C1917]"
                              >
                                <span className="text-sm font-medium text-[#1C1917] dark:text-[#FAFAF9]">{s.name}</span>
                                <p className="mt-0.5 text-xs text-[#78716C] dark:text-[#A8A29E]">{s.purpose}</p>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-[#D6D3D1] dark:text-[#57534E]">
                          <Clock className="h-3 w-3" />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {isThinking && (
              <div className="msg-fade-up py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" style={{ animationDelay: "0.15s" }} />
                    <span className="thinking-dot" style={{ animationDelay: "0.3s" }} />
                  </div>
                  <span className="text-xs text-[#A8A29E] dark:text-[#78716C]">思考中</span>
                </div>
              </div>
            )}
          </div>

        </div>
          {showScrollBtn && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="slide-up-fade absolute bottom-2 left-1/2 z-10 flex items-center gap-1 rounded-full bg-[#1C1917]/80 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm hover:bg-[#1C1917] dark:bg-[#FAFAF9]/80 dark:text-[#1C1917] dark:hover:bg-[#FAFAF9]"
            >
              <ArrowDown className="h-3 w-3" />
              最新
            </button>
          )}
        </div>

        {/* 版本历史 */}
        {pageId && (
          <div className="max-h-48 shrink-0 overflow-y-auto border-t border-[#E7E5E4] bg-[#FAFAF9] px-4 py-2 dark:border-[#44403C] dark:bg-[#1C1917]">
            <VersionHistory
              projectId={projectId}
              pageId={pageId}
              currentVersionId={`v${versionCount}`}
              onRollback={handleRollback}
            />
          </div>
        )}

      </aside>

      {/* 预览区 + 输入框 */}
      <div className={`${mobileTab === "preview" ? "flex" : "hidden"} flex-col overflow-hidden bg-[#F5F5F4] lg:flex dark:bg-[#0C0A09]`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {generatedHtml ? (
            <PreviewPanel
              html={generatedHtml}
              pageName={pageName}
              versionNumber={versionCount}
              previewPath={previewPath}
              generationPhase={generationPhase}
              selectionMode={selectionMode}
              onSelectionModeToggle={setSelectionMode}
              onElementSelected={handleElementSelected}
              onShareClick={pageId ? () => setShareDialogOpen(true) : undefined}
              onScreenshot={generatedHtml ? handleScreenshot : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                {isThinking ? (
                  <GenerationAnimation phase={generationPhase} />
                ) : (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7E5E4]/30 dark:bg-[#292524]">
                      <FileText className="h-7 w-7 text-[#D6D3D1] dark:text-[#57534E]" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#78716C]">页面预览</p>
                    <p className="mt-1 text-xs text-[#A8A29E]">在左侧描述你的需求开始</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部输入框 */}
        <RequirementComposer
          value={inputText}
          onChange={setInputText}
          onSubmit={handleSend}
          composerState={displayComposerState}
          selectedElement={selectedElement}
          onClearElement={() => setSelectedElement(null)}
          pendingAttachments={pendingAttachments}
          onRemoveAttachment={removePendingAttachment}
          onImageSelect={handleImageSelect}
          onFileSelect={handleFileSelect}
          onPasteImage={(file) => {
            const url = URL.createObjectURL(file);
            setPendingAttachments((prev) => [...prev, { name: file.name || "粘贴图片.png", url, type: "image" }]);
          }}
        />
      </div>

      {pageId && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          projectId={projectId}
          pageId={pageId}
          currentVersionId={`v${versionCount}`}
        />
      )}
      </div>
    </div>
  );
}
