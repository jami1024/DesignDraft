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
  describe("buildAnalyzeDocumentPrompt", () => {
    it("includes role, task, and XML section structure", async () => {
      const prompt = await buildAnalyzeDocumentPrompt({
        extractedText: "我们需要一个产品介绍页",
        projectId: "project-1",
        userHints: "偏专业可信",
      });

      expect(prompt).toContain("<role>");
      expect(prompt).toContain("DesignDraft 的产品与页面规划 Agent");
      expect(prompt).toContain("<task>");
      expect(prompt).toContain("3 到 5 个 PageSuggestion");
      expect(prompt).toContain("<design_system>");
      expect(prompt).toContain("<output_rules>");
      expect(prompt).toContain("JSON.parse");
    });

    it("includes user input and hints", async () => {
      const prompt = await buildAnalyzeDocumentPrompt({
        extractedText: "我们需要一个产品介绍页",
        projectId: "project-1",
        userHints: "偏专业可信",
      });

      expect(prompt).toContain("我们需要一个产品介绍页");
      expect(prompt).toContain("偏专业可信");
      expect(prompt).toContain("project-1");
    });

    it("includes decision rules for register and designRules", async () => {
      const prompt = await buildAnalyzeDocumentPrompt({
        extractedText: "需求文本",
        projectId: "project-1",
      });

      expect(prompt).toContain("<decision_rules>");
      expect(prompt).toContain("brand");
      expect(prompt).toContain("product");
      expect(prompt).toContain("designRules");
    });
  });

  describe("buildGeneratePagePrompt", () => {
    it("includes all required sections", async () => {
      const prompt = await buildGeneratePagePrompt({
        extractedText: "产品有三项核心能力",
        suggestion,
        stylePreset: "modern-minimal",
      });

      expect(prompt).toContain("<role>");
      expect(prompt).toContain("<system_constraints>");
      expect(prompt).toContain("<design_system>");
      expect(prompt).toContain("<anti_slop_checklist>");
      expect(prompt).toContain("<pre_flight>");
      expect(prompt).toContain("<page_brief>");
      expect(prompt).toContain("<output_rules>");
    });

    it("includes anti-truncation and anti-slop rules", async () => {
      const prompt = await buildGeneratePagePrompt({
        extractedText: "产品有三项核心能力",
        suggestion,
      });

      expect(prompt).toContain("CRITICAL");
      expect(prompt).toContain("<!doctype html>");
      expect(prompt).toContain("Inter / Roboto");
      expect(prompt).toContain("data-designdraft-id");
    });

    it("includes pre-flight decisions and self-critique", async () => {
      const prompt = await buildGeneratePagePrompt({
        extractedText: "产品有三项核心能力",
        suggestion,
      });

      expect(prompt).toContain("配色策略");
      expect(prompt).toContain("字体方案");
      expect(prompt).toContain("Philosophy");
      expect(prompt).toContain("Hierarchy");
      expect(prompt).toContain("Restraint");
    });

    it("includes environment constraints", async () => {
      const prompt = await buildGeneratePagePrompt({
        extractedText: "产品有三项核心能力",
        suggestion,
      });

      expect(prompt).toContain("iframe sandbox");
      expect(prompt).toContain("Google Fonts");
    });

    it("includes page brief and requirement text", async () => {
      const prompt = await buildGeneratePagePrompt({
        extractedText: "产品有三项核心能力",
        suggestion,
      });

      expect(prompt).toContain("产品有三项核心能力");
      expect(prompt).toContain("Modern Minimal");
    });
  });

  describe("buildSelectionOptimizationPrompt", () => {
    it("includes critical rule and XML structure", async () => {
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

      expect(prompt).toContain("<critical_rule>");
      expect(prompt).toContain("data-dd-target");
      expect(prompt).toContain("一个字符都不能改");
      expect(prompt).toContain("<target_element>");
      expect(prompt).toContain("<output_rules>");
    });

    it("includes target element info", async () => {
      const prompt = await buildSelectionOptimizationPrompt({
        currentHtml: "<section>旧文案</section>",
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

      expect(prompt).toContain("data-designdraft-id=\"hero\"");
      expect(prompt).toContain("改得更有冲击力");
      expect(prompt).toContain("旧文案");
    });

    it("includes anti-truncation block", async () => {
      const prompt = await buildSelectionOptimizationPrompt({
        currentHtml: "<section>旧文案</section>",
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

      expect(prompt).toContain("CRITICAL");
      expect(prompt).toContain("完整 HTML");
    });
  });

  describe("buildChatOptimizationPrompt", () => {
    it("includes semantic intent classification", async () => {
      const prompt = await buildChatOptimizationPrompt({
        currentHtml: "<main>页面</main>",
        extractedText: "需求文本",
        suggestion,
        history: [],
        userInstruction: "增加客户案例",
      });

      expect(prompt).toContain("<intent_classification>");
      expect(prompt).toContain("意图 A");
      expect(prompt).toContain("意图 B");
      expect(prompt).toContain("意图 C");
      expect(prompt).toContain("意图 D");
      expect(prompt).toContain("[TEXT]");
    });

    it("includes conversation history and user instruction", async () => {
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

      expect(prompt).toContain("更商务");
      expect(prompt).toContain("已调整");
      expect(prompt).toContain("增加客户案例");
    });

    it("includes anti-truncation for intent A output", async () => {
      const prompt = await buildChatOptimizationPrompt({
        currentHtml: "<main>页面</main>",
        extractedText: "需求文本",
        suggestion,
        history: [],
        userInstruction: "增加客户案例",
      });

      expect(prompt).toContain("CRITICAL");
      expect(prompt).toContain("完整 HTML");
    });

    it("uses semantic criteria instead of keyword lists", async () => {
      const prompt = await buildChatOptimizationPrompt({
        currentHtml: "<main>页面</main>",
        extractedText: "需求文本",
        suggestion,
        history: [],
        userInstruction: "增加客户案例",
      });

      expect(prompt).toContain("判断标准");
      expect(prompt).not.toContain("关键词：改、调整、修复");
    });
  });
});
