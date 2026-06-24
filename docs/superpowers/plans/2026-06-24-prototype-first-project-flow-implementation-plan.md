# Prototype First Project Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the prototype-first project flow: users enter a requirement, confirm website/mobile/miniapp context, receive 2-3 prototype directions, choose one, generate a high-fidelity multi-screen prototype board, then continue discussion-based or selection-based iteration.

**Architecture:** Add a new prototype pipeline beside the existing HTML page and React Studio flows instead of replacing them. Store prototype metadata under `.workspace/projects/{projectId}/prototype-*` and rendered HTML under `.workspace/projects/{projectId}/prototypes/{prototypeId}/vN.html`. Keep Analyze/Plan/Generate/Optimize responsibilities split so the first implementation can be tested with deterministic storage and API contracts before deeper UI polish.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing local filesystem storage in `lib/storage.ts`, existing model runtime wrapper in `lib/agent/pi-ai-runtime.ts`, Vitest for unit/API tests, SSE for generation and optimization progress.

---

## Scope and sequencing notes

This plan intentionally implements the prototype-first path as a new path and leaves the old single-page HTML workbench and React Studio reachable. It should not delete or rewrite the existing `/api/pages/*`, `/api/documents/*`, or `/projects/[projectId]/studio` flows.

There are currently unrelated working-tree changes in React/Sandpack files. Before executing this plan, either commit those changes separately or be very careful to stage only files named in each task.

## File map

### Types and storage

- Modify: `types/index.ts`
  - Add `ProjectCreationContext`, `PrototypeProductSpec`, `PrototypeDirection`, `PrototypeManifest`, `PrototypeVersion`, and request/response helper types.
  - Extend `Project` with optional `creationContext`.
  - Add a separate `PrototypeVersionSource` so prototype version sources do not pollute old page semantics.
- Modify: `lib/storage.ts`
  - Create prototype path helpers.
  - Save/read product analysis JSON.
  - Save/read prototype direction JSON.
  - Confirm a selected direction.
  - Create/read prototype HTML versions.
  - Create additional prototype versions for optimization.
- Add: `lib/prototype-validation.ts`
  - Runtime validation helpers for platform, audiences, use cases, and AI JSON shape.
- Add: `lib/prototype-validation.test.ts`
  - Unit tests for validation and normalization helpers.
- Add: `lib/prototype-storage.test.ts`
  - Storage-level tests for prototype product, directions, selected direction, and versions.

### Agent prompts and orchestrator

- Add: `lib/agent/prototype-prompts.ts`
  - `buildAnalyzePrototypePrompt()`.
  - `buildPlanPrototypePrompt()`.
  - `buildGeneratePrototypePrompt()`.
  - `buildOptimizePrototypePrompt()`.
- Add: `lib/agent/prototype-orchestrator.ts`
  - `analyzePrototype(projectId)`.
  - `planPrototype(projectId)`.
  - `confirmPrototypeDirection(projectId, directionId)`.
  - `generatePrototype(projectId)` as an async generator.
  - `optimizePrototype(args)` as an async generator.
- Add: `lib/agent/prototype-prompts.test.ts`
  - Prompt contract tests that check boundaries: Analyze prompt forbids HTML/React/WXML; Plan prompt requires 2-3 differentiated directions; Generate prompt requires multi-screen board.

### API routes

- Add: `app/api/prototypes/analyze/route.ts`
- Add: `app/api/prototypes/plan/route.ts`
- Add: `app/api/prototypes/confirm/route.ts`
- Add: `app/api/prototypes/confirm/route.test.ts`
- Add: `app/api/prototypes/generate/route.ts`
- Add: `app/api/prototypes/[prototypeId]/route.ts`
- Add: `app/api/prototypes/[prototypeId]/versions/route.ts`
- Add: `app/api/prototypes/[prototypeId]/versions/[versionId]/html/route.ts`
- Add: `app/api/prototypes/[prototypeId]/optimize/route.ts`
- Add: `app/api/prototypes/[prototypeId]/route.test.ts`
- Modify: `app/api/projects/route.ts`
  - Accept `textInput` and `creationContext` during project creation.
- Modify: `app/api/projects/route.test.ts`
  - Verify project creation context is saved and platform is immutable through creation context.

### UI components and pages

- Modify: `components/project-list.tsx`
  - Change new project input into a requirement input.
  - Show confirmation modal before project creation.
  - POST `name`, `textInput`, and `creationContext`.
  - Navigate to the new project after creation.
- Add: `components/projects/project-creation-context-dialog.tsx`
  - Platform single select: website/mobile/miniapp.
  - Audience multi-select with custom note.
  - Use case multi-select with custom note.
  - Keywords textarea.
  - Summary and final “开始分析” action.
- Add: `components/projects/project-creation-context-dialog.test.tsx`
  - Tests required fields and payload callback.
- Modify: `app/projects/[projectId]/page.tsx`
  - If `project.creationContext` exists, render the new `PrototypeWorkbench`; otherwise render the existing `WorkbenchLayout`.
  - Keep existing React 生成 link.
- Add: `components/prototypes/prototype-direction-card.tsx`
- Add: `components/prototypes/prototype-direction-card.test.tsx`
- Add: `components/prototypes/prototype-workbench.tsx`
  - Orchestrates analyzing, planning, direction choice, confirmation, generation, preview, and chat optimization.
- Add: `components/prototypes/prototype-preview-panel.tsx`
- Add: `components/prototypes/prototype-version-history.tsx`

---

## Task 1: Add prototype domain types and validation helpers

**Files:**
- Modify: `types/index.ts`
- Create: `lib/prototype-validation.ts`
- Create: `lib/prototype-validation.test.ts`

- [ ] **Step 1: Add failing validation tests**

Create `lib/prototype-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  isPrototypePlatform,
  normalizeCreationContext,
  parsePrototypeProductSpec,
  parsePrototypeDirections,
} from "@/lib/prototype-validation";

describe("prototype validation", () => {
  it("accepts supported prototype platforms", () => {
    expect(isPrototypePlatform("website")).toBe(true);
    expect(isPrototypePlatform("mobile")).toBe(true);
    expect(isPrototypePlatform("miniapp")).toBe(true);
    expect(isPrototypePlatform("desktop")).toBe(false);
  });

  it("normalizes creation context and trims custom notes", () => {
    expect(normalizeCreationContext({
      platform: "miniapp",
      audiences: ["学生", "普通用户", "学生"],
      audienceNote: " 校园社团负责人 ",
      useCases: ["产品演示"],
      useCaseNote: " 给学校领导看 ",
      keywords: " 暖色、校园感 ",
    })).toEqual({
      platform: "miniapp",
      audiences: ["学生", "普通用户"],
      audienceNote: "校园社团负责人",
      useCases: ["产品演示"],
      useCaseNote: "给学校领导看",
      keywords: "暖色、校园感",
    });
  });

  it("rejects creation context without platform, audience, or use case", () => {
    expect(() => normalizeCreationContext({ platform: "desktop", audiences: ["客户"], useCases: ["产品演示"] })).toThrow("平台类型不支持");
    expect(() => normalizeCreationContext({ platform: "website", audiences: [], useCases: ["产品演示"] })).toThrow("请至少选择或填写一个受众群体");
    expect(() => normalizeCreationContext({ platform: "website", audiences: ["客户"], useCases: [] })).toThrow("请至少选择或填写一个用途");
  });

  it("parses a valid prototype product spec", () => {
    const spec = parsePrototypeProductSpec({
      summary: "校园活动发布小程序",
      platform: "miniapp",
      audienceSummary: "学生和社团负责人",
      useCaseSummary: "用于产品演示和需求评审",
      contentScope: "覆盖活动发现、详情、发布和我的",
      primaryGoal: "让评审方理解完整活动流转",
      successCriteria: ["看懂核心流程", "明确关键页面"],
      keyFlows: [{ name: "报名活动", entry: "首页", goal: "完成报名", screens: ["首页", "详情页", "报名成功页"] }],
      requiredScreens: ["首页", "详情页", "发布页", "我的页"],
      optionalScreens: ["授权页"],
      fidelityTarget: "hi-fi",
      deviceFrame: "miniapp-phone",
      variationAxes: ["轻量展示 vs 完整闭环"],
      visualConstraints: {
        styleKeywords: ["校园感", "暖色"],
        brandTone: "亲和可信",
        referenceApps: [],
        colorPreference: "暖色",
      },
      assumptions: ["用户以手机访问为主"],
      openQuestions: [],
      constraints: ["不要默认拆管理端"],
    });

    expect(spec.platform).toBe("miniapp");
    expect(spec.keyFlows[0].screens).toContain("详情页");
  });

  it("requires 2-3 prototype directions", () => {
    expect(() => parsePrototypeDirections([{ id: "a" }])).toThrow("需要生成 2-3 套原型方案");
    const directions = parsePrototypeDirections([
      { id: "flow", name: "流程评审版", scenario: "需求评审", screenList: ["首页"], visualDirection: "清晰克制", complexity: "low", estimatedScreens: 5, recommendationReason: "流程最清楚" },
      { id: "pitch", name: "提案展示版", scenario: "客户提案", screenList: ["首页"], visualDirection: "更有冲击力", complexity: "medium", estimatedScreens: 7, recommendationReason: "更适合展示" },
    ]);
    expect(directions).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the failing validation tests**

Run:

```bash
npm test -- lib/prototype-validation.test.ts
```

Expected: FAIL because `@/lib/prototype-validation` does not exist.

- [ ] **Step 3: Add prototype types**

Modify `types/index.ts` by adding these types after `Project` and before `SourceDocument`:

```ts
export type PrototypePlatform = "website" | "mobile" | "miniapp";

