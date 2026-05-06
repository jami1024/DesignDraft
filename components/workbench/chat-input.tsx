"use client";

import React, { useRef, useState } from "react";
import { ArrowUp, MessageSquare } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatInputProps = {
  messages: ChatMessage[];
  onSend: (content: string) => void;
};

export function ChatInput({ messages, onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-warm-border-soft bg-warm-panel/90 backdrop-blur-xl">
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto px-4 pt-3">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[#2563EB] text-white"
                      : "bg-warm-subtle text-warm-text"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-4 py-3">
        <MessageSquare className="mb-2.5 h-4 w-4 shrink-0 text-warm-text-faint" />
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想修改的内容…"
            rows={1}
            className="w-full resize-none rounded-lg border border-warm-border bg-warm-panel px-3 py-2 text-sm text-warm-text outline-none transition-colors placeholder:text-warm-text-faint focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
