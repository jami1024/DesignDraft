# 原型优先项目创建与生成流程设计

日期：2026-06-24  
状态：待实现  
目标分支：`feat/multi-agent-react`

## 1. 背景

当前 DesignDraft 已有两条生成能力：

- 旧主流程：输入需求后生成单文件 HTML 页面。
- React Studio：分阶段分析、规划、确认后生成多文件 React 应用。

新的产品方向需要把主流程调整为“原型优先”：

```text
输入需求
→ 确认平台、受众、用途、关键词
→ AI 分析
→ 推荐 2-3 套原型方案
→ 用户选择方案
→ 生成高保真原型方案板
→ 围绕原型继续讨论修改
```

这里的“原型”不是 Figma 图层文件，也不是生产代码，而是类似产品方案板的高保真网页产物：可以在浏览器预览，集中展示多个关键页面、流程说明、设计说明和版本演进。

## 2. 产品定位

第一版定位为：

```text
AI 产品原型方案生成器
```

而不是：

```text
AI 生产代码生成器
```

生成结果优先满足产品讨论、客户提案、需求评审、视觉探索和开发前确认。React、小程序或客户端代码生成保留为原型确认后的后置能力。

## 3. 平台范围

项目创建时必须选择平台，且创建后不可修改。

第一版只支持三类平台：

```text
网站
移动端
小程序
```

平台影响原型展示方式：

- 网站：桌面浏览器窗口、页面缩略图矩阵、关键页面串联。
- 移动端：手机壳中的 App 关键页面。
- 小程序：小程序式手机壳、底部导航、轻量流程页面。

所有平台第一阶段都生成高保真原型方案板，不直接生成生产代码。

## 4. 核心流程

```text
用户输入需求
  ↓
点击“开始”
  ↓
弹窗确认生成方向
  - 平台：网站 / 移动端 / 小程序
  - 受众群体
  - 用途
  - 补充关键词
  ↓
点击“开始分析”
  ↓
创建项目并保存上下文
  ↓
Analyze Prototype Agent 分析需求
  ↓
Plan Prototype Agent 推荐 2-3 套原型方案
  ↓
用户选择其中一套
  ↓
弹窗确认最终生成信息
  ↓
Generate Prototype Agent 生成高保真原型方案板
  ↓
进入原型工作台
  ↓
对话修改 / 点选修改 / 版本回退
```

## 5. 创建确认弹窗

用户在项目列表页输入需求并点击“开始”后，不直接创建项目，而是打开确认弹窗。

标题：

```text
确认生成方向
```

提示：

```text
这些信息会影响 AI 推荐的原型方案。平台创建后不可修改。
```

### 5.1 平台类型

单选，必填：

- 网站
- 移动端
- 小程序

说明文案：

- 网站：适合官网、后台、SaaS、运营页、门户系统。
- 移动端：适合 App 原型、移动 H5、手机端产品流程。
- 小程序：适合微信小程序、校园/社区/交易/服务类轻应用。

### 5.2 受众群体

多选，支持自定义补充。至少选择一个固定选项，或填写自定义补充。

内置选项：

```text
客户
投资人
内部团队
管理层
产品经理
设计师
开发者
运营人员
销售团队
审核人员
普通用户
学生
商家
管理员
合作伙伴
```

自定义示例：

```text
校园社团负责人、B 端采购经理、社区志愿者
```

### 5.3 用途

多选，支持自定义补充。至少选择一个固定选项，或填写自定义补充。

内置选项：

```text
产品演示
需求评审
客户提案
销售转化
融资路演
内部汇报
开发交付
可用性测试
视觉探索
信息架构梳理
活动宣传
流程验证
```

自定义示例：

```text
给学校领导看、给外包团队开发、给客户确认范围
```

### 5.4 关键词 / 风格偏好

自由输入，选填。

示例：

```text
暖色、校园感、不要太商务、像真实产品
```

### 5.5 确认摘要

弹窗底部显示本次生成上下文：

```text
平台：小程序
受众：学生、普通用户
用途：产品演示、需求评审
关键词：校园感、暖色、像真实产品
```

