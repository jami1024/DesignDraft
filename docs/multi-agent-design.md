# DesignDraft 多 Agent 协同设计方案（讨论稿 v1）

> 状态：**讨论中,未实现**。本文是把"需求 → 多 Agent 协同 → 生成网页"的目标态写清楚,作为后续实现的契约。
> 调研来源:商业标杆(v0 / Lovable / Bolt / Orchids)+ 高 star OSS(screenshot-to-code 73k / open-lovable 27k / OpenUI 22k / Dyad 21k / bolt.diy 20k / make-real 5k)+ 设计 skill(Impeccable 38k / ui-ux-pro-max / refactoring-ui)+ 多 agent 框架(CrewAI / AutoGen / LangGraph reflection)。

---

## 0. 已锁定的技术选型(决策已定)

| 维度 | 决定 | 理由 |
|---|---|---|
| 产品形态 | **不断长大的多文件应用**(非一次性原型) | 用户明确目标 |
| 后端 | **纯前端**(无 API/DB/服务端) | 用户明确;决定了预览可用浏览器内方案 |
| 产物 | **多文件 React 工程**:Vite + React + TS + Tailwind + shadcn/ui | 组件化、可长期演进;shadcn 给质量打底 |
| 预览运行时 | **Sandpack**(CodeSandbox,浏览器内打包) | 纯前端足够;MIT、不吃服务器;v0 因要后端才弃浏览器预览,纯前端不受此限 |
| 版本/存储 | **每个项目一个 git 仓库**(版本=commit,回退/diff 免费) | "长大的应用"天然适合 git;也直接支持导出可交付工程 |
| 优化上下文 | **按文件隔离**:文件索引 + 路由 agent 选相关文件再读 | 解决"大单文件全量读"的成本/质量问题 |

> 单文件 HTML 管线(iframe 预览 / `vN.html` / 静态分享)**整体废弃**,改为下方多文件架构。这是一次正式的架构升级。

---

## 1. 目标流程(带"用户确认门")

```
用户输入文字
   │
   ▼
① 沟通澄清 Agent ──(需求模糊?最多问 2-3 个关键问题)──┐
   │  收敛足够后                                       │ 用户回答
   ▼ ◄───────────────────────────────────────────────┘
② 需求分析 Agent → 写 PRODUCT.md(结构化需求契约)
   │
   ▼
③ UI 设计规划 Agent → 写 DESIGN.md(2-3 个设计方向 + 设计系统)
   │
   ▼
   ╳═══ 用户确认门:展示方向,用户选定/微调后才继续 ═══╳   ← "确认后再生成"
   │
   ▼
④ HTML 生成 Agent ──流式──► 单文件 HTML
   │                          ▲
   ▼                          │ 不合格 → 结构化反馈打回(最多 N 轮)
   ├─ detect 静态 lint gate(不耗 token,先扫)
   ▼                          │
⑤ 样式质检 Agent(audit rubric)┘
   │ 通过
   ▼
呈现给用户 → 点选/对话迭代 → ⑥ 优化 Agent(surgeon 式精准改)
```

核心原则(沿用项目既有理念):**后端确定性执行编排与落盘,Agent 只负责理解/规划/生成/评审**。新增的 `detect` 静态门禁强化了"确定性优先、LLM 兜底"。

---

## 2. Agent 团队名册

每个 Agent 有:独立 system prompt、模型档位、输入/输出契约、挂载的 Impeccable 资产。

| # | Agent | 职责 | 模型档 | 输入 → 输出 | 挂载的 Impeccable 资产 |
|---|---|---|---|---|---|
| ① | 沟通澄清 | 把模糊需求问清,收敛即停 | 快 | 用户文字 → 澄清问答 | `clarify.md`(问题分类法) |
| ② | 需求分析 | 文档/对话 → 结构化需求 | 推理 | 文本+澄清 → **PRODUCT.md** | Register 二分法 |
| ③ | UI 设计规划 | 出设计方向 + 设计系统 | 推理 | PRODUCT.md → **DESIGN.md**(2-3 方向) | `brand.md`/`product.md`、`color-and-contrast.md`、`spatial-design.md`、SKILL.md 配色策略四档 |
| ④ | HTML 生成 | 设计方案 → 单文件 HTML(流式) | 快/强 | DESIGN.md+选定方向 → HTML | SKILL.md Absolute bans、`brand.md` 字体黑名单、`typography.md`/`layout.md`、`ux-writing.md` |
| ⑤ | 样式质检 | rubric 打分 + 结构化反馈 | 中,**temp=0** | HTML → 评审 JSON | `audit.md`(5 维 0-4 量规)、SKILL.md AI slop test |
| ⑥ | 优化迭代 | 点选/对话式精准改 | 快 | HTML+指令 → 改后 HTML | surgeon 纪律 + 按需挂 `bolder/quieter/distill/adapt/delight/harden/animate/colorize` |

