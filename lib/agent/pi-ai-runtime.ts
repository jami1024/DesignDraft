// Real multi-provider LLM runtime backed by @earendil-works/pi-ai.
// Replaces the mock PiAgentRuntime for the multi-agent React pipeline.
import { getModel, stream, type Context, type Model, type Api } from "@earendil-works/pi-ai";

import { getAgentModelConfig } from "./model-config";
import { ensureProxyDispatcher } from "./proxy-bootstrap";

export type ModelTier = "generation" | "reasoning";

export type LlmCallParams = {
  system: string;
  user: string;
  tier?: ModelTier; // default "generation"
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

function resolveModel(tier: ModelTier): Model<Api> {
  const cfg = getAgentModelConfig();
  const modelId =
    tier === "reasoning"
      ? cfg.reasoningModel || "deepseek-v4-pro"
      : cfg.model || "deepseek-v4-flash";

  // pi-ai ships DeepSeek model metadata (deepseek-v4-flash / deepseek-v4-pro).
  // Cast through unknown because the id is config-driven, not a literal.
  const base = getModel("deepseek", modelId as never) as Model<Api>;

  // Allow pointing at an OpenAI-compatible gateway (e.g. OmniHub) via config.
  return cfg.baseUrl && cfg.baseUrl !== base.baseUrl
    ? { ...base, baseUrl: cfg.baseUrl }
    : base;
}

/** Stream assistant text token-by-token. Returns the full accumulated text. */
export async function* streamText(params: LlmCallParams): AsyncGenerator<string, string> {
  ensureProxyDispatcher();
  const cfg = getAgentModelConfig();
  const model = resolveModel(params.tier ?? "generation");
  const context: Context = {
    systemPrompt: params.system,
    messages: [{ role: "user", content: params.user, timestamp: Date.now() }],
  };

  const events = stream(model, context, {
    apiKey: cfg.apiKey,
    temperature: params.temperature ?? 0.7,
    maxTokens: params.maxTokens ?? 16384,
    signal: params.signal,
  });

  let full = "";
  for await (const event of events) {
    if (event.type === "text_delta") {
      full += event.delta;
      yield event.delta;
    } else if (event.type === "error") {
      throw new Error(event.error?.errorMessage || `LLM stream ${event.reason}`);
    }
  }
  return full;
}

/** Non-streaming convenience: drain the stream and return the full text. */
export async function completeText(params: LlmCallParams): Promise<string> {
  const gen = streamText(params);
  let result = await gen.next();
  while (!result.done) result = await gen.next();
  return result.value;
}
