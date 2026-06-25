"use client";

import React, { FormEvent, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Upload, X } from "lucide-react";

type UploadedDocumentSummary = {
  id: string;
  originalFileName: string;
  createdAt?: string;
};

type DocumentUploadProps = {
  projectId: string;
  initialText?: string | null;
  onDocumentSaved?: (documentId: string) => void;
};

type DocumentApiResponse = {
  document?: UploadedDocumentSummary;
  extractedTextPreview?: string;
  error?: string;
};

type RecentDocument = {
  document: UploadedDocumentSummary;
  preview: string;
};

const MAX_RECENT = 10;

export function DocumentUpload({ projectId, initialText, onDocumentSaved }: DocumentUploadProps) {
  const [text, setText] = useState(initialText ?? "");
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addRecentDocument(body: DocumentApiResponse) {
    if (!body.document) return;
    setRecentDocuments((current) => [
      {
        document: body.document as UploadedDocumentSummary,
        preview: body.extractedTextPreview ?? "",
      },
      ...current,
    ].slice(0, MAX_RECENT));
    onDocumentSaved?.(body.document.id);
  }

  async function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      setError("请先输入需求内容");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/text-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text }),
      });
      const body = (await response.json()) as DocumentApiResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "保存失败");
      }

      addRecentDocument(body);
      setText("");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as DocumentApiResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "上传失败");
      }

      addRecentDocument(body);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  }

  const isLoading = isSaving || isUploading;

  return (
    <section aria-label="需求输入">
      <div className="rounded-xl border border-warm-border bg-warm-panel shadow-warm-xs">
        <div className="flex items-center gap-2.5 border-b border-warm-border-soft px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warm-subtle text-warm-text-muted">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-warm-text">需求描述</h2>
        </div>

        <form onSubmit={handleTextSubmit}>
          <label htmlFor="requirement-text" className="sr-only">
            直接输入需求
          </label>
          <textarea
            id="requirement-text"
            aria-label="直接输入需求"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            placeholder="描述你想要的演示页面，例如：一个面向客户的产品介绍页，突出核心能力、使用流程和行动按钮。"
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-sm leading-relaxed text-warm-text outline-none placeholder:text-warm-text-faint disabled:opacity-50"
          />

          <div className="flex items-center gap-2 border-t border-warm-border-soft px-3 py-2">
            <button
              type="button"
              aria-label="上传文档"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              aria-label="上传文档"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-warm-text-muted transition-colors hover:bg-warm-subtle hover:text-warm-text focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              上传文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              aria-label="上传 .md 或 .txt 文件"
              accept=".md,.txt,.pdf,.docx"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) void handleFileUpload(e.target.files[0]); }}
            />

            <span className="text-[11px] text-warm-text-faint">.md .txt .pdf .docx</span>

            <button
              type="submit"
              aria-label="保存文本需求"
              disabled={!text.trim() || isLoading}
              className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-lg bg-warm-text px-3 text-xs font-semibold text-white transition-colors hover:bg-warm-text/80 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3 w-3" />}
              保存需求
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error">
          {error}
        </div>
      )}

      {recentDocuments.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-2 text-xs font-medium text-warm-text-soft">已保存文档</h3>
          <div className="space-y-1.5">
            {recentDocuments.map((item) => (
              <div key={item.document.id} className="flex items-center gap-2 rounded-lg border border-warm-border bg-warm-panel px-3 py-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-warm-text-faint" />
                <span className="truncate text-xs font-medium text-warm-text">{item.document.originalFileName}</span>
                <span className="ml-auto truncate text-[11px] text-warm-text-faint max-w-[140px]">{item.preview}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
