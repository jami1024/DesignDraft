# DesignDraft — 任务规划

共 24 个任务，按 5 个里程碑组织。

---

## M1：基础工作台 + 存储（7 个任务）

### #1 初始化 Next.js 项目
- **依赖**：无（起点）
- **内容**：使用 create-next-app 创建项目，配置 TypeScript + Tailwind CSS + shadcn/ui，安装核心依赖（nanoid、bcryptjs 等），创建基础目录结构，配置 .env.local 模板

### #2 本地文件系统存储层
- **依赖**：#1
- **内容**：实现 lib/storage.ts：.workspace/ 目录结构管理，项目目录创建/读取/删除，JSON metadata 读写，文件路径工具函数。对应 design.md 第 9 章

### #3 数据类型定义
- **依赖**：#1
- **内容**：实现 types/index.ts：定义 Project、SourceDocument、PageSuggestion、GeneratedPage、PageVersion、SelectionOptimizationRequest、ShareLink 等所有类型。对应 design.md 第 7 章

### #4 项目管理 API
- **依赖**：#2, #3
- **内容**：实现 /api/projects 路由：POST 创建项目、GET 项目列表、GET 项目详情、DELETE 删除项目（级联删除）。对应 design.md 第 11.1 章

### #5 项目列表首页 UI
- **依赖**：#4
- **内容**：实现 app/page.tsx 项目列表页面：展示所有项目卡片、创建新项目按钮/对话框、删除项目、点击进入工作台。中文界面

### #6 文档上传与解析
- **依赖**：#2, #3
- **内容**：实现文档上传 API（/api/documents/upload、/api/documents/text-input）、文档解析器 lib/document-parser.ts（支持 .md/.txt/.pdf/.docx 文本抽取），安装 pdf-parse、mammoth 等依赖。对应 design.md 第 10.1 和 11.2 章

### #7 工作台基础布局
- **依赖**：#5, #6
- **内容**：实现 app/projects/[projectId]/page.tsx 工作台页面：左侧输入区（文档上传 + 文本输入 + 原型图上传组件）、右侧预览区（占位）、底部操作栏。对应 design.md 第 19 章

---

## M2：文档分析 + 页面建议（5 个任务）

### #8 Agent Runtime Adapter 接口与 Pi Agent 集成
- **依赖**：#7
- **内容**：实现 lib/agent/adapter.ts（AgentRuntimeAdapter 接口）和 lib/agent/pi-runtime.ts（PiAgentRuntime 默认实现）、lib/agent/model-config.ts（模型/Provider 配置）。接入 Pi Agent，支持 DeepSeek/Claude/OpenAI 多模型切换。对应 design.md 第 8 章

### #9 UI Skill 规则文件
- **依赖**：#1（可与 M1 其他任务并行）
- **内容**：整理并内置 ui-ux-pro-max 和 Impeccable 的核心规则到 lib/skills/ 目录：行业推理规则（精选 30-50 条）、风格库、字体搭配、反模式清单、质量检测规则。对应 design.md 第 15 章

### #10 Prompt 模板实现
- **依赖**：#8, #9
- **内容**：实现 lib/agent/prompts.ts：文档分析 Prompt、页面生成 Prompt、点选优化 Prompt、对话优化 Prompt，包含 Skill 规则注入逻辑和风格预设注入。对应 design.md 第 16 章

### #11 文档分析 API
- **依赖**：#10
- **内容**：实现 /api/documents/analyze 路由：接收 projectId + documentId，读取抽取文本 + 原型图，调用 Agent analyzeDocument，返回 3-5 个 PageSuggestion。对应 design.md 第 10.2 和 11.3 章

### #12 页面建议列表 UI
- **依赖**：#11
- **内容**：实现 components/workbench/suggestion-list.tsx：展示 AI 返回的 3-5 个页面建议卡片（名称、用途、模块、复杂度、视觉方向），用户可选择一个进入生成流程

---

## M3：HTML 生成 + 预览（4 个任务）

### #13 风格选择器
- **依赖**：#12
- **内容**：实现 lib/styles.ts（风格预设定义：简约/商务/科技/活泼/自定义）和 components/workbench/style-selector.tsx UI 组件

### #14 HTML 页面生成 API（流式 SSE）
- **依赖**：#10, #13
- **内容**：实现 /api/pages/generate 路由：接收 projectId + suggestionId + stylePreset，组装上下文（文档 + 方案 + Skill 规则 + 风格），调用 Agent generatePage，通过 SSE 推送进度和结果，保存为 v1 版本。对应 design.md 第 10.3、11.4、12 章

### #15 预览路由
- **依赖**：#2（可提前做）
- **内容**：实现 app/previews/[projectId]/[pageId]/[version]/route.ts：校验存在性、读取 HTML、设置安全响应头（CSP/X-Frame-Options/nosniff），返回 text/html。对应 design.md 第 14 章

