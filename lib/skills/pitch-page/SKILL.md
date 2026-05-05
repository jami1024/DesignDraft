---
id: pitch-page
name: Pitch Page
mode: prototype
scenario: product
previewType: html
recommendedFor:
  - executive-summary
  - proposal
  - pitch
craft:
  requires:
    - typography
    - color
    - layout
    - anti-ai-slop
outputs:
  primary: index.html
capabilities:
  selectionOptimization: true
---

# Pitch Page

生成面向管理层、客户决策人或评审场景的汇报摘要页。

## 页面结构建议

- 先讲结论，再讲依据。
- 用清晰分区呈现背景、方案、收益、计划。
- 适合使用 editorial 或 refined 风格，但不要牺牲可读性。

## 生成要求

- 像一页可演示的高质量汇报材料。
- 重点内容必须可扫读。
- 关键区块添加 `data-designdraft-id`。
