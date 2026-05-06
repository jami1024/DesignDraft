import OpenAI from "openai";

import type { PageSuggestion } from "@/types";
import type {
  AgentRuntimeAdapter,
  AnalyzeDocumentParams,
  GeneratePageParams,
  OptimizePageParams,
} from "./adapter";
import type { AgentModelConfig } from "./model-config";
import {
  buildAnalyzeDocumentPrompt,
  buildGeneratePagePrompt,
  buildChatOptimizationPrompt,
} from "./prompts";

export class DeepSeekRuntime implements AgentRuntimeAdapter {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: AgentModelConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || "https://api.deepseek.com",
    });
    this.model = config.model || "deepseek-chat";
  }

  async analyzeDocument(params: AnalyzeDocumentParams): Promise<PageSuggestion[]> {
    const prompt = await buildAnalyzeDocumentPrompt({
      extractedText: params.extractedText,
      projectId: params.projectId ?? "project",
      userHints: params.userHints,
    });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return this.parseJsonSuggestions(content, params.projectId ?? "project");
  }

  async *generatePage(params: GeneratePageParams): AsyncGenerator<string, string> {
    const prompt = await buildGeneratePagePrompt({
      extractedText: params.extractedText,
      suggestion: params.suggestion,
      stylePreset: params.stylePreset,
    });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 16384,
      stream: true,
    });

    let accumulated = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        accumulated += delta;
        yield delta;
      }
    }

    return this.cleanHtml(accumulated);
  }

  async *optimizePage(params: OptimizePageParams): AsyncGenerator<string, string> {
    const prompt = await buildChatOptimizationPrompt({
      currentHtml: params.currentHtml,
      extractedText: params.extractedText,
      suggestion: params.suggestion,
      history: [],
      userInstruction: params.userInstruction,
    });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 16384,
      stream: true,
    });

    let accumulated = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        accumulated += delta;
        yield delta;
      }
    }

    return this.cleanHtml(accumulated);
  }

  private cleanHtml(raw: string): string {
    let html = raw.trim();
    const htmlStart = html.indexOf("<!doctype") !== -1
      ? html.indexOf("<!doctype")
      : html.indexOf("<!DOCTYPE") !== -1
        ? html.indexOf("<!DOCTYPE")
        : html.indexOf("<html");
    if (htmlStart > 0) html = html.slice(htmlStart);

    const htmlEnd = html.lastIndexOf("</html>");
    if (htmlEnd !== -1) html = html.slice(0, htmlEnd + 7);

    return html;
  }

  private parseJsonSuggestions(content: string, projectId: string): PageSuggestion[] {
    const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
    if (!jsonMatch) {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const arr = JSON.parse(arrayMatch[0]) as PageSuggestion[];
          return arr.map((s) => ({ ...s, projectId }));
        } catch { /* fall through */ }
      }
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { suggestions?: PageSuggestion[] };
      return (parsed.suggestions ?? []).map((s) => ({ ...s, projectId }));
    } catch {
      return [];
    }
  }

  get runtimeLabel() {
    return `deepseek:${this.model}`;
  }
}
