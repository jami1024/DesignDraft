# DesignDraft — 产品与技术设计文档

日期：2026-05-01
状态：设计稿

---

## 1. 产品定义

| 项目 | 决定 |
|------|------|
| **名称** | DesignDraft |
| **一句话描述** | 输入需求（文字/文档/原型图） → AI 分析并建议页面方案 → 生成可交互的 HTML 演示页面 → 点选或对话式迭代优化 |
| **形态** | Web 应用 |
| **AI 运行时** | Pi Agent（原生多模型：DeepSeek / Claude / OpenAI 等） |
| **目标用户** | 产品经理、设计师、开发者，以非技术人员为主 |
| **部署** | 自有服务器（Docker） |

## 2. 完成标准

第一版完成时，用户应该可以：

1. 上传 `.md`、`.txt`、`.pdf`、`.docx` 文档，或直接输入文本需求，或上传原型图。
2. 让 agent 阅读文档并给出 3–5 个可生成页面建议。
3. 选择一个页面建议并选择风格预设后，生成一个完整的单文件 HTML 页面。
4. 通过独立预览链接直接访问生成页面。
5. 在工作台中点选页面元素输入优化意见，或通过对话式自然语言指令迭代修改。
6. 查看版本历史、回退旧版本、复制预览链接、下载 HTML 文件。
7. 生成带限时 + 可选密码的分享链接，发给客户/同事直接查看。

第一版不做：多人协作、源码编辑器、多页面站点自动发布、截图手绘标注、临时子域名、用户注册登录、数据库、Figma 集成。

## 3. 核心用户流程

```
创建项目
    ↓
上传文档(.md/.txt/.pdf/.docx) + 输入文本需求 + 上传原型图(可选)
    ↓
AI 分析文档，给出 3-5 个页面建议
    ↓
用户选择一个页面建议 + 选择风格预设
    ↓
AI 生成单文件 HTML（流式输出 + 进度反馈）
    ↓
实时预览（sandboxed iframe）+ 独立预览链接
    ↓
  ┌─── 满意 → 下载 HTML / 生成分享链接
  └─── 不满意 → 两种迭代方式：
       ├── 点选页面元素 + 输入修改意见（精准定位）
       └── 对话式自然语言指令（灵活表达）
       → 生成新版本（保留完整版本历史）
```

产品重点不是让用户编辑源码，而是让用户用自然语言和页面标注驱动页面优化。

## 4. 技术栈

| 层 | 技术 | 理由 |
|----|------|------|
| 框架 | **Next.js 14 (App Router)** + TypeScript | 全栈一体，承载工作台 + 预览 + API |
| 样式 | **Tailwind CSS** + **shadcn/ui** | 快速构建美观 UI |
| AI 运行时 | **Pi Agent** (pi-mono) | 原生多模型路由（DeepSeek/Claude/OpenAI/Gemini），MIT 开源，可编程工作流 |
| 预览 | **sandboxed iframe** + 独立预览路由 | 安全隔离渲染 |
| 文件存储 | **本地文件系统** (.workspace/) | v1 简单可靠，未来可换对象存储 |
| 文档解析 | pdf-parse / mammoth 等 | 抽取 .pdf/.docx 文本 |
| 部署 | **Docker** + docker-compose | 自有服务器 |

重要原则：
- 文档解析、HTML 文件读取、版本保存等关键步骤由后端确定性执行。
- Agent 负责理解、规划、生成和优化。
- 不把文件路径读取完全交给模型自由决定，避免不可控行为。

## 5. 系统架构

