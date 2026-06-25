import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrototypeDirectionCard } from "./prototype-direction-card";

const direction = {
  id: "pitch",
  name: "提案版",
  scenario: "客户提案",
  screenList: ["首页", "详情页", "发布页"],
  visualDirection: "暖色纸感",
  complexity: "medium" as const,
  estimatedScreens: 7,
  recommendationReason: "更适合演示完整流程",
};

describe("PrototypeDirectionCard", () => {
  it("renders direction details and select action", () => {
    const onSelect = vi.fn();
    render(<PrototypeDirectionCard direction={direction} selected={false} onSelect={onSelect} />);

    expect(screen.getByText("提案版")).toBeInTheDocument();
    expect(screen.getByText("客户提案")).toBeInTheDocument();
    expect(screen.getByText("暖色纸感")).toBeInTheDocument();
    expect(screen.getByText("预计 7 个页面")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择这个方案" }));
    expect(onSelect).toHaveBeenCalledWith("pitch");
  });
});
