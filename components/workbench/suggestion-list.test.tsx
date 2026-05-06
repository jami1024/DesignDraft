import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageSuggestion } from "@/types";
import { SuggestionList } from "./suggestion-list";

const suggestions: PageSuggestion[] = [
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

afterEach(() => {
  cleanup();
});

describe("SuggestionList", () => {
  it("renders suggestions", () => {
    render(<SuggestionList suggestions={suggestions} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("产品介绍落地页")).toBeInTheDocument();
    expect(screen.getByText("数据看板页面")).toBeInTheDocument();
    expect(screen.getByText("Modern Minimal")).toBeInTheDocument();
  });

  it("highlights selected suggestion", () => {
    render(<SuggestionList suggestions={suggestions} selectedId="landing-page" onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toContain("border-[#2563EB]");
  });

  it("calls onSelect when clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SuggestionList suggestions={suggestions} selectedId={null} onSelect={onSelect} />);

    await user.click(screen.getAllByRole("button")[0]);
    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it("renders nothing when empty", () => {
    const { container } = render(<SuggestionList suggestions={[]} selectedId={null} onSelect={() => {}} />);
    expect(container.innerHTML).toBe("");
  });
});
