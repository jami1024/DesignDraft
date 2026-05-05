import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, getProject, getSourceDocument } from "@/lib/storage";
import { POST } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-text-input-api-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/documents/text-input", () => {
  it("stores direct text input as a source document", async () => {
    const project = await createProject({ name: "文本项目" });

    const response = await POST(
      new Request("http://localhost/api/documents/text-input", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, text: "这是用户输入的页面需求。" }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.document.originalFileName).toBe("文本需求.txt");
    expect(body.extractedTextPreview).toBe("这是用户输入的页面需求。");

    const savedDocument = await getSourceDocument(project.id, body.document.id);
    expect(savedDocument).toEqual(body.document);
    await expect(readFile(savedDocument!.extractedTextPath, "utf8")).resolves.toBe("这是用户输入的页面需求。");

    const updatedProject = await getProject(project.id);
    expect(updatedProject?.sourceDocumentIds).toContain(body.document.id);
  });

  it("rejects empty text", async () => {
    const project = await createProject({ name: "文本项目" });

    const response = await POST(
      new Request("http://localhost/api/documents/text-input", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, text: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "文本需求不能为空" });
  });
});
