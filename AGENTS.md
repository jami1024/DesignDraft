# DesignDraft — Agent 协作规范

本文件供所有 AI coding agent（Claude Code、Pi Agent、Codex、Cursor 等）在参与 DesignDraft 项目开发时遵守。

---

## 项目概述

DesignDraft 是一个 Web 应用，用户通过输入文字需求、上传 PRD 文档或原型图来描述产品，AI 分析后建议页面方案，生成可交互的 HTML 演示页面，支持点选或对话式迭代优化。

- **技术栈**：Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **AI 运行时**：Pi Agent（多模型：DeepSeek / Claude / OpenAI）
- **存储**：本地文件系统（.workspace/）
- **部署**：Docker + 自有服务器

## 核心文档

开始工作前必须阅读以下文档：

| 文档 | 路径 | 内容 |
|------|------|------|
| 产品与技术设计 | `docs/design.md` | 架构、数据模型、API、流程、Prompt 模板 |
| UI 设计规范 | `docs/ui-spec.md` | 配色、字体、间距、组件样式、亮暗模式 |
| 任务规划 | `docs/tasks.md` | 24 个任务的详情、依赖关系 |

## 代码规范

### 语言与框架

- TypeScript strict mode，不使用 `any`
- Next.js App Router（不使用 Pages Router）
- React Server Components 优先，仅在需要交互时使用 `"use client"`
- 所有 API 路由使用 Route Handlers（`app/api/**/route.ts`）

### 命名

- 文件名：kebab-case（`document-upload.tsx`、`pi-runtime.ts`）
- 组件名：PascalCase（`DocumentUpload`、`PreviewPanel`）
- 函数/变量：camelCase（`analyzeDocument`、`pageVersion`）
- 类型名：PascalCase（`PageSuggestion`、`ShareLink`）
- 常量：UPPER_SNAKE_CASE（`MAX_FILE_SIZE`、`SSE_TIMEOUT`）

### 样式

- 使用 Tailwind CSS utility classes，不写自定义 CSS（除非 Tailwind 无法实现）
- 使用 shadcn/ui 组件作为基础，按 `docs/ui-spec.md` 定制
- 颜色使用 `primary-*` 和 `warm-gray-*` 自定义色值，不使用 Tailwind 默认灰色
- 支持亮暗双模式：使用 `dark:` 前缀
- 中文界面，所有用户可见文字使用中文

### 项目结构

```
designdraft/
├── app/              # 页面和 API 路由
├── components/       # React 组件
│   ├── ui/           # shadcn/ui 基础组件
│   └── workbench/    # 工作台业务组件
├── lib/              # 工具库和业务逻辑
│   ├── agent/        # Agent 运行时
│   └── skills/       # UI Skill 规则文件
├── types/            # TypeScript 类型定义
├── .workspace/       # 运行时数据（gitignore）
└── docs/             # 项目文档
```

不要随意创建新的顶层目录。新文件放到上述既定目录中。

### 类型定义

- 所有共享类型定义在 `types/index.ts`
- API 请求/响应体使用类型约束
- 不使用 `enum`，使用 union type（`"low" | "medium" | "high"`）

### API 规范

- RESTful 风格
- 请求体/响应体使用 JSON
- 流式接口使用 SSE（`text/event-stream`）
- 错误响应统一格式：`{ error: string, message: string }`
- 参考 `docs/design.md` 第 11 章的 API 设计

### 安全

- 不在客户端暴露 API Key 或密钥
- 文件上传限制白名单格式和大小（≤10MB）
- 预览路由设置 CSP 响应头
- iframe 使用 sandbox 属性
- 分享密码使用 bcrypt 哈希存储
- 路径参数做遍历防护，不允许读取项目目录之外的文件

## 工作流程

### 开始新任务前

1. 阅读 `docs/tasks.md` 确认任务详情和依赖
2. 阅读 `docs/design.md` 中对应章节
3. 如涉及 UI，阅读 `docs/ui-spec.md`
4. 检查相关已有代码，理解上下文

### 提交代码

- 每个任务单独提交，commit message 格式：`feat(M1.1): 初始化 Next.js 项目`
- 前缀：`feat` 新功能 / `fix` 修复 / `refactor` 重构 / `docs` 文档 / `chore` 配置
- 括号内标注任务编号
- 不提交 `.workspace/`、`.env.local`、`node_modules/`

### 并行工作

- 多个 agent 可能并行工作，只修改自己任务涉及的文件
- 不要回滚或删除其他 agent 的代码
- 类型定义（`types/index.ts`）是共享文件，修改时注意不覆盖他人的改动
- 发现冲突时优先沟通，不要强制覆盖

## 质量要求

- 代码可通过 `tsc --noEmit`（无类型错误）
- 组件可通过 `npm run dev` 正常渲染
- API 接口可通过 curl/fetch 调用并返回预期结果
- UI 在亮色和暗色模式下均正常显示
- 响应式布局在 768px 和 1280px 断点正常
