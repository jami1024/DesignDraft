import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentUpload } from "./document-upload";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url === "/api/documents/text-input" && init?.method === "POST") {
        return Response.json(
          {
            document: {
              id: "doc-text",
              originalFileName: "文本需求.txt",
              createdAt: "2026-05-02T00:00:00.000Z",
            },
            extractedTextPreview: "这是一段文本需求",
          },
          { status: 201 },
        );
      }
      if (url === "/api/documents/upload" && init?.method === "POST") {
        return Response.json(
          {
            document: {
              id: "doc-file",
              originalFileName: "brief.md",
              createdAt: "2026-05-02T00:00:00.000Z",
            },
            extractedTextPreview: "# brief",
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

describe("DocumentUpload", () => {
  it("submits direct text requirements", async () => {
    const user = userEvent.setup();
    render(<DocumentUpload projectId="project-1" />);

    await user.type(screen.getByLabelText("直接输入需求"), "这是一段文本需求");
    await user.click(screen.getByRole("button", { name: "保存文本需求" }));

    expect(await screen.findByText("文本需求.txt")).toBeInTheDocument();
    expect(screen.getByText("这是一段文本需求")).toBeInTheDocument();
  });

  it("uploads markdown or text files", async () => {
    const user = userEvent.setup();
    render(<DocumentUpload projectId="project-1" />);

    await user.upload(screen.getByLabelText("上传 .md 或 .txt 文件"), new File(["# brief"], "brief.md", { type: "text/markdown" }));
    await user.click(screen.getByRole("button", { name: "上传文档" }));

    expect(await screen.findByText("brief.md")).toBeInTheDocument();
    expect(screen.getByText("# brief")).toBeInTheDocument();
  });
});
