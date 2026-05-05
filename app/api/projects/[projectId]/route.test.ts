import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, getProject } from "@/lib/storage";
import { DELETE, GET } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-project-detail-api-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/projects/[projectId]", () => {
  it("returns a project detail", async () => {
    const project = await createProject({ name: "客户汇报页" });

    const response = await GET(new Request("http://localhost/api/projects/unused"), {
      params: { projectId: project.id },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.project).toEqual(project);
  });

  it("returns 404 for a missing project", async () => {
    const response = await GET(new Request("http://localhost/api/projects/missing"), {
      params: { projectId: "missing" },
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "项目不存在" });
  });

  it("deletes a project", async () => {
    const project = await createProject({ name: "待删除项目" });

    const response = await DELETE(new Request("http://localhost/api/projects/unused"), {
      params: { projectId: project.id },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    await expect(getProject(project.id)).resolves.toBeNull();
  });
});
