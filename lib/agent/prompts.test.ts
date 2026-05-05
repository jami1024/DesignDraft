import { describe, expect, it } from "vitest";

import {
  buildAnalyzeDocumentPrompt,
  buildChatOptimizationPrompt,
  buildGeneratePagePrompt,
  buildSelectionOptimizationPrompt,
} from "./prompts";

const suggestion = {
  id: "landing-page",
  projectId: "project-1",
  name: "产品介绍落地页",
  purpose: "介绍产品价值",
  audience: "潜在客户",
  modules: ["Hero", "功能", "CTA"],
  recommendedSkillIds: ["web-landing"],
  visualDirection: "Modern Minimal",
  complexity: "medium" as const,
};

describe("agent prompts", () => {
  it("builds document analysis prompt with skill context", async () => {
    const prompt = await buildAnalyzeDocumentPrompt({
      extractedText: "我们需要一个产品介绍页",
      projectId: "project-1",
      userHints: "偏专业可信",
    });

    expect(prompt).toContain("你是 DesignDraft 的产品与页面规划 Agent");
    expect(prompt).toContain("输出 3 到 5 个 PageSuggestion");
    expect(prompt).toContain("# Skill: Web Landing Page");
    expect(prompt).toContain("# Craft: typography");
    expect(prompt).toContain("我们需要一个产品介绍页");
  });

  it("builds page generation prompt with direction and data-designdraft-id requirement", async () => {
    const prompt = await buildGeneratePagePrompt({
      extractedText: "产品有三项核心能力",
      suggestion,
      stylePreset: "modern-minimal",
    });

    expect(prompt).toContain("生成完整单文件 HTML");
    expect(prompt).toContain("data-designdraft-id");
    expect(prompt).toContain("Modern Minimal");
    expect(prompt).toContain("# Skill: Web Landing Page");
    expect(prompt).toContain("产品有三项核心能力");
  });

  it("builds selection optimization prompt", async () => {
    const prompt = await buildSelectionOptimizationPrompt({
      currentHtml: "<section data-designdraft-id=\"hero\">旧文案</section>",
      extractedText: "需求文本",
      suggestion,
      selectedElement: {
        stableId: "hero",
        path: "html.body.section[0]",
        html: "<section>旧文案</section>",
        text: "旧文案",
      },
      userInstruction: "改得更有冲击力",
    });

    expect(prompt).toContain("只优化用户选中的元素相关区域");
    expect(prompt).toContain("stableId: hero");
    expect(prompt).toContain("改得更有冲击力");
    expect(prompt).toContain("必须返回完整 HTML");
  });

  it("builds chat optimization prompt with history", async () => {
    const prompt = await buildChatOptimizationPrompt({
      currentHtml: "<main>页面</main>",
      extractedText: "需求文本",
      suggestion,
      history: [
        { role: "user", content: "更商务" },
        { role: "assistant", content: "已调整" },
      ],
      userInstruction: "增加客户案例",
    });

    expect(prompt).toContain("对话式页面优化");
    expect(prompt).toContain("更商务");
    expect(prompt).toContain("增加客户案例");
    expect(prompt).toContain("必须返回完整 HTML");
  });
});
