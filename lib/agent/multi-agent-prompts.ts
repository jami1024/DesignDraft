// Prompt builders for the multi-agent React pipeline (② analyze / ③ plan / ④ generate).
// System prompts mirror docs/multi-agent-detailed.md and inject Impeccable assets.
import {
  loadDesignReferences,
  loadImpeccableCoreLaws,
  loadRegisterReference,
} from "@/lib/skills/registry";
import type { DesignRegister } from "@/types";
import type { AgentDesignDirection, ProductSpec } from "@/types/multi-agent";

import type { LlmCallParams } from "./pi-ai-runtime";

// File-output protocol for ④ — backend parses these into FilePatch[].
export const FILE_BEGIN = "===FILE:";
export const FILE_END = "===END===";

async function sharedLaws(): Promise<string> {
  const laws = await loadImpeccableCoreLaws();
  return laws ? `\n\n# 共享设计法则(必须遵守)\n\n${laws}` : "";
}

// ----- ② 需求分析 → ProductSpec -----

export async function buildAnalyzePrompt(input: {
  extractedText: string;
  userHints?: string;
}): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的需求分析 Agent。把用户输入转成结构化的 ProductSpec。",
    "",
    "任务:",
    "1. 判定 register:brand(营销/落地/品牌/作品集:设计即产品)或 product(应用/后台/工具:设计服务产品)。依据任务措辞 + 焦点界面。这是顶层路由,后续所有 Agent 据此切换策略。",
    "2. 抽取:summary、audience、brandVoice(3 个调性词)、primaryFlow、views[](每个含 id(kebab-case)/name/purpose/sections/route)、contentScope、constraints。",
    "3. 不确定的点放进 openQuestions,不要自己编。",
    "",
    "输出:严格符合下述 TS 类型的 JSON,可被 JSON.parse 直接解析,不要任何解释或代码围栏。",
    "type ProductSpec = { register:'brand'|'product'; summary:string; audience:string; brandVoice:string[]; primaryFlow:string; views:{id:string;name:string;purpose:string;sections:string[];route:string}[]; contentScope:string; constraints:string; openQuestions:string[] }",
    await sharedLaws(),
  ].join("\n");

  const user = [
    input.userHints ? `用户补充偏好:${input.userHints}\n` : "",
    "需求文档:",
    "```markdown",
    input.extractedText,
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user, tier: "reasoning", temperature: 0.7, maxTokens: 4096 };
}

// ----- ③ UI 设计规划 → DesignSpec -----

export async function buildPlanPrompt(product: ProductSpec): Promise<LlmCallParams> {
  const registerRef = await loadRegisterReference(product.register as DesignRegister);
  const designRefs = await loadDesignReferences(["color-and-contrast", "spatial-design"]);

  const system = [
    "你是 DesignDraft 的 UI 设计规划 Agent。读 ProductSpec,产出 2-3 个差异化设计方向。先想后做,不写代码。",
    "",
    "每个方向必须:",
    "1. 差异化:2-3 个方向之间有明显视觉差异,不是同一风格微调。",
    "2. 先选配色策略再选色(commitment 轴四档):Restrained(中性微调+单强调≤10%,product 默认)/ Committed(单饱和色占 30-60%)/ Full palette(3-4 命名角色)/ Drenched(整面即色)。",
    "3. 配色全用 OKLCH;禁 #000/#fff;中性色微调向品牌色(chroma 0.005-0.01)。给 primary/accent/neutral/background/foreground + 语义色(success/error/warning)。",
    "4. 字体禁用训练数据默认字体:Inter / Roboto / Arial / Helvetica / Playfair Display / Fraunces / Newsreader / Lora / DM Sans / Space Grotesk / Plus Jakarta Sans / Outfit。选与行业和调性匹配的字体。",
    "5. theme:写一句物理场景(谁/何地/何种光线/何种情绪)推导暗或亮。",
    "6. layoutPlan:具体到结构(哪些区块、顺序、布局方式),禁泛泛。",
    "7. 名称:2-4 字中文名。spacingBase 固定 4;typeScale.ratio ≥1.25。",
    "",
    "输出:严格符合下述 TS 类型的 JSON(selectedDirectionId 置 null),可 JSON.parse,无解释无围栏。",
    "type DesignSpec = { directions: AgentDesignDirection[]; selectedDirectionId: null }",
    "type AgentDesignDirection = { id:string; name:string; colorStrategy:'Restrained'|'Committed'|'Full palette'|'Drenched'; themeRationale:string; tokens:{ paletteOklch:{primary:string;accent:string;neutral:string;background:string;foreground:string}; semantic:{success:string;error:string;warning:string}; spacingBase:4; typeScale:{ratio:number;steps:string[]}; fonts:{display:string;body:string}; radius:string; shadow:string; motion:string }; layoutPlan:string }",
    await sharedLaws(),
    registerRef ? `\n\n# Register 参考(${product.register})\n\n${registerRef}` : "",
    designRefs ? `\n\n# 配色与间距参考\n\n${designRefs}` : "",
  ].join("\n");

  const user = `ProductSpec:\n\`\`\`json\n${JSON.stringify(product, null, 2)}\n\`\`\``;

  return { system, user, tier: "reasoning", temperature: 0.8, maxTokens: 6144 };
}