主按钮：

```text
开始分析
```

## 6. 推荐方案卡片

AI 分析后返回 2-3 套原型方案。每套方案必须有明显差异，不能只是换颜色。

每张方案卡片包含：

- 方案名称
- 适用场景
- 原型范围
- 视觉方向
- 复杂度
- 预计页面数
- 推荐理由

示例：

```text
方案名称：校园公告栏
适用场景：适合产品演示和需求评审，重点展示核心流程和页面结构。
原型范围：首页、列表页、详情页、发布页、消息页、我的页、空状态、错误状态
视觉方向：暖色纸感、圆角卡片、贴纸式标签
复杂度：中
预计页面：8 个
推荐理由：你的目标是团队评审，因此这套方案优先展示完整流程，而不是营销包装。
```

用户点击方案后，弹出最后确认。

## 7. 生成前确认弹窗

标题：

```text
确认生成原型？
```

展示内容：

```text
平台：小程序
受众：学生、普通用户
用途：产品演示、需求评审
关键词：校园感、暖色、像真实产品
选择方案：校园公告栏
预计页面：8 个
视觉方向：暖色纸感、圆角卡片、贴纸式标签
```

主按钮：

```text
生成原型
```

点击后才开始生成完整原型方案板。

## 8. 原型方案板

原型方案板是单文件 HTML，用于稳定预览和后续讨论修改。

基础结构：

```text
标题区
  - 项目名
  - 平台
  - 方案名
  - 页面数量
  - 简短定位

主体区
  - 多个手机壳 / 浏览器窗口 / 页面画板
  - 每个页面有编号和名称
  - 展示关键页面或关键状态

说明区
  - 设计说明
  - 页面清单
  - 信息流说明
  - 交互说明
```

不同平台的展示方式：

- 网站：桌面浏览器窗口 + 页面缩略图矩阵。
- 移动端：手机壳展示 App 关键页面。
- 小程序：小程序式手机壳展示首页、列表、详情、发布、授权、我的等页面。

原型方案板重点是“可讨论的高保真方案”，不是生产代码。

## 9. 原型讨论修改

生成后进入原型工作台，支持持续讨论修改。

用户可以输入：

```text
补一个登录页
把风格改得更年轻
把页面压缩成 5 个
把详情页改得更像小程序
把配色换成蓝绿色
```

系统读取：

- 原始需求
- 平台、受众、用途、关键词
- 已选方案
- 当前完整原型 HTML
- 用户修改指令
- 选中区域信息（如果有）

然后生成新版本原型。

旧版本不被覆盖，所有修改都保存为新版本。

## 10. 数据结构

### 10.1 项目创建上下文

```ts
type ProjectCreationContext = {
  platform: "website" | "mobile" | "miniapp";
  audiences: string[];
  audienceNote?: string;
  useCases: string[];
  useCaseNote?: string;
  keywords?: string;
};
```

项目扩展：

```ts
type Project = {
  id: string;
  name: string;
  textInput?: string;
  creationContext?: ProjectCreationContext;
};
```

### 10.2 原型产品分析结果

```ts
type PrototypeProductSpec = {
  summary: string;
  platform: "website" | "mobile" | "miniapp";
  audienceSummary: string;
  useCaseSummary: string;
  contentScope: string;
  primaryGoal: string;
  successCriteria: string[];
  keyFlows: {
    name: string;
    entry: string;
    goal: string;
    screens: string[];
  }[];
  requiredScreens: string[];
  optionalScreens: string[];
  fidelityTarget: "low-fi" | "mid-fi" | "hi-fi";
  deviceFrame: "desktop-browser" | "mobile-app" | "miniapp-phone";
  variationAxes: string[];
  visualConstraints: {
    styleKeywords: string[];
    brandTone: string;
    referenceApps: string[];
    colorPreference?: string;
  };
  assumptions: string[];
  openQuestions: string[];
  constraints: string[];
};
```

保存到：

```text
.workspace/projects/{projectId}/prototype-product.json
```

### 10.3 推荐原型方案

