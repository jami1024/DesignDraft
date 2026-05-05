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
    - layout
    - anti-ai-slop
    - accessibility
outputs:
  primary: index.html
capabilities:
  selectionOptimization: true
---

# Web Landing Page

生成面向客户或内部评审的单文件 HTML 落地页。页面必须自包含 CSS，不依赖外部构建工具。

## 页面结构建议

- Hero：一句清晰主张、短说明、主行动按钮。
- Value：3–5 个核心价值点，避免泛泛而谈。
- Feature：把能力按用户任务组织，不按内部模块罗列。
- Flow：如果文档中有流程，转成 3–5 步。
- CTA：给出明确下一步。

## 生成要求

- 输出完整单文件 HTML。
- 关键区块添加 `data-designdraft-id`，例如 `hero`、`features`、`flow`、`cta`。
- 中文界面，文案直接可演示。
- 不要输出解释文字，只输出 HTML。
