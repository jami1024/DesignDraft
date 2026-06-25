import type {
  ProjectCreationContext,
  PrototypeDirection,
  PrototypePlatform,
  PrototypeProductSpec,
} from "@/types";

const PLATFORMS: PrototypePlatform[] = ["website", "mobile", "miniapp"];
const FIDELITY_TARGETS = ["low-fi", "mid-fi", "hi-fi"] as const;
const DEVICE_FRAMES = ["desktop-browser", "mobile-app", "miniapp-phone"] as const;
const COMPLEXITIES = ["low", "medium", "high"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}不能为空`);
  return value.trim();
}

function stringArray(value: unknown, label: string): string[] {
  const result = labeledStringArray(value, label, { allowMissing: false });
  if (result.length === 0) throw new Error(`${label}不能为空`);
  return result;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function labeledStringArray(value: unknown, label: string, options: { allowMissing: boolean }): string[] {
  if (value === undefined && options.allowMissing) return [];
  if (!Array.isArray(value)) throw new Error(`${label}必须是数组`);

  return value
    .map((item) => {
      if (typeof item !== "string" || !item.trim()) throw new Error(`${label}必须是字符串数组`);
      return item.trim();
    })
    .filter((item, index, array) => array.indexOf(item) === index);
}

function optionalStringArray(value: unknown, label: string): string[] {
  return labeledStringArray(value, label, { allowMissing: true });
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error(`${label}必须是正数`);
  }
  return value;
}

export function isPrototypePlatform(value: unknown): value is PrototypePlatform {
  return typeof value === "string" && PLATFORMS.includes(value as PrototypePlatform);
}

export function normalizeCreationContext(input: unknown): ProjectCreationContext {
  if (!isRecord(input)) throw new Error("创建上下文不能为空");
  if (!isPrototypePlatform(input.platform)) throw new Error("平台类型不支持");

  const audienceNote = optionalString(input.audienceNote);
  const useCaseNote = optionalString(input.useCaseNote);
  const keywords = optionalString(input.keywords);
  const audiences = optionalStringArray(input.audiences, "受众群体");
  const useCases = optionalStringArray(input.useCases, "用途");

  if (audiences.length === 0 && !audienceNote) throw new Error("请至少选择或填写一个受众群体");
  if (useCases.length === 0 && !useCaseNote) throw new Error("请至少选择或填写一个用途");

  return {
    platform: input.platform,
    audiences,
    ...(audienceNote ? { audienceNote } : {}),
    useCases,
    ...(useCaseNote ? { useCaseNote } : {}),
    ...(keywords ? { keywords } : {}),
  };
}

export function parsePrototypeProductSpec(input: unknown): PrototypeProductSpec {
  if (!isRecord(input)) throw new Error("原型分析结果不是对象");
  if (!isPrototypePlatform(input.platform)) throw new Error("原型分析结果平台无效");
  if (!FIDELITY_TARGETS.includes(input.fidelityTarget as PrototypeProductSpec["fidelityTarget"])) {
    throw new Error("原型保真度无效");
  }
  if (!DEVICE_FRAMES.includes(input.deviceFrame as PrototypeProductSpec["deviceFrame"])) {
    throw new Error("设备框架无效");
  }

  const visual = input.visualConstraints;
  if (!isRecord(visual)) throw new Error("视觉约束不能为空");

  const keyFlowsRaw = input.keyFlows;
  if (!Array.isArray(keyFlowsRaw) || keyFlowsRaw.length === 0) throw new Error("关键流程不能为空");
  const keyFlows = keyFlowsRaw.map((flow, index) => {
    if (!isRecord(flow)) throw new Error(`关键流程${index + 1}无效`);
    return {
      name: stringValue(flow.name, "流程名称"),
      entry: stringValue(flow.entry, "流程入口"),
      goal: stringValue(flow.goal, "流程目标"),
      screens: stringArray(flow.screens, "流程页面"),
    };
  });

  const colorPreference = optionalString(visual.colorPreference);

  return {
    summary: stringValue(input.summary, "摘要"),
    platform: input.platform,
    audienceSummary: stringValue(input.audienceSummary, "受众摘要"),
    useCaseSummary: stringValue(input.useCaseSummary, "用途摘要"),
    contentScope: stringValue(input.contentScope, "内容范围"),
    primaryGoal: stringValue(input.primaryGoal, "主要目标"),
    successCriteria: stringArray(input.successCriteria, "成功标准"),
    keyFlows,
    requiredScreens: stringArray(input.requiredScreens, "必需页面"),
    optionalScreens: optionalStringArray(input.optionalScreens, "可选页面"),
    fidelityTarget: input.fidelityTarget as PrototypeProductSpec["fidelityTarget"],
    deviceFrame: input.deviceFrame as PrototypeProductSpec["deviceFrame"],
    variationAxes: stringArray(input.variationAxes, "方案差异维度"),
    visualConstraints: {
      styleKeywords: optionalStringArray(visual.styleKeywords, "风格关键词"),
      brandTone: stringValue(visual.brandTone, "品牌语气"),
      referenceApps: optionalStringArray(visual.referenceApps, "参考应用"),
      ...(colorPreference ? { colorPreference } : {}),
    },
    assumptions: optionalStringArray(input.assumptions, "假设条件"),
    openQuestions: optionalStringArray(input.openQuestions, "开放问题"),
    constraints: optionalStringArray(input.constraints, "约束条件"),
  };
}

export function parsePrototypeDirections(input: unknown): PrototypeDirection[] {
  if (!Array.isArray(input) || input.length < 2 || input.length > 3) {
    throw new Error("需要生成 2-3 套原型方案");
  }

  return input.map((direction, index) => {
    if (!isRecord(direction)) throw new Error(`原型方案${index + 1}无效`);
    if (!COMPLEXITIES.includes(direction.complexity as PrototypeDirection["complexity"])) {
      throw new Error("方案复杂度无效");
    }
    const estimatedScreens = positiveInteger(direction.estimatedScreens, "预计页面数");
    return {
      id: stringValue(direction.id, "方案 ID"),
      name: stringValue(direction.name, "方案名称"),
      scenario: stringValue(direction.scenario, "适用场景"),
      screenList: stringArray(direction.screenList, "页面清单"),
      visualDirection: stringValue(direction.visualDirection, "视觉方向"),
      complexity: direction.complexity as PrototypeDirection["complexity"],
      estimatedScreens,
      recommendationReason: stringValue(direction.recommendationReason, "推荐理由"),
    };
  });
}
