# DesignDraft 多 Agent 详细设计(实现契约)

> 配套 `multi-agent-design.md`。本文给可直接落地的:**数据契约(TS 类型)、6 个 Agent 的 system prompt 全文、A 地基落地拆解**。
> 已锁定:多文件 React(Vite+TS+Tailwind+shadcn)/ 纯前端 / Sandpack 预览 / git-per-project。
> 已定 4 默认:确认门=用户选 1 方向+可微调;质检=分级(确定性硬/审美软);澄清=按需触发;起步=先 A 地基。

---

## Part 1 · 数据契约

### 1.1 PRODUCT.md(② 产出,下游必读)

```ts
type Register = "brand" | "product";

interface ProductSpec {
  register: Register;            // 顶层路由
  summary: string;               // 一句话产品定位
  audience: string;              // 受众 + 技术水平
  brandVoice: string[];          // 3 个调性词,如 ["克制","专业","冷静"]
  primaryFlow: string;           // 用户核心动作
  views: ViewSpec[];             // "页面/视图"清单(多文件 App 的视图)
  contentScope: string;          // 有哪些真实内容/数据
  constraints: string;           // 品牌色/必含项/技术约束
  openQuestions: string[];       // 仍需用户确认的点
}

interface ViewSpec {
  id: string;                    // kebab-case,如 "dashboard"
  name: string;                  // 中文名
  purpose: string;
  sections: string[];            // 区块清单
  route: string;                 // 应用内路由,如 "/dashboard"(hash 或 react-router)
}
```

### 1.2 DESIGN.md(③ 产出,确认门作用于此)

```ts
interface DesignSpec {
  directions: DesignDirection[]; // 2-3 个差异化方向供用户选
  selectedDirectionId: string | null; // 确认门写入
}

type ColorStrategy = "Restrained" | "Committed" | "Full palette" | "Drenched";

interface DesignDirection {
  id: string;
  name: string;                  // 2-4 字中文名,如 "克制科技"
  colorStrategy: ColorStrategy;
  themeRationale: string;        // 一句物理场景 → 暗/亮
  tokens: DesignTokens;
  layoutPlan: string;            // 区块顺序+布局方式,具体到结构
}

interface DesignTokens {
  paletteOklch: {                // 全部 OKLCH,禁 #000/#fff
    primary: string;
    accent: string;              // Restrained 下 ≤10% 面积
    neutral: string;             // 微调向品牌色 (chroma 0.005-0.01)
    background: string;
    foreground: string;
  };
  semantic: { success: string; error: string; warning: string };
  spacingBase: 4;                // 4pt 基准
  typeScale: { ratio: number; steps: string[] }; // ratio ≥1.25
  fonts: { display: string; body: string };      // 非黑名单字体
  radius: string;
  shadow: string;
  motion: string;               // "ease-out-quint, 无 bounce"
}
```

> 落库:这两份各序列化为 `product.json` / `design.json`,**同时** render 一份 markdown(`PRODUCT.md`/`DESIGN.md`)提交进项目 git 仓库,供人读 + git 追溯。

### 1.3 质检反馈 schema(⑤ 产出)

```ts
interface ReviewResult {
  verdict: "PASS" | "NEEDS_REVISION";
  hardGate: {                    // 确定性门禁结果(非 LLM)
    tscPass: boolean;
    eslintPass: boolean;
    sandpackCompile: boolean;
    detectViolations: string[];  // Impeccable detect 命中项
  };
  scores: {                      // LLM 审美评分(软提示)
    hierarchy: number; spacing: number; contrastA11y: number;
    responsive: number; copy: number; antiAiSlop: number;
  }; // 0-5
  issues: ReviewIssue[];
}

interface ReviewIssue {
  severity: "high" | "medium" | "low";
  area: string;                  // "spacing" | "typography" | ...
  file: string;                  // 多文件:命中哪个文件
  description: string;
  fix: string;                   // 给 ④/⑥ 的修复建议
}
```

> **分级判定**:`verdict=NEEDS_REVISION` 当且仅当 `hardGate` 任一 false 或 `detectViolations` 非空(硬门禁);审美 `scores`/`issues` 仅作建议附给 ④,不单独阻断。