```ts
type PrototypeDirection = {
  id: string;
  name: string;
  scenario: string;
  screenList: string[];
  visualDirection: string;
  complexity: "low" | "medium" | "high";
  estimatedScreens: number;
  recommendationReason: string;
};
```

保存到：

```text
.workspace/projects/{projectId}/prototype-directions.json
```

### 10.4 原型版本

```ts
type PrototypeVersion = {
  id: string;
  prototypeId: string;
  versionNumber: number;
  htmlPath: string;
  createdAt: string;
  source: "initial-generation" | "chat-optimization" | "selection-optimization" | "rollback";
  changeSummary: string;
};
```

保存到：

```text
.workspace/projects/{projectId}/prototypes/{prototypeId}/v1.html
.workspace/projects/{projectId}/prototypes/{prototypeId}/v1.json
```

## 11. Agent 信息流

```text
用户输入需求
  ↓
确认弹窗收集平台 / 受众 / 用途 / 关键词
  ↓
保存 Project.creationContext
  ↓
Analyze Prototype Agent
  ↓
prototype-product.json
  ↓
Plan Prototype Agent
  ↓
prototype-directions.json
  ↓
用户选择方案
  ↓
Generate Prototype Agent
  ↓
prototype v1.html
  ↓
原型预览 + 对话修改 / 点选修改
  ↓
prototype v2.html / v3.html
```

Agent 不主动把页面分成管理端、运营端、用户端。只有用户需求明确提到这些角色或端时，才根据需求生成相关页面。

### 11.1 Analyze Prototype Agent 规则与系统提示词

Analyze Prototype Agent 只负责把原始需求整理成结构化产品分析，不负责生成方案卡片、不负责生成 HTML、不负责写代码。

#### 使用的规则

- 需求分析规则：提取产品目标、核心流程、页面范围、约束、未明确点。
- 平台理解规则：区分 `website`、`mobile`、`miniapp` 的页面形态和流程表达方式。
- 质量基础规则：避免输出空泛结论、AI 味很重的总结、或把分析阶段过早变成视觉设计阶段。
- 信息充分性规则：判断是否可以继续推荐方案；如果关键信息不足，输出 1-3 个必须补问的问题。
- 方案差异输入规则：输出 `variationAxes`，供后续 Plan Prototype Agent 生成真正不同的 2-3 套方案，而不是只换颜色。
- 视觉约束提取规则：只提取用户表达过或可稳妥推导的风格关键词、品牌语气、参考产品、颜色偏好，不直接生成视觉稿。

#### 不应加载的规则

- 不应加载完整页面生成类规则。
- 不应提前输出视觉方案卡片。
- 不应输出 HTML / React / 小程序代码。

#### 系统提示词草案

```text
你是 DesignDraft 的原型需求分析 Agent。

你的任务不是生成页面，也不是写代码，而是把用户输入的自然语言需求、
平台类型、受众、用途和关键词，整理成适合后续原型方案规划的结构化产品分析。

输入包含：
- 原始需求文本
- 平台：website / mobile / miniapp
- 受众群体
- 用途
- 补充关键词或风格偏好

你需要完成：

1. 理解产品目标
   - 这个产品或页面要解决什么问题？
   - 用户希望别人通过原型理解什么？

2. 理解使用场景
   - 这个原型主要用于产品演示、需求评审、客户提案、开发交付、可用性测试，还是其他目的？
   - 不同用途会影响页面范围和表达重点。

3. 理解目标受众
   - 原型是给谁看的？
   - 他们更关心价值、流程、视觉、数据、操作效率，还是开发细节？

4. 根据平台判断原型范围
   - website：考虑桌面网页、信息架构、页面层级、关键业务页面。
   - mobile：考虑手机端核心流程、底部导航、列表/详情/表单/状态页。
   - miniapp：考虑小程序轻量路径、授权、首页、列表、详情、发布、我的等常见结构。
   - 只能根据用户需求推导，不要默认拆成管理端、运营端、用户端，除非用户明确提到。

5. 输出结构化 JSON
   - 只能输出 JSON。
   - 不要输出 Markdown。
   - 不要解释。
   - 不要生成 UI 方案。
   - 不要生成 HTML / React / WXML 代码。

6. 判断信息是否足够
   - 如果平台、受众、用途已明确，但核心业务目标或关键流程太模糊，可以在 openQuestions 中提出 1-3 个必须补问的问题。
   - 问题必须具体、可回答，不能问“请补充更多信息”这种空泛问题。
   - 即使存在 openQuestions，也要基于现有信息输出可用的 assumptions，方便后续继续推进。

7. 为后续方案规划准备差异化方向
   - variationAxes 只能描述方案差异维度，例如“流程完整度 vs 视觉冲击力”、“轻量展示 vs 完整业务闭环”、“偏销售提案 vs 偏产品评审”。
   - 不要直接给出方案名称和完整方案卡片。
```

