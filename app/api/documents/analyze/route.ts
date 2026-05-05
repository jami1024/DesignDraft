import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { createAgentRuntime } from "@/lib/agent/adapter";
import { getAgentModelConfig } from "@/lib/agent/model-config";
import { buildAnalyzeDocumentPrompt } from "@/lib/agent/prompts";
import { getProject, getSourceDocument, savePageSuggestions } from "@/lib/storage";

export const runtime = "nodejs";

type AnalyzeRequestBody = {
  projectId?: unknown;
  documentId?: unknown;
};

export async function POST(request: Request) {
  let body: AnalyzeRequestBody;

  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }

  if (typeof body.documentId !== "string" || !body.documentId.trim()) {
    return NextResponse.json({ error: "文档 ID 不能为空" }, { status: 400 });
  }

  const project = await getProject(body.projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const document = await getSourceDocument(project.id, body.documentId);
  if (!document) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  const extractedText = await readFile(document.extractedTextPath, "utf8");
  if (!extractedText.trim()) {
    return NextResponse.json({ error: "文档内容为空" }, { status: 400 });
  }

  const skillRules = await buildAnalyzeDocumentPrompt({
    extractedText,
    projectId: project.id,
  });
  const runtimeAdapter = createAgentRuntime(getAgentModelConfig());
  const suggestions = await runtimeAdapter.analyzeDocument({
    projectId: project.id,
    extractedText,
    skillRules,
  });

  await savePageSuggestions(project.id, suggestions);

  return NextResponse.json({ suggestions });
}