```
Next.js Web App
├─ Workbench UI（工作台）
│  ├─ 项目列表 / 创建项目
│  ├─ 文档上传 + 文本输入 + 原型图上传
│  ├─ 页面建议列表
│  ├─ 风格选择器
│  ├─ 预览面板（iframe + 元素点选层）
│  ├─ 对话式迭代面板
│  ├─ 源码查看器
│  └─ 版本历史面板
│
├─ Preview Routes
│  ├─ /previews/[projectId]/[pageId]/[version]   # 内部预览
│  └─ /share/[shareToken]                         # 外部分享预览
│
├─ API Routes
│  ├─ /api/projects (CRUD)
│  ├─ /api/documents/upload
│  ├─ /api/documents/text-input
│  ├─ /api/documents/analyze
│  ├─ /api/pages/generate
│  ├─ /api/pages/optimize-selection
│  ├─ /api/pages/optimize-chat
│  ├─ /api/pages/[pageId]/versions
│  ├─ /api/pages/[pageId]/rollback
│  ├─ /api/pages/[pageId]/versions/[versionId]/download
│  ├─ /api/pages/[pageId]/share
│  ├─ /api/pages/[pageId]/shares
│  └─ /api/skills/update
│
├─ Agent Runtime Layer
│  ├─ AgentRuntimeAdapter（统一接口）
│  ├─ PiAgentRuntime（默认，多模型支持）
│  └─ LightweightModelRuntime（可选，纯 API 调用）
│
├─ Skill Layer
│  ├─ ui-ux-pro-max（生成前：页面类型、风格、布局建议）
│  └─ Impeccable（生成后：质量检查、视觉优化）
│
└─ Workspace Storage
   └─ .workspace/projects/{projectId}/...
```

## 6. 项目结构

```
designdraft/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 项目列表首页
│   ├── projects/
│   │   └── [projectId]/
│   │       └── page.tsx                  # 项目工作台
│   ├── previews/
│   │   └── [projectId]/[pageId]/[version]/
│   │       └── route.ts                  # 内部预览路由
│   ├── share/
│   │   └── [token]/
│   │       └── page.tsx                  # 外部分享页（含密码验证）
│   ├── api/
│   │   ├── projects/
│   │   │   └── route.ts
│   │   ├── documents/
│   │   │   ├── upload/route.ts
│   │   │   ├── text-input/route.ts
│   │   │   └── analyze/route.ts
│   │   ├── pages/
│   │   │   ├── generate/route.ts
│   │   │   ├── optimize-selection/route.ts
│   │   │   ├── optimize-chat/route.ts
│   │   │   └── [pageId]/
│   │   │       ├── versions/route.ts
│   │   │       ├── rollback/route.ts
│   │   │       └── versions/[versionId]/
│   │   │           └── download/route.ts
│   │   ├── skills/
│   │   │   └── update/route.ts
│   │   └── share/
│   │       └── verify/route.ts
│   └── globals.css
│
├── components/
│   ├── project-list.tsx
│   ├── workbench/
│   │   ├── document-upload.tsx
│   │   ├── suggestion-list.tsx
│   │   ├── style-selector.tsx
│   │   ├── preview-panel.tsx
│   │   ├── chat-panel.tsx
│   │   ├── code-viewer.tsx
│   │   ├── version-history.tsx
│   │   └── progress-indicator.tsx
│   └── ui/                               # shadcn/ui 组件
│
├── lib/
│   ├── agent/
│   │   ├── adapter.ts                    # AgentRuntimeAdapter 接口
│   │   ├── pi-runtime.ts                 # Pi Agent 实现（默认）
│   │   ├── model-config.ts               # 模型/Provider 配置管理
│   │   └── prompts.ts                    # prompt 模板
│   ├── skills/
│   │   ├── ui-ux-pro-max/
│   │   │   ├── generation-rules.md
│   │   │   ├── style-selection.md
│   │   │   └── anti-patterns.md
│   │   └── impeccable/
│   │       ├── quality-rules.md
│   │       ├── typography-rules.md
│   │       └── layout-rules.md
│   ├── storage.ts
│   ├── document-parser.ts
│   └── styles.ts
│
├── types/
│   └── index.ts
│
├── .workspace/                           # 运行时数据（gitignore）
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.local
```

## 7. 数据模型