#### 输出结构

```ts
type PrototypeProductSpec = {
  summary: string;
  platform: "website" | "mobile" | "miniapp";
  audienceSummary: string;
  useCaseSummary: string;
  contentScope: string;
  primaryGoal: string;
  successCriteria: string[];
  keyFlows: {
    name: string;
    entry: string;
    goal: string;
    screens: string[];
  }[];
  requiredScreens: string[];
  optionalScreens: string[];
  fidelityTarget: "low-fi" | "mid-fi" | "hi-fi";
  deviceFrame: "desktop-browser" | "mobile-app" | "miniapp-phone";
  variationAxes: string[];
  visualConstraints: {
    styleKeywords: string[];
    brandTone: string;
    referenceApps: string[];
    colorPreference?: string;
  };
  assumptions: string[];
  openQuestions: string[];
  constraints: string[];
};
```

### 11.2 外部 Agent / Skill 调研结论

调研日期：2026-06-24。

#### baoyu-design / baoyu skill 可借鉴点

参考：

- [JimLiu/baoyu-design](https://github.com/JimLiu/baoyu-design)
- [baoyu-design skill 目录](https://github.com/JimLiu/baoyu-design/tree/main/skills/baoyu-design)

`baoyu-design` 的定位是把设计生成能力封装成可移植 Agent Skill，能生成 mockup、prototype、wireframe、landing page、dashboard、mobile app、deck 等自包含 HTML 产物。它对 DesignDraft 的直接借鉴不是某一句提示词，而是它的工作流组织方式。

可借鉴的设计：

1. **Prompt 分层**
   - `SKILL.md` 作为入口。
   - `system-prompt.md` 存放通用设计方法和质量标准。
   - `references/` 适配不同运行环境。
   - `built-in-skills/` 存放移动端、线框图、设计系统等专项能力。

   DesignDraft 可对应拆成：

   ```text
   Analyze Prototype Agent
   ├─ core analysis prompt
   ├─ website analysis rules
   ├─ mobile analysis rules
   ├─ miniapp analysis rules
   ├─ output schema
   └─ quality checklist
   ```

2. **按任务加载专项规则**
   - baoyu-design 不把所有设计能力一次性塞进主提示词，而是根据任务加载对应 built-in skill。
   - DesignDraft 也应根据平台加载不同规则：网站看信息架构和页面层级，移动端看手机流程和状态页，小程序看轻量路径、授权、首页、列表、详情、发布、我的等结构。

3. **先确认，再生成**
   - baoyu-design 强调先明确输出类型、保真度、约束和参考材料。
   - DesignDraft 应在 Analyze Prototype Agent 阶段判断信息是否足够；不足时通过 `openQuestions` 让前端补问，而不是直接生成泛化方案。

4. **设计系统与视觉约束**
   - baoyu-design 对 design system、tokens、components、fonts 和 UI kit 的组织很明确。
   - DesignDraft 第一版不需要完整设计系统，但 Analyze Prototype Agent 应先提取 `visualConstraints`，包括风格关键词、品牌语气、参考产品和颜色偏好，作为后续方案规划和原型生成的输入。

5. **生成后验证**
   - baoyu-design 的流程强调预览、截图、检查和修复。
   - DesignDraft 后续 Generate Prototype Agent 应增加自动检查：HTML 是否完整、是否包含必要页面、是否符合所选平台外观、是否像原型方案板而不是普通单页网页。

不应直接照搬的部分：

- baoyu-design 偏“直接生成设计产物”。
- DesignDraft 当前流程是“先分析 → 推荐方案 → 用户选择 → 再生成原型”。
- 因此 Analyze Prototype Agent 不能变成页面生成 Agent，只能输出结构化分析和后续方案规划输入。

#### X 上类似讨论与可借鉴方向

搜索没有找到名称完全等同于 `Analyze Prototype Agent` 的公开 X prompt。更接近的是以下几类讨论：

1. **UX Agent 负责页面结构和用户流程**
   - X 上多 Agent MVP / SaaS 工作流的常见拆法是：UX Agent 先负责用户流程、页面结构、Dashboard / Report layout，Frontend Agent 再负责 UI 结构和组件实现。
   - 参考：[UX Agent / Frontend Agent 分工讨论](https://x.com/Ai_Tech_tool/article/2060668807065325791)、[多 Agent SaaS MVP 讨论](https://x.com/sairahul1/status/2059691862043344968)

   对 DesignDraft 的借鉴：

   ```text
   Analyze Prototype Agent 不做视觉实现；
   它负责把需求整理成页面结构、关键流程、业务目标和约束。
   ```

   可落地为 Analyze Prototype Agent 的输出字段：

   ```text
   primaryGoal
   keyFlows
   requiredScreens
   optionalScreens
   successCriteria
   constraints
   ```

   这类职责边界能避免“分析 Agent”过早进入页面生成，也能让后续 Plan Prototype Agent 有稳定输入。

2. **UI/UX Architect Prompt**
   - X 上有把 coding agent 转成 UI/UX architect 的 prompt 讨论，重点不是写代码，而是用高级产品设计标准审查界面质量。
   - 这类 prompt 通常会检查视觉层级、留白、字体、颜色、对齐、组件一致性、动效、空状态、加载状态、错误状态、响应式和可访问性。
   - 参考：[UI/UX architect prompt 讨论](https://x.com/kloss_xyz/status/2018869093789728799)、[相关整理](https://godofprompt.beehiiv.com/p/you-suck-at-prompting)

   对 DesignDraft 的借鉴：

   ```text
   可以吸收“产品体验判断”和“高级设计标准”；
   但不要让 Analyze Prototype Agent 直接写高保真页面。
   ```

   更适合落到后置质量检查：

   ```text
   Generate Prototype Agent 生成原型
   → Review Prototype Agent 检查视觉层级、状态完整性、平台一致性、页面说明
   → 不通过则自动修正一次或提示重新生成
   ```

   因此 UI/UX Architect Prompt 不应直接并入 Analyze Prototype Agent 主提示词，而应沉淀为 `Prototype Quality Review Rules`。

3. **A2UI / Generative UI schema**
   - X 上 A2UI / Generative UI 的讨论重点是：Agent 不一定直接写死 UI，而是输出结构化 UI schema，再由前端组件系统渲染。
   - 参考：[A2UI / Generative UI 讨论](https://x.com/Saboo_Shubham_/status/2062610190261006371)、[AG-UI Protocol](https://x.com/AGUI_Protocol)、[CopilotKit A2UI Widget Builder 讨论](https://x.com/CopilotKit/status/2000700073550995753)、[A2UI v0.9 讨论](https://x.com/CopilotKit/status/2045169479739695578)、[Google A2UI v0.9 官方说明](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)

   对 DesignDraft 的借鉴：

   ```text
   Analyze Prototype Agent 的输出必须结构化、稳定、可被后续 Agent 消费；
   不应输出散文式分析。
   ```

   第一版仍可以生成单文件 HTML 原型，但内部数据建议保留 schema 化方向：

   ```text
   PrototypeProductSpec
   → PrototypeDirection[]
   → PrototypeBoardSchema
   → HTML renderer
   ```

   这样未来扩展到 React、Figma、小程序代码或客户端页面时，不需要重新理解用户需求，只需要更换渲染器。

4. **Figma 内部 AI Agent 与多画布上下文**
   - X 上关于 Figma Agent、Figma MCP、Google Stitch 的讨论都强调：AI 设计不是只生成一个单页，而是围绕多个 screen、flow、component、canvas 做连续编辑。
   - Figma Agent 支持在设计文件里并行运行多个 prompt；Stitch 强调 AI-native canvas、agent manager、多方向探索，以及导出到 Figma。
   - 参考：[Figma Design Agent 官方介绍](https://www.figma.com/blog/the-figma-agent-is-here/)、[Figma Agent 帮助文档](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files)、[Figma use_figma MCP X 公告](https://x.com/figma/status/2047415320131014970)、[Google Stitch 介绍](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)、[Stitch 导出 Figma X 公告](https://x.com/stitchbygoogle/status/2021320125983621626)

   对 DesignDraft 的借鉴：

   ```text
   原型不是单页面；
   Analyze Prototype Agent 必须输出 requiredScreens、optionalScreens、keyFlows，
   让后续原型方案板天然支持多页面、多状态、多流程。
   ```

   这会影响原型方案板的默认结构：

   ```text
   网站：多浏览器窗口 / 多页面缩略图 / 关键路径说明
   移动端：多手机壳 / 首页、列表、详情、表单、状态页
   小程序：多小程序手机壳 / 授权、首页、详情、发布、我的、空状态
   ```

   后续如果要对接 Figma，应优先导出“多页面结构化原型”，而不是把一整个 HTML 截图塞进 Figma。

#### 本项目采用的结论

DesignDraft 不把 Analyze Prototype Agent 设计成“万能设计师”，而是设计成“原型需求结构化分析层”：

```text
用户自然语言
→ Analyze Prototype Agent 输出稳定 JSON
→ Plan Prototype Agent 生成 2-3 套差异化方案
→ Generate Prototype Agent 生成高保真原型方案板
→ Optimize Prototype Agent 讨论修改并保存新版本
```

这能同时吸收 baoyu-design 的 skill 分层能力、X 上 UX Agent 的职责拆分、A2UI 的结构化输出思路，以及 Figma Agent 多页面上下文的经验。

进一步拆分后，原型主流程建议保留 5 个 Agent 边界：

```text
Analyze Prototype Agent
  需求结构化、关键流程、页面范围、约束、缺失问题

Plan Prototype Agent
  基于 variationAxes 推荐 2-3 套差异化原型方案

Generate Prototype Agent
  生成高保真多页面原型方案板

Review Prototype Agent
  借鉴 UI/UX Architect Prompt 做质量检查

Optimize Prototype Agent
  支持对话修改、点选修改、版本迭代
```

第一版重点实现前三个 Agent；Review Prototype Agent 可先作为生成后的轻量校验规则，后续再独立成 Agent。

## 12. 后端 API

新增 Prototype API，不直接硬改旧 HTML / React API。

### 12.1 创建项目

扩展现有：

```text
POST /api/projects
```

支持：

```ts
{
  name: string;
  textInput: string;
  creationContext: ProjectCreationContext;
}
```

创建成功后保存需求和上下文。

### 12.2 分析需求

```text
POST /api/prototypes/analyze
```

输入：

```ts
{ projectId: string }
```

输出并保存：

```text
prototype-product.json
```

### 12.3 生成推荐方案

```text
POST /api/prototypes/plan
```

输入：

```ts
{ projectId: string }
```

输出并保存：

```text
prototype-directions.json
```

### 12.4 确认方案

```text
POST /api/prototypes/confirm
```

输入：

```ts
{
  projectId: string;
  directionId: string;
}
```

写入：

```text
prototype-directions.json.selectedDirectionId
```

### 12.5 生成原型

```text
POST /api/prototypes/generate
```

输入：

```ts
{ projectId: string }
```

流式返回生成进度，并保存：

```text
prototypes/{prototypeId}/v1.html
```

### 12.6 读取原型

```text
GET /api/prototypes/[prototypeId]?projectId=xxx
GET /api/prototypes/[prototypeId]/versions?projectId=xxx
GET /api/prototypes/[prototypeId]/versions/[versionId]/html?projectId=xxx
```

### 12.7 原型讨论修改

```text
POST /api/prototypes/[prototypeId]/optimize
```

输入：

```ts
{
  projectId: string;
  versionId: string;
  instruction: string;
  selectedElement?: {
    html: string;
    text?: string;
    path?: string;
  };
}
```

输出新版本原型。

## 13. 前端页面

### 13.1 项目列表页

当前首页大输入框改成：

```text
描述你想做的产品或页面…
```

点击“开始”后弹出确认弹窗。

### 13.2 方案选择状态

项目创建后进入项目页，展示：

```text
正在分析需求…
```

分析完成后展示 2-3 张方案卡片。

### 13.3 原型工作台

生成后进入原型工作台。

推荐结构：

```text
顶部：项目名 / 平台 / 方案名 / 当前版本
中间：高保真原型方案板预览
底部或侧栏：讨论修改输入框
侧栏：版本历史
```

### 13.4 React Studio

React Studio 保留，但不作为创建项目后的主入口。

原型完成后可以提供次级按钮：

```text
从当前原型生成代码
```

该按钮后续再接入 React / 小程序 / 客户端代码生成。

## 14. 错误处理

### 输入不完整

平台必选。受众和用途至少各有一个固定选项或自定义补充。

错误提示：

```text
请先确认平台、受众和用途
```

### AI 分析失败

```text
分析失败，请重试。你的项目和输入内容已保存。
```

用户可以重新点击“重新分析”。

### 没有推荐方案

```text
暂时没有生成可用方案，请补充需求或重试。
```

### 原型生成失败

```text
原型生成失败，请重试。
```

后端应检查 HTML 是否包含 `<!doctype html>` 和 `</html>`。不完整时允许自动修复一次。

### 修改失败

```text
修改失败，当前版本未受影响。
```

旧版本不能被覆盖。

## 15. 测试标准

### 创建流程

- 输入需求后弹窗出现。
- 平台单选正常。
- 受众多选正常。
- 用途多选正常。
- 自定义补充能保存。
- 平台创建后不可修改。

### 分析和方案

- 点击“开始分析”后创建项目。
- 项目保存 `creationContext`。
- Analyze Agent 能读取平台、受众、用途、关键词。
- Plan Agent 返回 2-3 套方案。
- 方案卡片显示名称、场景、页面清单、视觉方向、推荐理由。

### 生成原型

- 用户选择方案后弹出确认。
- 点击“生成原型”后生成 HTML。
- 网站、移动端、小程序能生成不同外观的方案板。
- 原型预览能正常显示。

### 讨论修改

- 用户可以输入修改意见。
- 系统生成新版本。
- 旧版本不丢失。
- 版本历史可查看。

### 回归

- 原有项目列表仍可打开。
- 旧 HTML 工作台不被删除。
- React Studio 仍可访问，但不作为主流程入口。

## 16. 第一版范围

### 做

- 创建确认弹窗。
- 平台 / 受众 / 用途 / 关键词。
- Prototype 数据结构。
- `/api/prototypes/analyze`
- `/api/prototypes/plan`
- `/api/prototypes/confirm`
- `/api/prototypes/generate`
- 原型方案卡片。
- 高保真原型 HTML 生成。
- 原型预览。
- 对话式修改。
- 版本保存。

### 暂不做

- 真实 React Native 代码生成。
- 真实小程序 WXML/WXSS/TS 生成。
- Figma 导出。
- 多人协作。
- 图片资产上传管理。
- 自动发布。
- 复杂代码编辑器。

## 17. 成功标准

功能完成后，用户应该能完成：

```text
输入一个产品需求
→ 选择平台、受众、用途
→ 看到 2-3 套推荐原型方案
→ 选择一套
→ 生成高保真原型方案板
→ 继续对话修改
→ 得到新版本原型
```

生成结果应接近用户提供的示例：多个关键页面集中展示、有平台形态、有页面编号、有设计说明，并能围绕结果继续讨论修改。
