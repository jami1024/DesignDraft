import { describe, expect, it } from "vitest";

import { getAgentModelConfig, listSupportedProviders } from "./model-config";

describe("model config", () => {
  it("returns default provider and model", () => {
    const config = getAgentModelConfig();

    expect(config.provider).toBe("mock");
    expect(config.model).toBe("designdraft-mock-designer");
  });

  it("reads provider and model from environment", () => {
    process.env.DESIGNDRAFT_AGENT_PROVIDER = "openai";
    process.env.DESIGNDRAFT_AGENT_MODEL = "gpt-4.1-mini";

    const config = getAgentModelConfig();

    expect(config.provider).toBe("openai");
    expect(config.model).toBe("gpt-4.1-mini");

    delete process.env.DESIGNDRAFT_AGENT_PROVIDER;
    delete process.env.DESIGNDRAFT_AGENT_MODEL;
  });

  it("lists supported providers", () => {
    expect(listSupportedProviders()).toEqual(["mock", "pi", "openai", "deepseek", "anthropic"]);
  });
});