```ts
type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sourceDocumentIds: string[];
  pageIds: string[];
  currentSkillId: string;
  textInput?: string;
};

type SourceDocument = {
  id: string;
  projectId: string;
  originalFileName: string;
  mimeType: string;
  originalPath: string;
  extractedTextPath: string;
  imagesPaths?: string[];
  createdAt: string;
};

type PageSuggestion = {
  id: string;
  projectId: string;
  name: string;
  purpose: string;
  audience: string;
  modules: string[];
  recommendedSkillIds: string[];
  visualDirection: string;
  complexity: "low" | "medium" | "high";
};

type GeneratedPage = {
  id: string;
  projectId: string;
  suggestionId: string;
  name: string;
  currentVersionId: string;
  versionIds: string[];
  createdAt: string;
  updatedAt: string;
};

type PageVersion = {
  id: string;                          // "v1", "v2", ...
  pageId: string;
  versionNumber: number;
  htmlPath: string;
  previewPath: string;
  createdAt: string;
  changeSummary: string;
  skillSnapshot: string[];
  source: "initial-generation" | "selection-optimization" | "chat-optimization" | "rollback";
};

type SelectionOptimizationRequest = {
  projectId: string;
  pageId: string;
  versionId: string;
  selectedElementHtml: string;
  selectedElementPath: string;
  selectedElementText?: string;
  userInstruction: string;
};

type ShareLink = {
  id: string;
  shareToken: string;
  projectId: string;
  pageId: string;
  versionId: string;
  passwordHash?: string;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  isRevoked: boolean;
};
```

版本标识统一规则：
- 版本 ID 格式统一为 `v{versionNumber}`，如 `v1`、`v2`、`v3`。
- 文件命名使用 `v1.html`、`v2.html`。
- 预览路由使用 `/previews/{projectId}/{pageId}/v1`。

## 8. Agent Runtime Adapter 接口

```ts
interface AgentRuntimeAdapter {
  analyzeDocument(params: {
    extractedText: string;
    images?: { base64: string; mediaType: string }[];
    skillRules: string;
    userHints?: string;
  }): Promise<PageSuggestion[]>;

  generatePage(params: {
    extractedText: string;
    images?: { base64: string; mediaType: string }[];
    suggestion: PageSuggestion;
    skillRules: string;
    stylePreset: string;
    outputRequirements: string;
  }): AsyncGenerator<string, string>;

  optimizePage(params: {
    currentHtml: string;
    extractedText: string;
    suggestion: PageSuggestion;
    selectedElement?: {
      html: string;
      path: string;
      text?: string;
    };
    userInstruction: string;
    skillRules: string;
  }): AsyncGenerator<string, string>;
}
```

两种迭代方式共用 `optimizePage` 接口，区别在于是否传入 `selectedElement`。

## 9. 文件存储结构

```
.workspace/
├─ projects/
│  └─ project-id/
│     ├─ uploads/
│     │  └─ original.docx
│     ├─ extracted/
│     │  └─ document.txt
│     ├─ images/
│     │  └─ prototype-1.png
│     ├─ suggestions/
│     │  └─ suggestions.json
│     ├─ pages/
│     │  └─ page-id/
│     │     ├─ v1.html
│     │     ├─ v2.html
│     │     └─ metadata.json
│     └─ project.json
├─ shares/
│  └─ shares.json
└─ skills/
   ├─ ui-ux-pro-max/
   └─ impeccable/
```

## 10. 核心流程详细设计

### 10.1 上传或输入需求

支持输入：`.md`、`.txt`、`.pdf`、`.docx`、直接输入文本、上传原型图。

上传后，后端先抽取文本并保存。文本需求保存为虚拟文档（`mimeType: "text/plain"`），后续流程与上传文档一致。

### 10.2 文档分析

Agent 读取抽取后的文档文本（+ 可选原型图），输出 3–5 个候选页面。输出为结构化 JSON：

```json
{
  "pages": [
    {
      "id": "landing-page",
      "name": "产品介绍落地页",
      "purpose": "把文档内容转成面向用户的产品介绍页面",
      "audience": "潜在客户和内部评审人员",
      "modules": ["Hero", "核心价值", "功能说明", "使用流程", "行动按钮"],
      "recommendedSkillIds": ["ui-ux-pro-max", "impeccable"],
      "visualDirection": "科技感、简洁、大留白",
      "complexity": "medium"
    }
  ]
}
```

### 10.3 生成 HTML 页面

用户选择候选页面后，后端组装上下文（文档摘要 + 页面方案 + UI skill 规则 + 风格预设 + 输出要求），Agent 返回完整单文件 HTML。

生成要求：
- 必须包含 `<!DOCTYPE html>`
- CSS 内联在 `<style>` 中
- 少量 JS 可内联在 `<script>` 中
- 不依赖构建工具，不引用用户本地路径
- 默认避免外部脚本依赖
- 页面应具备响应式布局
- 基于 PRD 生成真实文案，不用 lorem ipsum

