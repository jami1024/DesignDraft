import type { PageSuggestion } from "@/types";
import type {
  AgentRuntimeAdapter,
  AnalyzeDocumentParams,
  GeneratePageParams,
  OptimizePageParams,
} from "./adapter";
import type { AgentModelConfig } from "./model-config";

export class LightweightModelRuntime implements AgentRuntimeAdapter {
  constructor(private readonly config: AgentModelConfig) {}

  async analyzeDocument(params: AnalyzeDocumentParams): Promise<PageSuggestion[]> {
    const projectId = params.projectId ?? "project";
    const text = params.extractedText.toLowerCase();
    const includesDashboard = text.includes("dashboard") || text.includes("数据") || text.includes("后台");

    const suggestions: PageSuggestion[] = [
      {
        id: "landing-page",
        projectId,
        name: "产品介绍落地页",
        purpose: "把需求内容整理成面向客户的产品介绍页面，突出核心价值、功能和行动按钮。",
        audience: "潜在客户、内部评审人员和项目干系人",
        modules: ["Hero", "核心价值", "功能说明", "使用流程", "行动按钮"],
        recommendedSkillIds: ["web-landing"],
        visualDirection: "Modern Minimal",
        complexity: "medium",
      },
      {
        id: includesDashboard ? "dashboard" : "feature-overview",
        projectId,
        name: includesDashboard ? "数据看板页面" : "功能概览页面",
        purpose: includesDashboard ? "展示关键指标、状态和操作入口。" : "把产品能力拆成清晰模块，方便快速理解。",
        audience: includesDashboard ? "运营人员、管理者和内部团队" : "客户、销售和项目评审人员",
        modules: includesDashboard ? ["指标卡", "趋势图", "任务列表", "状态筛选"] : ["功能分组", "场景说明", "对比优势", "下一步行动"],
        recommendedSkillIds: [includesDashboard ? "dashboard" : "web-landing"],
        visualDirection: includesDashboard ? "Tech Utility" : "Warm Soft",
        complexity: includesDashboard ? "high" : "medium",
      },
      {
        id: "executive-summary",
        projectId,
        name: "汇报摘要页",
        purpose: "用更凝练的结构呈现背景、方案、收益和后续计划。",
        audience: "管理层、客户决策人和项目负责人",
        modules: ["背景", "核心方案", "关键收益", "时间线", "结论"],
        recommendedSkillIds: ["pitch-page"],
        visualDirection: "Editorial",
        complexity: "low",
      },
    ];

    return suggestions;
  }

  async *generatePage(params: GeneratePageParams): AsyncGenerator<string, string> {
    const html = buildDemoHtml(params);
    const chunks = splitIntoChunks(html, 900);

    for (const chunk of chunks) {
      yield chunk;
    }

    return html;
  }

  async *optimizePage(params: OptimizePageParams): AsyncGenerator<string, string> {
    const note = `<!-- DesignDraft optimization: ${escapeHtml(params.userInstruction)} -->`;
    const html = params.currentHtml.includes("</body>")
      ? params.currentHtml.replace("</body>", `${note}\n</body>`)
      : `${params.currentHtml}\n${note}`;

    yield html;
    return html;
  }

  get runtimeLabel() {
    return `${this.config.provider}:${this.config.model}`;
  }
}

function buildDemoHtml(params: GeneratePageParams) {
  const modules = params.suggestion.modules.map((module) => `<li>${escapeHtml(module)}</li>`).join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.suggestion.name)}</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fafaf9; color: #1c1917; }
    main { max-width: 960px; margin: 0 auto; padding: 72px 24px; }
    section { margin-top: 32px; padding: 24px; border: 1px solid #e7e5e4; border-radius: 24px; background: white; }
    h1 { font-size: clamp(40px, 7vw, 76px); line-height: 0.95; letter-spacing: -0.06em; margin: 0; }
    p { color: #57534e; line-height: 1.7; }
    a { display: inline-flex; margin-top: 24px; border-radius: 999px; background: #2563eb; color: white; padding: 12px 18px; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <section data-designdraft-id="hero">
      <p>${escapeHtml(params.suggestion.visualDirection)}</p>
      <h1>${escapeHtml(params.suggestion.name)}</h1>
      <p>${escapeHtml(params.suggestion.purpose)}</p>
      <a href="#modules">查看页面模块</a>
    </section>
    <section id="modules" data-designdraft-id="modules">
      <h2>建议模块</h2>
      <ul>${modules}</ul>
    </section>
  </main>
</body>
</html>`;
}

function splitIntoChunks(value: string, size: number) {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
