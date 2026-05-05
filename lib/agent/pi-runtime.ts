import type { AgentRuntimeAdapter, AnalyzeDocumentParams, GeneratePageParams, OptimizePageParams } from "./adapter";
import { LightweightModelRuntime } from "./lightweight-runtime";
import type { AgentModelConfig } from "./model-config";

/**
 * Pi Agent adapter boundary.
 *
 * The real Pi integration can replace the fallback implementation without
 * changing API routes or UI code. Until Pi runtime details are wired, this
 * class keeps the same contract and delegates to the deterministic lightweight
 * runtime so the product flow remains testable end-to-end.
 */
export class PiAgentRuntime implements AgentRuntimeAdapter {
  private readonly fallback: LightweightModelRuntime;

  constructor(private readonly config: AgentModelConfig) {
    this.fallback = new LightweightModelRuntime(config);
  }

  analyzeDocument(params: AnalyzeDocumentParams) {
    return this.fallback.analyzeDocument(params);
  }

  generatePage(params: GeneratePageParams) {
    return this.fallback.generatePage(params);
  }

  optimizePage(params: OptimizePageParams) {
    return this.fallback.optimizePage(params);
  }

  get runtimeLabel() {
    return `pi:${this.config.model}`;
  }
}
