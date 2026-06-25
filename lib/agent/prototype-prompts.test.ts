import { describe, expect, it } from "vitest";

import {
  buildAnalyzePrototypePrompt,
  buildGeneratePrototypePrompt,
  buildOptimizePrototypePrompt,
  buildPlanPrototypePrompt,
} from "@/lib/agent/prototype-prompts";
import type { Project, PrototypeDirection, PrototypeProductSpec } from "@/types";

const project: Project = {
  id: "p1",
  name: "校园活动助手",
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
  sourceDocumentIds: [],
  pageIds: [],
  currentSkillId: "ui-ux-pro-max",
  textInput: "做一个校园活动小程序",
  creationContext: {
    platform: "miniapp",
    audiences: ["学生"],
    useCases: ["产品演示"],
    keywords: "暖色、校园感",
  },
};

const product: PrototypeProductSpec = {
  summary: "校园活动小程序",
  platform: "miniapp",
  audienceSummary: "学生",
  useCaseSummary: "产品演示",
  contentScope: "活动发现、详情、发布、我的",
  primaryGoal: "讲清楚活动流转",
  successCriteria: ["看懂流程"],
  keyFlows: [{ name: "报名", entry: "首页", goal: "报名成功", screens: ["首页", "详情页"] }],
  requiredScreens: ["首页", "详情页"],
  optionalScreens: ["授权页"],
  fidelityTarget: "hi-fi",
  deviceFrame: "miniapp-phone",
  variationAxes: ["轻量展示 vs 完整闭环"],
  visualConstraints: { styleKeywords: ["校园感"], brandTone: "亲和", referenceApps: [] },
  assumptions: [],
  openQuestions: [],
  constraints: ["不默认拆管理端"],
};

const direction: PrototypeDirection = {
  id: "pitch",
  name: "提案版",
  scenario: "客户提案",
  screenList: ["首页", "详情页"],
  visualDirection: "暖色纸感",
  complexity: "medium",
  estimatedScreens: 6,
  recommendationReason: "更适合演示",
};

describe("prototype prompt builders", () => {
  it("builds analyze prompt with strict non-generation boundaries", async () => {
    const prompt = await buildAnalyzePrototypePrompt({ project });
    expect(prompt.system).toContain("原型需求分析 Agent");
    expect(prompt.system).toContain("不要生成 HTML / React / WXML 代码");
    expect(prompt.system).toContain("不要默认拆成管理端、运营端、用户端");
    expect(prompt.user).toContain("miniapp");
    expect(prompt.user).toContain("做一个校园活动小程序");
  });

  it("builds plan prompt requiring 2-3 differentiated directions", async () => {
    const prompt = await buildPlanPrototypePrompt(product);
    expect(prompt.system).toContain("推荐 2-3 套原型方案");
    expect(prompt.system).toContain("不能只是换颜色");
    expect(prompt.user).toContain("variationAxes");
  });

  it("builds generate prompt for a high-fidelity multi-screen board", async () => {
    const prompt = await buildGeneratePrototypePrompt({ product, direction });
    expect(prompt.system).toContain("高保真原型方案板");
    expect(prompt.system).toContain("单文件 HTML");
    expect(prompt.system).toContain("多个手机壳 / 浏览器窗口 / 页面画板");
  });

  it("builds optimize prompt preserving versions and current context", async () => {
    const prompt = await buildOptimizePrototypePrompt({
      product,
      direction,
      currentHtml: "<!doctype html><html><body>old</body></html>",
      instruction: "把配色换成蓝绿色",
    });
    expect(prompt.system).toContain("原型优化 Agent");
    expect(prompt.user).toContain("把配色换成蓝绿色");
  });
});
