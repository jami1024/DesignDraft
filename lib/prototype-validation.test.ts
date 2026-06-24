import { describe, expect, it } from "vitest";

import {
  isPrototypePlatform,
  normalizeCreationContext,
  parsePrototypeProductSpec,
  parsePrototypeDirections,
} from "@/lib/prototype-validation";

describe("prototype validation", () => {
  it("accepts supported prototype platforms", () => {
    expect(isPrototypePlatform("website")).toBe(true);
    expect(isPrototypePlatform("mobile")).toBe(true);
    expect(isPrototypePlatform("miniapp")).toBe(true);
    expect(isPrototypePlatform("desktop")).toBe(false);
  });

  it("normalizes creation context and trims custom notes", () => {
    expect(normalizeCreationContext({
      platform: "miniapp",
      audiences: ["学生", "普通用户", "学生"],
      audienceNote: " 校园社团负责人 ",
      useCases: ["产品演示"],
      useCaseNote: " 给学校领导看 ",
      keywords: " 暖色、校园感 ",
    })).toEqual({
      platform: "miniapp",
      audiences: ["学生", "普通用户"],
      audienceNote: "校园社团负责人",
      useCases: ["产品演示"],
      useCaseNote: "给学校领导看",
      keywords: "暖色、校园感",
    });
  });

  it("rejects creation context without platform, audience, or use case", () => {
    expect(() => normalizeCreationContext({ platform: "desktop", audiences: ["客户"], useCases: ["产品演示"] })).toThrow("平台类型不支持");
    expect(() => normalizeCreationContext({ platform: "website", audiences: [], useCases: ["产品演示"] })).toThrow("请至少选择或填写一个受众群体");
    expect(() => normalizeCreationContext({ platform: "website", audiences: ["客户"], useCases: [] })).toThrow("请至少选择或填写一个用途");
  });

  it("parses a valid prototype product spec", () => {
    const spec = parsePrototypeProductSpec({
      summary: "校园活动发布小程序",
      platform: "miniapp",
      audienceSummary: "学生和社团负责人",
      useCaseSummary: "用于产品演示和需求评审",
      contentScope: "覆盖活动发现、详情、发布和我的",
      primaryGoal: "让评审方理解完整活动流转",
      successCriteria: ["看懂核心流程", "明确关键页面"],
      keyFlows: [{ name: "报名活动", entry: "首页", goal: "完成报名", screens: ["首页", "详情页", "报名成功页"] }],
      requiredScreens: ["首页", "详情页", "发布页", "我的页"],
      optionalScreens: ["授权页"],
      fidelityTarget: "hi-fi",
      deviceFrame: "miniapp-phone",
      variationAxes: ["轻量展示 vs 完整闭环"],
      visualConstraints: {
        styleKeywords: ["校园感", "暖色"],
        brandTone: "亲和可信",
        referenceApps: [],
        colorPreference: "暖色",
      },
      assumptions: ["用户以手机访问为主"],
      openQuestions: [],
      constraints: ["不要默认拆管理端"],
    });

    expect(spec.platform).toBe("miniapp");
    expect(spec.keyFlows[0].screens).toContain("详情页");
  });

  it("requires 2-3 prototype directions", () => {
    expect(() => parsePrototypeDirections([{ id: "a" }])).toThrow("需要生成 2-3 套原型方案");
    const directions = parsePrototypeDirections([
      { id: "flow", name: "流程评审版", scenario: "需求评审", screenList: ["首页"], visualDirection: "清晰克制", complexity: "low", estimatedScreens: 5, recommendationReason: "流程最清楚" },
      { id: "pitch", name: "提案展示版", scenario: "客户提案", screenList: ["首页"], visualDirection: "更有冲击力", complexity: "medium", estimatedScreens: 7, recommendationReason: "更适合展示" },
    ]);
    expect(directions).toHaveLength(2);
  });
});
