import type { PageSuggestion } from "@/types";
import { resolveSkillContext } from "@/lib/skills/registry";

export type StylePresetId = "modern-minimal" | "warm-soft" | "tech-utility" | "editorial" | "playful-vibrant";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type BuildAnalyzeDocumentPromptParams = {
  extractedText: string;
  projectId: string;
  userHints?: string;
};

type BuildGeneratePagePromptParams = {
  extractedText: string;
  suggestion: PageSuggestion;
  stylePreset: StylePresetId | string;
};

type BuildSelectionOptimizationPromptParams = {
  currentHtml: string;
  extractedText: string;
  suggestion: PageSuggestion;
  selectedElement: {
    stableId?: string;
    path: string;
    html: string;
    text?: string;
  };
  userInstruction: string;
};

type BuildChatOptimizationPromptParams = {
  currentHtml: string;
  extractedText: string;
  suggestion: PageSuggestion;
  history: ChatMessage[];
  userInstruction: string;
};

type VisualDirection = {
  id: StylePresetId;
  name: string;
  mood: string;
  palette: string;
  typography: string;
  layout: string;
};

const VISUAL_DIRECTIONS: Record<StylePresetId, VisualDirection> = {
  "modern-minimal": {
    id: "modern-minimal",
    name: "Modern Minimal",
    mood: "克制、清晰、软件产品感，适合 SaaS、工具和效率产品。",
    palette: "暖白背景、深石墨文字、少量柔和蓝强调。",
    typography: "清晰无衬线字体，标题紧凑，正文保持高可读性。",
    layout: "大留白、清晰栅格、少量卡片，避免无意义装饰。",
  },
  "warm-soft": {
    id: "warm-soft",
    name: "Warm Soft",
    mood: "亲和、温暖、轻松可信，适合教育、咨询、健康和轻量产品。",
    palette: "奶油色背景、柔和边框、低饱和暖色强调。",
    typography: "标题更有编辑感，正文柔和清楚。",
    layout: "圆角适中，模块之间呼吸感强，避免冰冷工具感。",
  },
  "tech-utility": {
    id: "tech-utility",
    name: "Tech Utility",
    mood: "信息密度高、工程化、重视状态和数据，适合后台与 Dashboard。",
    palette: "浅底或深底均可，但状态色必须语义清晰。",
    typography: "数字使用等宽或 tabular numerics，正文保持紧凑。",
    layout: "指标、表格、筛选和操作入口优先，少做营销式 hero。",
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    mood: "杂志感、叙事性、适合汇报、品牌介绍和高质感说明页。",
    palette: "纸张感背景、墨色文字、单一暖色强调。",
    typography: "标题可更有刊物气质，正文排版像文章一样稳。",
    layout: "大标题、分栏、引用、重点语句形成节奏。",
  },
  "playful-vibrant": {
    id: "playful-vibrant",
    name: "Playful / Vibrant",
    mood: "活泼、有能量，适合活动页、消费产品和年轻化场景。",
    palette: "明亮但不刺眼，强调色最多 1–2 个。",
    typography: "标题可以更有性格，但正文必须稳定可读。",
    layout: "更强的视觉节奏和插画感，但不要影响信息理解。",
  },
};

export function getVisualDirection(stylePreset: string) {
  return VISUAL_DIRECTIONS[stylePreset as StylePresetId] ?? VISUAL_DIRECTIONS["modern-minimal"];
}

export async function buildAnalyzeDocumentPrompt(params: BuildAnalyzeDocumentPromptParams) {
  const skillContext = await resolveSkillContext(["web-landing", "dashboard", "pitch-page"]);

  return [
    "你是 DesignDraft 的产品与页面规划 Agent。",
    "你的任务是阅读用户输入的需求文档，输出 3 到 5 个 PageSuggestion。",
    "必须用中文输出，结果必须能被 JSON.parse 解析。",
    "每个建议都要包含页面名称、用途、受众、模块、推荐 Skill、视觉方向和复杂度。",
    "优先推荐这些 Skill：web-landing、dashboard、pitch-page。",
    params.userHints ? `用户补充偏好：${params.userHints}` : "用户没有额外补充偏好。",
    `项目 ID：${params.projectId}`,
    "",
    "# 可用 Skill 与 Craft Rules",
    skillContext,
    "",
    "# 需求文档",
    fenced(params.extractedText, "markdown"),
    "",
    "# 输出格式",
    fenced(
      JSON.stringify(
        {
          suggestions: [
            {
              id: "landing-page",
              projectId: params.projectId,
              name: "产品介绍落地页",
              purpose: "...",
              audience: "...",
              modules: ["Hero", "核心价值", "行动按钮"],
              recommendedSkillIds: ["web-landing"],
              visualDirection: "Modern Minimal",
              complexity: "medium",
            },
          ],
        },
        null,
        2,
      ),
      "json",
    ),
  ].join("\n");
}