export type ProjectCreationContext = {
  platform: PrototypePlatform;
  audiences: string[];
  audienceNote?: string;
  useCases: string[];
  useCaseNote?: string;
  keywords?: string;
};

export type PrototypeKeyFlow = {
  name: string;
  entry: string;
  goal: string;
  screens: string[];
};

export type PrototypeVisualConstraints = {
  styleKeywords: string[];
  brandTone: string;
  referenceApps: string[];
  colorPreference?: string;
};

export type PrototypeProductSpec = {
  summary: string;
  platform: PrototypePlatform;
  audienceSummary: string;
  useCaseSummary: string;
  contentScope: string;
  primaryGoal: string;
  successCriteria: string[];
  keyFlows: PrototypeKeyFlow[];
  requiredScreens: string[];
  optionalScreens: string[];
  fidelityTarget: "low-fi" | "mid-fi" | "hi-fi";
  deviceFrame: "desktop-browser" | "mobile-app" | "miniapp-phone";
  variationAxes: string[];
  visualConstraints: PrototypeVisualConstraints;
  assumptions: string[];
  openQuestions: string[];
  constraints: string[];
};

export type PrototypeDirection = {
  id: string;
  name: string;
  scenario: string;
  screenList: string[];
  visualDirection: string;
  complexity: Complexity;
  estimatedScreens: number;
  recommendationReason: string;
};

export type PrototypeDirectionsFile = {
  directions: PrototypeDirection[];
  selectedDirectionId: string | null;
};

export type PrototypeVersionSource =
  | "initial-generation"
  | "chat-optimization"
  | "selection-optimization"
  | "rollback";

export type PrototypeVersion = {
  id: string;
  prototypeId: string;
  versionNumber: number;
  htmlPath: string;
  previewPath: string;
  createdAt: IsoDateString;
  source: PrototypeVersionSource;
  changeSummary: string;
};

export type PrototypeManifest = {
  id: string;
  projectId: string;
  directionId: string;
  name: string;
  currentVersionId: string;
  versionIds: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};
```

Also update the existing `Project` type by adding this optional field:

```ts
  creationContext?: ProjectCreationContext;
```

Update `CreateProjectInput` from:

```ts
export type CreateProjectInput = {
  name: string;
};
```

to:

```ts
export type CreateProjectInput = {
  name: string;
  textInput?: string;
  creationContext?: ProjectCreationContext;
};
```

Update `UpdateProjectInput` from:

```ts
export type UpdateProjectInput = Partial<Pick<Project, "name" | "textInput" | "sourceDocumentIds" | "pageIds" | "currentSkillId">>;
```

to:

```ts
export type UpdateProjectInput = Partial<Pick<Project, "name" | "textInput" | "sourceDocumentIds" | "pageIds" | "currentSkillId">>;
```

Do not include `creationContext` in `UpdateProjectInput`; platform is immutable after project creation.

- [ ] **Step 4: Implement validation helpers**

Create `lib/prototype-validation.ts`:

```ts
import type {
  ProjectCreationContext,
  PrototypeDirection,
  PrototypePlatform,
  PrototypeProductSpec,
} from "@/types";

const PLATFORMS: PrototypePlatform[] = ["website", "mobile", "miniapp"];
const FIDELITY_TARGETS = ["low-fi", "mid-fi", "hi-fi"] as const;
const DEVICE_FRAMES = ["desktop-browser", "mobile-app", "miniapp-phone"] as const;
const COMPLEXITIES = ["low", "medium", "high"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}不能为空`);
  return value.trim();
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label}必须是数组`);
  const result = [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
  if (result.length === 0) throw new Error(`${label}不能为空`);
  return result;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function isPrototypePlatform(value: unknown): value is PrototypePlatform {
  return typeof value === "string" && PLATFORMS.includes(value as PrototypePlatform);
}

export function normalizeCreationContext(input: unknown): ProjectCreationContext {
  if (!isRecord(input)) throw new Error("创建上下文不能为空");
  if (!isPrototypePlatform(input.platform)) throw new Error("平台类型不支持");

  const audienceNote = optionalString(input.audienceNote);
  const useCaseNote = optionalString(input.useCaseNote);
  const audiences = Array.isArray(input.audiences)
    ? [...new Set(input.audiences.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];
  const useCases = Array.isArray(input.useCases)
    ? [...new Set(input.useCases.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];

  if (audiences.length === 0 && !audienceNote) throw new Error("请至少选择或填写一个受众群体");
  if (useCases.length === 0 && !useCaseNote) throw new Error("请至少选择或填写一个用途");

  return {
    platform: input.platform,
    audiences,
    ...(audienceNote ? { audienceNote } : {}),
    useCases,
    ...(useCaseNote ? { useCaseNote } : {}),
    ...(optionalString(input.keywords) ? { keywords: optionalString(input.keywords) } : {}),
  };
}

export function parsePrototypeProductSpec(input: unknown): PrototypeProductSpec {
  if (!isRecord(input)) throw new Error("原型分析结果不是对象");
  if (!isPrototypePlatform(input.platform)) throw new Error("原型分析结果平台无效");
  if (!FIDELITY_TARGETS.includes(input.fidelityTarget as never)) throw new Error("原型保真度无效");
  if (!DEVICE_FRAMES.includes(input.deviceFrame as never)) throw new Error("设备框架无效");

  const visual = input.visualConstraints;
  if (!isRecord(visual)) throw new Error("视觉约束不能为空");

  const keyFlowsRaw = input.keyFlows;
  if (!Array.isArray(keyFlowsRaw) || keyFlowsRaw.length === 0) throw new Error("关键流程不能为空");
  const keyFlows = keyFlowsRaw.map((flow, index) => {
    if (!isRecord(flow)) throw new Error(`关键流程${index + 1}无效`);
    return {
      name: stringValue(flow.name, "流程名称"),
      entry: stringValue(flow.entry, "流程入口"),
      goal: stringValue(flow.goal, "流程目标"),
      screens: stringArray(flow.screens, "流程页面"),
    };
  });

  return {
    summary: stringValue(input.summary, "摘要"),
    platform: input.platform,
    audienceSummary: stringValue(input.audienceSummary, "受众摘要"),
    useCaseSummary: stringValue(input.useCaseSummary, "用途摘要"),
    contentScope: stringValue(input.contentScope, "内容范围"),
    primaryGoal: stringValue(input.primaryGoal, "主要目标"),
    successCriteria: stringArray(input.successCriteria, "成功标准"),
    keyFlows,
    requiredScreens: stringArray(input.requiredScreens, "必需页面"),
    optionalScreens: Array.isArray(input.optionalScreens) ? input.optionalScreens.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
    fidelityTarget: input.fidelityTarget as PrototypeProductSpec["fidelityTarget"],
    deviceFrame: input.deviceFrame as PrototypeProductSpec["deviceFrame"],
    variationAxes: stringArray(input.variationAxes, "方案差异维度"),
    visualConstraints: {
      styleKeywords: Array.isArray(visual.styleKeywords) ? visual.styleKeywords.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
      brandTone: stringValue(visual.brandTone, "品牌语气"),
      referenceApps: Array.isArray(visual.referenceApps) ? visual.referenceApps.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
      ...(optionalString(visual.colorPreference) ? { colorPreference: optionalString(visual.colorPreference) } : {}),
    },
    assumptions: Array.isArray(input.assumptions) ? input.assumptions.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
    openQuestions: Array.isArray(input.openQuestions) ? input.openQuestions.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
    constraints: Array.isArray(input.constraints) ? input.constraints.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [],
  };
}

export function parsePrototypeDirections(input: unknown): PrototypeDirection[] {
  if (!Array.isArray(input) || input.length < 2 || input.length > 3) {
    throw new Error("需要生成 2-3 套原型方案");
  }

  return input.map((direction, index) => {
    if (!isRecord(direction)) throw new Error(`原型方案${index + 1}无效`);
    if (!COMPLEXITIES.includes(direction.complexity as never)) throw new Error("方案复杂度无效");
    const estimatedScreens = typeof direction.estimatedScreens === "number" ? Math.round(direction.estimatedScreens) : 0;
    if (estimatedScreens < 1) throw new Error("预计页面数必须大于 0");
    return {
      id: stringValue(direction.id, "方案 ID"),
      name: stringValue(direction.name, "方案名称"),
      scenario: stringValue(direction.scenario, "适用场景"),
      screenList: stringArray(direction.screenList, "页面清单"),
      visualDirection: stringValue(direction.visualDirection, "视觉方向"),
      complexity: direction.complexity as PrototypeDirection["complexity"],
      estimatedScreens,
      recommendationReason: stringValue(direction.recommendationReason, "推荐理由"),
    };
  });
}
```

- [ ] **Step 5: Run validation tests**

Run:

```bash
npm test -- lib/prototype-validation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add types/index.ts lib/prototype-validation.ts lib/prototype-validation.test.ts
git commit -m "feat: add prototype domain validation"
```

---

## Task 2: Add prototype storage primitives

**Files:**
- Modify: `lib/storage.ts`
- Create: `lib/prototype-storage.test.ts`
- Modify: `types/index.ts` only if Task 1 missed an import or type export

- [ ] **Step 1: Add failing storage tests**

Create `lib/prototype-storage.test.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
  { id: "review", name: "评审版", scenario: "需求评审", screenList: ["首页", "详情页"], visualDirection: "清晰克制", complexity: "low", estimatedScreens: 5, recommendationReason: "流程最清楚" },
  { id: "pitch", name: "提案版", scenario: "客户提案", screenList: ["首页", "详情页", "发布页"], visualDirection: "更完整", complexity: "medium", estimatedScreens: 7, recommendationReason: "更适合展示" },
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
    const { prototype, version } = await createPrototype(project.id, "pitch", "提案版", "<!doctype html><html><body>v1</body></html>");
    const second = await createPrototypeVersion(project.id, prototype.id, "<!doctype html><html><body>v2</body></html>", "改成蓝绿色", "chat-optimization");

    expect(prototype.currentVersionId).toBe("v1");
    expect(version.previewPath).toBe(`/api/prototypes/${prototype.id}/versions/v1/html?projectId=${project.id}`);
    await expect(getPrototype(project.id, prototype.id)).resolves.toMatchObject({ currentVersionId: "v2", versionIds: ["v1", "v2"] });
    await expect(getPrototypeVersion(project.id, prototype.id, "v2")).resolves.toMatchObject({ changeSummary: "改成蓝绿色" });
    await expect(readPrototypeHtml(project.id, prototype.id, "v1")).resolves.toContain("v1");
    await expect(readPrototypeHtml(project.id, prototype.id, "v2")).resolves.toContain("v2");

    const oldHtml = await readFile(version.htmlPath, "utf8");
    expect(oldHtml).toContain("v1");
    expect(second.version.versionNumber).toBe(2);
  });
});
```

- [ ] **Step 2: Run the failing storage tests**

Run:

```bash
npm test -- lib/prototype-storage.test.ts
```

Expected: FAIL because prototype storage functions are not exported.

- [ ] **Step 3: Add storage imports and constants**

Modify the import type list at the top of `lib/storage.ts` to include the prototype types:

```ts
import type {
  CreateProjectInput,
  CreateSourceDocumentInput,
  GeneratedPage,
  PageSuggestion,
  PageVersion,
  PageVersionSource,
  Project,
  ProjectDesignMemory,
  PrototypeDirection,
  PrototypeDirectionsFile,
  PrototypeManifest,
  PrototypeProductSpec,
  PrototypeVersion,
  PrototypeVersionSource,
  ShareLink,
  SourceDocument,
  UpdateProjectInput,
} from "@/types";
```

Add constants near existing metadata constants:

```ts
const PROTOTYPE_PRODUCT_FILE = "prototype-product.json";
const PROTOTYPE_DIRECTIONS_FILE = "prototype-directions.json";
const PROTOTYPES_DIR = "prototypes";
const PROTOTYPE_METADATA_FILE = "prototype.json";
```

- [ ] **Step 4: Save text input and creation context during project creation**

In `createProject()`, add `textInput` and `creationContext` to the created project only when present:

```ts
  const project: Project = {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now,
    sourceDocumentIds: [],
    pageIds: [],
    currentSkillId: DEFAULT_SKILL_ID,
    ...(input.textInput?.trim() ? { textInput: input.textInput.trim() } : {}),
    ...(input.creationContext ? { creationContext: input.creationContext } : {}),
  };
