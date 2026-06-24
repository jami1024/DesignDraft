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
  keyFlows: string[];
  requiredScreens: string[];
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
```

#### 输出结构

```ts
type PrototypeProductSpec = {
  summary: string;
  platform: "website" | "mobile" | "miniapp";
  audienceSummary: string;
  useCaseSummary: string;
  contentScope: string;
  keyFlows: string[];
  requiredScreens: string[];
  constraints: string[];
};
```

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
