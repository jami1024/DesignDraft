# DesignDraft

输入需求（文字/文档/原型图） → AI 分析并建议页面方案 → 生成可交互的 HTML 演示页面 → 点选或对话式迭代优化。

## 功能特性

- 支持上传 `.md`、`.txt`、`.pdf`、`.docx` 文档或直接输入文本需求
- 支持上传原型图辅助分析
- AI 分析需求，给出 3–5 个可生成页面建议
- 选择页面建议 + 风格预设后，流式生成单文件 HTML 页面
- 实时预览（sandboxed iframe）+ 独立预览链接
- 点选页面元素精准修改，或对话式自然语言迭代优化
- 版本历史管理、回退、下载 HTML
- 生成带时效 + 可选密码保护的分享链接

## 技术选型

| 层 | 技术 | 选型理由 |
|----|------|----------|
| 框架 | Next.js 14 (App Router) + TypeScript | 全栈一体，同时承载工作台 UI、预览路由和 API |
| 样式 | Tailwind CSS + shadcn/ui | 快速构建美观 UI，组件可定制 |
| AI 运行时 | Pi Agent (pi-mono) | 原生多模型路由（DeepSeek / Claude / OpenAI / Gemini），MIT 开源，可编程工作流 |
| 预览 | sandboxed iframe + 独立预览路由 | 安全隔离渲染用户生成的 HTML |
| 文件存储 | 本地文件系统 (.workspace/) | v1 简单可靠，未来可换对象存储 |
| 文档解析 | pdf-parse / mammoth | 抽取 .pdf / .docx 文本内容 |
| 测试 | Vitest + Testing Library | 轻量快速，与 Next.js 生态兼容 |
| 部署 | Docker + docker-compose | 自有服务器一键部署 |

**核心原则**：文档解析、文件读写、版本保存等关键步骤由后端确定性执行；Agent 负责理解、规划、生成和优化；不把文件路径操作交给模型自由决定，避免不可控行为。

## 技术架构

```
Next.js Web App
├─ Workbench UI（工作台）
│  ├─ 项目列表 / 创建项目
│  ├─ 文档上传 + 文本输入 + 原型图上传
│  ├─ 页面建议列表 + 风格选择器
│  ├─ 预览面板（iframe + 元素点选层）
│  ├─ 对话式迭代面板
│  └─ 版本历史面板
│
├─ Preview Routes（预览路由）
│  ├─ /previews/[projectId]/[pageId]/[version]  → 内部预览
│  └─ /share/[shareToken]                        → 外部分享
│
├─ API Routes（RESTful + SSE 流式）
│  ├─ /api/projects                → 项目 CRUD
│  ├─ /api/documents/upload        → 文档上传
│  ├─ /api/documents/analyze       → AI 分析需求
│  ├─ /api/pages/generate          → 流式生成页面
│  ├─ /api/pages/optimize-*        → 点选/对话式优化
│  └─ /api/pages/[pageId]/share    → 分享管理
│
├─ Agent Runtime Layer（Agent 运行时）
│  ├─ AgentRuntimeAdapter         → 统一接口
│  ├─ PiAgentRuntime              → 生产环境（多模型）
│  └─ LightweightModelRuntime     → 开发测试（mock）
│
├─ Skill Layer（技能层）
│  ├─ web-landing / dashboard / pitch-page  → 页面类型规则
│  └─ 视觉方向系统                           → 风格引导
│
└─ Workspace Storage（本地存储）
   └─ .workspace/projects/{projectId}/...
```

### 数据流

```
用户输入需求 → 文档解析（后端） → Agent 分析生成建议
    → 用户选择建议 + 风格 → Agent 流式生成 HTML（SSE）
    → iframe 实时预览 → 用户点选/对话迭代 → Agent 优化
    → 版本保存 → 可分享/下载
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone git@github.com:jami1024/DesignDraft.git
cd DesignDraft

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写 API Key

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

### 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试
```

### Docker 部署

```bash
docker compose up -d
```

## 项目结构

