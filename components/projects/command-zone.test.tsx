import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandZone } from "./command-zone";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

beforeEach(() => {
  pushMock.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === "/api/projects" && init?.method === "POST") {
        const payload = init.body ? JSON.parse(init.body.toString()) : {};
        return Response.json(
          {
            project: {
              id: "project-2",
              name: payload.name,
              createdAt: "2026-05-02T01:00:00.000Z",
              updatedAt: "2026-05-02T01:00:00.000Z",
              sourceDocumentIds: [],
              pageIds: [],
              currentSkillId: "ui-ux-pro-max",
              textInput: payload.textInput,
              creationContext: payload.creationContext,
            },
          },
          { status: 201 },
        );
      }
      return Response.json({ error: "未匹配请求" }, { status: 500 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CommandZone", () => {
  it("opens creation context dialog before creating a text project", async () => {
    const user = userEvent.setup();
    render(<CommandZone />);

    await user.type(screen.getByPlaceholderText(/SaaS 产品的定价页面/), "做一个校园活动报名小程序，给学生使用");
    await user.click(screen.getByRole("button", { name: "开始" }));

    expect(await screen.findByText("确认生成方向")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "小程序" }));
    await user.click(screen.getByRole("button", { name: "学生" }));
    await user.click(screen.getByRole("button", { name: "产品演示" }));
    await user.click(screen.getByRole("button", { name: "开始分析" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "做一个校园活动报名小程序，给学生使用",
            textInput: "做一个校园活动报名小程序，给学生使用",
            creationContext: {
              platform: "miniapp",
              audiences: ["学生"],
              useCases: ["产品演示"],
            },
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/projects/project-2");
    });
  });
});