export async function buildGeneratePagePrompt(params: BuildGeneratePagePromptParams) {
  const skillContext = await resolveSkillContext(params.suggestion.recommendedSkillIds);
  const direction = getVisualDirection(params.stylePreset);

  return [
    "你是 DesignDraft 的高级 UI 生成 Agent。",
    "生成完整单文件 HTML，包含内联 CSS 和可直接演示的中文内容。",
    "不要输出解释、Markdown 包裹或额外说明，只输出 HTML。",
    "所有关键区块必须添加稳定的 data-designdraft-id，供后续点选优化使用。",
    "HTML 必须能被 iframe sandbox 安全预览，不要依赖外部脚本。",
    "",
    "# 页面建议",
    fenced(JSON.stringify(params.suggestion, null, 2), "json"),
    "",
    "# 视觉方向",
    renderVisualDirection(direction),
    "",
    "# Skill 与 Craft Rules",
    skillContext,
    "",
    "# 原始需求文本",
    fenced(params.extractedText, "markdown"),
    "",
    "# 输出硬性要求",
    "- 生成完整单文件 HTML。",
    "- 必须包含 `<!doctype html>`。",
    "- 必须包含 `data-designdraft-id`。",
    "- 页面必须适合非技术人员直接演示。",
  ].join("\n");
}

export async function buildSelectionOptimizationPrompt(params: BuildSelectionOptimizationPromptParams) {
  const skillContext = await resolveSkillContext(params.suggestion.recommendedSkillIds);

  return [
    "你是 DesignDraft 的点选优化 Agent。",
    "用户在预览中选中了一个元素，并给出修改意见。",
    "体验上只优化用户选中的元素相关区域，但你必须读取完整 HTML，并且必须返回完整 HTML。",
    "不要只返回片段。不要输出解释。",
    "",
    "# 用户选中元素",
    `stableId: ${params.selectedElement.stableId ?? "无"}`,
    `path: ${params.selectedElement.path}`,
    `text: ${params.selectedElement.text ?? ""}`,
    fenced(params.selectedElement.html, "html"),
    "",
    "# 用户修改意见",
    params.userInstruction,
    "",
    "# 页面建议",
    fenced(JSON.stringify(params.suggestion, null, 2), "json"),
    "",
    "# Skill 与 Craft Rules",
    skillContext,
    "",
    "# 原始需求文本",
    fenced(params.extractedText, "markdown"),
    "",
    "# 当前完整 HTML",
    fenced(params.currentHtml, "html"),
    "",
    "# 输出要求",
    "必须返回完整 HTML。保留未相关区域，避免无关重写。",
  ].join("\n");
}

export async function buildChatOptimizationPrompt(params: BuildChatOptimizationPromptParams) {
  const skillContext = await resolveSkillContext(params.suggestion.recommendedSkillIds);

  return [
    "你是 DesignDraft 的对话式页面优化 Agent。",
    "用户通过自然语言持续迭代页面。你需要结合完整 HTML、需求文本、页面建议和对话历史进行修改。",
    "必须返回完整 HTML。不要只返回说明或片段。",
    "",
    "# 对话历史",
    params.history.map((message) => `${message.role}: ${message.content}`).join("\n") || "无",
    "",
    "# 用户新指令",
    params.userInstruction,
    "",
    "# 页面建议",
    fenced(JSON.stringify(params.suggestion, null, 2), "json"),
    "",
    "# Skill 与 Craft Rules",
    skillContext,
    "",
    "# 原始需求文本",
    fenced(params.extractedText, "markdown"),
    "",
    "# 当前完整 HTML",
    fenced(params.currentHtml, "html"),
    "",
    "# 输出要求",
    "必须返回完整 HTML。保留已经确认的设计方向和内容结构，只修改用户要求的部分。",
  ].join("\n");
}

function renderVisualDirection(direction: VisualDirection) {
  return [
    `方向：${direction.name}`,
    `气质：${direction.mood}`,
    `色彩：${direction.palette}`,
    `字体：${direction.typography}`,
    `布局：${direction.layout}`,
  ].join("\n");
}

function fenced(value: string, language: string) {
  return `\`\`\`${language}\n${value}\n\`\`\``;
}
