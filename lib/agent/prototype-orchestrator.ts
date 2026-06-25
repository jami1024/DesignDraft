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
import { parsePrototypeDirections, parsePrototypeProductSpec } from "@/lib/prototype-validation";
import type { PrototypeDirection, PrototypeProductSpec } from "@/types";

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

function extractHtml(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const start = candidate.toLowerCase().indexOf("<!doctype html");

  if (start === -1) {
    throw new Error("原型 HTML 不完整");
  }

  const end = candidate.toLowerCase().lastIndexOf("</html>");
  if (end === -1) {
    throw new Error("原型 HTML 不完整");
  }

  return candidate.slice(start, end + "</html>".length).trim();
}

function assertCompleteHtml(html: string): string {
  const cleaned = extractHtml(html);
  const lower = cleaned.toLowerCase();

  if (!lower.startsWith("<!doctype html") || !lower.includes("</html>")) {
    throw new Error("原型 HTML 不完整");
  }

  return cleaned;
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
  | {
      type: "done";
      prototypeId: string;
      versionId: string;
      versionNumber: number;
      previewPath: string;
    };

export async function* generatePrototype(projectId: string): AsyncGenerator<PrototypeGenerateEvent, void> {
  const product = await getPrototypeProduct(projectId);
  const directionsFile = await getPrototypeDirections(projectId);
  if (!product || !directionsFile) throw new Error("缺少原型分析或方案");

  const direction =
    directionsFile.directions.find((item) => item.id === directionsFile.selectedDirectionId) ??
    directionsFile.directions[0];
  if (!direction) throw new Error("没有可用的原型方案");

  const params = await buildGeneratePrototypePrompt({ product, direction });
  let full = "";
  for await (const chunk of streamText(params)) {
    full += chunk;
    yield { type: "chunk", text: chunk };
  }

  const html = assertCompleteHtml(full);
  const { prototype, version } = await createPrototype(projectId, direction.id, direction.name, html);
  yield {
    type: "done",
    prototypeId: prototype.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    previewPath: version.previewPath,
  };
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
  if (!product || !directionsFile || !currentVersion || !currentHtml) {
    throw new Error("原型上下文不完整");
  }

  const direction =
    directionsFile.directions.find((item) => item.id === directionsFile.selectedDirectionId) ??
    directionsFile.directions[0];
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
  const { prototype, version } = await createPrototypeVersion(
    args.projectId,
    args.prototypeId,
    html,
    args.instruction,
    source,
  );
  yield {
    type: "done",
    prototypeId: prototype.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    previewPath: version.previewPath,
  };
}