### 10.4 点选元素优化

在 iframe 预览中注入轻量选择脚本（不永久修改用户 HTML）。

前端捕获：
- DOM path / CSS selector
- outerHTML
- innerText
- bounding box

后端流程：
```
接收优化请求
→ 读取完整 HTML + 原始文档 + 页面方案 + UI skill 规则
→ 将完整页面、选中元素和优化意见交给 Agent
→ Agent 返回新的完整 HTML（不是局部片段）
→ 保存为新版本
```

关键规则：用户体验上像"只优化选中区域"，但执行上下文必须包含完整 HTML，返回结果也必须是完整 HTML。

### 10.5 对话式迭代

对话面板 UI，保留对话历史。发送完整 HTML + 对话历史 + 用户新指令给 Agent，Agent 在原有 HTML 基础上修改。

## 11. API 设计

### 11.1 项目管理

```http
POST   /api/projects                    # 创建项目 { name }
GET    /api/projects                    # 项目列表
GET    /api/projects/[projectId]        # 项目详情
DELETE /api/projects/[projectId]        # 删除项目（级联删除所有数据）
```

### 11.2 文档上传

```http
POST /api/documents/upload
```
输入：`multipart/form-data`（file + projectId）
输出：`{ documentId, projectId, extractedTextPreview }`

```http
POST /api/documents/text-input
```
输入：`{ projectId, text }`
输出：`{ documentId, extractedTextPreview }`

### 11.3 文档分析

```http
POST /api/documents/analyze
```
输入：`{ projectId, documentId }`
输出：`{ suggestions: PageSuggestion[] }`

### 11.4 生成页面

```http
POST /api/pages/generate              → text/event-stream (SSE)
```
输入：`{ projectId, suggestionId }`
输出（SSE 最终事件）：`{ pageId, versionId, previewUrl }`

### 11.5 优化

```http
POST /api/pages/optimize-selection    → text/event-stream (SSE)
```
输入：`{ projectId, pageId, versionId, selectedElementHtml, selectedElementPath, userInstruction }`
输出（SSE 最终事件）：`{ newVersionId, previewUrl, changeSummary }`

```http
POST /api/pages/optimize-chat         → text/event-stream (SSE)
```
输入：`{ projectId, pageId, versionId, userInstruction, history }`
输出（SSE 最终事件）：`{ newVersionId, previewUrl, changeSummary }`

### 11.6 版本管理

```http
GET  /api/pages/[pageId]/versions?projectId=xxx     # 版本列表
POST /api/pages/[pageId]/rollback                    # 版本回退 { projectId, targetVersionId }
GET  /api/pages/[pageId]/versions/[versionId]/download?projectId=xxx  # 下载 HTML
```

回退说明：不删除后续版本，而是基于目标版本的 HTML 创建新版本（`source: "rollback"`），确保历史完整。

### 11.7 分享

```http
POST   /api/pages/[pageId]/share       # 创建分享链接 { projectId, versionId, expiresIn, password? }
GET    /api/pages/[pageId]/shares      # 查看分享链接列表
DELETE /api/pages/[pageId]/shares/[shareId]  # 撤销分享链接
POST   /api/share/verify               # 验证分享密码
```

### 11.8 Skill 配置

```http
PUT /api/skills/update                 # 更新项目 skill { projectId, skillId }
```

## 12. SSE 进度推送

生成和优化接口返回 `text/event-stream`：

```
event: progress
data: {"stage": "reading-document", "message": "正在读取文档..."}

event: progress
data: {"stage": "analyzing", "message": "正在分析页面结构..."}

event: progress
data: {"stage": "generating", "message": "正在生成 HTML..."}

event: complete
data: {"pageId": "page_123", "versionId": "v2", "previewUrl": "/previews/..."}

event: error
data: {"code": "GENERATION_FAILED", "message": "生成失败，请重试。"}
```

## 13. 预览与分享设计

### 预览体系

```
┌─────────────────────────────────────────────────────┐
│                    预览方式                           │
├──────────────┬──────────────┬───────────────────────┤
│ 工作台内预览   │ 独立预览链接   │ 外部分享链接           │
│ (iframe)     │ (内部访问)    │ (公网 + 限时 + 密码)   │
├──────────────┼──────────────┼───────────────────────┤
│ 嵌在工作台内   │ 新标签页打开   │ 发给客户/同事直接看     │
│ 支持元素点选   │ 需登录态      │ 无需登录               │
│ sandbox 隔离  │ 全屏查看效果   │ token + 可选密码       │
└──────────────┴──────────────┴───────────────────────┘
```