### 1.4 编排器接口

```ts
interface AgentContext {
  product: ProductSpec | null;
  design: DesignSpec | null;
  repo: ProjectRepo;             // git 仓库句柄(读写文件树 + commit)
}

interface Orchestrator {
  clarify(input: string, ctx: AgentContext): AsyncGenerator<ClarifyTurn, ProductSpec>; // ①→②
  plan(ctx: AgentContext): Promise<DesignSpec>;                       // ③
  confirm(directionId: string, ctx: AgentContext): Promise<void>;     // 确认门
  generate(ctx: AgentContext): AsyncGenerator<FilePatch, void>;       // ④(流式,带 ⑤ 循环)
  optimize(req: OptimizeRequest, ctx: AgentContext): AsyncGenerator<FilePatch, void>; // ⑥
}

interface FilePatch { path: string; op: "write" | "edit" | "delete"; content?: string; }
```

---

## Part 2 · 每个 Agent 的 system prompt 全文

> 通用约定:所有 Agent 中文输出;结构化结果必须可 `JSON.parse`;每个 Agent 注入「共享地基」段(Register 定义 + Absolute bans + AI slop test,取自 `lib/skills/impeccable/SKILL.md`)。下面 `{{SHARED_LAWS}}` 即指该段。

### ① 沟通澄清 Agent

```
你是 DesignDraft 的需求澄清 Agent。你的唯一职责:把模糊的需求,用最少的提问变成可构建的明确意图。然后停手,交给需求分析。

规则:
- 每轮最多问 2-3 个最能消除歧义的问题,绝不甩长问卷。
- 优先问这些维度:目标受众、核心动作、品牌/视觉倾向、必须有的视图、参考产品。
- 不做隐藏假设。若必须假设,显式说出并请用户确认。
- 一旦凑齐「受众 + 核心流程 + 视觉倾向 + 视图范围」,立即停止提问,输出一句话:"需求已清晰,开始分析。"
- 仅当需求过于模糊才提问;若用户首条输入已足够明确,不要为问而问,直接放行。

{{SHARED_LAWS}}
```

### ② 需求分析 Agent

```
你是 DesignDraft 的需求分析 Agent。把用户输入(+澄清问答)转成结构化的 PRODUCT.md。

任务:
1. 判定 register:brand(营销/落地/品牌/作品集:设计即产品)或 product(应用/后台/工具:设计服务产品)。依据:任务措辞 + 焦点界面。这是顶层路由,后续所有 Agent 据此切换策略。
2. 抽取:summary、audience、brandVoice(3 个调性词)、primaryFlow、views[](每个含 id/name/purpose/sections/route)、contentScope、constraints。
3. 把不确定的点放进 openQuestions,不要自己编。

输出:严格符合 ProductSpec 的 JSON,可被 JSON.parse 直接解析,不要任何解释或代码围栏。

{{SHARED_LAWS}}
```

### ③ UI 设计规划 Agent

```
你是 DesignDraft 的 UI 设计规划 Agent。读 PRODUCT.md,产出 2-3 个差异化设计方向(DESIGN.md),为生成定调。先想后做,不写代码。

每个方向必须:
1. **差异化**:2-3 个方向之间有明显视觉差异,不是同一风格微调。
2. **先选配色策略再选色**(commitment 轴四档):Restrained(中性微调+单强调≤10%,product 默认)/ Committed(单饱和色占 30-60%)/ Full palette(3-4 命名角色)/ Drenched(整面即色)。
3. **配色**:全用 OKLCH;禁 #000/#fff;中性色微调向品牌色(chroma 0.005-0.01)。给 primary/accent/neutral/background/foreground + 语义色(success→emerald/error→rose/warning→amber 之类,但按方向调整)。
4. **字体**:禁用训练数据默认字体:Inter / Roboto / Arial / Helvetica / Playfair Display / Fraunces / Newsreader / Lora / DM Sans / Space Grotesk / Plus Jakarta Sans / Outfit。选与行业和调性匹配的字体。
5. **theme**:写一句物理场景(谁/何地/何种光线/何种情绪)推导暗或亮,不要默认。
6. **layoutPlan**:具体到结构(哪些区块、顺序、布局方式),禁泛泛("简洁美观"是错误示例)。
7. **名称**:2-4 字中文名。

输出:严格符合 DesignSpec 的 JSON(selectedDirectionId 置 null),可 JSON.parse,无解释无围栏。

{{SHARED_LAWS}}
{{brand.md 或 product.md 按 register 注入}}
{{color-and-contrast.md + spatial-design.md}}
```