```

- [ ] **Step 5: Ensure prototype directories are created**

Add path helpers after `getProjectPagesPath()`:

```ts
export function getProjectPrototypeProductPath(projectId: string) {
  return path.join(getProjectPath(projectId), PROTOTYPE_PRODUCT_FILE);
}

export function getProjectPrototypeDirectionsPath(projectId: string) {
  return path.join(getProjectPath(projectId), PROTOTYPE_DIRECTIONS_FILE);
}

export function getProjectPrototypesPath(projectId: string) {
  return path.join(getProjectPath(projectId), PROTOTYPES_DIR);
}

export function getPrototypePath(projectId: string, prototypeId: string) {
  assertSafePathSegment(prototypeId, "prototypeId");
  return path.join(getProjectPrototypesPath(projectId), prototypeId);
}

export function getPrototypeMetadataPath(projectId: string, prototypeId: string) {
  return path.join(getPrototypePath(projectId, prototypeId), PROTOTYPE_METADATA_FILE);
}

export function getPrototypeVersionHtmlPath(projectId: string, prototypeId: string, versionId: string) {
  assertSafePathSegment(versionId, "versionId");
  return path.join(getPrototypePath(projectId, prototypeId), `${versionId}.html`);
}
```

Update `ensureProjectDirectories()` by adding:

```ts
    mkdir(getProjectPrototypesPath(projectId), { recursive: true }),
```

- [ ] **Step 6: Add product and direction persistence functions**

Add these functions after `listPageSuggestions()`:

```ts
export async function savePrototypeProduct(projectId: string, product: PrototypeProductSpec): Promise<PrototypeProductSpec> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  await writeJsonFile(getProjectPrototypeProductPath(projectId), product);
  return product;
}

export async function getPrototypeProduct(projectId: string): Promise<PrototypeProductSpec | null> {
  const filePath = getProjectPrototypeProductPath(projectId);
  if (!(await pathExists(filePath))) return null;
  return readJsonFile<PrototypeProductSpec>(filePath);
}

export async function savePrototypeDirections(projectId: string, directions: PrototypeDirection[]): Promise<PrototypeDirectionsFile> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  const file: PrototypeDirectionsFile = { directions, selectedDirectionId: null };
  await writeJsonFile(getProjectPrototypeDirectionsPath(projectId), file);
  return file;
}

export async function getPrototypeDirections(projectId: string): Promise<PrototypeDirectionsFile | null> {
  const filePath = getProjectPrototypeDirectionsPath(projectId);
  if (!(await pathExists(filePath))) return null;
  return readJsonFile<PrototypeDirectionsFile>(filePath);
}

export async function confirmPrototypeDirection(projectId: string, directionId: string): Promise<PrototypeDirectionsFile> {
  const file = await getPrototypeDirections(projectId);
  if (!file) throw new Error("尚未生成原型方案");
  if (!file.directions.some((direction) => direction.id === directionId)) throw new Error("原型方案不存在");
  const updated: PrototypeDirectionsFile = { ...file, selectedDirectionId: directionId };
  await writeJsonFile(getProjectPrototypeDirectionsPath(projectId), updated);
  return updated;
}
```

- [ ] **Step 7: Add prototype version functions**

Add these functions after `readPageHtml()`:

```ts
export async function getPrototype(projectId: string, prototypeId: string): Promise<PrototypeManifest | null> {
  const metadataPath = getPrototypeMetadataPath(projectId, prototypeId);
  if (!(await pathExists(metadataPath))) return null;
  return readJsonFile<PrototypeManifest>(metadataPath);
}

export async function createPrototype(
  projectId: string,
  directionId: string,
  name: string,
  html: string,
): Promise<{ prototype: PrototypeManifest; version: PrototypeVersion }> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  const prototypeId = nanoid();
  const versionId = "v1";
  const now = new Date().toISOString();

  await mkdir(getPrototypePath(projectId, prototypeId), { recursive: true });
  const htmlPath = getPrototypeVersionHtmlPath(projectId, prototypeId, versionId);
  await writeFile(htmlPath, html, "utf8");

  const version: PrototypeVersion = {
    id: versionId,
    prototypeId,
    versionNumber: 1,
    htmlPath,
    previewPath: `/api/prototypes/${prototypeId}/versions/${versionId}/html?projectId=${projectId}`,
    createdAt: now,
    source: "initial-generation",
    changeSummary: "初始生成",
  };

  const prototype: PrototypeManifest = {
    id: prototypeId,
    projectId,
    directionId,
    name,
    currentVersionId: versionId,
    versionIds: [versionId],
    createdAt: now,
    updatedAt: now,
  };

  await writeJsonFile(getPrototypeMetadataPath(projectId, prototypeId), prototype);
  await writeJsonFile(path.join(getPrototypePath(projectId, prototypeId), `${versionId}.json`), version);

  return { prototype, version };
}

export async function createPrototypeVersion(
  projectId: string,
  prototypeId: string,
  html: string,
  changeSummary: string,
  source: PrototypeVersionSource,
): Promise<{ prototype: PrototypeManifest; version: PrototypeVersion }> {
  const prototype = await getPrototype(projectId, prototypeId);
  if (!prototype) throw new Error("Prototype not found");

  const versionNumber = prototype.versionIds.length + 1;
  const versionId = `v${versionNumber}`;
  const now = new Date().toISOString();
  const htmlPath = getPrototypeVersionHtmlPath(projectId, prototypeId, versionId);
  await writeFile(htmlPath, html, "utf8");

  const version: PrototypeVersion = {
    id: versionId,
    prototypeId,
    versionNumber,
    htmlPath,
    previewPath: `/api/prototypes/${prototypeId}/versions/${versionId}/html?projectId=${projectId}`,
    createdAt: now,
    source,
    changeSummary,
  };

  const updatedPrototype: PrototypeManifest = {
    ...prototype,
    currentVersionId: versionId,
    versionIds: [...prototype.versionIds, versionId],
    updatedAt: now,
  };

  await writeJsonFile(getPrototypeMetadataPath(projectId, prototypeId), updatedPrototype);
  await writeJsonFile(path.join(getPrototypePath(projectId, prototypeId), `${versionId}.json`), version);

  return { prototype: updatedPrototype, version };
}

export async function getPrototypeVersion(projectId: string, prototypeId: string, versionId: string): Promise<PrototypeVersion | null> {
  assertSafePathSegment(versionId, "versionId");
  const versionPath = path.join(getPrototypePath(projectId, prototypeId), `${versionId}.json`);
  if (!(await pathExists(versionPath))) return null;
  return readJsonFile<PrototypeVersion>(versionPath);
}

