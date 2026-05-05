import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StyleSelector } from "./style-selector";

afterEach(() => {
  cleanup();
});

describe("StyleSelector", () => {
  it("renders style cards", () => {
    render(<StyleSelector value="modern-minimal" onChange={vi.fn()} />);

    expect(screen.getByText("Modern Minimal")).toBeInTheDocument();
    expect(screen.getByText("Warm Soft")).toBeInTheDocument();
    expect(screen.getByText("Tech Utility")).toBeInTheDocument();
  });

  it("selects a style preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StyleSelector value="modern-minimal" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "选择 Warm Soft" }));

    expect(onChange).toHaveBeenCalledWith("warm-soft");
  });
});
