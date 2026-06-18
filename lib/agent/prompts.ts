import type { PageSuggestion, ProjectDesignMemory } from "@/types";
import {
  inferOptimizeCommand,
  loadCommandReference,
  loadDesignReferences,
  loadImpeccableCoreLaws,
  loadRegisterReference,
} from "@/lib/skills/registry";

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
  stylePreset?: string;
  designMemory?: ProjectDesignMemory;
};

type BuildSelectionOptimizationPromptParams = {
  currentHtml: string;
  extractedText: string;
  suggestion: PageSuggestion;
  selectedElement: {
    stableId?: string;
    parentStableId?: string;
    path: string;
    html: string;
    text?: string;
  };
  userInstruction: string;
  history?: ChatMessage[];
  designMemory?: ProjectDesignMemory;
};

type BuildChatOptimizationPromptParams = {
  currentHtml: string;
  extractedText: string;
  suggestion: PageSuggestion;
  history: ChatMessage[];
  userInstruction: string;
  designMemory?: ProjectDesignMemory;
};

export async function buildAnalyzeDocumentPrompt(params: BuildAnalyzeDocumentPromptParams) {
  const coreLaws = await loadImpeccableCoreLaws();

  const role = section(
    "role",
    "你是 DesignDraft 的产品与页面规划 Agent。你拥有出色的需求分析能力，能从模糊的文档中提取精确的产品意图，并将其转化为可执行的页面方案。",
  );

  const task = section(
    "task",
    [
      "阅读用户输入的需求文档，完成两件事：",
      "1. 输出 2 到 3 个 DesignDirection（设计方向），为整个项目的视觉风格定调",
      "2. 输出 3 到 5 个 PageSuggestion（页面建议），规划需要哪些页面",
      "",
      "必须用中文输出，结果必须能被 JSON.parse 直接解析。",
    ].join("\n"),
  );

  const designKnowledge = buildDesignContext({ coreLaws });

  const decisionRules = section(
    "decision_rules",
    [
      "每个页面建议需要完成以下判断：",
      "",
      "1. **Register 判断**：",
      "   - brand（设计即产品）：营销/落地/品牌/作品集/展示/活动/案例",
      "   - product（设计服务产品）：应用/后台/仪表盘/工具/管理/设置",
      "",
      "2. **页面类型**：根据需求内容自由推断，不受限于预定义模板",
      "",
      "3. **designRules 要求**：必须具体到页面结构（哪些区块、顺序、布局方式），不能是泛泛的描述。",
      "   ❌ 错误示例：\"页面要简洁美观，突出重点\"",
      "   ✅ 正确示例：\"Hero 区一句话说清产品价值。定价卡片 2-4 列，推荐方案视觉突出。功能对比用表格而非列表。\"",
      "",
      "4. **visualDirection 要求**：必须指明配色策略（Restrained/Committed/Full palette/Drenched）和色彩倾向",
    ].join("\n"),
  );

  const directionRules = section(
    "design_direction_rules",
    [
      "每个 DesignDirection 的生成规则：",
      "",
      "1. **差异化**：2-3 个方向之间必须有明显的视觉差异，不能都是同一风格的微调",
      "2. **palette**：给出 4-5 个具体 hex 色值，包含主色、强调色、背景色、文字色。不能用通用默认色",
      "3. **字体选择**：禁止使用 Inter、Roboto、Arial、Helvetica、Playfair Display。选择与行业和调性匹配的字体",
      "4. **匹配需求**：方向应该与需求文档的行业、受众、语气紧密相关",
      "5. **colorStrategy**：明确指出 Restrained / Committed / Full palette / Drenched",
      "6. **名称**：2-4 个字的中文名，如「克制科技」「温暖人文」「活力撞色」",
    ].join("\n"),
  );

  const input = section(
    "input",
    [
      params.userHints ? `用户补充偏好：${params.userHints}\n` : "",
      `项目 ID：${params.projectId}`,
      "",
      "需求文档：",
      fenced(params.extractedText, "markdown"),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const outputRules = section(
    "output_rules",
    [
      "严格遵守以下输出规则：",
      "- 只输出 JSON，不要输出任何解释文字、Markdown 包裹或代码围栏",
      "- 输出必须能被 JSON.parse() 直接解析",
      "- designDirections 数组包含 2 到 3 个方向",
      "- suggestions 数组包含 3 到 5 个建议",
      "",
      "输出格式示例：",
      fenced(
        JSON.stringify(
          {
            designDirections: [
              {
                id: "restrained-tech",
                name: "克制科技",
                description: "深色背景、冷色强调，营造专业可信的技术氛围",
                palette: ["#0F172A", "#1E293B", "#3B82F6", "#F8FAFC", "#64748B"],
                colorStrategy: "Restrained",
                typography: { display: "Space Grotesk", body: "Noto Sans SC" },
                register: "product",
                visualCharacteristics: ["深色", "克制", "专业", "科技感"],
              },
            ],
            suggestions: [
              {
                id: "pricing-page",
                projectId: params.projectId,
                name: "SaaS 定价页",
                purpose: "展示产品定价方案，引导用户选择并付费",
                audience: "潜在付费用户",
                modules: ["定价方案对比", "功能差异矩阵", "FAQ", "CTA"],
                recommendedSkillIds: [],
                visualDirection: "Committed 色彩策略，品牌主色贯穿定价卡片",
                complexity: "medium",
                register: "brand",
                designRules:
                  "Hero 区一句话说清产品价值。定价卡片 2-4 列，推荐方案视觉突出。功能对比用表格而非列表。FAQ 用折叠面板。底部 CTA 呼应 Hero。",
              },
            ],
          },
          null,
          2,
        ),
        "json",
      ),
    ].join("\n"),
  );

  return [role, task, designKnowledge, directionRules, decisionRules, input, outputRules].join("\n\n");
}

export async function buildGeneratePagePrompt(params: BuildGeneratePagePromptParams) {
  const register = params.suggestion.register ?? "brand";
  const [coreLaws, registerRef, designRefs] = await Promise.all([
    loadImpeccableCoreLaws(),
    loadRegisterReference(register),
    loadDesignReferences(["typography", "color-and-contrast", "spatial-design"]),
  ]);

  const role = section(
    "role",
    [
      "你是 DesignDraft 的高级 UI 工程师与视觉设计师。",
      "你拥有完美的视觉感知力和对细节的极度关注。你创造独特的、有生命力的界面，而不是千篇一律的 AI 模板。",
      "你的每一个设计决策都有明确的理由，每一个视觉元素都在为页面的整体叙事服务。",
    ].join("\n"),
  );

  const constraints = section("system_constraints", buildEnvironmentConstraints());

  const designSystem = buildDesignContext({ coreLaws, register, registerRef, designRefs });

  const designMemorySection = params.designMemory
    ? buildDesignMemorySection(params.designMemory)
    : null;

  const antiSlop = section("anti_slop_checklist", buildAntiSlopChecklist());

  const preFlight = section("pre_flight", buildPreFlightDecisions());

  const pageBrief = section(
    "page_brief",
    [
      "页面建议：",
      fenced(JSON.stringify(params.suggestion, null, 2), "json"),
      "",
      params.suggestion.designRules
        ? `页面结构规则：\n${params.suggestion.designRules}`
        : "",
      "",
      "原始需求文本：",
      fenced(params.extractedText, "markdown"),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const outputRules = section(
    "output_rules",
    [
      buildAntiTruncationBlock(),
      "",
      "格式要求：",
      "- 只输出 HTML 代码，不要输出 Markdown 包裹（不要 ```html），不要输出解释文字",
      "- 以 <!doctype html> 开头，以 </html> 结尾",
      "- 所有可见的交互元素和内容元素都必须添加 data-designdraft-id 属性，包括但不限于：section、nav、header、footer、div 容器、h1-h6、p、a、button、input、textarea、select、img、ul/ol、li、table、form",
      "- ID 格式：{区块}-{元素类型}-{序号}，如 hero-title、pricing-card-1、contact-email-input、nav-link-about",
      "- 纯装饰性 span 或布局 wrapper 可不加，但所有用户可能想单独修改的元素必须有 ID",
      "- 所有用户可见文字使用中文，从需求文档中提取真实内容，禁止 Lorem ipsum 和占位数据",
      "",
      "设计质量要求：",
      "- 响应式设计：移动端优先，至少覆盖 375px / 768px / 1024px / 1440px",
      "- 无障碍：语义化 HTML（header/main/section/footer）、图片 alt 属性、WCAG AA 对比度",
      "- 页面必须适合非技术人员直接演示",
      "",
      buildSelfCritiqueChecklist(),
    ].join("\n"),
  );

  return [
    role,
    constraints,
    designSystem,
    ...(designMemorySection ? [designMemorySection] : []),
    antiSlop,
    preFlight,
    pageBrief,
    outputRules,
  ].join("\n\n");
}

export async function buildSelectionOptimizationPrompt(params: BuildSelectionOptimizationPromptParams) {
  const register = params.suggestion.register ?? "brand";
  const command = inferOptimizeCommand(params.userInstruction);

  const [coreLaws, registerRef, commandRef] = await Promise.all([
    loadImpeccableCoreLaws(),
    loadRegisterReference(register),
    command ? loadCommandReference(command) : Promise.resolve(""),
  ]);

  const elementId = params.selectedElement.stableId
    ? `定位方式: data-designdraft-id="${params.selectedElement.stableId}"（精确匹配）`
    : `定位方式: CSS path ${params.selectedElement.path}（注意：请以 data-dd-target 标记为准）`;

  const role = section(
    "role",
    "你是 DesignDraft 的精准修改 Agent。你能在不破坏页面其他部分的前提下，精确修改目标元素。你的修改既要满足用户指令，又要保持与页面整体设计的协调。",
  );

  const criticalRule = section(
    "critical_rule",
    [
      "⚠️ 最重要的规则 — 严格限定修改范围",
      "",
      "在下方完整 HTML 中，被选中的元素已标记为 data-dd-target=\"true\"。",
      "- 你**只能修改**带有 data-dd-target 属性的那一个元素及其子元素",
      "- 页面中所有其他元素必须保持原样，一个字符都不能改",
      "- 修改完成后，移除 data-dd-target 属性",
      "- 附带的截图展示了用户选中元素在页面中的实际位置和样式，请结合截图理解修改目标",
      "",
      "违反此规则（修改了非目标元素）是最严重的错误。",
    ].join("\n"),
  );

  const constraints = section("system_constraints", buildEnvironmentConstraints());

  const targetElement = section(
    "target_element",
    [
      "用户选中的目标元素：",
      elementId,
      `文本内容: ${params.selectedElement.text ?? "（无文本）"}`,
      fenced(params.selectedElement.html, "html"),
    ].join("\n"),
  );

  const userInstruction = section(
    "user_instruction",
    [
      "用户的最新修改指令：",
      params.userInstruction,
      "",
      "对话历史：",
      params.history && params.history.length > 0
        ? params.history
            .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
            .join("\n")
        : "无",
    ].join("\n"),
  );

  const designContextParts = [buildDesignContext({ coreLaws, register, registerRef })];
  if (command && commandRef) {
    designContextParts.push(section("command_reference", `适用的设计命令：${command}\n\n${commandRef}`));
  }
  const designContext = section("design_context", designContextParts.join("\n\n"));

  const selectionDesignMemory = params.designMemory
    ? buildDesignMemorySection(params.designMemory)
    : null;

  const pageContext = section(
    "page_context",
    [
      "页面建议：",
      fenced(JSON.stringify(params.suggestion, null, 2), "json"),
      "",
      "原始需求文本：",
      fenced(params.extractedText, "markdown"),
    ].join("\n"),
  );

  const currentHtml = section("current_html", fenced(params.currentHtml, "html"));

  const outputRules = section(
    "output_rules",
    [
      buildAntiTruncationBlock(),
      "",
      "- 必须返回完整 HTML（从 <!doctype html> 到 </html>），不是片段",
      "- 只有目标元素及其子元素可以与输入 HTML 不同，其余部分逐字节保留",
      "- 移除 data-dd-target 属性",
      "- 保留所有 data-designdraft-id 属性不变（除非用户明确要求修改元素结构）",
      "- 不要输出解释文字，不要 Markdown 包裹，只输出 HTML",
    ].join("\n"),
  );

  return [
    role,
    criticalRule,
    constraints,
    targetElement,
    userInstruction,
    designContext,
    ...(selectionDesignMemory ? [selectionDesignMemory] : []),
    pageContext,
    currentHtml,
    outputRules,
  ].join("\n\n");
}

export async function buildChatOptimizationPrompt(params: BuildChatOptimizationPromptParams) {
  const register = params.suggestion.register ?? "brand";
  const command = inferOptimizeCommand(params.userInstruction);

  const [coreLaws, registerRef, commandRef] = await Promise.all([
    loadImpeccableCoreLaws(),
    loadRegisterReference(register),
    command ? loadCommandReference(command) : Promise.resolve(""),
  ]);

  const role = section(
    "role",
    "你是 DesignDraft 的对话式页面优化 Agent。你拥有出色的意图理解能力，能准确判断用户想要什么，并采取最合适的行动。",
  );

  const intentClassification = section(
    "intent_classification",
    [
      "收到用户消息后，先判断意图类别，再按对应规则响应。",
      "",
      "意图 A — 修改页面",
      "判断标准：用户描述了对当前页面的具体、可执行的改动（包含「改什么」或「怎么改」的信息）。",
      "示例：\"把标题颜色改成红色\"、\"增加一个客户案例区块\"、\"导航栏改成固定定位\"、\"能不能让标题更大一点？\"",
      "→ 修改 HTML 并返回完整页面。只改用户要求的部分，保留其余不变。",
      "",
      "意图 B — 提问或解释",
      "判断标准：用户在询问关于页面或设计的信息，核心目的是获取知识而非要求变更。",
      "示例：\"这个页面用了什么字体？\"、\"为什么这里用蓝色？\"、\"Hero 区块的布局逻辑是什么？\"",
      "→ 用 [TEXT] 开头回复纯文字。如：[TEXT]这个页面使用了 CSS Grid 布局…",
      "",
      "意图 C — 重新生成",
      "判断标准：用户否定了整体方向，想从头开始而非局部修改。",
      "示例：\"重新做一个\"、\"换个完全不同的风格\"、\"这个方向不对，从头来\"",
      "→ 用 [TEXT] 确认意图：[TEXT]好的，你希望我重新生成页面吗？请描述新的方向或风格偏好。",
      "",
      "意图 D — 不相关",
      "判断标准：消息与页面设计无关。",
      "→ 用 [TEXT] 礼貌引导：[TEXT]我是页面设计助手，可以帮你修改或优化当前页面。有什么需要调整的吗？",
      "",
      "关键区分规则：",
      "- 如果消息既像提问又像修改请求（如\"能不能让标题更大一点？\"），视为意图 A",
      "- 只有纯粹的信息查询才是意图 B",
      "- 只有意图 A 输出完整 HTML，其他意图一律以 [TEXT] 开头",
    ].join("\n"),
  );

  const constraints = section("system_constraints", buildEnvironmentConstraints());

  const designContextParts = [buildDesignContext({ coreLaws, register, registerRef })];
  if (command && commandRef) {
    designContextParts.push(section("command_reference", `适用的设计命令：${command}\n\n${commandRef}`));
  }
  const designContext = section("design_context", designContextParts.join("\n\n"));

  const chatDesignMemory = params.designMemory
    ? buildDesignMemorySection(params.designMemory)
    : null;

  const conversation = section(
    "conversation",
    [
      "对话历史：",
      params.history.length > 0
        ? params.history
            .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
            .join("\n")
        : "无",
      "",
      "用户新指令：",
      params.userInstruction,
    ].join("\n"),
  );

  const pageContext = section(
    "page_context",
    [
      "页面建议：",
      fenced(JSON.stringify(params.suggestion, null, 2), "json"),
      "",
      "原始需求文本：",
      fenced(params.extractedText, "markdown"),
    ].join("\n"),
  );

  const currentHtml = section("current_html", fenced(params.currentHtml, "html"));

  const outputRules = section(
    "output_rules",
    [
      "意图 A 的输出要求：",
      buildAntiTruncationBlock(),
      "- 必须返回完整 HTML（从 <!doctype html> 到 </html>），不是片段",
      "- 保留已确认的设计方向和内容结构，只修改用户要求的部分",
      "- 不要输出解释文字，不要 Markdown 包裹",
      "",
      "意图 B/C/D 的输出要求：",
      "- 以 [TEXT] 开头，只输出纯文字",
      "- 不要输出任何 HTML 代码",
    ].join("\n"),
  );

  return [
    role,
    intentClassification,
    constraints,
    designContext,
    ...(chatDesignMemory ? [chatDesignMemory] : []),
    conversation,
    pageContext,
    currentHtml,
    outputRules,
  ].join("\n\n");
}

function fenced(value: string, language: string) {
  return `\`\`\`${language}\n${value}\n\`\`\``;
}

function section(tag: string, content: string): string {
  return `<${tag}>\n${content}\n</${tag}>`;
}

function buildEnvironmentConstraints(): string {
  return [
    "你的输出将在 iframe sandbox（allow-scripts）中渲染，以下是硬性环境限制：",
    "- 单文件 HTML：所有 CSS 写在 <style> 中，所有 JS 写在 <script> 中",
    "- 禁止外部 JS 框架（无 React / Vue / jQuery）",
    "- 允许的外部资源：Google Fonts（fonts.googleapis.com）、Lucide Icons 或 Font Awesome（cdnjs）、Unsplash 图片",
    "- 禁止 localStorage、sessionStorage、fetch() 调用外部 API、cookies",
    "- 核心内容必须无 JS 也能展示，JS 仅用于交互增强",
    "- 不要引用本地文件路径、不要假设任何构建工具",
  ].join("\n");
}

function buildAntiTruncationBlock(): string {
  return [
    "CRITICAL — 完整输出要求：",
    "- 必须输出完整 HTML，从 <!doctype html> 到 </html>，不遗漏任何部分",
    "- 绝对禁止省略占位符，如 <!-- 其余代码保持不变 -->、// ...rest of code、/* 省略 */",
    "- 不要截断、跳过或总结任何区块。即使页面很长，每一行代码都必须实际写出",
    "- 不完整的输出是不可接受的，会导致页面渲染失败",
  ].join("\n");
}

function buildAntiSlopChecklist(): string {
  return [
    "以下是具体的 AI 生成痕迹模式，必须逐一避免：",
    "",
    "1. ❌ 渐变 blob / mesh 背景作为装饰填充 → ✅ 使用纯色或有品牌意义的图案",
    "2. ❌ 装饰性 emoji 作为功能图标（✨🚀🎯💡放在标题旁）→ ✅ 不放图标，或使用有意义的 SVG/图标字体",
    "3. ❌ 默认选择 Inter / Roboto / Arial / Helvetica → ✅ 遵循设计法则中的字体选择流程，选择与页面气质匹配的字体",
    "4. ❌ 编造统计数据（\"10x 更快\"、\"99.9% 可用性\"、\"10,000+ 用户\"）→ ✅ 从需求文档中推导真实数据，无数据则不写",
    "5. ❌ 暖米色 / 奶油色 / 桃色作为\"安全中性\"背景 → ✅ 根据页面情绪和受众选择有意义的背景色",
    "6. ❌ 默认 Tailwind 蓝 (#3B82F6) 或紫粉渐变作为强调色 → ✅ 选择与品牌/内容匹配的专属色彩",
    "7. ❌ 千篇一律的等宽卡片网格（每个区块都是 3 列卡片）→ ✅ 按内容类型变化布局：表格、时间线、对比图、列表等",
    "8. ❌ 六张结构相同的 feature 卡（图标 + 标题 + 两行描述）→ ✅ 变化卡片结构，或用其他形式展示",
    "9. ❌ 通用 Hero 模板（大标题 + 副标题 + 主按钮 + 幽灵按钮）→ ✅ 为这个具体页面设计专属叙事和视觉焦点",
    "10. ❌ 每个卡片都加 box-shadow 作为唯一深度手段 → ✅ 用间距、背景对比、边框或无装饰来建立层级",
    "11. ❌ 空洞营销词：\"赋能\"、\"一站式\"、\"智能高效\"、\"全方位\"、\"开箱即用\" → ✅ 从需求文档提取具体价值描述，写实际的文案",
    "",
    "检验标准：如果有人一眼就能说出「这是 AI 生成的」，就说明以上某条被违反了。",
  ].join("\n");
}

function buildPreFlightDecisions(): string {
  return [
    "在输出 <!doctype html> 之前，你必须先完成以下 7 个设计决策。",
    "你可以将思考过程写在 <!doctype html> 之前（会被系统自动裁剪，不会出现在最终页面中）。",
    "",
    "1. **配色策略**：从 Restrained / Committed / Full palette / Drenched 中选择，写出选择理由",
    "2. **字体方案**：选择展示字体 + 正文字体（检查是否在 reflex-reject 清单中），确定层级比例（≥1.25）",
    "3. **布局方式**：非对称 / 严格网格 / 居中堆叠 / 混合，选择理由与页面类型相关",
    "4. **内容密度**：稀疏（品牌/作品集）/ 适中（落地页）/ 密集（仪表盘/工具），基于受众判断",
    "5. **主题**：亮色或暗色。写一句物理场景描述（谁在何处何种光线下使用），场景必须决定答案",
    "6. **动效策略**：无动效 / 仅入场动画 / 滚动触发 / 交互反馈，说明动效传达什么信息",
    "7. **资源规划**：需要加载哪些 Google Fonts、是否使用 Unsplash 图片、是否需要图标库",
  ].join("\n");
}

function buildSelfCritiqueChecklist(): string {
  return [
    "输出 </html> 之前，按以下 5 个维度对设计进行心理评分（1-5 分）。",
    "任何维度低于 3 分，必须回头修改对应部分后再输出。不要输出评分本身。",
    "",
    "1. **Philosophy（设计观点）**— 页面是否有明确的视觉立场？能否仅从视觉就判断出受众和情绪？",
    "2. **Hierarchy（视觉层级）**— 模糊眼睛看页面，能否立刻识别最重要的元素？每屏有且只有一个视觉焦点？",
    "3. **Execution（执行质量）**— 代码是否干净？样式是否一致？响应式是否完整？交互状态是否定义？",
    "4. **Specificity（内容特异性）**— 页面内容是否专属于这个产品？能否把文案套到另一个产品上？如果能，就不够具体",
    "5. **Restraint（克制）**— 每个视觉元素是否都有存在的理由？强调色是否使用过度？装饰是否必要？",
  ].join("\n");
}

function buildDesignMemorySection(memory: ProjectDesignMemory): string {
  const parts: string[] = [
    "[优先级: 高 — 项目级设计一致性]",
    "",
    "本项目已有其他页面使用以下设计决策。为保持项目内视觉一致性，请优先沿用这些选择：",
  ];

  if (memory.palette.colors.length > 0) {
    parts.push("", "已有色彩体系：", memory.palette.colors.join(", "));
    if (memory.palette.colorStrategy) {
      parts.push(`配色策略：${memory.palette.colorStrategy}`);
    }
  }

  const typo = memory.typography;
  if (typo.display || typo.body || typo.mono) {
    parts.push("", "已有字体方案：");
    if (typo.display) parts.push(`展示字体：${typo.display}`);
    if (typo.body) parts.push(`正文字体：${typo.body}`);
    if (typo.mono) parts.push(`等宽字体：${typo.mono}`);
  }

  if (memory.visualCharacteristics.length > 0) {
    parts.push("", `视觉方向：${memory.visualCharacteristics.join("、")}`);
  }

  parts.push(
    "",
    "一致性规则：",
    "- 主色和强调色必须沿用，确保品牌识别的统一",
    "- 字体家族必须保持一致，不得在同一项目中混用不同风格的字体",
    "- 可以在保持色彩和字体一致的前提下，根据页面用途调整明暗和密度",
    "- 在 pre_flight 决策中，配色策略和字体方案应参考以上已确定的选择",
  );

  return section("project_design_memory", parts.join("\n"));
}

type DesignContextParams = {
  coreLaws: string;
  register?: string;
  registerRef?: string;
  designRefs?: string;
};

function buildDesignContext(params: DesignContextParams): string {
  const parts = [
    section("core_laws", `[优先级: 最高 — 所有设计必须遵守]\n\n${params.coreLaws}`),
  ];

  if (params.register && params.registerRef) {
    parts.push(
      section(
        "register_rules",
        `[优先级: 高 — ${params.register === "brand" ? "Brand（设计即产品）" : "Product（设计服务产品）"} 模式规则]\n\n${params.registerRef}`,
      ),
    );
  }

  if (params.designRefs) {
    parts.push(
      section("design_references", `[优先级: 参考 — 排版/配色/空间设计指南]\n\n${params.designRefs}`),
    );
  }

  return section("design_system", parts.join("\n\n"));
}
