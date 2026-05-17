import { NextResponse } from "next/server";

import { createAgentRuntime } from "@/lib/agent/adapter";
import { getAgentModelConfig } from "@/lib/agent/model-config";
import { extractDesignTokens, mergeDesignMemory } from "@/lib/design-memory-extractor";
import { createPage, getProject, loadDesignMemory, saveDesignMemory } from "@/lib/storage";
import type { PageSuggestion, ProjectDesignMemoryPageEntry } from "@/types";

export const runtime = "nodejs";

type RequestBody = {
  projectId?: string;
  extractedText?: string;
  suggestion?: PageSuggestion;
  stylePreset?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, suggestion, extractedText } = body;
  if (!projectId || !suggestion || !extractedText) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const runtimeAdapter = createAgentRuntime(getAgentModelConfig());
  const designMemory = await loadDesignMemory(projectId);

  const generator = runtimeAdapter.generatePage({
    extractedText,
    suggestion,
    skillRules: "",
    stylePreset: body.stylePreset ?? "modern-minimal",
    outputRequirements: "生成完整单文件 HTML。",
    designMemory: designMemory ?? undefined,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullHtml = "";
      try {
        for await (const chunk of generator) {
          fullHtml += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }

        const { page, version } = await createPage(
          projectId,
          suggestion.id,
          suggestion.name,
          fullHtml,
          suggestion.recommendedSkillIds ?? [],
        );

        const tokens = extractDesignTokens(fullHtml);
        const pageEntry: ProjectDesignMemoryPageEntry = {
          pageId: page.id,
          pageName: suggestion.name,
          register: suggestion.register,
          visualDirection: suggestion.visualDirection,
          extractedAt: new Date().toISOString(),
        };
        const updatedMemory = mergeDesignMemory(designMemory, tokens, pageEntry);
        await saveDesignMemory(projectId, updatedMemory);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          pageId: page.id,
          versionId: version.id,
          versionNumber: version.versionNumber,
          previewPath: version.previewPath,
        })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "生成失败";
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
