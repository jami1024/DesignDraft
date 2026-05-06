"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Clock, FileText, Image, Loader2, Paperclip, Sparkles, X } from "lucide-react";

import type { PageSuggestion } from "@/types";
import { PreviewPanel } from "./preview-panel";

type Attachment = { name: string; url: string; type: "image" | "file"; size?: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  suggestions?: PageSuggestion[];
  generatedVersion?: number;
  attachments?: Attachment[];
  timestamp: number;
};

type WorkbenchLayoutProps = {
  projectId: string;
  projectName: string;
  initialLatestDocumentId: string | null;
  initialTextInput: string | null;
};

export function WorkbenchLayout({ projectId, projectName, initialLatestDocumentId, initialTextInput }: WorkbenchLayoutProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialTextInput) {
      return [{ id: "init-user", role: "user" as const, content: initialTextInput, timestamp: Date.now() - 5000 }];
    }
    return [];
  });
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [versionCount, setVersionCount] = useState(0);
  const [pageName, setPageName] = useState("预览");
  const [extractedText, setExtractedText] = useState(initialTextInput ?? "");
  const [selectedSuggestion, setSelectedSuggestion] = useState<PageSuggestion | null>(null);
  const [needsAnalysis, setNeedsAnalysis] = useState(!!initialTextInput);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const analyzeText = useCallback(async (text: string) => {
    setIsThinking(true);
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
      const body = (await res.json()) as { suggestions?: PageSuggestion[] };
      const suggestions = body.suggestions ?? [];
      if (suggestions.length > 0) {
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
    }
  }, [projectId, initialLatestDocumentId]);

  useEffect(() => {
    if (needsAnalysis && initialTextInput) {
      setNeedsAnalysis(false);
      void analyzeText(initialTextInput);
    }
  }, [needsAnalysis, initialTextInput, analyzeText]);

  const generateFromSuggestion = useCallback(async (suggestion: PageSuggestion) => {
    setSelectedSuggestion(suggestion);
    setPageName(suggestion.name);
    setIsThinking(true);
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
        body: JSON.stringify({ projectId, extractedText, suggestion, stylePreset: "modern-minimal" }),
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
              const data = JSON.parse(line.slice(6)) as { chunk?: string; error?: string };
              if (data.chunk) { html += data.chunk; setGeneratedHtml(html); }
              if (data.error) throw new Error(data.error);
            } catch { /* skip parse errors */ }
          }
        }
      }

      setVersionCount(1);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("sys-gen-"));
        return [...filtered, {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `已生成「${suggestion.name}」。你可以告诉我需要修改什么。`,
          generatedVersion: 1,
          timestamp: Date.now(),
        }];
      });
    } catch {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("sys-gen-"));
        return [...filtered, { id: `a-${Date.now()}`, role: "assistant", content: "页面生成失败，请重试。", timestamp: Date.now() }];
      });
    } finally {
      setIsThinking(false);
    }
  }, [projectId, extractedText]);

  const optimizePage = useCallback(async (instruction: string) => {
    if (!generatedHtml || !selectedSuggestion) return;
    setIsThinking(true);

    try {
      const res = await fetch("/api/pages/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, extractedText, suggestion: selectedSuggestion, currentHtml: generatedHtml, instruction }),
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
              const data = JSON.parse(line.slice(6)) as { chunk?: string; error?: string };
              if (data.chunk) { html += data.chunk; setGeneratedHtml(html); }
              if (data.error) throw new Error(data.error);
            } catch { /* skip */ }
          }
        }
      }

      setVersionCount((v) => v + 1);
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `已修改：「${instruction}」。`,
        generatedVersion: versionCount + 1,
        timestamp: Date.now(),
      }]);
    } catch {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: "修改失败，请重试。", timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  }, [projectId, extractedText, generatedHtml, selectedSuggestion, versionCount]);

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
    if (inputRef.current) inputRef.current.style.height = "auto";

    if (!generatedHtml && !selectedSuggestion) {
      void analyzeText(text);
    } else if (generatedHtml) {
      void optimizePage(text);
    }
  }, [inputText, isThinking, pendingAttachments, generatedHtml, selectedSuggestion, analyzeText, optimizePage]);

  const handleSuggestionClick = useCallback((suggestion: PageSuggestion) => {
    setMessages((prev) => [...prev, { id: `u-pick-${Date.now()}`, role: "user", content: `生成「${suggestion.name}」`, timestamp: Date.now() }]);
    void generateFromSuggestion(suggestion);
  }, [generateFromSuggestion]);

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="grid h-[calc(100vh-57px)] grid-cols-1 lg:grid-cols-[360px_1fr]">
      {/* 对话侧栏 */}
      <aside className="flex flex-col border-r border-[#E7E5E4] bg-white dark:border-[#44403C] dark:bg-[#292524]">
        {/* 消息区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Sparkles className="h-8 w-8 text-[#D6D3D1] dark:text-[#57534E]" />
              <p className="mt-4 text-sm font-medium text-[#1C1917] dark:text-[#FAFAF9]">描述你想要的页面</p>
              <p className="mt-1 text-xs text-[#A8A29E] dark:text-[#78716C]">例如：一个 SaaS 产品定价页面</p>
            </div>
          )}

          <div className="space-y-0.5 px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className="py-2">
                {msg.role === "user" ? (
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
                      <p className="flex items-center gap-1.5 text-xs text-[#A8A29E] dark:text-[#78716C]">
                        <Sparkles className="h-3 w-3" />
                        {msg.thinking}
                      </p>
                    )}

                    {msg.generatedVersion && (
                      <div className="flex items-center gap-2 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-2 dark:border-[#44403C] dark:bg-[#1C1917]">
                        <FileText className="h-3.5 w-3.5 text-[#A8A29E]" />
                        <span className="text-xs font-medium text-[#1C1917] dark:text-[#FAFAF9]">{pageName}</span>
                        <span className="rounded bg-[#E7E5E4] px-1.5 py-0.5 text-[10px] font-medium text-[#78716C] dark:bg-[#44403C] dark:text-[#A8A29E]">v{msg.generatedVersion}</span>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed text-[#1C1917] dark:text-[#FAFAF9]">{msg.content}</p>

                    {msg.suggestions && (
                      <div className="mt-1 space-y-1.5">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSuggestionClick(s)}
                            className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2 text-left transition-colors hover:bg-[#F5F5F4] dark:border-[#44403C] dark:hover:bg-[#1C1917]"
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
            ))}

            {isThinking && (
              <div className="py-2">
                <div className="flex items-center gap-2 text-xs text-[#A8A29E] dark:text-[#78716C]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  思考中…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部输入 */}
        <div className="border-t border-[#E7E5E4] px-4 py-3 dark:border-[#44403C]">
          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map((a, i) => (
                <div key={i} className="group relative">
                  {a.type === "image" ? (
                    <img src={a.url} alt={a.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F5F4] px-2.5 py-1.5 text-xs text-[#57534E] dark:bg-[#1C1917] dark:text-[#A8A29E]">
                      <FileText className="h-3 w-3" />{a.name}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C1917] text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#FAFAF9] dark:text-[#1C1917]"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex shrink-0 items-center gap-0.5 pb-1.5">
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isThinking} className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] disabled:opacity-50 dark:text-[#78716C] dark:hover:bg-[#1C1917]" title="上传图片">
                <Image className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isThinking} className="rounded-md p-1.5 text-[#A8A29E] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] disabled:opacity-50 dark:text-[#78716C] dark:hover:bg-[#1C1917]" title="上传文件">
                <Paperclip className="h-4 w-4" />
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={fileInputRef} type="file" accept=".md,.txt,.pdf,.docx" className="hidden" onChange={handleFileSelect} />
            </div>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="提出后续问题…"
              rows={1}
              disabled={isThinking}
              className="flex-1 resize-none overflow-hidden rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] px-3.5 py-2.5 text-sm leading-relaxed text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 disabled:opacity-50 dark:border-[#44403C] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={(!inputText.trim() && pendingAttachments.length === 0) || isThinking}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 预览区 */}
      <div className="flex flex-col overflow-hidden bg-[#F5F5F4] dark:bg-[#0C0A09]">
        {generatedHtml ? (
          <PreviewPanel html={generatedHtml} pageName={pageName} versionNumber={versionCount} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              {isThinking ? (
                <>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2563EB]" />
                  <p className="mt-4 text-sm text-[#78716C]">正在处理…</p>
                </>
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
    </div>
  );
}
