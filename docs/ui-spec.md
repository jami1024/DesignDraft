# DesignDraft — UI 设计规范

## 1. 设计理念

**温暖亲和、专业可信。** DesignDraft 的目标用户包含大量非技术人员（产品经理、设计师），界面应让人感到轻松、易于上手，同时保持工具类产品的专业感和效率感。

参考调性：Notion 的柔和亲切 + Linear 的结构清晰。

---

## 2. 品牌色系

### 主色：柔和蓝（Soft Blue）

作为品牌主色，传递信任、专业、平静的感觉，同时不冷淡。

```
Primary:
  50:  #EFF6FF    ← 最浅背景
  100: #DBEAFE
  200: #BFDBFE
  300: #93C5FD
  400: #60A5FA    ← 悬停态
  500: #3B82F6    ← 品牌主色
  600: #2563EB    ← 按钮/链接
  700: #1D4ED8
  800: #1E40AF
  900: #1E3A8A
  950: #172554    ← 最深
```

### 辅助色

```
Warm Gray（暖灰，替代纯灰，增加温暖感）:
  50:  #FAFAF9
  100: #F5F5F4
  200: #E7E5E4
  300: #D6D3D1
  400: #A8A29E
  500: #78716C
  600: #57534E
  700: #44403C
  800: #292524
  900: #1C1917
  950: #0C0A09

Success（成功/完成）:
  light: #10B981 (Emerald 500)
  dark:  #34D399 (Emerald 400)

Warning（警告/进行中）:
  light: #F59E0B (Amber 500)
  dark:  #FBBF24 (Amber 400)

Error（错误/危险）:
  light: #EF4444 (Red 500)
  dark:  #F87171 (Red 400)

Info（信息/提示）:
  light: #3B82F6 (Blue 500，复用主色)
  dark:  #60A5FA (Blue 400)
```

### 亮色模式配色

```
背景：
  页面背景:       #FAFAF9  (warm-gray-50)
  卡片/面板背景:   #FFFFFF
  侧边栏背景:     #F5F5F4  (warm-gray-100)
  代码/预览背景:   #FAFAF9  (warm-gray-50)

文字：
  标题:           #1C1917  (warm-gray-900)
  正文:           #44403C  (warm-gray-700)
  次要文字:       #78716C  (warm-gray-500)
  占位符:         #A8A29E  (warm-gray-400)

边框：
  默认:           #E7E5E4  (warm-gray-200)
  悬停:           #D6D3D1  (warm-gray-300)
  焦点:           #3B82F6  (primary-500)

交互：
  主按钮背景:     #2563EB  (primary-600)
  主按钮悬停:     #1D4ED8  (primary-700)
  主按钮文字:     #FFFFFF
  次按钮背景:     #FFFFFF
  次按钮边框:     #E7E5E4  (warm-gray-200)
  次按钮悬停:     #F5F5F4  (warm-gray-100)
  链接:           #2563EB  (primary-600)
```

### 暗色模式配色

```
背景：
  页面背景:       #1C1917  (warm-gray-900)
  卡片/面板背景:   #292524  (warm-gray-800)
  侧边栏背景:     #1C1917  (warm-gray-900)
  代码/预览背景:   #0C0A09  (warm-gray-950)

文字：
  标题:           #FAFAF9  (warm-gray-50)
  正文:           #E7E5E4  (warm-gray-200)
  次要文字:       #A8A29E  (warm-gray-400)
  占位符:         #78716C  (warm-gray-500)

边框：
  默认:           #44403C  (warm-gray-700)
  悬停:           #57534E  (warm-gray-600)
  焦点:           #60A5FA  (primary-400)

交互：
  主按钮背景:     #3B82F6  (primary-500)
  主按钮悬停:     #60A5FA  (primary-400)
  主按钮文字:     #FFFFFF
  次按钮背景:     #292524  (warm-gray-800)
  次按钮边框:     #44403C  (warm-gray-700)
  次按钮悬停:     #44403C  (warm-gray-700)
  链接:           #60A5FA  (primary-400)
```

---

## 3. 字体

### 字体选择

```
中文正文:    "Noto Sans SC", system-ui, sans-serif
英文/代码:   "Inter", system-ui, sans-serif
等宽/代码:   "JetBrains Mono", "Fira Code", monospace
```

选择理由：
- Noto Sans SC：Google 出品，中文渲染优秀，与 Inter 搭配和谐
- Inter：现代、清晰、中性，适合工具类界面
- JetBrains Mono：代码查看器专用，连字支持好

### 字号体系

```
xs:    12px / 1.5   ← 标签、时间戳、辅助信息
sm:    14px / 1.5   ← 次要正文、表格内容
base:  16px / 1.6   ← 正文默认
lg:    18px / 1.5   ← 小标题、强调文字
xl:    20px / 1.4   ← 页面子标题
2xl:   24px / 1.3   ← 页面标题
3xl:   30px / 1.2   ← 大标题（首页等）
```

### 字重

```
normal:   400   ← 正文
medium:   500   ← 强调、标签
semibold: 600   ← 小标题、按钮
bold:     700   ← 页面标题
```