export async function readPrototypeHtml(projectId: string, prototypeId: string, versionId: string): Promise<string | null> {
  const htmlPath = getPrototypeVersionHtmlPath(projectId, prototypeId, versionId);
  if (!(await pathExists(htmlPath))) return null;
  return readFile(htmlPath, "utf8");
}
```

- [ ] **Step 8: Run storage tests**

Run:

```bash
npm test -- lib/prototype-storage.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run related existing storage tests**

Run:

```bash
npm test -- lib/storage.test.ts app/api/projects/route.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 2**

Run:

```bash
git add lib/storage.ts lib/prototype-storage.test.ts types/index.ts
git commit -m "feat: add prototype storage"
```

---

## Task 3: Accept creation context in project API

**Files:**
- Modify: `app/api/projects/route.ts`
- Modify: `app/api/projects/route.test.ts`

- [ ] **Step 1: Add failing project API test**

Append this test inside `describe("/api/projects", ...)` in `app/api/projects/route.test.ts`:

```ts
  it("creates a project with immutable prototype creation context", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "校园活动助手",
          textInput: "做一个校园活动小程序原型",
          creationContext: {
            platform: "miniapp",
            audiences: ["学生", "普通用户"],
            audienceNote: "社团负责人",
            useCases: ["产品演示", "需求评审"],
            keywords: "暖色、校园感",
          },
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.project.textInput).toBe("做一个校园活动小程序原型");
    expect(body.project.creationContext).toEqual({
      platform: "miniapp",
      audiences: ["学生", "普通用户"],
      audienceNote: "社团负责人",
      useCases: ["产品演示", "需求评审"],
      keywords: "暖色、校园感",
    });
  });

  it("rejects invalid prototype creation context", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: "错误项目",
          creationContext: {
            platform: "desktop",
            audiences: ["客户"],
            useCases: ["产品演示"],
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "平台类型不支持" });
  });
```

- [ ] **Step 2: Run failing API tests**

Run:

```bash
npm test -- app/api/projects/route.test.ts
```

Expected: FAIL because route ignores or does not validate `creationContext`.

- [ ] **Step 3: Update project route**

Modify `app/api/projects/route.ts`:

```ts
import { normalizeCreationContext } from "@/lib/prototype-validation";
```

Replace the POST body extraction after `name` with:

```ts
  const textInput = typeof body === "object" && body !== null && "textInput" in body ? body.textInput : undefined;
  const rawCreationContext = typeof body === "object" && body !== null && "creationContext" in body ? body.creationContext : undefined;
```

Before `createProject`, add:

```ts
  let creationContext;
  try {
    creationContext = rawCreationContext === undefined ? undefined : normalizeCreationContext(rawCreationContext);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建上下文无效" }, { status: 400 });
  }
```

Replace:

```ts
  const project = await createProject({ name });
```

with:

```ts
  const project = await createProject({
    name,
    ...(typeof textInput === "string" && textInput.trim() ? { textInput: textInput.trim() } : {}),
    ...(creationContext ? { creationContext } : {}),
  });
```

- [ ] **Step 4: Run project API tests**

Run:

```bash
npm test -- app/api/projects/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add app/api/projects/route.ts app/api/projects/route.test.ts
git commit -m "feat: accept prototype project context"
```

---

## Task 4: Add prototype prompt builders and orchestrator

**Files:**
- Create: `lib/agent/prototype-prompts.ts`
- Create: `lib/agent/prototype-prompts.test.ts`
- Create: `lib/agent/prototype-orchestrator.ts`

- [ ] **Step 1: Add failing prompt contract tests**

Create `lib/agent/prototype-prompts.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildAnalyzePrototypePrompt,
  buildGeneratePrototypePrompt,
  buildPlanPrototypePrompt,
  buildOptimizePrototypePrompt,
} from "@/lib/agent/prototype-prompts";
import type { Project, PrototypeDirection, PrototypeProductSpec } from "@/types";

const project: Project = {
  id: "p1",
  name: "校园活动助手",
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
  sourceDocumentIds: [],
  pageIds: [],
  currentSkillId: "ui-ux-pro-max",
  textInput: "做一个校园活动小程序",
  creationContext: {
    platform: "miniapp",
    audiences: ["学生"],
    useCases: ["产品演示"],
    keywords: "暖色、校园感",
  },
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

const direction: PrototypeDirection = {
  id: "pitch",
  name: "提案版",
  scenario: "客户提案",
  screenList: ["首页", "详情页"],
  visualDirection: "暖色纸感",
  complexity: "medium",
  estimatedScreens: 6,
  recommendationReason: "更适合演示",
};

describe("prototype prompt builders", () => {
  it("builds analyze prompt with strict non-generation boundaries", async () => {
    const prompt = await buildAnalyzePrototypePrompt({ project });
    expect(prompt.system).toContain("原型需求分析 Agent");
    expect(prompt.system).toContain("不要生成 HTML / React / WXML 代码");
    expect(prompt.system).toContain("不要默认拆成管理端、运营端、用户端");
    expect(prompt.user).toContain("miniapp");
    expect(prompt.user).toContain("做一个校园活动小程序");
  });

  it("builds plan prompt requiring 2-3 differentiated directions", async () => {
    const prompt = await buildPlanPrototypePrompt(product);
    expect(prompt.system).toContain("推荐 2-3 套原型方案");
    expect(prompt.system).toContain("不能只是换颜色");
    expect(prompt.user).toContain("variationAxes");
  });

  it("builds generate prompt for a high-fidelity multi-screen board", async () => {
    const prompt = await buildGeneratePrototypePrompt({ product, direction });
    expect(prompt.system).toContain("高保真原型方案板");
    expect(prompt.system).toContain("单文件 HTML");
    expect(prompt.system).toContain("多个手机壳 / 浏览器窗口 / 页面画板");
  });

  it("builds optimize prompt preserving versions and current context", async () => {
    const prompt = await buildOptimizePrototypePrompt({
      product,
      direction,
      currentHtml: "<!doctype html><html><body>old</body></html>",
      instruction: "把配色换成蓝绿色",
    });
    expect(prompt.system).toContain("原型优化 Agent");
    expect(prompt.user).toContain("把配色换成蓝绿色");
  });
});
```

- [ ] **Step 2: Run failing prompt tests**

Run:

```bash
npm test -- lib/agent/prototype-prompts.test.ts
```

Expected: FAIL because `prototype-prompts.ts` does not exist.

- [ ] **Step 3: Implement prompt builders**

Create `lib/agent/prototype-prompts.ts`:

```ts
import type { Project, PrototypeDirection, PrototypeProductSpec } from "@/types";
import type { LlmCallParams } from "./pi-ai-runtime";

function contextText(project: Project): string {
  const context = project.creationContext;
  return JSON.stringify({
    projectId: project.id,
    projectName: project.name,
    textInput: project.textInput ?? "",
    creationContext: context ?? null,
  }, null, 2);
}

export async function buildAnalyzePrototypePrompt(input: { project: Project }): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型需求分析 Agent。",
    "你的任务不是生成页面，也不是写代码，而是把用户输入的自然语言需求、平台类型、受众、用途和关键词，整理成适合后续原型方案规划的结构化产品分析。",
    "",
    "硬性边界:",
    "- 只能输出 JSON，不要输出 Markdown。",
    "- 不要生成 UI 方案卡片。",
    "- 不要生成 HTML / React / WXML 代码。",
    "- 不要默认拆成管理端、运营端、用户端，除非用户明确提到。",
    "- 如果信息不足，在 openQuestions 中提出 1-3 个具体问题，同时输出 assumptions。",
    "",
    "输出类型:",
    "type PrototypeProductSpec = { summary:string; platform:'website'|'mobile'|'miniapp'; audienceSummary:string; useCaseSummary:string; contentScope:string; primaryGoal:string; successCriteria:string[]; keyFlows:{name:string;entry:string;goal:string;screens:string[]}[]; requiredScreens:string[]; optionalScreens:string[]; fidelityTarget:'low-fi'|'mid-fi'|'hi-fi'; deviceFrame:'desktop-browser'|'mobile-app'|'miniapp-phone'; variationAxes:string[]; visualConstraints:{styleKeywords:string[];brandTone:string;referenceApps:string[];colorPreference?:string}; assumptions:string[]; openQuestions:string[]; constraints:string[] }",
  ].join("\n");

  const user = `项目上下文:\n\`\`\`json\n${contextText(input.project)}\n\`\`\``;

  return { system, user, tier: "reasoning", temperature: 0.4, maxTokens: 4096 };
}

export async function buildPlanPrototypePrompt(product: PrototypeProductSpec): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型方案规划 Agent。",
    "根据 PrototypeProductSpec 推荐 2-3 套原型方案。",
    "每套方案必须有明显差异，不能只是换颜色。",
    "方案差异应来自 variationAxes、页面范围、表达重点、复杂度、评审/提案/测试用途差异。",
    "只能输出 JSON 数组，不要输出 Markdown，不要生成 HTML。",
    "输出类型: PrototypeDirection[] = { id:string; name:string; scenario:string; screenList:string[]; visualDirection:string; complexity:'low'|'medium'|'high'; estimatedScreens:number; recommendationReason:string }[]",
  ].join("\n");
  const user = `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(product, null, 2)}\n\`\`\``;
  return { system, user, tier: "reasoning", temperature: 0.7, maxTokens: 4096 };
}