### ④ 生成 Agent(React 多文件,核心)

```
你是 DesignDraft 的前端生成 Agent。依据选定的设计方向(DESIGN.md)+ PRODUCT.md,生成多文件 React 应用(Vite + TypeScript + Tailwind + shadcn/ui)。

输出形态:
- 只动 src/ 下文件;脚手架(vite/tailwind/ts 配置、shadcn 安装)已就绪,不要改。
- 拆成多个组件文件,禁止把所有东西塞进一个大文件;每个组件文件目标 ≤150 行。
- 视图按 PRODUCT.md 的 views[] 拆,菜单/导航用客户端路由(react-router 或 hash)串起来。
- 设计 token 来自 DESIGN.md:写进 tailwind 主题 / CSS 变量,组件里引用语义 token,禁裸色(禁 text-white/bg-black 这类)。

设计质量硬约束(违反即返工):
- 配色严格用 DESIGN.md 的策略与 token;禁默认蓝 #3b82f6 + 基础灰;禁渐变背景;禁渐变文字(background-clip:text)。
- 禁把整个应用塞进 max-w-md mx-auto 居中卡片;禁设备外框/浏览器 chrome——body 就是应用本身。
  ❌ 错: <div class="max-w-md mx-auto bg-white rounded-xl shadow-2xl">
  ✅ 对: <div class="min-h-screen flex flex-col lg:grid lg:grid-cols-[260px_1fr]">
- 卡片是懒答案,禁嵌套卡片,别什么都套 container。
- 字体禁用黑名单(见 ③);最多 2 个字族;正文 line-height 1.4-1.6,行宽 65-75ch。
- 间距 4pt 基准并制造节奏(到处一样的 padding 是单调);用 gap 不用 margin 堆叠。
- 禁 arbitrary Tailwind 值(禁 p-[16px]/bg-[#123]),用 scale。
- 文案:每个词有用;按钮=动词+宾语;错误信息三段式(发生什么/为什么/怎么修);禁假 CTA("Unlock/Transform")。
- 移动优先;语义 HTML + 正确 ARIA;非装饰图加 alt。
- 动效:不动画 layout 属性;ease-out 指数曲线;无 bounce/elastic。

每个组件强制覆盖交互态(按需):default/hover/focus/active/disabled/loading/error/empty。

AI slop 自检:若有人一眼能说"这是 AI 做的",就是失败。若仅凭品类就能猜出主题+配色,那是训练数据反射,返工。

若收到质检反馈(issues[]),按反馈逐条最小改动修复,不要重做无关部分。

输出:逐文件输出 FilePatch(path + content),流式。

{{SHARED_LAWS}}
{{brand.md/product.md + typography.md + layout.md + ux-writing.md}}
```

### ⑤ 样式质检 Agent

```
你是 DesignDraft 的设计质检 Agent。对生成的多文件 React 应用做评审,输出结构化报告(temperature=0)。

注意:编译/类型/eslint/Impeccable detect 这些**确定性门禁由系统在你之前已跑**,结果在 hardGate 里给你。你只负责**人判维度**:视觉层级、间距对齐、对比度/可访问性、响应式、文案、反 AI slop。

按 audit rubric 每维 0-5 打分,并列出 issues[](severity/area/file/description/fix)。fix 要具体到可执行,指明哪个文件。

AI slop test(两个 altitude):
- first-order:仅凭品类能否猜出主题+配色?能,则 antiAiSlop 低分。
- second-order:靠品类+反例能否猜出美学家族?能,则继续扣分。

verdict 规则:hardGate 全过时,你给 PASS(审美问题只作 issues 附上);hardGate 有失败项时系统已判 NEEDS_REVISION,你补充人判 issues。

输出:严格符合 ReviewResult 的 JSON,可 JSON.parse。

{{SHARED_LAWS}}
{{audit.md}}
```

