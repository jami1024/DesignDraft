import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, getProject, getSourceDocument } from "@/lib/storage";
import { POST } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-upload-api-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/documents/upload", () => {
  it("uploads and extracts a markdown document", async () => {
    const project = await createProject({ name: "上传项目" });
    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("file", new File(["# 产品需求\n生成官网首页"], "brief.md", { type: "text/markdown" }));

    const response = await POST(
      new Request("http://localhost/api/documents/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.document.originalFileName).toBe("brief.md");
    expect(body.extractedTextPreview).toBe("# 产品需求\n生成官网首页");

    const savedDocument = await getSourceDocument(project.id, body.document.id);
    expect(savedDocument).toEqual(body.document);
    await expect(readFile(savedDocument!.originalPath, "utf8")).resolves.toBe("# 产品需求\n生成官网首页");
    await expect(readFile(savedDocument!.extractedTextPath, "utf8")).resolves.toBe("# 产品需求\n生成官网首页");

    const updatedProject = await getProject(project.id);
    expect(updatedProject?.sourceDocumentIds).toContain(body.document.id);
  });

  it("rejects unsupported uploads", async () => {
    const project = await createProject({ name: "上传项目" });
    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("file", new File(["fake"], "brief.pdf", { type: "application/pdf" }));

    const response = await POST(
      new Request("http://localhost/api/documents/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "仅支持 .md 和 .txt 文件" });
  });
});