### 分享链接访问逻辑

- 无密码：直接访问 `/share/{token}` 即可看到页面
- 有密码：先显示密码输入页，验证后展示 HTML 页面
- 过期：显示"链接已过期"提示页

### 分享安全策略

- shareToken 使用 nanoid 生成，足够长防猜测
- 密码使用 bcrypt 哈希存储
- 过期检查在路由层执行
- 分享页面使用独立 CSP 策略，不携带工作台 session
- 分享页面不暴露项目 ID 或内部路径

## 14. 安全设计

### 预览安全

预览路由响应头：
```
Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

工作台 iframe：
```html
<iframe
  src="/previews/{projectId}/{pageId}/{version}"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
/>
```

### 文件安全

- 上传文件限制大小（≤ 10MB）
- 只允许白名单格式
- 文件保存到项目隔离目录
- 不允许用户通过路径参数读取任意文件

### Agent 权限

- Agent 只允许读取当前项目目录
- 不允许读取系统目录、用户私密目录或无关项目
- 不允许执行任意 shell 命令

### 认证与授权

- 本地开发模式：无需认证
- 部署模式：基于 cookie 的会话认证（Next.js middleware）

### 并发控制

优化请求必须携带当前 `versionId`。后端校验是否仍是 `currentVersionId`，不一致时返回 409 Conflict：

```json
{
  "error": "VERSION_CONFLICT",
  "message": "页面已被更新，请刷新后重试。",
  "latestVersionId": "v3"
}
```

## 15. UI Skill 集成设计

采用"内置固定版 + 后续可更新"的策略。第一版将规则整理成本地文件，不实时拉取上游。

### 15.1 ui-ux-pro-max

来源：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill（MIT）
安装：`npm install -g uipro-cli`

核心能力：AI 设计系统生成引擎，包含 161 条行业规则。

我们需要提取并内置的规则集：

| 规则类型 | 数量 | 用途 |
|---------|------|------|
| 行业推理规则 | 161 条 | 根据产品类型（SaaS/金融/医疗/电商等）匹配最佳设计方案 |
| UI 风格库 | 67 种 | 玻璃态/黏土态/极简/野兽派/暗色/Bento Grid/AI-Native 等 |
| 字体搭配 | 57 组 | 基于 Google Fonts 的精选组合 |
| 色彩方案 | 161 套 | 与产品类型 1:1 对应的配色 |
| UX 准则 | 99 条 | 可访问性和交互设计最佳实践 |
| 落地页模式 | 24+ 种 | 转化优化的页面结构 |

每条行业规则包含 5 个维度（基于 BM25 排序）：
1. **推荐布局模式** — 最优落地页结构
2. **风格优先级** — 最匹配的 UI 风格类别
3. **色彩情绪** — 行业适配的配色方案
4. **字体气质** — 字体个性和搭配建议
5. **关键效果** — 动画和交互建议
6. **反模式** — 该行业应避免的设计

关键反模式示例：
- 银行产品不要用 AI 紫粉渐变
- 不用 emoji 当图标（用 SVG：Heroicons/Lucide）
- 尊重 `prefers-reduced-motion`
- 健康/养生类不用霓虹色
- 必须有 hover 态、键盘导航、focus 指示器

### 15.2 Impeccable

来源：https://github.com/pbakaus/impeccable（Apache 2.0）
安装：`npx skills add pbakaus/impeccable`

核心能力：设计质量检查 + 反 AI 套路，7 个维度 25+ 条检测规则。

| 维度 | 检查内容 |
|------|---------|
| 字体 | 烂大街字体检测（Inter/Arial/Geist/Space Grotesk 等）、层级不当、尺寸问题 |
| 颜色 | 灰色文字+彩色背景、纯黑/纯灰（应加色调偏移）、低对比度、渐变上放文字 |
| 间距 | 卡片套卡片、视觉层级弱、间距不一致、网格单调 |
| 动画 | 弹跳/弹性缓动（过时）、时序不当 |
| 响应式 | 缺少断点、非流式布局、移动端触摸目标太小 |
| 无障碍 | 缺 alt 文本、无 skip-to-content、focus-visible 样式差 |
| UX 文案 | 标签不清晰、错误信息含糊 |

关键概念：
- **PRODUCT.md** — 品牌个性、目标用户、用例、反参考
- **DESIGN.md** — 设计 token（颜色/字体/间距/圆角）、组件、视觉系统
- 支持 CLI 确定性检测（不依赖 LLM，可集成 CI）
- Chrome 扩展实时高亮反模式

### 15.3 分工与使用流程

| Skill | 使用时机 | 职责 |
|-------|---------|------|
| ui-ux-pro-max | 文档分析 + 页面生成 | 判断页面类型、匹配行业规则、推荐风格/配色/布局/字体 |
| Impeccable | 页面生成 + 迭代优化 | 反 AI 套路、质量检查、视觉层级/字体/间距/颜色把关 |

```
文档分析阶段：
  ui-ux-pro-max → 行业推理规则 + 页面类型判断 + 风格/配色/布局推荐