> 名册是**目标态**。落地可合并(②③合一、⑤先用"生成内自检"轻量版),不必一次到位。

---

## 3. 横切机制(全队共享)

### 3.1 Register 顶层路由(Impeccable 地基,最高性价比)
一句话需求进来,②先判定 **brand**(营销/落地/品牌/作品集:设计即产品)还是 **product**(应用/后台/工具:设计服务产品),写进 PRODUCT.md。③④⑤⑥ 全部据此切换策略表。
> 项目现有代码已有 `register` 字段,只需**提升为顶层路由**,所有 Agent 读取。

### 3.2 反 AI slop 三件套(喂给 ④ 生成 + ⑤ 评审)
1. **Absolute bans**(SKILL.md):禁侧条边框、渐变文字、默认 glassmorphism、hero-metric 模板、千篇一律卡片网格、modal 优先。
2. **AI slop test**(SKILL.md):两个 altitude——"能否仅凭品类猜出主题+配色"(first-order)、"能否靠品类+反例猜出美学家族"(second-order),猜得出就返工。
3. **字体/美学黑名单**(`brand.md`):禁 Inter/Roboto/Playfair/Fraunces 等训练数据默认字体 + 已饱和美学车道。
> 再补 make-real 的**可执行黑名单 + BAD/GOOD 对照**:禁 `#3b82f6` 默认蓝、禁 `max-w-md mx-auto` 整页居中卡片、禁设备外框、禁渐变背景、禁 arbitrary Tailwind 值。

### 3.3 detect 静态 lint gate(④→⑤ 之间,不耗 token)
生成的 HTML 先过**确定性正则/AST 扫描**(命中 Absolute bans 就打回),LLM 评审只处理规则抓不到的主观问题。**比纯 LLM 评审便宜、稳定。**

### 3.4 生成↔质检循环(LangGraph reflection 模式)
⑤ 用固定 rubric 输出结构化反馈打回 ④,带 `revision_number` 计数器,N 轮强制退出防死循环;⑤ 用 temp=0 让判定可复现。反馈 schema:
```json
{ "verdict": "PASS | NEEDS_REVISION",
  "scores": {"hierarchy":0-5,"spacing":0-5,"contrast_a11y":0-5,"responsive":0-5,"copy":0-5,"anti_ai_slop":0-5},
  "issues": [{"severity":"high|medium|low","area":"spacing","description":"...","fix":"..."}] }
```
> "audit 只诊断不修复"——诊断(⑤)和修复(④/⑥)职责分离,天然契合流水线。

### 3.5 surgeon 式优化(⑥,替换现有 optimizePage)
open-lovable 纪律:"precision and preservation,99% 代码不动,只改请求项,不重新设计"。点选用 `outerHTML` 作 locator 只改对应元素。

---

## 4. 契约文件字段设计

多 Agent 最大的坑是各自臆测、风格漂移。用两份持久文件做**Agent 间契约**(升级现有 `design-memory.json`)。

### 4.1 `PRODUCT.md`(② 产出,所有下游必读)
捕获需求一次,贯穿全程。建议结构化为 JSON + markdown 双形态:
```jsonc
{
  "register": "brand | product",        // 顶层路由
  "summary": "一句话产品定位",
  "audience": "目标受众 + 技术水平",
  "brand_voice": ["三个调性词,如 克制/专业/冷静"],
  "primary_flow": "用户来这里要完成的核心动作",
  "pages": [                            // 页面清单
    { "name": "落地页", "purpose": "...", "sections": ["hero","定价","FAQ"] }
  ],
  "content_scope": "有哪些真实内容/数据",
  "constraints": "技术栈/品牌色/必须包含项",
  "open_questions": ["仍需用户确认的点"]
}
```

### 4.2 `DESIGN.md`(③ 产出,用户确认门作用于此)
可移植的视觉系统。每个方向一份:
```jsonc
{
  "directions": [                       // 2-3 个差异化方向供用户选
    {
      "id": "restrained-tech",
      "name": "克制科技",               // 2-4 字中文名
      "color_strategy": "Restrained | Committed | Full palette | Drenched",
      "tokens": {
        "palette_oklch": ["主色","强调≤10%","中性(微调向品牌色)","背景","文字"],
        "semantic": {"success":"emerald","error":"rose","warning":"amber"},
        "spacing_base": 4,              // 4pt 基准
        "type_scale": {"ratio":1.25,"steps":["12","14","16","20","24","32","48"]},
        "fonts": {"display":"非黑名单字体","body":"非黑名单字体"},
        "radius":"...", "shadow":"...", "motion":"ease-out-quint, 无 bounce"
      },
      "layout_plan": "区块顺序 + 布局方式(具体到结构,非泛泛)",
      "theme_rationale": "一句物理场景:谁/何地/何种光线/何种情绪 → 暗或亮"
    }
  ],
  "selected_direction_id": null         // 用户确认门写入
}
```

