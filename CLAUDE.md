# DesignDraft — Claude Code 项目规范

本文件供 Claude Code 在本项目中工作时遵守。

---

## 项目简介

DesignDraft：输入需求（文字/文档/原型图） → AI 分析并建议页面方案 → 生成可交互 HTML 演示页面。Next.js 14 + TypeScript + Tailwind + shadcn/ui。

## 必读文档

每次开始工作前，根据任务类型阅读对应文档：

- `docs/design.md` — 产品与技术设计（架构、数据模型、API、Prompt 模板）
- `docs/ui-spec.md` — UI 设计规范（**所有页面开发必读**）
- `docs/tasks.md` — 任务规划与依赖关系
- `AGENTS.md` — 代码规范与协作规则

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run lint         # ESLint 检查
npx tsc --noEmit     # 类型检查
```

## UI 开发要点

页面开发**必须参考 `docs/ui-spec.md`**，以下是关键约定：

### 配色

- 品牌主色：`primary-500` (#3B82F6) 到 `primary-700` (#1D4ED8)
- 中性色：`warm-gray-*` 系列（不使用 Tailwind 默认 gray/slate/zinc）
- 亮暗双模式：所有组件必须同时定义 `dark:` 样式

### 字体

```
中文: "Noto Sans SC"
英文: "Inter"
代码: "JetBrains Mono"
```

### 组件样式速查

```
主按钮:   bg-primary-600 text-white hover:bg-primary-700 rounded-md px-4 py-2 font-semibold text-sm
次按钮:   bg-white border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-100 rounded-md
输入框:   bg-white border border-warm-gray-200 rounded-md px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
卡片:     bg-white border border-warm-gray-200 rounded-lg shadow-warm-sm hover:shadow-warm-md
标签:     bg-primary-50 text-primary-700 rounded-sm px-2 py-0.5 text-xs font-medium
```

暗色模式对应：
```
主按钮:   dark:bg-primary-500 dark:hover:bg-primary-400
次按钮:   dark:bg-warm-gray-800 dark:border-warm-gray-700 dark:text-warm-gray-200 dark:hover:bg-warm-gray-700
输入框:   dark:bg-warm-gray-800 dark:border-warm-gray-700 dark:focus:border-primary-400 dark:focus:ring-primary-400/20
卡片:     dark:bg-warm-gray-800 dark:border-warm-gray-700
标签:     dark:bg-primary-900/30 dark:text-primary-300
```

### 间距约定

```
按钮内边距:    px-4 py-2（小按钮 px-3 py-1.5）
卡片内边距:    p-4 或 p-6
卡片间距:      gap-4
输入框内边距:  px-3 py-2
页面边距:      px-6 py-8
侧边栏宽度:    w-80
```

### 图标

使用 Lucide Icons（`lucide-react`），线性风格。常用映射见 `docs/ui-spec.md` 第 7 章。

### 动效

```
hover/focus:  transition-colors duration-150
面板切换:     transition-all duration-200
模态弹出:     transition-all duration-200 (opacity + scale)
```

所有动效添加 `motion-reduce:transition-none` 兼容。

## 代码风格

- TypeScript strict，不用 `any`
- 文件名 kebab-case，组件名 PascalCase
- React Server Components 优先，交互组件加 `"use client"`
- 颜色只用 `primary-*` 和 `warm-gray-*`，不用默认灰色
- 所有用户可见文字使用**中文**
- 不写多余注释，代码自解释

## 文件存储

- 运行时数据在 `.workspace/`（已 gitignore）
- 项目数据路径：`.workspace/projects/{projectId}/`
- 分享数据路径：`.workspace/shares/shares.json`
- 不要在 `.workspace/` 之外写入运行时数据

## API 路由

所有 API 在 `app/api/` 下，RESTful 风格。流式接口用 SSE。错误统一 `{ error, message }` 格式。详见 `docs/design.md` 第 11 章。

## Git 规范

- commit 格式：`feat(M1.1): 描述`
- 前缀：feat / fix / refactor / docs / chore
- 不提交：`.workspace/`、`.env.local`、`node_modules/`
- 每个任务独立 commit
- 不回滚其他开发者/agent 的改动

## 注意事项

- 修改 `types/index.ts` 时注意不覆盖已有类型
- `.env.local` 中存放 API Key，不提交到仓库
- 预览 HTML 在 sandboxed iframe 中渲染，注意 CSP 头
- 分享密码用 bcrypt 哈希，不存明文
