import type { PageSuggestion } from "@/types";
import type { AgentModelConfig } from "./model-config";
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
  };
  userInstruction: string;
  skillRules: string;
};

export interface AgentRuntimeAdapter {
  analyzeDocument(params: AnalyzeDocumentParams): Promise<PageSuggestion[]>;
  generatePage(params: GeneratePageParams): AsyncGenerator<string, string>;
  optimizePage(params: OptimizePageParams): AsyncGenerator<string, string>;
}

export function createAgentRuntime(config: AgentModelConfig): AgentRuntimeAdapter {
  if (config.provider === "pi") {
    return new PiAgentRuntime(config);
  }

  return new LightweightModelRuntime(config);
}