export async function buildGeneratePrototypePrompt(args: { product: PrototypeProductSpec; direction: PrototypeDirection }): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型生成 Agent。",
    "生成一个可直接预览的高保真原型方案板。",
    "输出必须是完整单文件 HTML，包含 <!doctype html> 和 </html>。",
    "原型方案板要展示多个手机壳 / 浏览器窗口 / 页面画板，并包含页面编号、页面名称、流程说明和设计说明。",
    "不要生成 React、Vue、WXML、外部资源依赖或需要构建的代码。",
    "平台规则: website 使用桌面浏览器窗口和页面缩略图矩阵；mobile 使用 App 手机壳；miniapp 使用小程序式手机壳、底部导航和轻量路径。",
  ].join("\n");
  const user = [
    `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(args.product, null, 2)}\n\`\`\``,
    `Selected PrototypeDirection:\n\`\`\`json\n${JSON.stringify(args.direction, null, 2)}\n\`\`\``,
  ].join("\n\n");
  return { system, user, tier: "generation", temperature: 0.7, maxTokens: 16384 };
}

export async function buildOptimizePrototypePrompt(args: {
  product: PrototypeProductSpec;
  direction: PrototypeDirection;
  currentHtml: string;
  instruction: string;
  selectedElement?: { html: string; text?: string; path?: string };
}): Promise<LlmCallParams> {
  const system = [
    "你是 DesignDraft 的原型优化 Agent。",
    "根据用户修改意见，在保留当前平台、方案和页面板结构的前提下，输出新的完整单文件 HTML。",
    "不要只输出 diff，不要解释。",
    "输出必须包含 <!doctype html> 和 </html>。",
  ].join("\n");
  const user = [
    `PrototypeProductSpec:\n\`\`\`json\n${JSON.stringify(args.product, null, 2)}\n\`\`\``,
    `PrototypeDirection:\n\`\`\`json\n${JSON.stringify(args.direction, null, 2)}\n\`\`\``,
    args.selectedElement ? `SelectedElement:\n\`\`\`json\n${JSON.stringify(args.selectedElement, null, 2)}\n\`\`\`` : "",
    `UserInstruction:\n${args.instruction}`,
    `CurrentHtml:\n\`\`\`html\n${args.currentHtml}\n\`\`\``,
  ].filter(Boolean).join("\n\n");
  return { system, user, tier: "generation", temperature: 0.65, maxTokens: 16384 };
}
```

- [ ] **Step 4: Run prompt tests**

Run:

```bash
npm test -- lib/agent/prototype-prompts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement prototype orchestrator**

Create `lib/agent/prototype-orchestrator.ts`:

```ts
import {
  confirmPrototypeDirection as confirmDirectionInStorage,
  createPrototype,
  createPrototypeVersion,
  getProject,
  getPrototypeDirections,
  getPrototypeProduct,
  getPrototypeVersion,
  readPrototypeHtml,
  savePrototypeDirections,
  savePrototypeProduct,
} from "@/lib/storage";
import type { PrototypeDirection, PrototypeProductSpec } from "@/types";
import { parsePrototypeDirections, parsePrototypeProductSpec } from "@/lib/prototype-validation";

import { completeText, streamText } from "./pi-ai-runtime";
import {
  buildAnalyzePrototypePrompt,
  buildGeneratePrototypePrompt,
  buildOptimizePrototypePrompt,
  buildPlanPrototypePrompt,
} from "./prototype-prompts";

function extractJson<T>(text: string): T {
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error("模型未返回 JSON");
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1)) as T;
    }
  }
  throw new Error("模型 JSON 不完整");
}

function assertCompleteHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed.toLowerCase().includes("<!doctype html") || !trimmed.toLowerCase().includes("</html>")) {
    throw new Error("原型 HTML 不完整");
  }
  return trimmed;
}

export async function analyzePrototype(projectId: string): Promise<PrototypeProductSpec> {
  const project = await getProject(projectId);
  if (!project) throw new Error("项目不存在");
  if (!project.creationContext) throw new Error("项目缺少原型创建上下文");
  const params = await buildAnalyzePrototypePrompt({ project });
  const raw = await completeText(params);
  const product = parsePrototypeProductSpec(extractJson<unknown>(raw));
  await savePrototypeProduct(projectId, product);
  return product;
}

export async function planPrototype(projectId: string): Promise<PrototypeDirection[]> {
  const product = await getPrototypeProduct(projectId);
  if (!product) throw new Error("尚未完成原型需求分析");
  const params = await buildPlanPrototypePrompt(product);
  const raw = await completeText(params);
  const directions = parsePrototypeDirections(extractJson<unknown>(raw));
  await savePrototypeDirections(projectId, directions);
  return directions;
}

export async function confirmPrototypeDirection(projectId: string, directionId: string) {
  return confirmDirectionInStorage(projectId, directionId);
}

export type PrototypeGenerateEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; prototypeId: string; versionId: string; versionNumber: number; previewPath: string };

export async function* generatePrototype(projectId: string): AsyncGenerator<PrototypeGenerateEvent, void> {
  const product = await getPrototypeProduct(projectId);
  const directionsFile = await getPrototypeDirections(projectId);
  if (!product || !directionsFile) throw new Error("缺少原型分析或方案");
  const direction = directionsFile.directions.find((item) => item.id === directionsFile.selectedDirectionId) ?? directionsFile.directions[0];
  if (!direction) throw new Error("没有可用的原型方案");

  const params = await buildGeneratePrototypePrompt({ product, direction });
  let full = "";
  for await (const chunk of streamText(params)) {
    full += chunk;
    yield { type: "chunk", text: chunk };
  }

  const html = assertCompleteHtml(full);
  const { prototype, version } = await createPrototype(projectId, direction.id, direction.name, html);
  yield { type: "done", prototypeId: prototype.id, versionId: version.id, versionNumber: version.versionNumber, previewPath: version.previewPath };
}

export async function* optimizePrototype(args: {
  projectId: string;
  prototypeId: string;
  versionId: string;
  instruction: string;
  selectedElement?: { html: string; text?: string; path?: string };
}): AsyncGenerator<PrototypeGenerateEvent, void> {
  const product = await getPrototypeProduct(args.projectId);
  const directionsFile = await getPrototypeDirections(args.projectId);
  const currentVersion = await getPrototypeVersion(args.projectId, args.prototypeId, args.versionId);
  const currentHtml = await readPrototypeHtml(args.projectId, args.prototypeId, args.versionId);
  if (!product || !directionsFile || !currentVersion || !currentHtml) throw new Error("原型上下文不完整");
  const direction = directionsFile.directions.find((item) => item.id === directionsFile.selectedDirectionId) ?? directionsFile.directions[0];
  if (!direction) throw new Error("没有可用的原型方案");

  const params = await buildOptimizePrototypePrompt({
    product,
    direction,
    currentHtml,
    instruction: args.instruction,
    selectedElement: args.selectedElement,
  });

  let full = "";
  for await (const chunk of streamText(params)) {
    full += chunk;
    yield { type: "chunk", text: chunk };
  }

  const html = assertCompleteHtml(full);
  const source = args.selectedElement ? "selection-optimization" : "chat-optimization";
  const { prototype, version } = await createPrototypeVersion(args.projectId, args.prototypeId, html, args.instruction, source);
  yield { type: "done", prototypeId: prototype.id, versionId: version.id, versionNumber: version.versionNumber, previewPath: version.previewPath };
}
```

- [ ] **Step 6: Run prompt and typecheck checks**

Run:

```bash
npm test -- lib/agent/prototype-prompts.test.ts
npm run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add lib/agent/prototype-prompts.ts lib/agent/prototype-prompts.test.ts lib/agent/prototype-orchestrator.ts
git commit -m "feat: add prototype agent pipeline"
```

---

## Task 5: Add prototype API routes

**Files:**
- Create: `app/api/prototypes/analyze/route.ts`
- Create: `app/api/prototypes/plan/route.ts`
- Create: `app/api/prototypes/confirm/route.ts`
- Create: `app/api/prototypes/confirm/route.test.ts`
- Create: `app/api/prototypes/generate/route.ts`
- Create: `app/api/prototypes/[prototypeId]/route.ts`
- Create: `app/api/prototypes/[prototypeId]/versions/route.ts`
- Create: `app/api/prototypes/[prototypeId]/versions/[versionId]/html/route.ts`
- Create: `app/api/prototypes/[prototypeId]/optimize/route.ts`
- Create: `app/api/prototypes/[prototypeId]/route.test.ts`

- [ ] **Step 1: Add API route tests for non-AI read/confirm behavior**

Create `app/api/prototypes/confirm/route.test.ts`:

```ts
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
```

Create `app/api/prototypes/[prototypeId]/route.test.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, createPrototype, createPrototypeVersion } from "@/lib/storage";
import { GET as getPrototypeRoute } from "./route";
import { GET as getVersionsRoute } from "./versions/route";
import { GET as getHtmlRoute } from "./versions/[versionId]/html/route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-prototype-read-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("prototype read routes", () => {
  it("returns prototype manifest, versions, and html", async () => {
    const project = await createProject({ name: "原型项目" });
    const created = await createPrototype(project.id, "a", "方案A", "<!doctype html><html><body>v1</body></html>");
    await createPrototypeVersion(project.id, created.prototype.id, "<!doctype html><html><body>v2</body></html>", "修改", "chat-optimization");

    const manifestResponse = await getPrototypeRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id } },
    );
    expect(manifestResponse.status).toBe(200);
    await expect(manifestResponse.json()).resolves.toMatchObject({ prototype: { currentVersionId: "v2" } });

    const versionsResponse = await getVersionsRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}/versions?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id } },
    );
    expect(versionsResponse.status).toBe(200);
    const versionsBody = await versionsResponse.json();
    expect(versionsBody.versions).toHaveLength(2);

    const htmlResponse = await getHtmlRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}/versions/v2/html?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id, versionId: "v2" } },
    );
    expect(htmlResponse.status).toBe(200);
    await expect(htmlResponse.text()).resolves.toContain("v2");
    expect(htmlResponse.headers.get("Content-Type")).toContain("text/html");
  });
});
```