页面生成阶段：
  ui-ux-pro-max → 风格建议 + 字体搭配 + 落地页模式
  Impeccable → 质量规则 + 反模式约束

迭代优化阶段：
  Impeccable → 优化规则 + 检查清单
  ui-ux-pro-max → 确保优化不偏离行业风格
```

### 15.4 本地规则文件结构

```
lib/skills/
├─ ui-ux-pro-max/
│  ├─ generation-rules.md       # 页面生成时注入的核心规则
│  ├─ style-selection.md        # 67 种风格 + 选择逻辑
│  ├─ industry-rules.md         # 行业推理规则（精选最常用的 30-50 条）
│  ├─ typography.md             # 57 组字体搭配
│  ├─ color-palettes.md         # 常用配色方案
│  └─ anti-patterns.md          # 反模式清单
│
└─ impeccable/
   ├─ quality-rules.md          # 25+ 条质量检测规则
   ├─ typography-rules.md       # 字体反模式 + 推荐
   ├─ color-rules.md            # 色彩反模式 + OKLCH 指南
   ├─ layout-rules.md           # 布局反模式 + 间距规范
   └─ anti-ai-slop.md           # 专门针对 AI 生成内容的反套路规则
```

## 16. Agent Prompt 设计原则

### 16.1 通用 Prompt 策略

核心原则：**约束越具体，输出质量越高。**

- 用具体数值而非模糊形容词："768px 断点"而不是"响应式"，"WCAG AA 4.5:1 对比度"而不是"可访问"
- 明确反 AI 审美："避免通用 AI 生成风格，创造有辨识度的设计"
- 指定具体技术约束："CSS 内联在 `<style>`，JS 在 `<script>`，不依赖外部 CDN"
- 要求真实内容："基于 PRD 生成真实文案，不用 Lorem ipsum"
- 三步法优于一步到位：先结构 → 再视觉 → 最后无障碍/响应式

### 16.2 文档分析 Prompt

```
你是一位资深产品设计顾问。根据以下文档内容，分析并建议 3-5 个可以生成的 HTML 演示页面。

要求：
- 只基于文档内容和用户补充需求
- 每个建议包含：页面名称、用途、目标用户、主要模块列表、推荐视觉方向、复杂度
- 使用以下行业规则判断最适合的风格：{ui-ux-pro-max 行业规则}
- 不生成 HTML，只输出结构化 JSON
- JSON 格式严格按照 PageSuggestion 类型定义

文档内容：
{extractedText}

{如有原型图：用户提供了以下原型图作为视觉参考，请结合图片内容分析。}
```

### 16.3 页面生成 Prompt

```
你是一位顶级前端开发工程师 + UI 设计师。根据以下页面方案，生成一个完整的单文件 HTML 页面。

技术要求：
- 输出完整 HTML 文件（以 <!DOCTYPE html> 开头）
- 所有 CSS 内联在 <style> 中，可使用 CSS 变量保持一致性
- 少量 JS 可内联在 <script> 中（页面底部）
- 语义化 HTML：使用 <header>, <nav>, <main>, <section>, <footer>
- 响应式：mobile-first，断点 375px / 768px / 1024px / 1440px
- 不依赖构建工具，不引用本地路径
- 图片使用 unsplash.com URL 并添加 alt 文本

