---
id: dashboard
name: Dashboard
mode: prototype
scenario: operation
previewType: html
recommendedFor:
  - dashboard
  - admin-panel
  - analytics
craft:
  requires:
    - typography
    - color
    - layout
    - accessibility
outputs:
  primary: index.html
capabilities:
  selectionOptimization: true
---

# Dashboard

生成数据密集型或运营管理场景的单文件 HTML 页面。

## 页面结构建议

- 顶部说明当前视图目标。
- 关键指标卡展示最重要的 3–5 个数字。
- 主图表区突出趋势、分布或漏斗。
- 任务列表或异常状态区给用户行动入口。

## 生成要求

- 信息密度高但层级清楚。
- 使用表格、指标、状态标签时保证可读性。
- 关键区块添加 `data-designdraft-id`，例如 `metrics`、`chart`、`table`、`actions`。