// ----- ④ 生成 React 多文件工程 -----

export async function buildGeneratePrompt(args: {
  product: ProductSpec;
  direction: AgentDesignDirection;
  reviewFeedback?: string; // issues from ⑤, on revision rounds
}): Promise<LlmCallParams> {
  const registerRef = await loadRegisterReference(args.product.register as DesignRegister);
  const designRefs = await loadDesignReferences(["typography", "layout", "ux-writing"]);

  const system = [
    "你是 DesignDraft 的前端生成 Agent。依据选定设计方向 + ProductSpec,生成多文件 React 应用(Vite + TypeScript + Tailwind + shadcn/ui)。",
    "",
    "输出形态:",
    `- 只动 src/ 下文件;脚手架(vite/tailwind/ts 配置、shadcn 安装)已就绪,不要改。`,
    "- 拆成多个组件文件,禁止把所有东西塞进一个大文件;每个组件文件目标 ≤150 行。",
    "- 视图按 ProductSpec 的 views[] 拆,菜单/导航用 react-router-dom 串起来(HashRouter)。",
    "- 设计 token 来自选定方向:写进 src/index.css 的 CSS 变量 + tailwind 主题,组件引用语义 token,禁裸色(禁 text-white/bg-black 这类)。",
    "",
    "设计质量硬约束(违反即返工):",
    "- 配色严格用方向的策略与 token;禁默认蓝 #3b82f6 + 基础灰;禁渐变背景;禁渐变文字(background-clip:text)。",
    "- 禁把整个应用塞进 max-w-md mx-auto 居中卡片;禁设备外框——body 就是应用本身。",
    "- 卡片是懒答案,禁嵌套卡片,别什么都套 container。",
    "- 字体最多 2 个字族;正文 line-height 1.4-1.6,行宽 65-75ch。",
    "- 禁止 import/npm 引入字体包或外部 CSS（例如 @fontsource/*、Google Fonts）;只能在 CSS 中写字体栈，依赖系统/浏览器已有字体回退。",
    "- 间距 4pt 基准并制造节奏;用 gap 不用 margin 堆叠;禁 arbitrary Tailwind 值(禁 p-[16px]/bg-[#123])。",
    "- 文案:按钮=动词+宾语;错误信息三段式(发生什么/为什么/怎么修);禁假 CTA。",
    "- 移动优先;语义 HTML + 正确 ARIA;非装饰图加 alt。",
    "- 动效:不动画 layout 属性;ease-out 指数曲线;无 bounce/elastic。",
    "- 组件按需覆盖交互态:default/hover/focus/active/disabled/loading/error/empty。",
    "",
    "AI slop 自检:若有人一眼能说\"这是 AI 做的\"就是失败;若仅凭品类就能猜出主题+配色,返工。",
    "",
    "输出格式(严格遵守,后端按此解析,不要 markdown 围栏):",
    `每个文件用一行 "${FILE_BEGIN} <相对路径>" 开头,紧接文件内容,再用单独一行 "${FILE_END}" 结束。`,
    "示例:",
    `${FILE_BEGIN} src/App.tsx`,
    "import ...",
    FILE_END,
    "至少包含:src/index.css(设计 token)、src/App.tsx(HashRouter 路由壳 + 导航)、每个 view 一个 src/views/*.tsx、必要的 src/components/*.tsx。",
    await sharedLaws(),
    registerRef ? `\n\n# Register 参考(${args.product.register})\n\n${registerRef}` : "",
    designRefs ? `\n\n# 排版/布局/文案参考\n\n${designRefs}` : "",
  ].join("\n");

  const user = [
    `ProductSpec:\n\`\`\`json\n${JSON.stringify(args.product, null, 2)}\n\`\`\``,
    `\n选定设计方向:\n\`\`\`json\n${JSON.stringify(args.direction, null, 2)}\n\`\`\``,
    args.reviewFeedback
      ? `\n质检反馈(按条最小改动修复,不要重做无关部分):\n${args.reviewFeedback}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user, tier: "generation", temperature: 0.7, maxTokens: 16384 };
}
