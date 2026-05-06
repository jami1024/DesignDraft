import { NextResponse } from "next/server";

import { createAgentRuntime } from "@/lib/agent/adapter";
import { getAgentModelConfig } from "@/lib/agent/model-config";
import { resolveSkillContext } from "@/lib/skills/registry";
import { getProject } from "@/lib/storage";
import type { PageSuggestion } from "@/types";

export const runtime = "nodejs";

type RequestBody = {
  projectId?: string;
  extractedText?: string;
  suggestion?: PageSuggestion;
  currentHtml?: string;
  instruction?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  if (!body.projectId || !body.currentHtml || !body.instruction || !body.suggestion) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const project = await getProject(body.projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const skillContext = await resolveSkillContext(body.suggestion.recommendedSkillIds);
  const runtimeAdapter = createAgentRuntime(getAgentModelConfig());

  const generator = runtimeAdapter.optimizePage({
    currentHtml: body.currentHtml,
    extractedText: body.extractedText ?? "",
    suggestion: body.suggestion,
    userInstruction: body.instruction,
    skillRules: skillContext,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "优化失败";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
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