---

## 4. 间距体系

基于 4px 网格，使用 Tailwind 默认间距。

```
0.5:  2px    ← 极小间隙
1:    4px    ← 紧凑内边距
1.5:  6px
2:    8px    ← 元素间小间距
3:    12px   ← 按钮内边距（水平）
4:    16px   ← 卡片内边距、列表项间距
5:    20px
6:    24px   ← 区块间距
8:    32px   ← 大区块间距
10:   40px
12:   48px   ← 页面区域间距
16:   64px   ← 页面大间距
```

### 常用间距约定

```
按钮内边距:       px-4 py-2 (16px / 8px)
小按钮内边距:     px-3 py-1.5 (12px / 6px)
卡片内边距:       p-4 或 p-6 (16px 或 24px)
卡片间距:         gap-4 (16px)
输入框内边距:     px-3 py-2 (12px / 8px)
面板间距:         gap-6 (24px)
页面边距:         px-6 py-8 (24px / 32px)
侧边栏宽度:      w-80 (320px) 或 w-96 (384px)
```

---

## 5. 圆角

```
none:  0px     ← 不使用
sm:    4px     ← 标签、小徽章
md:    6px     ← 按钮、输入框
lg:    8px     ← 卡片、下拉菜单
xl:    12px    ← 对话框、大卡片
2xl:   16px    ← 模态框
full:  9999px  ← 圆形头像、胶囊按钮
```

### 约定

```
按钮:       rounded-md (6px)
输入框:     rounded-md (6px)
卡片:       rounded-lg (8px)
对话框:     rounded-xl (12px)
工具提示:   rounded-md (6px)
头像:       rounded-full
```

---

## 6. 阴影

温暖风格的阴影带微弱暖色调，避免冷灰阴影。

```
亮色模式：
  sm:   0 1px 2px rgba(28, 25, 23, 0.05)
  md:   0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05)
  lg:   0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04)
  xl:   0 20px 25px -5px rgba(28, 25, 23, 0.08), 0 8px 10px -6px rgba(28, 25, 23, 0.04)

暗色模式：
  sm:   0 1px 2px rgba(0, 0, 0, 0.3)
  md:   0 4px 6px -1px rgba(0, 0, 0, 0.4)
  lg:   0 10px 15px -3px rgba(0, 0, 0, 0.4)
  xl:   0 20px 25px -5px rgba(0, 0, 0, 0.4)
```

### 使用场景

```
卡片（静态）:    shadow-sm
卡片（悬停）:    shadow-md
下拉菜单:       shadow-lg
对话框/模态:    shadow-xl
浮动按钮:       shadow-md
```

---

## 7. 图标

使用 **Lucide Icons**（shadcn/ui 默认图标库）。

风格：线性（stroke），1.5px 粗细，与温暖亲和的调性一致。

### 常用图标映射

```
项目:         FolderOpen
创建项目:     Plus
删除:         Trash2
上传文档:     Upload / FileText
文本输入:     Type / PenLine
图片上传:     Image / ImagePlus
生成:         Sparkles
预览:         Eye
源码:         Code2
下载:         Download
分享:         Share2 / Link
版本历史:     History / GitBranch
回退:         Undo2
风格选择:     Palette
设置:         Settings
亮色模式:     Sun
暗色模式:     Moon
加载中:       Loader2（旋转动画）
成功:         CheckCircle2
错误:         XCircle
警告:         AlertTriangle
关闭:         X
```

---

## 8. 动效

### 原则

- 轻柔自然，不突兀
- 功能性优先：动效应辅助用户理解状态变化
- 尊重 `prefers-reduced-motion`

### 时长

```
快速反馈:     150ms   ← hover、focus、按钮按下
标准过渡:     200ms   ← 面板展开、标签切换
内容切换:     300ms   ← 页面过渡、模态出现
复杂动画:     400ms   ← 列表重排、大区块展开
```

### 缓动

```
默认:         ease-out             ← 大多数交互
弹性:         cubic-bezier(0.34, 1.56, 0.64, 1)  ← 按钮反馈（谨慎使用）
进入:         ease-out
离开:         ease-in
```

### 常用动效

```
按钮 hover:    背景色过渡 150ms ease-out
卡片 hover:    shadow 提升 + 微弱 translateY(-1px) 200ms
模态弹出:      opacity 0→1 + scale 0.95→1, 200ms ease-out
Toast 通知:    从右侧滑入 300ms, 自动消失前 fade-out
加载旋转:      Loader2 图标 spin 动画
SSE 进度:      进度条宽度过渡 300ms ease-out
页面建议卡片:  stagger 入场，每张间隔 50ms
```

---

## 9. 组件风格

### 按钮