### 4.3 多页一致性(可选,`extract`)
决定做多页时:第 1 页定设计系统,`extract` 抽出组件+token 回写 DESIGN.md,后续页复用,防漂移。

---

## 5. Impeccable 资产 → Agent 映射总表

本机 `lib/skills/impeccable/reference/` 全都有,**无需引额外依赖**。

| 资产文件 | 用途 | 挂到哪个 Agent |
|---|---|---|
| `SKILL.md`(Register/bans/slop test) | 全队地基 | ②③④⑤ |
| `brand.md` / `product.md` | register 分叉策略 + 字体黑名单 | ③④ |
| `color-and-contrast.md` / `colorize.md` | OKLCH/对比度/配色策略 | ③④ |
| `typography.md` / `typeset.md` | 比例/字重/字体选择程序 | ④ |
| `layout.md` / `spatial-design.md` | 间距节奏/反卡片滥用 | ④ |
| `ux-writing.md` / `clarify.md` | 文案公式/澄清问题分类 | ①④⑤ |
| `audit.md` | 5 维 0-4 评分量规 | ⑤ |
| `interaction-design.md` | 八态表 | ⑥(harden) |
| `distill / adapt / delight / bolder / quieter / animate / optimize.md` | 定向优化算子 | ⑥ |

---

## 6. 技术落地(多文件 React + Sandpack)

把现有 `AgentRuntimeAdapter`(3 个一次性调用、产单文件)演进为 **Orchestrator + 多 Agent + 文件树**:
- 底层 **pi-ai**(多 provider,每个 Agent 挑不同模型档),④⑤ 的生成↔评审循环可用 **pi-agent-core**。
- **存储**:每个项目 = 一个 git 仓库(`.workspace/projects/{id}/repo/`),版本 = commit,回退/diff/历史走 git。脚手架固定(Vite+React+TS+Tailwind+shadcn 配置),Agent 只动 `src/`。
- **预览**:前端用 **Sandpack** 加载项目文件树,浏览器内打包预览;点选层(`element-selector`)在 Sandpack 渲染结果上做。
- **质检确定性门禁(多文件红利)**:`tsc --noEmit` + `eslint` + Sandpack 编译错 + Impeccable `detect`(正则/AST)——全是**不耗 token 的真门禁**,编译/类型不过直接打回 ④。
- **优化上下文隔离**:维护文件索引(组件→文件映射),⑥ 改某组件只读相关文件;大稳定文件走 prompt cache。
- 契约文件 `PRODUCT.md` / `DESIGN.md` 提交进仓库,作为 Agent 间契约 + git 可追溯。

---

## 7. 分阶段实施(多文件版)

| 阶段 | 内容 | 价值 |
|---|---|---|
| **A 地基** | Sandpack 预览 + git-per-project 存储 + ④ 生成 Vite/React/TS/Tailwind/shadcn 多文件工程(真实 pi-ai);Register 顶层路由 + 反 slop 三件套 + make-real 黑名单 | 把新管线立起来,能生成+预览多文件 React 应用 |
| **B 质检闭环** | 确定性门禁(tsc/eslint/Sandpack/detect)+ `audit.md` rubric 做 ⑤ + 生成↔质检循环 + PRODUCT.md/DESIGN.md 契约 + 用户确认门 | "多 agent 质检"立起来,质量可控 |
| **C 团队补全** | ① 沟通澄清 + ⑥ 按文件隔离的 surgeon 优化 + 定向算子(harden/adapt/distill/delight)+ `extract` 跨组件一致性 | 完整团队 + 长期可演进 |

---

## 8. 已定 / 待定

**已定**(见 §0):产物=多文件 React;纯前端;预览=Sandpack;存储=git-per-project;栈=Vite+React+TS+Tailwind+shadcn。

**仍待拍板**:
1. **确认门形态**:③出方案后,用户"选 1 个方向"还是"可逐条改方案"再生成?
2. **质检严格度**:⑤ 硬门禁(不过打回,最多 N 轮)还是软提示(给建议不阻断)?
3. **沟通澄清**:① 每次都先澄清,还是仅当需求过模糊时按需触发(v0 式)?
4. **起步范围**:先 A 地基,还是 A+B 一起?
```
