import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createProject,
  deleteProject,
  getProject,
  getProjectPath,
  listProjects,
  readJsonFile,
  updateProject,
  writeJsonFile,
} from "./storage";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-storage-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("project storage", () => {
  it("creates, reads, lists, updates, and deletes a project", async () => {
    const project = await createProject({ name: "首个演示项目" });

    expect(project.name).toBe("首个演示项目");
    expect(project.sourceDocumentIds).toEqual([]);
    expect(project.pageIds).toEqual([]);
    expect(project.currentSkillId).toBe("ui-ux-pro-max");

    const projectPath = getProjectPath(project.id);
    expect(projectPath.startsWith(workspaceDir)).toBe(true);

    await expect(getProject(project.id)).resolves.toEqual(project);
    await expect(listProjects()).resolves.toEqual([project]);

    const updated = await updateProject(project.id, {
      name: "更新后的项目",
      textInput: "这是一段需求文本",
    });

    expect(updated.name).toBe("更新后的项目");
    expect(updated.textInput).toBe("这是一段需求文本");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(project.updatedAt).getTime(),
    );

    await deleteProject(project.id);

    await expect(getProject(project.id)).resolves.toBeNull();
    await expect(listProjects()).resolves.toEqual([]);
  });

  it("keeps project paths inside the workspace", () => {
    expect(() => getProjectPath("../outside")).toThrow("Invalid projectId");
  });
});

describe("json helpers", () => {
  it("writes and reads typed JSON files", async () => {
    const filePath = join(workspaceDir, "nested", "metadata.json");

    await writeJsonFile(filePath, { value: 42, label: "answer" });

    const result = await readJsonFile<{ value: number; label: string }>(filePath);
    expect(result).toEqual({ value: 42, label: "answer" });
  });
});
