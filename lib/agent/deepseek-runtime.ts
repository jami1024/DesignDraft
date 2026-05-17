import OpenAI from "openai";

import type { DesignDirection, PageSuggestion } from "@/types";
import type {
  AgentRuntimeAdapter,
  AnalyzeDocumentParams,
  AnalyzeDocumentResult,
  GeneratePageParams,
  OptimizePageParams,
} from "./adapter";
import type { AgentModelConfig } from "./model-config";
import {
  buildAnalyzeDocumentPrompt,
  buildGeneratePagePrompt,
  buildChatOptimizationPrompt,
  buildSelectionOptimizationPrompt,
} from "./prompts";

export class DeepSeekRuntime implements AgentRuntimeAdapter {
  private readonly client: OpenAI;
  private readonly generationModel: string;
  private readonly reasoningModel: string;

  constructor(private readonly config: AgentModelConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || "https://api.deepseek.com",
    });
    this.generationModel = config.model || "deepseek-v4-flash";
    this.reasoningModel = config.reasoningModel || "deepseek-v4-pro";
  }

  async analyzeDocument(params: AnalyzeDocumentParams): Promise<AnalyzeDocumentResult> {
    const prompt = await buildAnalyzeDocumentPrompt({
      extractedText: params.extractedText,
      projectId: params.projectId ?? "project",
      userHints: params.userHints,
    });

    const response = await this.client.chat.completions.create({
      model: this.reasoningModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return this.parseAnalyzeResult(content, params.projectId ?? "project");
  }

  async *generatePage(params: GeneratePageParams): AsyncGenerator<string, string> {
    const prompt = await buildGeneratePagePrompt({
      extractedText: params.extractedText,
      suggestion: params.suggestion,
      stylePreset: params.stylePreset,
      designMemory: params.designMemory,
    });

    const stream = await this.client.chat.completions.create({
      model: this.generationModel,
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
    const prompt = params.selectedElement
      ? await buildSelectionOptimizationPrompt({
          currentHtml: params.currentHtml,
          extractedText: params.extractedText,
          suggestion: params.suggestion,
          selectedElement: params.selectedElement,
          userInstruction: params.userInstruction,
          history: params.history,
          designMemory: params.designMemory,
        })
      : await buildChatOptimizationPrompt({
          currentHtml: params.currentHtml,
          extractedText: params.extractedText,
          suggestion: params.suggestion,
          history: params.history ?? [],
          userInstruction: params.userInstruction,
          designMemory: params.designMemory,
        });

    const supportsVision = !this.generationModel.startsWith("deepseek");

    const images: string[] = [];
    if (supportsVision) {
      if (params.selectedElement?.screenshot) images.push(params.selectedElement.screenshot);
      if (params.attachmentImages) images.push(...params.attachmentImages);
    }

    const hasImages = images.length > 0;
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: "text", text: prompt },
      ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const stream = await this.client.chat.completions.create({
      model: this.generationModel,
      messages: [{ role: "user", content: hasImages ? content : prompt }],
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

    html = html.replace(/^```(?:html|HTML)?\s*\n?/, "");
    html = html.replace(/\n?```\s*$/, "");

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

  private parseAnalyzeResult(content: string, projectId: string): AnalyzeDocumentResult {
    const empty: AnalyzeDocumentResult = { designDirections: [], suggestions: [] };
    const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
    if (!jsonMatch) return empty;

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        designDirections?: DesignDirection[];
        suggestions?: PageSuggestion[];
      };
      return {
        designDirections: parsed.designDirections ?? [],
        suggestions: (parsed.suggestions ?? []).map((s) => ({ ...s, projectId })),
      };
    } catch {
      return empty;
    }
  }

  get runtimeLabel() {
    return `deepseek:${this.generationModel}+${this.reasoningModel}`;
  }
}
