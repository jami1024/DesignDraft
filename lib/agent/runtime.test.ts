import { describe, expect, it } from "vitest";

import { createAgentRuntime } from "./adapter";
import { LightweightModelRuntime } from "./lightweight-runtime";
import { PiAgentRuntime } from "./pi-runtime";

describe("agent runtime adapter", () => {
  it("creates the lightweight runtime by default", () => {
    const runtime = createAgentRuntime({ provider: "mock", model: "demo" });

    expect(runtime).toBeInstanceOf(LightweightModelRuntime);
  });

  it("creates the Pi runtime for pi provider", () => {
    const runtime = createAgentRuntime({ provider: "pi", model: "deepseek-chat" });

    expect(runtime).toBeInstanceOf(PiAgentRuntime);
  });

  it("analyzes a document into page suggestions", async () => {
    const runtime = new LightweightModelRuntime({ provider: "mock", model: "demo" });

    const result = await runtime.analyzeDocument({
      extractedText: "我们要做一个产品介绍官网，包含核心价值、功能、流程和行动按钮。",
      skillRules: "优先生成清晰、专业的中文页面建议。",
    });

    expect(result.designDirections).toHaveLength(2);
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0]).toMatchObject({
      name: "产品介绍落地页",
      complexity: "medium",
      recommendedSkillIds: ["web-landing"],
    });
  });

  it("streams generated HTML chunks", async () => {
    const runtime = new LightweightModelRuntime({ provider: "mock", model: "demo" });
    const stream = runtime.generatePage({
      extractedText: "生成产品介绍页",
      suggestion: {
        id: "landing-page",
        projectId: "project-1",
        name: "产品介绍落地页",
        purpose: "介绍产品",
        audience: "潜在客户",
        modules: ["Hero", "功能", "CTA"],
        recommendedSkillIds: ["web-landing"],
        visualDirection: "Modern Minimal",
        complexity: "medium",
      },
      skillRules: "生成单文件 HTML",
      stylePreset: "modern-minimal",
      outputRequirements: "必须包含 data-designdraft-id",
    });

    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toContain("<!doctype html>");
    expect(chunks.join("")).toContain("data-designdraft-id=\"hero\"");
  });
});
