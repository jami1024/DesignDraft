export const SUPPORTED_AGENT_PROVIDERS = ["mock", "pi", "openai", "deepseek", "anthropic"] as const;

export type AgentProvider = (typeof SUPPORTED_AGENT_PROVIDERS)[number];

export type AgentModelConfig = {
  provider: AgentProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
};

const DEFAULT_PROVIDER: AgentProvider = "mock";
const DEFAULT_MODEL = "designdraft-mock-designer";

export function isSupportedProvider(value: string): value is AgentProvider {
  return SUPPORTED_AGENT_PROVIDERS.includes(value as AgentProvider);
}

export function listSupportedProviders() {
  return [...SUPPORTED_AGENT_PROVIDERS];
}

export function getAgentModelConfig(): AgentModelConfig {
  const providerFromEnv = process.env.DESIGNDRAFT_AGENT_PROVIDER;
  const provider = providerFromEnv && isSupportedProvider(providerFromEnv) ? providerFromEnv : DEFAULT_PROVIDER;

  return {
    provider,
    model: process.env.DESIGNDRAFT_AGENT_MODEL || DEFAULT_MODEL,
    baseUrl: process.env.DESIGNDRAFT_AGENT_BASE_URL,
    apiKey: process.env.DESIGNDRAFT_AGENT_API_KEY,
  };
}
