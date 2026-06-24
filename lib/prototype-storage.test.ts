import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PrototypeDirection, PrototypeProductSpec } from "@/types";
import {
  confirmPrototypeDirection,
  createProject,
  createPrototype,
  createPrototypeVersion,
  getPrototype,
  getPrototypeDirections,
  getPrototypeProduct,
  getPrototypeVersion,
  readPrototypeHtml,
  savePrototypeDirections,
  savePrototypeProduct,
} from "@/lib/storage";

let workspaceDir: string;

const product: PrototypeProductSpec = {
  summary: "校园活动小程序",
  platform: "miniapp",
  audienceSummary: "学生和社团负责人",
  useCaseSummary: "产品演示",
  contentScope: "活动发现、详情、发布、我的",
  primaryGoal: "讲清楚活动流转",
  successCriteria: ["看懂流程"],
  keyFlows: [{ name: "报名", entry: "首页", goal: "报名成功", screens: ["首页", "详情页", "成功页"] }],
  requiredScreens: ["首页", "详情页"],
  optionalScreens: ["授权页"],
  fidelityTarget: "hi-fi",
  deviceFrame: "miniapp-phone",
  variationAxes: ["轻量展示 vs 完整闭环"],
  visualConstraints: { styleKeywords: ["校园感"], brandTone: "亲和", referenceApps: [] },
  assumptions: [],
  openQuestions: [],
  constraints: ["不默认拆管理端"],
};

const directions: PrototypeDirection[] = [
  {
    id: "review",
    name: "评审版",
    scenario: "需求评审",
    screenList: ["首页", "详情页"],
    visualDirection: "清晰克制",
    complexity: "low",
    estimatedScreens: 5,
    recommendationReason: "流程最清楚",
  },
  {
    id: "pitch",
    name: "提案版",
    scenario: "客户提案",
    screenList: ["首页", "详情页", "发布页"],
    visualDirection: "更完整",
    complexity: "medium",
    estimatedScreens: 7,
    recommendationReason: "更适合展示",
  },
];

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-prototype-storage-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("prototype storage", () => {
  it("saves product analysis and directions", async () => {
    const project = await createProject({ name: "原型项目" });
    await savePrototypeProduct(project.id, product);
    await savePrototypeDirections(project.id, directions);

    await expect(getPrototypeProduct(project.id)).resolves.toEqual(product);
    await expect(getPrototypeDirections(project.id)).resolves.toEqual({ directions, selectedDirectionId: null });
  });

  it("confirms a selected direction", async () => {
    const project = await createProject({ name: "原型项目" });
    await savePrototypeDirections(project.id, directions);

    await expect(confirmPrototypeDirection(project.id, "pitch")).resolves.toMatchObject({ selectedDirectionId: "pitch" });
    await expect(confirmPrototypeDirection(project.id, "missing")).rejects.toThrow("原型方案不存在");
  });

  it("creates a prototype and appends versions without overwriting old html", async () => {
    const project = await createProject({ name: "原型项目" });
    const { prototype, version } = await createPrototype(
      project.id,
      "pitch",
      "提案版",
      "<!doctype html><html><body>v1</body></html>",
    );
    const second = await createPrototypeVersion(
      project.id,
      prototype.id,
      "<!doctype html><html><body>v2</body></html>",
      "改成蓝绿色",
      "chat-optimization",
    );

    expect(prototype.currentVersionId).toBe("v1");
    expect(version.previewPath).toBe(`/api/prototypes/${prototype.id}/versions/v1/html?projectId=${project.id}`);
    await expect(getPrototype(project.id, prototype.id)).resolves.toMatchObject({
      currentVersionId: "v2",
      versionIds: ["v1", "v2"],
    });
    await expect(getPrototypeVersion(project.id, prototype.id, "v2")).resolves.toMatchObject({ changeSummary: "改成蓝绿色" });
    await expect(readPrototypeHtml(project.id, prototype.id, "v1")).resolves.toContain("v1");
    await expect(readPrototypeHtml(project.id, prototype.id, "v2")).resolves.toContain("v2");

    const oldHtml = await readFile(version.htmlPath, "utf8");
    expect(oldHtml).toContain("v1");
    expect(second.version.versionNumber).toBe(2);
  });
});
