import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SuggestionList } from "./suggestion-list";

const suggestions = [
  {
    id: "landing-page",
    projectId: "project-1",
    name: "产品介绍落地页",
    purpose: "介绍产品价值",
    audience: "潜在客户",
    modules: ["Hero", "功能", "CTA"],
    recommendedSkillIds: ["web-landing"],
    visualDirection: "Modern Minimal",
    complexity: "medium",
  },
  {
    id: "dashboard",
    projectId: "project-1",
    name: "数据看板页面",
    purpose: "展示关键指标",
    audience: "运营团队",
    modules: ["指标", "图表"],
    recommendedSkillIds: ["dashboard"],
    visualDirection: "Tech Utility",
    complexity: "high",
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (input.toString() === "/api/documents/analyze" && init?.method === "POST") {
        return Response.json({ suggestions });
      }
      return Response.json({ error: "未匹配请求" }, { status: 500 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SuggestionList", () => {
  it("analyzes the latest document and displays suggestions", async () => {
    const user = userEvent.setup();
    render(<SuggestionList projectId="project-1" latestDocumentId="doc-1" />);

    await user.click(screen.getByRole("button", { name: "分析文档" }));

    expect(await screen.findByText("产品介绍落地页")).toBeInTheDocument();
    expect(screen.getByText("数据看板页面")).toBeInTheDocument();
    expect(screen.getByText("Modern Minimal")).toBeInTheDocument();
  });

  it("selects a suggestion", async () => {
    const user = userEvent.setup();
    render(<SuggestionList projectId="project-1" latestDocumentId="doc-1" />);

    await user.click(screen.getByRole("button", { name: "分析文档" }));
    await user.click(await screen.findByRole("button", { name: "选择 产品介绍落地页" }));

    expect(screen.getByText("已选择：产品介绍落地页")).toBeInTheDocument();
  });

  it("prompts for a document before analysis", async () => {
    const user = userEvent.setup();
    render(<SuggestionList projectId="project-1" latestDocumentId={null} />);

    await user.click(screen.getByRole("button", { name: "分析文档" }));

    expect(screen.getByText("请先保存文本需求或上传文档")).toBeInTheDocument();
  });
});