设计要求：
- 风格预设：{stylePreset}
- 遵循以下设计规则：{ui-ux-pro-max 风格建议}
- 遵循以下质量标准：{Impeccable 质量规则}
- 避免通用 AI 生成审美：不用 Inter/Arial 默认字体，不用紫粉渐变，不用卡片堆叠
- 使用有辨识度的配色方案（主色 + 强调色），不要保守均匀分配
- CSS transitions 用于交互元素（150-300ms），尊重 prefers-reduced-motion
- 无障碍：WCAG AA、proper labels、aria 属性、skip-to-content

内容要求：
- 基于 PRD 生成真实文案，不用 Lorem ipsum
- 所有文案使用中文（除非 PRD 明确要求其他语言）

页面方案：
{suggestion JSON}

原始文档摘要：
{extractedText}

{如有原型图：以下原型图作为视觉参考，尽量还原布局和元素位置。}

输出：只返回完整 HTML 代码，不要解释、不要 markdown 代码块标记。
```

### 16.4 迭代优化 Prompt（点选模式）

```
你是一位顶级前端开发工程师。用户在当前页面中选中了一个元素，并提出了优化意见。

当前完整 HTML：
{currentHtml}

选中元素：
- DOM 路径：{selectedElementPath}
- HTML 内容：{selectedElementHtml}
- 文本内容：{selectedElementText}

用户优化意见：
{userInstruction}

设计规则：
{Impeccable 优化规则}

要求：
- 理解完整页面上下文后，重点优化选中区域
- 保持整页风格一致，不破坏其他区域
- 返回完整 HTML（不是局部片段）
- 在 HTML 之后另起一行，用 <!-- CHANGE_SUMMARY: ... --> 注释说明变更内容

输出：只返回完整 HTML 代码。
```

### 16.5 迭代优化 Prompt（对话模式）

```
你是一位顶级前端开发工程师。用户希望对当前页面进行修改。

当前完整 HTML：
{currentHtml}

用户修改指令：
{userInstruction}

对话历史：
{history}

设计规则：
{Impeccable 优化规则}

要求：
- 理解完整页面后，按用户指令修改
- 保持整页风格一致
- 返回完整 HTML
- 在 HTML 之后另起一行，用 <!-- CHANGE_SUMMARY: ... --> 注释说明变更内容

