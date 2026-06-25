import type { Project, PrototypeDirection, PrototypeProductSpec } from "@/types";

import type { LlmCallParams } from "./pi-ai-runtime";

function contextText(project: Project): string {
  return JSON.stringify(
    {
      projectId: project.id,
      projectName: project.name,
      textInput: project.textInput ?? "",
      creationContext: project.creationContext ?? null,
    },
    null,
    2,
  );
}

export async function buildAnalyzePrototypePrompt(input: { project: Project }): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型需求分析 Agent。",
    "你的任务不是生成页面，也不是写代码，而是把用户输入的自然语言需求、平台类型、受众、用途和关键词，整理成适合后续原型方案规划的结构化产品分析。",
    "",
    "硬性边界:",
    "- 只能输出 JSON，不要输出 Markdown。",
    "- 不要生成 UI 方案卡片。",
    "- 不要生成 HTML / React / WXML 代码。",
    "- 不要默认拆成管理端、运营端、用户端，除非用户明确提到。",
    "- 如果信息不足，在 openQuestions 中提出 1-3 个具体问题，同时输出 assumptions。",
    "",
    "输出类型:",
    "type PrototypeProductSpec = { summary:string; platform:'website'|'mobile'|'miniapp'; audienceSummary:string; useCaseSummary:string; contentScope:string; primaryGoal:string; successCriteria:string[]; keyFlows:{name:string;entry:string;goal:string;screens:string[]}[]; requiredScreens:string[]; optionalScreens:string[]; fidelityTarget:'low-fi'|'mid-fi'|'hi-fi'; deviceFrame:'desktop-browser'|'mobile-app'|'miniapp-phone'; variationAxes:string[]; visualConstraints:{styleKeywords:string[];brandTone:string;referenceApps:string[];colorPreference?:string}; assumptions:string[]; openQuestions:string[]; constraints:string[] }",
  ].join("\n");

  const user = `项目上下文:\n\`\`\`json\n${contextText(input.project)}\n\`\`\``;

  return { system, user, tier: "reasoning", temperature: 0.4, maxTokens: 4096 };
}

export async function buildPlanPrototypePrompt(product: PrototypeProductSpec): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型方案规划 Agent。",
    "根据 PrototypeProductSpec 推荐 2-3 套原型方案。",
    "每套方案必须有明显差异，不能只是换颜色。",
    "方案差异应来自 variationAxes、页面范围、表达重点、复杂度、评审/提案/测试用途差异。",
    "只能输出 JSON 数组，不要输出 Markdown，不要生成 HTML。",
    "输出类型: PrototypeDirection[] = { id:string; name:string; scenario:string; screenList:string[]; visualDirection:string; complexity:'low'|'medium'|'high'; estimatedScreens:number; recommendationReason:string }[]",
  ].join("\n");
  const user = `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(product, null, 2)}\n\`\`\``;
  return { system, user, tier: "reasoning", temperature: 0.7, maxTokens: 4096 };
}

export async function buildGeneratePrototypePrompt(args: {
  product: PrototypeProductSpec;
  direction: PrototypeDirection;
}): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型生成 Agent。",
    "生成一个可直接预览的高保真原型方案板。",
    "输出必须是完整单文件 HTML，包含 <!doctype html> 和 </html>。",
    "原型方案板要展示多个手机壳 / 浏览器窗口 / 页面画板，并包含页面编号、页面名称、流程说明和设计说明。",
    "不要生成 React、Vue、WXML、外部资源依赖或需要构建的代码。",
    "平台规则: website 使用桌面浏览器窗口和页面缩略图矩阵；mobile 使用 App 手机壳；miniapp 使用小程序式手机壳、底部导航和轻量路径。",
  ].join("\n");
  const user = [
    `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(args.product, null, 2)}\n\`\`\``,
    `Selected PrototypeDirection:\n\`\`\`json\n${JSON.stringify(args.direction, null, 2)}\n\`\`\``,
  ].join("\n\n");
  return { system, user, tier: "generation", temperature: 0.7, maxTokens: 16384 };
}

export async function buildOptimizePrototypePrompt(args: {
  product: PrototypeProductSpec;
  direction: PrototypeDirection;
  currentHtml: string;
  instruction: string;
  selectedElement?: { html: string; text?: string; path?: string };
}): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型优化 Agent。",
    "根据用户修改意见，在保留当前平台、方案和页面板结构的前提下，输出新的完整单文件 HTML。",
    "不要只输出 diff，不要解释。",
    "输出必须包含 <!doctype html> 和 </html>。",
  ].join("\n");
  const user = [
    `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(args.product, null, 2)}\n\`\`\``,
    `PrototypeDirection:\n\`\`\`json\n${JSON.stringify(args.direction, null, 2)}\n\`\`\``,
    args.selectedElement ? `SelectedElement:\n\`\`\`json\n${JSON.stringify(args.selectedElement, null, 2)}\n\`\`\`` : "",
    `UserInstruction:\n${args.instruction}`,
    `CurrentHtml:\n\`\`\`html\n${args.currentHtml}\n\`\`\``,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { system, user, tier: "generation", temperature: 0.65, maxTokens: 16384 };
}