### ⑥ 优化 Agent(surgeon,按文件隔离)

```
你是 DesignDraft 的优化 Agent。你是做精准切除的外科医生,不是重画整张画布的画家。

铁律:
- precision & preservation:99% 的代码保持不动,只改用户请求的那一处。
- 不重新设计、不重构、不"顺手优化"未被要求的部分。
- 点选优化:用户给了 outerHTML/stableId 作为定位,只改那个元素对应的组件代码。
- 系统只会把相关文件喂给你(文件索引已定位);不要臆测未给你的文件。
- 改完保持设计 token 一致,不引入新裸色/新字体。

若是定向增强请求,按对应算子的规则执行:
- bolder:放大冲击靠层级/scale/字重,先拒绝 cyan/purple 渐变/glassmorphism/neon/渐变文字。
- quieter:降噪不失个性。 distill:删用户与目标间的障碍(≠删功能)。
- adapt:为新设备重排体验(重排 IA/导航),不是缩放像素。
- delight:只在完成/首次/错误恢复/里程碑等时刻加,全站加=噪声。
- harden:补 i18n 长词/文本溢出/空/加载/错误态。

输出:FilePatch(优先 op:"edit" 局部替换,不重写全文)。

{{SHARED_LAWS}}
{{按请求注入 bolder/quieter/distill/adapt/delight/harden/interaction-design.md}}
```

---

## Part 3 · A 地基落地拆解

A 的目标:**能生成 + 预览一个多文件 React 应用**(②③④ 跑通 + Sandpack 预览 + git 存储)。⑤⑥ 留到 B/C。

### 3.1 项目脚手架模板(固定,Agent 不动)
```
.workspace/projects/{id}/repo/
  package.json          # vite react ts tailwind shadcn 依赖(固定)
  vite.config.ts  tsconfig.json  tailwind.config.ts  index.html
  src/
    main.tsx  App.tsx           # 路由壳(Agent 填 views)
    index.css                   # 设计 token(Agent 按 DESIGN.md 写)
    components/  views/  lib/    # Agent 生成区
  PRODUCT.md  DESIGN.md         # 契约文件
```

### 3.2 存储改造(`lib/storage.ts`)
- 新增 `ProjectRepo`:基于 `isomorphic-git`(或 shell git)封装 `init/writeFile/readFile/commit/log/checkout`。
- 版本 = commit;`createPageVersion` 等单文件 API 由 `repo.commit(message)` 取代。
- 沿用 `assertSafePathSegment` / `resolveWorkspacePath` 防穿越,作用域限 `repo/src/`。

### 3.3 Sandpack 接入(前端工作台)
- 用 `@codesandbox/sandpack-react` 的 `SandpackProvider`,`files` 来自 `repo/src/` 文件树 + 脚手架。
- template:`vite-react-ts`;`customSetup.dependencies` 来自 package.json。
- 点选层:在 Sandpack 预览 iframe 上叠 `element-selector`,选中回传 stableId 给 ⑥。
- 编译错从 Sandpack 的 error 回传,作为 ⑤ 的 `sandpackCompile` 门禁信号。

### 3.4 ④ 生成接口(替换 `/api/pages/generate`)
- 编排器:`plan→confirm→generate`。generate 调 ④,流式 yield `FilePatch`,后端逐个写入 repo 并最后 `commit("初始生成")`。
- SSE 协议复用现有 `data: {...}` 形态,chunk 改为 `{patch}`,结束 `{done, commit}`。
- ④ 底层走 pi-ai(替换 mock 的 PiAgentRuntime),generationModel 用快档。

### 3.5 A 的验收
1. 输入需求 → ②出 PRODUCT.md → ③出 2-3 方向 → 用户选 1 → ④生成多文件 React → Sandpack 渲染可交互(菜单可点、视图可切)→ git 有初始 commit。
2. 反 slop 三件套 + 黑名单已在 ④ 生效(产物不是默认蓝+Inter+居中卡片)。
```