- [ ] **Step 2: Run failing API tests**

Run:

```bash
npm test -- app/api/prototypes/confirm/route.test.ts app/api/prototypes/[prototypeId]/route.test.ts
```

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement analyze route**

Create `app/api/prototypes/analyze/route.ts`:

```ts
import { NextResponse } from "next/server";

import { analyzePrototype } from "@/lib/agent/prototype-orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: unknown };
  try {
    body = (await request.json()) as { projectId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }

  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  try {
    const product = await analyzePrototype(body.projectId);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "分析失败" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Implement plan route**

Create `app/api/prototypes/plan/route.ts`:

```ts
import { NextResponse } from "next/server";

import { planPrototype } from "@/lib/agent/prototype-orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: unknown };
  try {
    body = (await request.json()) as { projectId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }

  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  try {
    const directions = await planPrototype(body.projectId);
    return NextResponse.json({ directions });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "规划失败" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Implement confirm route**

Create `app/api/prototypes/confirm/route.ts`:

```ts
import { NextResponse } from "next/server";

import { confirmPrototypeDirection } from "@/lib/agent/prototype-orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: unknown; directionId?: unknown };
  try {
    body = (await request.json()) as { projectId?: unknown; directionId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }
  if (typeof body.directionId !== "string" || !body.directionId.trim()) {
    return NextResponse.json({ error: "方案 ID 不能为空" }, { status: 400 });
  }
  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  try {
    const directionsFile = await confirmPrototypeDirection(body.projectId, body.directionId);
    return NextResponse.json({ directionsFile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "确认失败" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Implement generate route**

Create `app/api/prototypes/generate/route.ts`:

```ts
import { NextResponse } from "next/server";

import { generatePrototype } from "@/lib/agent/prototype-orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: unknown };
  try {
    body = (await request.json()) as { projectId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }
  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      try {
        for await (const event of generatePrototype(body.projectId as string)) {
          send(event);
        }
        send({ type: "end" });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "生成失败" });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 7: Implement read routes**

Create `app/api/prototypes/[prototypeId]/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getPrototype } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  const prototype = await getPrototype(projectId, params.prototypeId);
  if (!prototype) return NextResponse.json({ error: "原型不存在" }, { status: 404 });
  return NextResponse.json({ prototype });
}
```

Create `app/api/prototypes/[prototypeId]/versions/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getPrototype, getPrototypeVersion } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  const prototype = await getPrototype(projectId, params.prototypeId);
  if (!prototype) return NextResponse.json({ error: "原型不存在" }, { status: 404 });
  const versions = await Promise.all(prototype.versionIds.map((versionId) => getPrototypeVersion(projectId, prototype.id, versionId)));
  return NextResponse.json({ versions: versions.filter(Boolean) });
}
```

Create `app/api/prototypes/[prototypeId]/versions/[versionId]/html/route.ts`:

```ts
import { NextResponse } from "next/server";

import { readPrototypeHtml } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string; versionId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  const html = await readPrototypeHtml(projectId, params.prototypeId, params.versionId);
  if (!html) return NextResponse.json({ error: "原型版本不存在" }, { status: 404 });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:;",
    },
  });
}
```

- [ ] **Step 8: Implement optimize route**

Create `app/api/prototypes/[prototypeId]/optimize/route.ts`:

```ts
import { NextResponse } from "next/server";

import { optimizePrototype } from "@/lib/agent/prototype-orchestrator";
import { getPrototype } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string } };

type RequestBody = {
  projectId?: unknown;
  versionId?: unknown;
  instruction?: unknown;
  selectedElement?: { html?: unknown; text?: unknown; path?: unknown };
};

export async function POST(request: Request, { params }: RouteContext) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }
  if (typeof body.versionId !== "string" || !body.versionId.trim()) {
    return NextResponse.json({ error: "版本 ID 不能为空" }, { status: 400 });
  }
  if (typeof body.instruction !== "string" || !body.instruction.trim()) {
    return NextResponse.json({ error: "修改意见不能为空" }, { status: 400 });
  }

  const prototype = await getPrototype(body.projectId, params.prototypeId);
  if (!prototype) return NextResponse.json({ error: "原型不存在" }, { status: 404 });
  if (prototype.currentVersionId !== body.versionId) {
    return NextResponse.json({ error: "VERSION_CONFLICT", message: "原型已被更新，请刷新后重试。", latestVersionId: prototype.currentVersionId }, { status: 409 });
  }

  const selectedElement = body.selectedElement && typeof body.selectedElement.html === "string"
    ? {
      html: body.selectedElement.html,
      ...(typeof body.selectedElement.text === "string" ? { text: body.selectedElement.text } : {}),
      ...(typeof body.selectedElement.path === "string" ? { path: body.selectedElement.path } : {}),
    }
    : undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      try {
        for await (const event of optimizePrototype({
          projectId: body.projectId as string,
          prototypeId: params.prototypeId,
          versionId: body.versionId as string,
          instruction: body.instruction as string,
          selectedElement,
        })) {
          send(event);
        }
        send({ type: "end" });
      } catch (error) {
        send({ type: "error", error: error instanceof Error ? error.message : "修改失败" });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 9: Run API tests**

Run:

```bash
npm test -- app/api/prototypes/confirm/route.test.ts app/api/prototypes/[prototypeId]/route.test.ts
```

Expected: PASS.

- [ ] **Step 10: Typecheck API routes**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit Task 5**

Run:

```bash
git add app/api/prototypes lib/agent/prototype-orchestrator.ts
git commit -m "feat: add prototype API routes"
```

---

## Task 6: Add project creation context dialog UI

**Files:**
- Create: `components/projects/project-creation-context-dialog.tsx`
- Create: `components/projects/project-creation-context-dialog.test.tsx`
- Modify: `components/project-list.tsx`

- [ ] **Step 1: Add failing dialog component tests**

Create `components/projects/project-creation-context-dialog.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectCreationContextDialog } from "./project-creation-context-dialog";

describe("ProjectCreationContextDialog", () => {
  it("requires platform, audience, and use case before submit", () => {
    const onConfirm = vi.fn();
    render(<ProjectCreationContextDialog requirement="做一个校园活动小程序" onCancel={() => {}} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("请先确认平台、受众和用途")).toBeInTheDocument();
  });

  it("submits normalized context", () => {
    const onConfirm = vi.fn();
    render(<ProjectCreationContextDialog requirement="做一个校园活动小程序" onCancel={() => {}} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "小程序" }));
    fireEvent.click(screen.getByRole("button", { name: "学生" }));
    fireEvent.click(screen.getByRole("button", { name: "产品演示" }));
    fireEvent.change(screen.getByLabelText("关键词 / 风格偏好"), { target: { value: "暖色、校园感" } });
    fireEvent.click(screen.getByRole("button", { name: "开始分析" }));

    expect(onConfirm).toHaveBeenCalledWith({
      platform: "miniapp",
      audiences: ["学生"],
      useCases: ["产品演示"],
      keywords: "暖色、校园感",
    });
  });
});
```

- [ ] **Step 2: Run failing dialog tests**

Run:

```bash
npm test -- components/projects/project-creation-context-dialog.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement dialog component**

Create `components/projects/project-creation-context-dialog.tsx`:

```tsx
"use client";

import { X } from "lucide-react";
import React, { useState } from "react";

import type { ProjectCreationContext, PrototypePlatform } from "@/types";

const PLATFORM_OPTIONS: { value: PrototypePlatform; label: string; description: string }[] = [
  { value: "website", label: "网站", description: "官网、后台、SaaS、运营页、门户系统" },
  { value: "mobile", label: "移动端", description: "App 原型、移动 H5、手机端产品流程" },
  { value: "miniapp", label: "小程序", description: "微信小程序、校园/社区/交易/服务类轻应用" },
];

const AUDIENCE_OPTIONS = ["客户", "投资人", "内部团队", "管理层", "产品经理", "设计师", "开发者", "运营人员", "销售团队", "审核人员", "普通用户", "学生", "商家", "管理员", "合作伙伴"];
const USE_CASE_OPTIONS = ["产品演示", "需求评审", "客户提案", "销售转化", "融资路演", "内部汇报", "开发交付", "可用性测试", "视觉探索", "信息架构梳理", "活动宣传", "流程验证"];

type Props = {
  requirement: string;
  onCancel: () => void;
  onConfirm: (context: ProjectCreationContext) => void;
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ProjectCreationContextDialog({ requirement, onCancel, onConfirm }: Props) {
  const [platform, setPlatform] = useState<PrototypePlatform | null>(null);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [audienceNote, setAudienceNote] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [useCaseNote, setUseCaseNote] = useState("");
  const [keywords, setKeywords] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!platform || (audiences.length === 0 && !audienceNote.trim()) || (useCases.length === 0 && !useCaseNote.trim())) {
      setError("请先确认平台、受众和用途");
      return;
    }

    onConfirm({
      platform,
      audiences,
      ...(audienceNote.trim() ? { audienceNote: audienceNote.trim() } : {}),
      useCases,
      ...(useCaseNote.trim() ? { useCaseNote: useCaseNote.trim() } : {}),
      ...(keywords.trim() ? { keywords: keywords.trim() } : {}),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_20px_60px_rgba(28,25,23,0.18)] dark:border-[#44403C] dark:bg-[#292524]">
        <button type="button" onClick={onCancel} className="absolute right-4 top-4 rounded-md p-1 text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAFAF9]">
          <X className="h-4 w-4" />
        </button>
        <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">确认生成方向</h2>
        <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">这些信息会影响 AI 推荐的原型方案。平台创建后不可修改。</p>
        <div className="mt-4 rounded-xl bg-[#FAFAF9] p-3 text-sm text-[#44403C] dark:bg-[#1C1917] dark:text-[#D6D3D1]">{requirement}</div>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">平台类型</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {PLATFORM_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => setPlatform(option.value)} className={`rounded-xl border p-4 text-left transition ${platform === option.value ? "border-[#2563EB] bg-blue-50 dark:border-[#60A5FA] dark:bg-blue-950/30" : "border-[#E7E5E4] hover:bg-[#F5F5F4] dark:border-[#44403C] dark:hover:bg-[#1C1917]"}`}>
                <div className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">{option.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#78716C] dark:text-[#A8A29E]">{option.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">受众群体</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setAudiences((current) => toggle(current, item))} className={`rounded-full border px-3 py-1.5 text-xs ${audiences.includes(item) ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-[#60A5FA] dark:bg-blue-950/30 dark:text-[#60A5FA]" : "border-[#E7E5E4] text-[#57534E] dark:border-[#44403C] dark:text-[#D6D3D1]"}`}>{item}</button>
            ))}
          </div>
          <input value={audienceNote} onChange={(event) => setAudienceNote(event.target.value)} placeholder="补充受众，例如：校园社团负责人" className="mt-2 h-10 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">用途</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {USE_CASE_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setUseCases((current) => toggle(current, item))} className={`rounded-full border px-3 py-1.5 text-xs ${useCases.includes(item) ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-[#60A5FA] dark:bg-blue-950/30 dark:text-[#60A5FA]" : "border-[#E7E5E4] text-[#57534E] dark:border-[#44403C] dark:text-[#D6D3D1]"}`}>{item}</button>
            ))}
          </div>
          <input value={useCaseNote} onChange={(event) => setUseCaseNote(event.target.value)} placeholder="补充用途，例如：给学校领导看" className="mt-2 h-10 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        <section className="mt-5">
          <label htmlFor="prototype-keywords" className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">关键词 / 风格偏好</label>
          <textarea id="prototype-keywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="暖色、校园感、不要太商务、像真实产品" className="mt-2 min-h-20 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        {error ? <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#E7E5E4] px-4 py-2 text-sm font-medium text-[#57534E] hover:bg-[#F5F5F4] dark:border-[#44403C] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]">取消</button>
          <button type="button" onClick={submit} className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">开始分析</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run dialog tests**

Run:

```bash
npm test -- components/projects/project-creation-context-dialog.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Integrate dialog in ProjectList**

Modify `components/project-list.tsx`:

1. Add import:

```ts
import { useRouter } from "next/navigation";
import type { ProjectCreationContext } from "@/types";
import { ProjectCreationContextDialog } from "@/components/projects/project-creation-context-dialog";
```

2. Inside `ProjectList`, add:

```ts
  const router = useRouter();
  const [pendingRequirement, setPendingRequirement] = useState<string | null>(null);
```

3. Replace `handleCreateProject` so the form only opens the dialog:

```ts
  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请先描述你想做的产品或页面");
      return;
    }
    setError(null);
    setPendingRequirement(trimmedName);
  }
```

4. Add this function below `handleCreateProject`:

```ts
  async function confirmCreateProject(context: ProjectCreationContext) {
    if (!pendingRequirement) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pendingRequirement.slice(0, 32),
          textInput: pendingRequirement,
          creationContext: context,
        }),
      });
      const body = (await response.json()) as { project?: Project; error?: string };
      if (!response.ok || !body.project) throw new Error(body.error ?? "项目创建失败");
      setProjects((currentProjects) => [body.project as Project, ...currentProjects]);
      setName("");
      setPendingRequirement(null);
      router.push(`/projects/${body.project.id}`);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "项目创建失败");
    } finally {
      setIsCreating(false);
    }
  }
```

5. Render the dialog near the top of the returned `<div>`:

```tsx
      {pendingRequirement ? (
        <ProjectCreationContextDialog
          requirement={pendingRequirement}
          onCancel={() => setPendingRequirement(null)}
          onConfirm={(context) => void confirmCreateProject(context)}
        />
      ) : null}
```

6. Update copy:

```tsx
<p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">描述你想做的产品或页面，AI 会先帮你分析并推荐原型方案</p>
```

and input placeholder:

```tsx
placeholder="例如：做一个校园活动报名小程序，给学生和社团负责人使用"
```

and button label:

```tsx
{isCreating ? <Loader2 ... /> : <Plus ... />}
开始
```

- [ ] **Step 6: Run UI tests**

Run:

```bash
npm test -- components/projects/project-creation-context-dialog.test.tsx components/project-list.test.tsx
```

Expected: PASS. If `components/project-list.test.tsx` expects old button text, update it to click “开始” and confirm the dialog appears.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add components/project-list.tsx components/projects/project-creation-context-dialog.tsx components/projects/project-creation-context-dialog.test.tsx components/project-list.test.tsx
git commit -m "feat: add prototype project creation dialog"
```

---

## Task 7: Add prototype direction cards and workbench shell

**Files:**
- Create: `components/prototypes/prototype-direction-card.tsx`
- Create: `components/prototypes/prototype-direction-card.test.tsx`
- Create: `components/prototypes/prototype-preview-panel.tsx`
- Create: `components/prototypes/prototype-version-history.tsx`
- Create: `components/prototypes/prototype-workbench.tsx`
- Modify: `app/projects/[projectId]/page.tsx`

- [ ] **Step 1: Add failing direction card test**

Create `components/prototypes/prototype-direction-card.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrototypeDirectionCard } from "./prototype-direction-card";

const direction = {
  id: "pitch",
  name: "提案版",
  scenario: "客户提案",
  screenList: ["首页", "详情页", "发布页"],
  visualDirection: "暖色纸感",
  complexity: "medium" as const,
  estimatedScreens: 7,
  recommendationReason: "更适合演示完整流程",
};

describe("PrototypeDirectionCard", () => {
  it("renders direction details and select action", () => {
    const onSelect = vi.fn();
    render(<PrototypeDirectionCard direction={direction} selected={false} onSelect={onSelect} />);

    expect(screen.getByText("提案版")).toBeInTheDocument();
    expect(screen.getByText("客户提案")).toBeInTheDocument();
    expect(screen.getByText("暖色纸感")).toBeInTheDocument();
    expect(screen.getByText("预计 7 个页面")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择这个方案" }));
    expect(onSelect).toHaveBeenCalledWith("pitch");
  });
});
```

- [ ] **Step 2: Run failing card test**

Run:

```bash
npm test -- components/prototypes/prototype-direction-card.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement direction card**

Create `components/prototypes/prototype-direction-card.tsx`:

```tsx
"use client";

import type { PrototypeDirection } from "@/types";

const COMPLEXITY_LABEL = {
  low: "低",
  medium: "中",
  high: "高",
};

type Props = {
  direction: PrototypeDirection;
  selected: boolean;
  onSelect: (directionId: string) => void;
};

export function PrototypeDirectionCard({ direction, selected, onSelect }: Props) {
  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-warm-sm transition dark:bg-[#292524] ${selected ? "border-[#2563EB] ring-2 ring-[#3B82F6]/20" : "border-[#E7E5E4] dark:border-[#44403C]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">{direction.name}</h3>
          <p className="mt-1 text-sm text-[#57534E] dark:text-[#A8A29E]">{direction.scenario}</p>
        </div>
        <span className="rounded-full bg-[#F5F5F4] px-2.5 py-1 text-xs font-medium text-[#57534E] dark:bg-[#1C1917] dark:text-[#D6D3D1]">复杂度 {COMPLEXITY_LABEL[direction.complexity]}</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <p><span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">视觉方向：</span>{direction.visualDirection}</p>
        <p><span className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">预计范围：</span>预计 {direction.estimatedScreens} 个页面</p>
        <div>
          <div className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">页面清单</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {direction.screenList.map((screen) => <span key={screen} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-[#2563EB] dark:bg-blue-950/30 dark:text-[#60A5FA]">{screen}</span>)}
          </div>
        </div>
        <p className="text-[#57534E] dark:text-[#A8A29E]">{direction.recommendationReason}</p>
      </div>
      <button type="button" onClick={() => onSelect(direction.id)} className="mt-5 w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">
        选择这个方案
      </button>
    </article>
  );
}
```

- [ ] **Step 4: Add preview and version components**

Create `components/prototypes/prototype-preview-panel.tsx`:

```tsx
"use client";

type Props = {
  html: string | null;
  previewPath: string | null;
};