输出：只返回完整 HTML 代码。
```

## 17. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 文档无法解析 | 提示用户换格式或粘贴文本 |
| 文档太长 | 先生成摘要，再分析页面建议 |
| Agent 输出不是合法 HTML | 自动要求 Agent 修复一次 |
| 优化后页面损坏 | 保留旧版本，失败版本不切换为当前版本 |
| 预览链接不存在 | 显示版本不存在或已删除 |
| Skill 读取失败 | 回退到默认现代 Web 风格规则 |

## 18. 性能预期

| 环节 | 目标耗时 | 超时上限 |
|------|----------|----------|
| 文档上传与文本抽取 | < 3 秒 | 10 秒 |
| 文档分析（页面建议） | 5–15 秒 | 30 秒 |
| HTML 页面生成 | 10–30 秒 | 60 秒 |
| 选中元素优化 | 8–20 秒 | 45 秒 |
| 预览页面加载 | < 500ms | 2 秒 |
| 版本回退 | < 1 秒 | 3 秒 |

超时策略：前端到达目标耗时后显示"仍在处理中"，到达上限后取消请求提示重试。

## 19. 工作台布局

```
┌─────────────────────────────────────────────────────────┐
│  DesignDraft          [项目名]          [风格 ▾] [版本 ▾] │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  输入区       │              预览区                       │
│  ┌──────────┐│    ┌──────────────────────────────┐      │
│  │文档上传   ││    │                              │      │
│  │.md .pdf ..││    │    生成的 HTML 预览            │      │
│  └──────────┘│    │    (iframe + 点选层)           │      │
│  ┌──────────┐│    │                              │      │
│  │文本输入   ││    └──────────────────────────────┘      │
│  │          ││                                          │
│  └──────────┘│    ┌──────────────────────────────┐      │
│  ┌──────────┐│    │ 对话式修改 / 点选修改意见       │      │
│  │原型图上传 ││    │ "把导航栏改成深色..."           │      │
│  │[图1][图2] ││    └──────────────────────────────┘      │
│  └──────────┘│    [查看源码] [下载 HTML] [分享链接]       │
│              │                                          │
│  ── 页面建议 ──│    ── 版本历史 ──                        │
│  □ 产品落地页 │    v3 ← 优化首屏    当前                  │
│  ■ 功能对比页 │    v2 ← 改配色                           │
│  □ 定价页面  │    v1 ← 初始生成    [回退]                │
│              │                                          │
│  [生成页面]   │                                          │
├──────────────┴──────────────────────────────────────────┤
│  © DesignDraft                                            │
└─────────────────────────────────────────────────────────┘
```

## 20. 实施里程碑

### M1：基础工作台 + 存储
- Next.js 项目初始化（Tailwind + shadcn/ui）
- 项目 CRUD
- 文档上传 + 文本输入 + 原型图上传
- 文档解析（.md/.txt/.pdf/.docx）
- 本地文件系统存储

### M2：文档分析 + 页面建议
- 接入 Pi Agent（多模型支持）
- AgentRuntimeAdapter 接口实现（PiAgentRuntime 为默认）
- 模型/Provider 配置管理（用户可选 DeepSeek/Claude/OpenAI 等）
- 文档分析 → 3-5 个页面建议
- 页面建议列表 UI

### M3：HTML 生成 + 预览
- 风格选择器
- HTML 页面生成（流式 SSE）
- UI Skill 规则集成（ui-ux-pro-max + Impeccable）
- 预览路由 + iframe 预览
- 版本保存

### M4：迭代优化 + 版本管理 + 分享
- 元素点选交互层
- 点选优化 API
- 对话式迭代 API + UI
- 版本历史列表 + 版本回退
- 源码查看器 + 下载
- 分享链接生成（限时 + 可选密码）
- 分享页面 + 分享管理

### M5：安全 + 部署
- 预览安全策略（CSP、sandbox）
- 并发控制
- Dockerfile + docker-compose
- 环境变量管理
- 部署验证

## 21. 验证计划

1. 上传 .md/.txt/.pdf/.docx 均能正确抽取文本
2. 上传原型图能传入 Agent 作为视觉参考
3. 文档分析稳定输出 3-5 个页面建议
4. 选择建议后能流式生成完整 HTML
5. 预览链接可直接访问
6. 点选元素能准确捕获信息并触发优化
7. 对话式修改保留上下文
8. 每次修改产生新版本，版本可回退
9. 下载的 HTML 可独立运行
10. 分享链接可公网访问，密码和过期机制正常
11. Docker 构建和部署正常

## 22. 后续扩展（v2+）

- 临时子域名预览
- 多模型生成对比
- 多页面原型项目
- 从 HTML 升级到 Next.js / React 项目
- 截图标注式优化
- UI skill 在线更新
- 团队协作和评论
- React 组件代码生成
- 多 agent 编排

## 23. 可借鉴的开源项目

按优先级排列：

| 优先级 | 项目 | 学什么 | License |
|--------|------|--------|---------|
| 第一 | [OpenUI](https://github.com/wandb/openui) | UI 生成和实时预览 | Apache 2.0 |
| 第一 | [GrapesJS](https://github.com/GrapesJS/grapesjs) | 元素点选和页面结构管理 | BSD 3-Clause |
| 第一 | [Dyad](https://github.com/dyad-sh/dyad) | AI app builder 的项目工作流 | MIT |
| 第二 | [screenshot-to-code](https://github.com/abi/screenshot-to-code) | 视觉输入和标注（v2） | MIT |
| 第二 | [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) | 复杂 agent 生成和运行环境 | MIT |
| 第二 | [Webstudio](https://github.com/webstudio-is/webstudio) | 长期网站构建器架构 | AGPL-3.0（不复制代码） |

原则：以学习思路和交互模式为主，不直接复制大段代码。引入组件时优先选 MIT / Apache 2.0 项目。

## 24. 参考资料

- Pi Coding Agent：https://pi.dev/
- Next.js Route Handlers：https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware
- ui-ux-pro-max-skill：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Impeccable：https://impeccable.style/