```
主按钮（Primary）:
  亮: bg-primary-600 text-white hover:bg-primary-700
  暗: bg-primary-500 text-white hover:bg-primary-400
  圆角: rounded-md
  内边距: px-4 py-2
  字重: font-semibold
  字号: text-sm

次按钮（Secondary）:
  亮: bg-white border border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-100
  暗: bg-warm-gray-800 border border-warm-gray-700 text-warm-gray-200 hover:bg-warm-gray-700

幽灵按钮（Ghost）:
  亮: text-warm-gray-700 hover:bg-warm-gray-100
  暗: text-warm-gray-300 hover:bg-warm-gray-800

危险按钮（Destructive）:
  亮: bg-red-500 text-white hover:bg-red-600
  暗: bg-red-600 text-white hover:bg-red-500

禁用态:
  opacity-50 cursor-not-allowed
```

### 输入框

```
亮色:
  bg-white border border-warm-gray-200 rounded-md px-3 py-2
  focus: border-primary-500 ring-2 ring-primary-500/20
  placeholder: text-warm-gray-400

暗色:
  bg-warm-gray-800 border border-warm-gray-700 rounded-md px-3 py-2
  focus: border-primary-400 ring-2 ring-primary-400/20
  placeholder: text-warm-gray-500
```

### 卡片

```
亮色:
  bg-white border border-warm-gray-200 rounded-lg shadow-sm
  hover: shadow-md

暗色:
  bg-warm-gray-800 border border-warm-gray-700 rounded-lg shadow-sm
  hover: shadow-md
```

### 标签/徽章

```
蓝色: bg-primary-50 text-primary-700 (亮) / bg-primary-900/30 text-primary-300 (暗)
灰色: bg-warm-gray-100 text-warm-gray-600 (亮) / bg-warm-gray-800 text-warm-gray-400 (暗)
绿色: bg-emerald-50 text-emerald-700 (亮) / bg-emerald-900/30 text-emerald-300 (暗)
橙色: bg-amber-50 text-amber-700 (亮) / bg-amber-900/30 text-amber-300 (暗)
圆角: rounded-sm (4px)
内边距: px-2 py-0.5
字号: text-xs font-medium
```

---

## 10. 布局规范

### 页面结构

```
┌─────────────────────────────────────────┐
│  顶栏 (h-14, 固定)                       │
├─────────┬───────────────────────────────┤
│         │                               │
│ 左侧栏   │        主内容区                │
│ (w-80)  │     (flex-1, 自适应)           │
│ 可折叠   │                               │
│         │                               │
├─────────┴───────────────────────────────┤
│  底栏 / 状态栏 (可选, h-10)               │
└─────────────────────────────────────────┘
```

### 响应式断点

```
sm:   640px    ← 手机横屏
md:   768px    ← 平板竖屏（侧边栏折叠为抽屉）
lg:   1024px   ← 平板横屏/小笔记本
xl:   1280px   ← 标准桌面
2xl:  1536px   ← 大屏
```

### 工作台布局

```
桌面 (≥1024px):   左侧栏固定 + 主内容区双栏（预览 + 迭代面板）
平板 (768-1023px): 侧边栏可折叠，主内容区单栏切换
手机 (<768px):     全屏单栏，底部标签导航（非首要场景，基本可用即可）
```

---

## 11. 空状态与加载态

### 空状态

```
居中展示：
  图标（48px, warm-gray-300）
  标题（text-lg, font-semibold, warm-gray-700）
  描述（text-sm, warm-gray-500）
  操作按钮（主按钮）

示例 — 项目列表为空：
  图标: FolderOpen
  标题: "还没有项目"
  描述: "创建你的第一个项目，开始生成演示页面"
  按钮: "创建项目"
```

### 加载态

```
页面级加载:    居中 Loader2 旋转 + "加载中..." 文字
按钮加载:      Loader2 旋转替换图标，文字变为 "处理中..."，按钮禁用
SSE 生成进度:  步骤指示器（1.读取文档 → 2.分析 → 3.生成 → 4.完成）
骨架屏:        卡片/列表使用 animate-pulse 骨架占位
```

---

## 12. Toast 通知

```
位置: 右上角
最大数量: 3 条
自动消失: 5 秒（错误类型不自动消失）

类型:
  成功: 左侧绿色竖条 + CheckCircle2 图标
  错误: 左侧红色竖条 + XCircle 图标
  警告: 左侧橙色竖条 + AlertTriangle 图标
  信息: 左侧蓝色竖条 + Info 图标
```

---

## 13. Tailwind 配置参考

以下自定义配置需要添加到 tailwind.config.ts：

```ts
const config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },
        "warm-gray": {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      boxShadow: {
        "warm-sm": "0 1px 2px rgba(28, 25, 23, 0.05)",
        "warm-md": "0 4px 6px -1px rgba(28, 25, 23, 0.07), 0 2px 4px -2px rgba(28, 25, 23, 0.05)",
        "warm-lg": "0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04)",
      },
    },
  },
};
```

---

## 14. 无障碍要求

- 所有交互元素可键盘访问（Tab 导航 + Enter/Space 激活）
- focus-visible 样式清晰（ring-2 ring-primary-500）
- 色彩对比度 ≥ WCAG AA（4.5:1 正文，3:1 大文字）
- 图标按钮必须有 aria-label
- 表单控件必须关联 label
- 模态框 focus trap + Escape 关闭
- 加载状态有 aria-live 通知