### #16 预览面板与生成进度 UI
- **依赖**：#14, #15
- **内容**：实现 components/workbench/preview-panel.tsx（sandboxed iframe 预览）和 progress-indicator.tsx（SSE 进度展示：读取文档→分析→生成→完成）。对应 design.md 第 12、19 章

---

## M4：迭代优化 + 版本管理 + 分享（5 个任务）

### #17 元素点选交互层
- **依赖**：#16
- **内容**：在预览 iframe 中实现轻量元素选择功能：注入选择脚本（不修改用户 HTML），捕获 DOM path、outerHTML、innerText、bounding box，通过 postMessage 与工作台通信。对应 design.md 第 10.4 章

### #18 点选优化 + 对话迭代 API
- **依赖**：#17
- **内容**：实现 /api/pages/optimize-selection 和 /api/pages/optimize-chat 路由：读取完整 HTML + 上下文，调用 Agent optimizePage（点选传 selectedElement，对话传 history），SSE 返回，保存新版本。对应 design.md 第 11.5 章

### #19 对话迭代面板 UI
- **依赖**：#18
- **内容**：实现 components/workbench/chat-panel.tsx：对话输入框、对话历史展示、点选元素信息显示、发送修改请求、SSE 进度反馈

### #20 版本管理 API + UI
- **依赖**：#18
- **内容**：实现版本列表 API（GET /api/pages/[pageId]/versions）、版本回退 API（POST /api/pages/[pageId]/rollback）、下载 API（GET .../download）。实现 components/workbench/version-history.tsx 和 code-viewer.tsx。对应 design.md 第 11.6 章

### #21 分享链接功能
- **依赖**：#20
- **内容**：实现分享 API（创建/查看/撤销分享链接）、分享页面 app/share/[token]/page.tsx（密码验证、过期提示、HTML 展示）、密码验证 API。对应 design.md 第 13 章

---

## M5：安全 + 部署（3 个任务）

### #22 安全加固
- **依赖**：#21
- **内容**：实现：预览 CSP 响应头、iframe sandbox 配置、文件上传白名单 + 大小限制（≤10MB）、路径遍历防护、并发控制（versionId 校验 + 409 Conflict）、部署模式 cookie 会话认证。对应 design.md 第 14 章

### #23 Docker 部署配置
- **依赖**：#22
- **内容**：编写 Dockerfile（多阶段构建）、docker-compose.yml（环境变量、端口映射、.workspace 卷挂载）、.env.example 模板、构建和运行验证

### #24 端到端验证
- **依赖**：#23
- **内容**：按 design.md 第 21 章验证计划逐项测试：文档上传解析、原型图输入、文档分析、HTML 生成、预览、点选优化、对话迭代、版本回退、下载、分享链接、Docker 部署

---

## 依赖关系图

```
M1 基础工作台
  #1 初始化项目
  ├─→ #2 存储层 ─────────────────────────────→ #15 预览路由 ─┐
  ├─→ #3 类型定义                                            │
  │    ├─→ #4 项目 API → #5 项目列表 UI ─┐                   │
  │    └─→ #6 文档上传与解析 ────────────┤                   │
  │                                      ↓                   │
  └─→ #9 Skill 规则 ──┐           #7 工作台布局              │
                       │                 ↓                    │
M2 文档分析            │           #8 Pi Agent 集成           │
                       ↓                 ↓                    │
                  #10 Prompt 模板 ←──────┘                   │
                       ↓                                      │
                  #11 文档分析 API                            │
                       ↓                                      │
                  #12 页面建议 UI                             │
                       ↓                                      │
M3 生成 + 预览    #13 风格选择器                              │
                       ↓                                      │
                  #14 生成 API（SSE）                         │
                       ↓                                      │
                  #16 预览面板 UI ←───────────────────────────┘
                       ↓
M4 迭代 + 版本    #17 元素点选
                       ↓
                  #18 优化 API
                    ├──→ #19 对话面板 UI
                    └──→ #20 版本管理
                              ↓
                         #21 分享功能
                              ↓
M5 安全 + 部署    #22 安全加固
                       ↓
                  #23 Docker 配置
                       ↓
                  #24 端到端验证
```

## 可并行的任务

以下任务在依赖满足后可以并行开发：

- **#2 + #3**：存储层和类型定义可同时进行（都只依赖 #1）
- **#4 + #6**：项目 API 和文档上传可同时进行（都依赖 #2, #3）
- **#9**：Skill 规则整理只依赖 #1，可在 M1 期间提前做
- **#15**：预览路由只依赖 #2，可在 M2 期间提前做
- **#19 + #20**：对话面板和版本管理都依赖 #18，可并行
