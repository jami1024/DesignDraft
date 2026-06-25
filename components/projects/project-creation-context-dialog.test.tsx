import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectCreationContextDialog } from "./project-creation-context-dialog";

afterEach(() => {
  cleanup();
});

describe("ProjectCreationContextDialog", () => {
  it("requires platform, audience, and use case before submit", () => {
    const onConfirm = vi.fn();
    render(<ProjectCreationContextDialog requirement="做一个校园活动小程序" onCancel={() => {}} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("请先确认平台、受众和用途")).toBeInTheDocument();
  });

  it("submits normalized context", () => {
    const onConfirm = vi.fn();
    render(<ProjectCreationContextDialog requirement="做一个校园活动小程序" onCancel={() => {}} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "小程序" }));
    fireEvent.click(screen.getByRole("button", { name: "学生" }));
    fireEvent.click(screen.getByRole("button", { name: "产品演示" }));
    fireEvent.change(screen.getByLabelText("关键词 / 风格偏好"), { target: { value: "暖色、校园感" } });
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(onConfirm).toHaveBeenCalledWith({
      platform: "miniapp",
      audiences: ["学生"],
      useCases: ["产品演示"],
      keywords: "暖色、校园感",
    });
  });
});
