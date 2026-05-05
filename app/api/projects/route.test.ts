import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET, POST } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-project-api-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/projects", () => {
  it("creates a project and lists it", async () => {
    const createResponse = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "官网改版演示" }),
      }),
    );

    expect(createResponse.status).toBe(201);
    const createdBody = await createResponse.json();
    expect(createdBody.project.name).toBe("官网改版演示");

    const listResponse = await GET();
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.projects).toHaveLength(1);
    expect(listBody.projects[0].id).toBe(createdBody.project.id);
  });

  it("rejects empty project names", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "项目名称不能为空" });
  });
});
