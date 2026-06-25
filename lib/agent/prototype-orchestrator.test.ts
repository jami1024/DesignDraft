import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PrototypeDirection, PrototypeProductSpec } from "@/types";
import {
  createProject,
  getPrototypeDirections,
  getPrototypeProduct,
  getPrototypeVersion,
  savePrototypeDirections,
  savePrototypeProduct,
} from "@/lib/storage";

const {
  completeTextMock,
  streamTextMock,
  analyzePromptMock,
  planPromptMock,
  generatePromptMock,
  optimizePromptMock,
} = vi.hoisted(() => ({
  completeTextMock: vi.fn(),
  streamTextMock: vi.fn(),
  analyzePromptMock: vi.fn(),
  planPromptMock: vi.fn(),
  generatePromptMock: vi.fn(),
  optimizePromptMock: vi.fn(),
}));

vi.mock("./pi-ai-runtime", () => ({
  completeText: completeTextMock,
  streamText: streamTextMock,
}));

vi.mock("./prototype-prompts", () => ({
  buildAnalyzePrototypePrompt: analyzePromptMock,
  buildPlanPrototypePrompt: planPromptMock,
  buildGeneratePrototypePrompt: generatePromptMock,
  buildOptimizePrototypePrompt: optimizePromptMock,
}));

import { analyzePrototype, confirmPrototypeDirection, generatePrototype, optimizePrototype, planPrototype } from "./prototype-orchestrator";

let workspaceDir: string;

const projectCreationContext = {
  platform: "miniapp" as const,
  audiences: ["学生"],
  useCases: ["产品演示"],
};

const product: PrototypeProductSpec = {
  summary: "校园活动小程序",
  platform: "miniapp",
  audienceSummary: "学生",
  useCaseSummary: "产品演示",
  contentScope: "活动发现、详情、发布、我的",
  primaryGoal: "讲清楚活动流转",
  successCriteria: ["看懂流程"],
  keyFlows: [{ name: "报名", entry: "首页", goal: "报名成功", screens: ["首页", "详情页"] }],
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
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-prototype-orchestrator-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
  completeTextMock.mockReset();
  streamTextMock.mockReset();
  analyzePromptMock.mockReset();
  planPromptMock.mockReset();
  generatePromptMock.mockReset();
  optimizePromptMock.mockReset();
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("prototype orchestrator", () => {
  it("analyzes project context and stores the prototype product spec", async () => {
    const project = await createProject({
      name: "原型项目",
      textInput: "做一个校园活动小程序",
      creationContext: projectCreationContext,
    });

    analyzePromptMock.mockResolvedValue({ system: "analyze", user: "user" });
    completeTextMock.mockResolvedValue(JSON.stringify(product));

    await expect(analyzePrototype(project.id)).resolves.toMatchObject({ summary: "校园活动小程序" });
    await expect(getPrototypeProduct(project.id)).resolves.toMatchObject({ summary: "校园活动小程序" });
  });

  it("plans directions and stores them", async () => {
    const project = await createProject({
      name: "原型项目",
      textInput: "做一个校园活动小程序",
      creationContext: projectCreationContext,
    });

    await savePrototypeProduct(project.id, product);
    planPromptMock.mockResolvedValue({ system: "plan", user: "user" });
    completeTextMock.mockResolvedValue(JSON.stringify(directions));

    await expect(planPrototype(project.id)).resolves.toHaveLength(2);
    await expect(getPrototypeDirections(project.id)).resolves.toMatchObject({
      selectedDirectionId: null,
      directions,
    });
  });

  it("generates a prototype from cleaned HTML", async () => {
    const project = await createProject({
      name: "原型项目",
      textInput: "做一个校园活动小程序",
      creationContext: projectCreationContext,
    });

    await savePrototypeProduct(project.id, product);
    await savePrototypeDirections(project.id, directions);
    await confirmPrototypeDirection(project.id, "pitch");

    generatePromptMock.mockResolvedValue({ system: "generate", user: "user" });
    streamTextMock.mockImplementation(async function* () {
      yield "```html\n";
      yield "<!doctype html><html><body>demo</body></html>";
      yield "\n```";
    });

    const chunks: string[] = [];
    let prototypeId = "";
    for await (const event of generatePrototype(project.id)) {
      if (event.type === "chunk") chunks.push(event.text);
      if (event.type === "done") prototypeId = event.prototypeId;
    }

    expect(chunks.join("")).toContain("demo");
    await expect(getPrototypeVersion(project.id, prototypeId, "v1")).resolves.toMatchObject({
      changeSummary: "初始生成",
    });
  });

  it("creates an optimized version on the selected prototype", async () => {
    const project = await createProject({
      name: "原型项目",
      textInput: "做一个校园活动小程序",
      creationContext: projectCreationContext,
    });

    await savePrototypeProduct(project.id, product);
    await savePrototypeDirections(project.id, directions);
    await confirmPrototypeDirection(project.id, "pitch");

    generatePromptMock.mockResolvedValue({ system: "generate", user: "user" });
    streamTextMock.mockImplementation(async function* () {
      yield "<!doctype html><html><body>v1</body></html>";
    });

    let prototypeId = "";
    for await (const event of generatePrototype(project.id)) {
      if (event.type === "done") prototypeId = event.prototypeId;
    }

    optimizePromptMock.mockResolvedValue({ system: "optimize", user: "user" });
    streamTextMock.mockImplementation(async function* () {
      yield "```html\n<!doctype html><html><body>v2</body></html>\n```";
    });

    let optimizedVersion = "";
    for await (const event of optimizePrototype({
      projectId: project.id,
      prototypeId,
      versionId: "v1",
      instruction: "把颜色调暖一些",
    })) {
      if (event.type === "done") optimizedVersion = event.versionId;
    }

    expect(optimizedVersion).toBe("v2");
    await expect(getPrototypeVersion(project.id, prototypeId, "v2")).resolves.toMatchObject({
      changeSummary: "把颜色调暖一些",
    });
  });

  it("rejects incomplete HTML output", async () => {
    const project = await createProject({
      name: "原型项目",
      textInput: "做一个校园活动小程序",
      creationContext: projectCreationContext,
    });

    await savePrototypeProduct(project.id, product);
    await savePrototypeDirections(project.id, directions);
    await confirmPrototypeDirection(project.id, "pitch");

    generatePromptMock.mockResolvedValue({ system: "generate", user: "user" });
    streamTextMock.mockImplementation(async function* () {
      yield "```html\n<div>missing doctype</div>\n```";
    });

    await expect(
      (async () => {
        for await (const _event of generatePrototype(project.id)) {
          // consume all events to surface the final validation error
        }
      })(),
    ).rejects.toThrow("原型 HTML 不完整");
  });
});
