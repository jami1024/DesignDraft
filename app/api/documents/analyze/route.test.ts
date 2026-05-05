import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createProject,
  createSourceDocument,
  getProjectExtractedPath,
  getProjectSuggestionsFilePath,
  listPageSuggestions,
} from "@/lib/storage";
import { POST } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-analyze-api-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/documents/analyze", () => {
  it("analyzes an extracted document and stores suggestions", async () => {
    const project = await createProject({ name: "分析项目" });
    const extractedTextPath = join(getProjectExtractedPath(project.id), "doc.txt");
    await writeFile(extractedTextPath, "我们要做一个产品介绍官网，包含核心价值、功能、流程和行动按钮。", "utf8");
    const document = await createSourceDocument({
      projectId: project.id,
      originalFileName: "brief.txt",
      mimeType: "text/plain",
      originalPath: extractedTextPath,
      extractedTextPath,
    });

    const response = await POST(
      new Request("http://localhost/api/documents/analyze", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, documentId: document.id }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.suggestions).toHaveLength(3);
    expect(body.suggestions[0]).toMatchObject({
      projectId: project.id,
      name: "产品介绍落地页",
      recommendedSkillIds: ["web-landing"],
    });

    await expect(listPageSuggestions(project.id)).resolves.toEqual(body.suggestions);
    await expect(readFile(getProjectSuggestionsFilePath(project.id), "utf8")).resolves.toContain("产品介绍落地页");
  });

  it("returns 404 for a missing document", async () => {
    const project = await createProject({ name: "分析项目" });

    const response = await POST(
      new Request("http://localhost/api/documents/analyze", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, documentId: "missing" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "文档不存在" });
  });
});
