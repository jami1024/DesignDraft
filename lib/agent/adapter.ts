import type { DesignDirection, PageSuggestion, ProjectDesignMemory } from "@/types";
import type { AgentModelConfig } from "./model-config";
import { DeepSeekRuntime } from "./deepseek-runtime";
import { LightweightModelRuntime } from "./lightweight-runtime";
import { PiAgentRuntime } from "./pi-runtime";

export type AgentImageInput = {
  base64: string;
  mediaType: string;
};

export type AnalyzeDocumentParams = {
  extractedText: string;
  images?: AgentImageInput[];
  skillRules: string;
  userHints?: string;
  projectId?: string;
};

export type GeneratePageParams = {
  extractedText: string;
  images?: AgentImageInput[];
  suggestion: PageSuggestion;
  skillRules: string;
  stylePreset: string;
  outputRequirements: string;
  designMemory?: ProjectDesignMemory;
};

export type OptimizeChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OptimizePageParams = {
  currentHtml: string;
  extractedText: string;
  suggestion: PageSuggestion;
  selectedElement?: {
    html: string;
    path: string;
    text?: string;
    stableId?: string;
    parentStableId?: string;
    screenshot?: string;
    markingFailed?: boolean;
  };
  userInstruction: string;
  skillRules: string;
  history?: OptimizeChatMessage[];
  attachmentImages?: string[];
  designMemory?: ProjectDesignMemory;
};

export type AnalyzeDocumentResult = {
  designDirections: DesignDirection[];
  suggestions: PageSuggestion[];
};

export interface AgentRuntimeAdapter {
  analyzeDocument(params: AnalyzeDocumentParams): Promise<AnalyzeDocumentResult>;
  generatePage(params: GeneratePageParams): AsyncGenerator<string, string>;
  optimizePage(params: OptimizePageParams): AsyncGenerator<string, string>;
}

export function createAgentRuntime(config: AgentModelConfig): AgentRuntimeAdapter {
  if (config.provider === "pi") {
    return new PiAgentRuntime(config);
  }

  if (config.provider === "deepseek" || config.provider === "openai") {
    return new DeepSeekRuntime(config);
  }

  return new LightweightModelRuntime(config);
}
