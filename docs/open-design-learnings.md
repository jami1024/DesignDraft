# Open Design 可借鉴能力分析

日期：2026-05-02  
参考项目：[nexu-io/open-design](https://github.com/nexu-io/open-design)

本文记录 Open Design 中适合 DesignDraft 借鉴的产品与技术能力，作为后续任务实现时的参考。当前目标不是照搬 Open Design 的完整架构，而是吸收其中能提升 DesignDraft 生成质量、可控性和迭代体验的关键机制。

---

## 1. 总体判断

Open Design 的核心价值不在于它支持多少 agent 或多少导出格式，而在于它把“AI 设计生成”变成了一套更可控的流程：

1. 先锁定需求与约束。
2. 再选择明确的视觉方向。
3. 注入可复用的 Skill、Design System 和 Craft Rules。
4. 生成可预览的 artifact。
5. 通过点选、评论、参数调整继续迭代。
6. 保留版本和操作历史。

这与 DesignDraft 的产品方向高度匹配：

```text
文档 / 文字 / 原型图
  → AI 分析页面建议
  → 用户选择页面与风格
  → 生成单文件 HTML
  → 点选或对话式优化
  → 版本管理与分享
```

因此 DesignDraft 应优先吸收 Open Design 的“生成约束”和“设计质量控制”能力，而不是过早引入它的大型 daemon、多 agent、桌面端或多媒体体系。

---

## 2. 建议优先借鉴的能力

### 2.1 视觉方向卡片

Open Design 不只提供普通风格名称，而是提供更具体的视觉方向。每个方向包含：

- 名称与适用场景
- 色板
- 字体栈
- 参考品牌或参考风格
- 布局姿态
- 明确的使用限制

DesignDraft 当前任务 #13 计划实现“风格选择器”，建议升级为“视觉方向卡片选择器”。

建议内置方向：

| 方向 | 适合场景 | DesignDraft 用途 |
|---|---|---|
| Modern Minimal | SaaS、工具、效率产品 | 默认推荐，稳定通用 |
| Warm Soft | 教育、咨询、健康、轻量产品 | 更亲和、适合非技术用户 |
| Tech Utility | 数据、开发者工具、后台系统 | 适合 Dashboard 和 B2B 工具 |
| Editorial | 品牌介绍、报告型页面 | 适合高质感宣传页 |
| Playful / Vibrant | 活动页、消费产品 | 适合年轻化、营销场景 |

落地建议：

```text
#13 风格选择器
  从简单下拉框升级为视觉方向卡片
  每张卡展示色板、字体气质、适合页面类型和 AI 推荐理由
```

---

### 2.2 Skill 元数据结构

Open Design 的 Skill 不只是 Markdown 规则文件，还包含可被系统读取的元数据，例如：

- mode：适合 prototype、deck、template 等哪类产物
- preview：预览类型和入口文件
- inputs：需要用户提供哪些结构化输入
- outputs：会产出哪些文件
- design_system：是否需要注入设计系统
- craft：需要哪些通用设计规则
- capabilities_required：是否依赖点选编辑、文件写入等能力

DesignDraft 当前任务 #9 计划整理 `ui-ux-pro-max` 和 `Impeccable` 规则文件。建议保留规则文件，同时增加轻量 Skill Manifest。

建议结构：

```text
lib/skills/
  web-landing/
    SKILL.md
  dashboard/
    SKILL.md
  mobile-prototype/
    SKILL.md
  pitch-page/
    SKILL.md
  craft/
    typography.md
    color.md
    layout.md
    anti-ai-slop.md
```

建议 Manifest 字段：

```yaml
---
id: web-landing
name: Web Landing Page
mode: prototype
scenario: marketing
previewType: html
recommendedFor:
  - landing-page
  - product-intro
  - campaign-page
craft:
  requires:
    - typography
    - color
    - anti-ai-slop
outputs:
  primary: index.html
capabilities:
  selectionOptimization: true
---
```

落地建议：

```text
#9 UI Skill 规则文件
  升级为 Skill Registry + Skill Manifest + Craft Rules

#11 文档分析 API
  AI 返回页面建议时，同时返回 recommendedSkillIds
```

---

### 2.3 Craft Rules：通用设计质量规则

Open Design 把通用设计规则拆成 craft 文件，避免所有知识都塞进一个大 prompt。

DesignDraft 应借鉴这一点，把规则拆成几类：

```text
lib/skills/craft/
  typography.md      字体、层级、行高、字距规则
  color.md           配色、强调色使用、避免 AI 默认色
  layout.md          留白、栅格、视觉层级
  anti-ai-slop.md    反 AI 味清单
  accessibility.md   可读性、对比度、交互目标尺寸
```

好处：

- Prompt 更清晰。
- 不同页面类型可以按需注入不同规则。
- 后续可以单独维护设计质量规则。
- 生成后也能用这些规则做自检。

落地建议：

```text
#9 UI Skill 规则文件
  建立 craft 分层

#10 Prompt 模板实现
  根据页面类型和 Skill Manifest 注入对应 craft rules
```

---

### 2.4 生成前确认需求

Open Design 会在生成前先用表单锁定输出类型、平台、受众、语气、品牌上下文和规模。

DesignDraft 是文档驱动产品，不需要完全照搬表单，但可以在“页面建议列表”阶段加入确认信息。

建议页面建议卡片不仅展示页面名称，还展示 AI 对需求的理解：

```text
我理解这个页面用于：客户演示
主要受众：潜在客户 / 内部评审
建议页面：产品介绍落地页
推荐风格：Modern Minimal
重点模块：Hero、核心价值、流程、案例、CTA
```

用户确认某个建议后再生成，可以减少返工。

落地建议：

```text
#12 页面建议列表 UI
  页面建议卡片增加“AI 理解摘要”
  用户选择页面建议时，同时确认受众、目的、模块和视觉方向
```

---

### 2.5 点选优化中的稳定元素 ID

Open Design 的 comment mode 与 DesignDraft 的点选优化非常接近。它的关键思路是：用户点击预览元素后，把元素身份和用户意见一起传给 agent，让 agent 做更精准的修改。

DesignDraft 当前 #17 设计中计划捕获 DOM path、outerHTML、innerText 和 bounding box。建议再增加一个稳定标识机制：

```html
<section data-designdraft-id="hero">
```

生成 HTML 时，要求 AI 给关键区块加稳定 ID：

- `hero`
- `feature-grid`
- `pricing`
- `testimonial`
- `cta`
- `footer`
- `dashboard-sidebar`
- `metric-card-*`

点选优化时优先使用：

1. `data-designdraft-id`
2. DOM path
3. outerHTML
4. innerText
5. bounding box

这样比单纯依赖 DOM path 更稳定，因为后续版本中 DOM 层级可能变化。

落地建议：

```text
#10 Prompt 模板实现
  页面生成 Prompt 要求关键区块加 data-designdraft-id

#17 元素点选交互层
  捕获 data-designdraft-id 并优先传给后端

#18 点选优化 API
  selectedElement 增加 stableId 字段
```

---

### 2.6 append-only 操作日志

Open Design 使用 artifact 与 history 的概念记录生成和修改过程。DesignDraft 已经有版本文件设计，但可以增加项目级操作日志。

建议新增：

```text
.workspace/projects/{projectId}/history.jsonl
```

每一行是一条操作记录：

```json
{"ts":"2026-05-02T10:00:00.000Z","action":"generate-page","pageId":"page_1","versionId":"v1","summary":"生成产品介绍落地页"}
{"ts":"2026-05-02T10:05:00.000Z","action":"optimize-selection","pageId":"page_1","fromVersionId":"v1","versionId":"v2","summary":"调整 Hero CTA 文案"}
```

好处：

- 后续可做项目时间线。
- 方便排查生成与优化过程。
- 比只看版本文件更容易理解发生了什么。
- JSONL 简单、可追加、可人工查看。

落地建议：

```text
#2 本地文件系统存储层
  后续补充 appendHistoryEvent / listHistoryEvents

#14 HTML 页面生成 API
#18 点选优化 + 对话迭代 API
#20 版本管理 API + UI
  每次生成、优化、回退都写入 history.jsonl
```

---

### 2.7 沙盒预览安全策略

Open Design 的预览策略强调 iframe sandbox，不让生成内容接触宿主页面。

DesignDraft 预览路由和预览面板应继续坚持：

```html
<iframe sandbox="allow-scripts">
```

原则：

- 默认不要加 `allow-same-origin`。
- 预览 HTML 只从 `.workspace` 安全路径读取。
- 预览路由返回 `text/html`。
- 设置 CSP、`X-Content-Type-Options: nosniff` 等安全头。
- 工作台和预览内容通过受控 `postMessage` 通信。

落地建议：

```text
#15 预览路由
#16 预览面板与生成进度 UI
#22 安全加固
  参考 Open Design 的 sandbox iframe 策略
```

---

### 2.8 后续扩展模式

Open Design 有 Prototype、Deck、Template、Design System 等模式。DesignDraft v1 不建议做这么大，但可以作为后续路线参考。

对 DesignDraft 后续最有价值的是：

1. Template 模式  
   用户从成熟模板开始，AI 只填内容和轻度改风格。速度更快，质量下限更高。

2. Design System 模式  
   用户上传品牌手册、官网截图或参考图，DesignDraft 生成项目专属设计规范，后续页面都遵守它。

建议作为 v1.1 或 v2 能力，不进入当前 M1-M5 主线。

---

## 3. 不建议当前阶段照搬的能力

以下能力虽然强，但会显著扩大 DesignDraft 当前范围，暂不建议进入 v1：

- 本地 daemon 架构
- 多 CLI agent 自动检测
- Electron 桌面端
- 31 个 Skill 全量体系
- 72 套 Design System 全量导入
- 图片、视频、音频生成
- PDF、PPTX、ZIP 全格式导出
- Claude Design ZIP 导入
- 大型 artifact 文件树编辑器
- SQLite 会话与多标签状态持久化

DesignDraft v1 应保持主线清晰：

```text
输入需求 → 页面建议 → HTML 生成 → 预览 → 点选 / 对话优化 → 版本与分享
```

---

## 4. 推荐落地优先级

### P0：近期应该吸收

- 视觉方向卡片，替代普通风格选择器。
- Skill Manifest，支持页面建议绑定推荐 Skill。
- Craft Rules 分层，减少 prompt 混乱。
- 页面建议卡片展示 AI 理解摘要。

### P1：生成与迭代阶段吸收

- 生成 HTML 时加入 `data-designdraft-id`。
- 点选优化优先使用稳定元素 ID。
- 增加项目级 `history.jsonl` 操作日志。
- 预览 iframe 严格 sandbox。

### P2：后续版本考虑

- Template 模式。
- Design System 模式。
- 设计系统库。
- 多格式导出。

---

## 5. 对现有任务规划的建议调整

| 原任务 | 建议调整 |
|---|---|
| #9 UI Skill 规则文件 | 扩展为 Skill Registry + Manifest + Craft Rules |
| #10 Prompt 模板实现 | 注入 Skill Manifest、Craft Rules、视觉方向和 `data-designdraft-id` 要求 |
| #11 文档分析 API | 页面建议返回 recommendedSkillIds 和 recommendedDirectionId |
| #12 页面建议列表 UI | 展示 AI 理解摘要、推荐 Skill、推荐视觉方向 |
| #13 风格选择器 | 改为视觉方向卡片选择器 |
| #14 HTML 页面生成 API | 生成结果写入 history.jsonl |
| #17 元素点选交互层 | 捕获 `data-designdraft-id`，作为稳定元素标识 |
| #18 优化 API | 请求结构增加 stableId，优化结果写入 history.jsonl |
| #20 版本管理 API + UI | 展示版本历史时可关联操作日志 |
| #22 安全加固 | 明确 iframe sandbox 与预览路由安全头策略 |

---

## 6. 建议新增或调整的数据字段

### PageSuggestion

建议后续增加：

```ts
type PageSuggestion = {
  // existing fields...
  recommendedDirectionId?: string;
  confidence?: number;
  reasoningSummary?: string;
};
```

### SelectionOptimizationRequest

建议后续增加：

```ts
type SelectionOptimizationRequest = {
  // existing fields...
  selectedElementStableId?: string;
};
```

### HistoryEvent

建议后续新增：

```ts
type HistoryEvent = {
  id: string;
  projectId: string;
  ts: string;
  action:
    | "create-project"
    | "upload-document"
    | "analyze-document"
    | "generate-page"
    | "optimize-selection"
    | "optimize-chat"
    | "rollback-version"
    | "create-share";
  pageId?: string;
  fromVersionId?: string;
  versionId?: string;
  summary: string;
};
```

---

## 7. 结论

Open Design 对 DesignDraft 最有价值的启发是：不要让模型自由发挥，而是用“需求确认、视觉方向、Skill Manifest、Craft Rules、稳定元素 ID、操作历史”把生成过程约束住。

DesignDraft 当前阶段应优先吸收这些轻量但高收益的能力，继续避免过早引入大型运行时、桌面端和多媒体生成体系。
