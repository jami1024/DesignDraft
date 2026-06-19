// Multi-agent orchestrator: analyze ② → plan ③ → confirm → generate ④.
import path from "node:path";

import { ProjectRepo } from "@/lib/project-repo";
import { getProjectPath, pathExists, readJsonFile, writeJsonFile } from "@/lib/storage";
import type { DesignSpec, ProductSpec } from "@/types/multi-agent";

import { parseGeneratedFiles } from "./file-output";
import { buildAnalyzePrompt, buildGeneratePrompt, buildPlanPrompt } from "./multi-agent-prompts";
import { completeText, streamText } from "./pi-ai-runtime";

const productPath = (id: string) => path.join(getProjectPath(id), "product.json");
const designPath = (id: string) => path.join(getProjectPath(id), "design.json");

/** Extract the first balanced JSON object/array from a model response. */
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

export async function getProduct(projectId: string): Promise<ProductSpec | null> {
  return (await pathExists(productPath(projectId))) ? readJsonFile<ProductSpec>(productPath(projectId)) : null;
}

export async function getDesign(projectId: string): Promise<DesignSpec | null> {
  return (await pathExists(designPath(projectId))) ? readJsonFile<DesignSpec>(designPath(projectId)) : null;
}

// ② 需求分析
export async function analyze(
  projectId: string,
  extractedText: string,
  userHints?: string,
): Promise<ProductSpec> {
  const params = await buildAnalyzePrompt({ extractedText, userHints });
  const raw = await completeText(params);
  const product = extractJson<ProductSpec>(raw);
  await writeJsonFile(productPath(projectId), product);
  return product;
}

// ③ UI 设计规划
export async function plan(projectId: string): Promise<DesignSpec> {
  const product = await getProduct(projectId);
  if (!product) throw new Error("尚未完成需求分析");
  const params = await buildPlanPrompt(product);
  const raw = await completeText(params);
  const design = extractJson<DesignSpec>(raw);
  design.selectedDirectionId = null;
  await writeJsonFile(designPath(projectId), design);
  return design;
}

// 用户确认门
export async function confirmDirection(projectId: string, directionId: string): Promise<DesignSpec> {
  const design = await getDesign(projectId);
  if (!design) throw new Error("尚未生成设计方向");
  if (!design.directions.some((d) => d.id === directionId)) throw new Error("方向不存在");
  design.selectedDirectionId = directionId;
  await writeJsonFile(designPath(projectId), design);
  return design;
}

export type GenerateEvent =
  | { type: "chunk"; text: string }
  | { type: "done"; commit: string; files: string[] };

// ④ 生成(流式 + 落盘 commit)
export async function* generate(projectId: string): AsyncGenerator<GenerateEvent, void> {
  const product = await getProduct(projectId);
  const design = await getDesign(projectId);
  if (!product || !design) throw new Error("缺少 ProductSpec 或 DesignSpec");

  const direction =
    design.directions.find((d) => d.id === design.selectedDirectionId) ?? design.directions[0];
  if (!direction) throw new Error("没有可用的设计方向");

  const repo = await ProjectRepo.open(projectId);
  if (!(await repo.exists())) await repo.init();

  const params = await buildGeneratePrompt({ product, direction });

  let full = "";
  const gen = streamText(params);
  let r = await gen.next();
  while (!r.done) {
    full += r.value;
    yield { type: "chunk", text: r.value };
    r = await gen.next();
  }

  const files = parseGeneratedFiles(full);
  if (files.length === 0) throw new Error("生成结果未包含任何文件");
  await repo.applyPatches(files);
  const commit = await repo.commit("feat: 生成应用");
  yield { type: "done", commit: commit.hash, files: files.map((f) => f.path) };
}
