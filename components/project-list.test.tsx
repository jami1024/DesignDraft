import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectList } from "./project-list";
import type { Project } from "@/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const projects: Project[] = [
  {
    id: "project-1",
    name: "官网演示页",
    createdAt: "2026-05-02T01:00:00.000Z",
    updatedAt: "2026-05-02T01:30:00.000Z",
    sourceDocumentIds: [],
    pageIds: [],
    currentSkillId: "ui-ux-pro-max",
  },
];

beforeEach(() => {
  pushMock.mockReset();
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === "/api/projects" && (!init || init.method === undefined)) {
        return Response.json({ projects });
      }
      if (url === "/api/projects" && init?.method === "POST") {
        const payload = init.body ? JSON.parse(init.body.toString()) : {};
        return Response.json(
          {
            project: {
              ...projects[0],
              id: "project-2",
              name: payload.name ?? "新项目",
              textInput: payload.textInput,
              creationContext: payload.creationContext,
              updatedAt: "2026-05-02T02:00:00.000Z",
            },
          },
          { status: 201 },
        );
      }
      if (url === "/api/projects/project-1" && init?.method === "DELETE") {
        return Response.json({ ok: true });
      }
      return Response.json({ error: "未匹配请求" }, { status: 500 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProjectList", () => {
  it("loads and displays projects", async () => {
    render(<ProjectList />);

    expect(await screen.findByText("官网演示页")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /进入工作台/ })).toHaveAttribute(
      "href",
      "/projects/project-1",
    );
  });

  it("creates a project", async () => {
    const user = userEvent.setup();
    render(<ProjectList />);

    await user.type(screen.getByLabelText("项目需求"), "做一个校园活动报名小程序，给学生使用");
    await user.click(screen.getByRole("button", { name: "开始" }));
    expect(await screen.findByText("确认生成方向")).toBeInTheDocument();

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
    expect(await screen.findByRole("link", { name: /做一个校园活动报名小程序，给学生使用/ })).toHaveAttribute(
      "href",
      "/projects/project-2",
    );
    expect(pushMock).toHaveBeenCalledWith("/projects/project-2");
  });

  it("deletes a project", async () => {
    const user = userEvent.setup();
    render(<ProjectList />);

    expect(await screen.findByText("官网演示页")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "删除 官网演示页" }));
    await user.click(screen.getByRole("button", { name: "删除项目" }));

    await waitFor(() => {
      expect(screen.queryByText("官网演示页")).not.toBeInTheDocument();
    });
  });
});
