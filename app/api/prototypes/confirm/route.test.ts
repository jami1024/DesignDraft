import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, savePrototypeDirections } from "@/lib/storage";
import { POST } from "./route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-prototype-confirm-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("/api/prototypes/confirm", () => {
  it("confirms selected prototype direction", async () => {
    const project = await createProject({ name: "原型项目" });
    await savePrototypeDirections(project.id, [
      { id: "a", name: "方案A", scenario: "评审", screenList: ["首页"], visualDirection: "清晰", complexity: "low", estimatedScreens: 5, recommendationReason: "简单" },
      { id: "b", name: "方案B", scenario: "提案", screenList: ["首页"], visualDirection: "完整", complexity: "medium", estimatedScreens: 7, recommendationReason: "完整" },
    ]);

    const response = await POST(new Request("http://localhost/api/prototypes/confirm", {
      method: "POST",
      body: JSON.stringify({ projectId: project.id, directionId: "b" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ directionsFile: { selectedDirectionId: "b" } });
  });
});