```
├── app/             # Next.js App Router 页面与 API 路由
├── components/      # React 组件
├── lib/             # 工具函数与核心逻辑
├── types/           # TypeScript 类型定义
├── public/          # 静态资源
├── docs/            # 项目文档
└── .workspace/      # 运行时数据（已 gitignore）
```

## Agent 架构学习指南

本项目是一个完整的 AI Agent 应用实践，适合学习以下 Agent 开发模式：

### 核心架构

```
lib/agent/
├── adapter.ts              # Agent 运行时接口定义（适配器模式）
├── model-config.ts         # 多模型配置与提供商管理
├── prompts.ts              # Prompt 工程（多角色、多场景模板）
├── pi-runtime.ts           # Pi Agent 运行时（生产实现）
└── lightweight-runtime.ts  # 轻量级运行时（开发/测试用 mock）
```

### 关键设计模式

#### 1. 适配器模式（Adapter Pattern）

通过 `AgentRuntimeAdapter` 接口抽象 Agent 能力，支持灵活切换底层模型：

```typescript
interface AgentRuntimeAdapter {
  analyzeDocument(params): Promise<PageSuggestion[]>;   // 文档分析
  generatePage(params): AsyncGenerator<string, string>; // 流式生成
  optimizePage(params): AsyncGenerator<string, string>; // 迭代优化
}
```

#### 2. 多模型支持

通过环境变量配置不同的 AI 提供商（OpenAI / Claude / DeepSeek），无需修改业务代码：

```bash
DESIGNDRAFT_AGENT_PROVIDER=anthropic
DESIGNDRAFT_AGENT_MODEL=claude-sonnet-4-6
DESIGNDRAFT_AGENT_API_KEY=your-key
```

#### 3. Prompt 工程实践

`prompts.ts` 展示了生产级 Prompt 设计：
- **角色定义**：为不同任务设定专属 Agent 角色
- **结构化输出**：约束 AI 输出为可解析的 JSON 格式
- **上下文注入**：动态加载 Skill 规则影响生成结果
- **视觉方向系统**：用自然语言描述设计风格，引导 AI 生成

#### 4. 流式输出（Streaming）

使用 `AsyncGenerator` 实现 SSE 流式响应，提供实时生成反馈：

```typescript
async *generatePage(params): AsyncGenerator<string, string> {
  // 逐块 yield 内容，前端实时渲染
  for (const chunk of chunks) {
    yield chunk;
  }
  return fullHtml;
}
```

#### 5. 渐进式迭代

支持两种 Agent 交互范式：
- **点选优化**：用户选中元素 + 输入指令 → Agent 精准修改局部
- **对话式优化**：维护对话历史 → Agent 理解上下文持续迭代

### 学习路径建议

1. **入门**：阅读 `lib/agent/adapter.ts`，理解 Agent 接口抽象
2. **Prompt**：研究 `lib/agent/prompts.ts`，学习多场景 Prompt 模板设计
3. **运行时**：对比 `lightweight-runtime.ts`（mock）和 `pi-runtime.ts`（生产），理解适配器切换
4. **API 层**：查看 `app/api/documents/analyze/route.ts`，理解 Agent 如何集成到 Web 应用
5. **进阶**：阅读 `docs/design.md` 完整产品设计，理解 Agent 在产品中的定位

### 延伸学习方向

| 方向 | 本项目实践 | 可深入探索 |
|------|-----------|-----------|
| Prompt Engineering | 多角色模板、结构化输出 | Few-shot、CoT、ReAct |
| 流式交互 | SSE + AsyncGenerator | WebSocket、Streaming UI |
| 多模型切换 | Provider 适配器 | 路由策略、fallback 机制 |
| Agent 迭代 | 点选/对话式优化 | 工具调用、多步推理 |
| 上下文管理 | Skill 规则注入 | RAG、向量检索、记忆系统 |

## 目标用户

产品经理、设计师、开发者，尤其适合非技术人员快速将需求转化为可交互的页面原型。

## 许可证

MIT