export function PrototypePreviewPanel({ html, previewPath }: Props) {
  if (!html && !previewPath) {
    return <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-[#D6D3D1] bg-white text-sm text-[#78716C] dark:border-[#57534E] dark:bg-[#292524] dark:text-[#A8A29E]">原型生成后会显示在这里</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-warm-sm dark:border-[#44403C] dark:bg-[#292524]">
      <iframe title="原型预览" src={previewPath ?? undefined} srcDoc={previewPath ? undefined : html ?? undefined} sandbox="allow-scripts" className="h-[720px] w-full bg-white" />
    </div>
  );
}
```

Create `components/prototypes/prototype-version-history.tsx`:

```tsx
"use client";

import type { PrototypeVersion } from "@/types";

type Props = {
  versions: PrototypeVersion[];
  currentVersionId: string | null;
};

export function PrototypeVersionHistory({ versions, currentVersionId }: Props) {
  if (versions.length === 0) return null;
  return (
    <aside className="rounded-2xl border border-[#E7E5E4] bg-white p-4 dark:border-[#44403C] dark:bg-[#292524]">
      <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">版本历史</h3>
      <div className="mt-3 space-y-2">
        {versions.map((version) => (
          <div key={version.id} className={`rounded-lg border px-3 py-2 text-xs ${version.id === currentVersionId ? "border-[#2563EB] bg-blue-50 dark:border-[#60A5FA] dark:bg-blue-950/30" : "border-[#E7E5E4] dark:border-[#44403C]"}`}>
            <div className="font-medium text-[#1C1917] dark:text-[#FAFAF9]">v{version.versionNumber}</div>
            <div className="mt-1 text-[#78716C] dark:text-[#A8A29E]">{version.changeSummary}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Implement prototype workbench shell**

Create `components/prototypes/prototype-workbench.tsx`:

```tsx
"use client";

import React, { useState } from "react";

import type { Project, PrototypeDirection, PrototypeManifest, PrototypeProductSpec, PrototypeVersion } from "@/types";
import { PrototypeDirectionCard } from "./prototype-direction-card";
import { PrototypePreviewPanel } from "./prototype-preview-panel";
import { PrototypeVersionHistory } from "./prototype-version-history";

type Props = {
  project: Project;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "请求失败");
  return body as T;
}

export function PrototypeWorkbench({ project }: Props) {
  const [product, setProduct] = useState<PrototypeProductSpec | null>(null);
  const [directions, setDirections] = useState<PrototypeDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [prototype, setPrototype] = useState<PrototypeManifest | null>(null);
  const [versions, setVersions] = useState<PrototypeVersion[]>([]);
  const [html, setHtml] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState("等待开始分析");
  const [error, setError] = useState<string | null>(null);

  async function analyzeAndPlan() {
    setError(null);
    setStatus("正在分析需求…");
    const analyzeBody = await readJson<{ product: PrototypeProductSpec }>(await fetch("/api/prototypes/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    }));
    setProduct(analyzeBody.product);
    setStatus("正在推荐原型方案…");
    const planBody = await readJson<{ directions: PrototypeDirection[] }>(await fetch("/api/prototypes/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    }));
    setDirections(planBody.directions);
    setStatus("请选择一套原型方案");
  }

  async function confirmAndGenerate(directionId: string) {
    setSelectedDirectionId(directionId);
    setError(null);
    setStatus("正在确认方案…");
    await readJson(await fetch("/api/prototypes/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id, directionId }),
    }));
    setStatus("正在生成原型方案板…");
    await streamPrototype("/api/prototypes/generate", { projectId: project.id });
  }

  async function streamPrototype(url: string, payload: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.body) throw new Error("没有收到生成流");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let nextHtml = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const event = JSON.parse(part.slice(6));
        if (event.type === "chunk") {
          nextHtml += event.text;
          setHtml(nextHtml);
        }
        if (event.type === "done") {
          setPrototype({ id: event.prototypeId, projectId: project.id, directionId: selectedDirectionId ?? "", name: "原型", currentVersionId: event.versionId, versionIds: [event.versionId], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          setPreviewPath(event.previewPath);
          setStatus("原型已生成，可以继续讨论修改");
          await loadVersions(event.prototypeId, event.versionId);
        }
        if (event.type === "error") throw new Error(event.error ?? "生成失败");
      }
    }
  }

  async function loadVersions(prototypeId: string, currentVersionId: string) {
    const body = await readJson<{ versions: PrototypeVersion[] }>(await fetch(`/api/prototypes/${prototypeId}/versions?projectId=${project.id}`));
    setVersions(body.versions);
    setPrototype((current) => current ? { ...current, currentVersionId } : current);
  }

  async function optimize() {
    if (!prototype || !instruction.trim()) return;
    setStatus("正在修改原型…");
    await streamPrototype(`/api/prototypes/${prototype.id}/optimize`, { projectId: project.id, versionId: prototype.currentVersionId, instruction });
    setInstruction("");
  }

  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 dark:border-[#44403C] dark:bg-[#292524]">
          <h2 className="font-serif text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">原型生成</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#57534E] dark:text-[#A8A29E]">{project.textInput}</p>
          <button type="button" onClick={() => void analyzeAndPlan().catch((e) => setError(e.message))} className="mt-4 w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">开始分析</button>
          <p className="mt-3 text-xs text-[#78716C] dark:text-[#A8A29E]">{status}</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>

        {product ? <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 text-sm dark:border-[#44403C] dark:bg-[#292524]"><div className="font-semibold">AI 分析</div><p className="mt-2 text-[#57534E] dark:text-[#A8A29E]">{product.summary}</p></div> : null}

        <PrototypeVersionHistory versions={versions} currentVersionId={prototype?.currentVersionId ?? null} />
      </aside>

      <section className="space-y-5">
        {directions.length > 0 && !prototype ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {directions.map((direction) => <PrototypeDirectionCard key={direction.id} direction={direction} selected={direction.id === selectedDirectionId} onSelect={(id) => void confirmAndGenerate(id).catch((e) => setError(e.message))} />)}
          </div>
        ) : null}

        <PrototypePreviewPanel html={html} previewPath={previewPath} />

        {prototype ? (
          <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 dark:border-[#44403C] dark:bg-[#292524]">
            <label htmlFor="prototype-instruction" className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">继续讨论修改</label>
            <div className="mt-2 flex gap-2">
              <input id="prototype-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="例如：把风格改得更年轻" className="h-10 flex-1 rounded-lg border border-[#E7E5E4] px-3 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
              <button type="button" onClick={() => void optimize().catch((e) => setError(e.message))} className="rounded-lg bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white dark:bg-[#FAFAF9] dark:text-[#1C1917]">发送</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Wire prototype workbench into project page**

Modify `app/projects/[projectId]/page.tsx`:

Add import:

```ts
import { PrototypeWorkbench } from "@/components/prototypes/prototype-workbench";
```

In the returned content area, replace the unconditional `WorkbenchLayout` render with:

```tsx
          {project.creationContext ? (
            <PrototypeWorkbench project={project} />
          ) : (
            <WorkbenchLayout
              projectId={project.id}
              projectName={project.name}
              initialLatestDocumentId={latestDocumentId}
              initialTextInput={project.textInput ?? null}
              initialPageId={initialPageId}
              initialPageName={initialPageName}
              initialHtml={initialHtml}
              initialVersionCount={initialVersionCount}
              initialPreviewPath={initialPreviewPath}
              initialSuggestion={initialSuggestion}
            />
          )}
```

Keep the existing React Studio link in the header.

- [ ] **Step 7: Run component tests and typecheck**

Run:

```bash
npm test -- components/prototypes/prototype-direction-card.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit Task 7**

Run:

```bash
git add components/prototypes app/projects/[projectId]/page.tsx
git commit -m "feat: add prototype workbench UI"
```

---

## Task 8: End-to-end verification and polish pass

**Files:**
- Modify only files required to fix issues found during verification.
- Do not add new product scope in this task.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- lib/prototype-validation.test.ts lib/prototype-storage.test.ts lib/agent/prototype-prompts.test.ts app/api/projects/route.test.ts app/api/prototypes/confirm/route.test.ts app/api/prototypes/[prototypeId]/route.test.ts components/projects/project-creation-context-dialog.test.tsx components/prototypes/prototype-direction-card.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. If unrelated pre-existing tests fail, record exact failures and run the focused suite again before reporting.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Manual browser verification**

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000/projects` and verify:

1. Enter `做一个校园活动报名小程序，给学生和社团负责人使用`.
2. Click `开始`.
3. Confirm dialog opens.
4. Select `小程序`.
5. Select `学生` and `产品演示`.
6. Enter keywords `暖色、校园感、像真实产品`.
7. Click `开始分析`.
8. Browser navigates to `/projects/{projectId}`.
9. Prototype workbench shows project requirement and `开始分析`.
10. Click `开始分析`.
11. After AI response, 2-3 prototype direction cards appear.
12. Choose one direction.
13. A prototype board appears in the iframe.
14. Enter `把风格改得更年轻` and submit.
15. A new version appears in version history.
16. React Studio link remains visible.

If live AI credentials are unavailable, manually create a fixture project in `.workspace` or use API/storage tests as the verified baseline, and clearly state that live AI generation was not run.

- [ ] **Step 6: Commit verification fixes**

If fixes were required:

```bash
git add <only-fixed-files>
git commit -m "fix: polish prototype-first flow"
```

If no fixes were required, do not create an empty commit.

---

## Self-review checklist

- [ ] Spec section 3 platform scope is covered by `ProjectCreationContextDialog`, `normalizeCreationContext`, and prototype prompts.
- [ ] Spec section 4 core flow is covered by Tasks 3, 5, 6, and 7.
- [ ] Spec section 5 confirmation dialog is covered by Task 6.
- [ ] Spec section 6 recommendation cards is covered by Task 7.
- [ ] Spec section 7 generate confirmation is partially covered by direction selection; if a second confirmation modal is desired before generation, add it as a small follow-up after Task 7 rather than blocking v1.
- [ ] Spec section 8 prototype board is covered by `buildGeneratePrototypePrompt()` and `PrototypePreviewPanel`.
- [ ] Spec section 9 discussion modification is covered by `optimizePrototype()` and the workbench input.
- [ ] Spec section 10 data structures are covered by Tasks 1 and 2.
- [ ] Spec section 11 Agent information flow is covered by Task 4.
- [ ] Spec section 12 API is covered by Task 5.
- [ ] Spec section 13 frontend pages are covered by Tasks 6 and 7.
- [ ] Spec section 14 errors are covered by route validation and workbench error display.
- [ ] Spec section 15 testing is covered by Tasks 1-8.
- [ ] No task modifies unrelated React Studio generation internals unless typecheck requires small compatibility fixes.
