import { NextResponse } from "next/server";

import { createAgentRuntime } from "@/lib/agent/adapter";
import { getAgentModelConfig } from "@/lib/agent/model-config";
import { extractDesignTokens, mergeDesignMemory } from "@/lib/design-memory-extractor";
import { createPageVersion, getPage, getProject, loadDesignMemory, saveDesignMemory } from "@/lib/storage";
import type { PageSuggestion, ProjectDesignMemoryPageEntry } from "@/types";

export const runtime = "nodejs";

type RequestBody = {
  projectId?: string;
  pageId?: string;
  versionId?: string;
  extractedText?: string;
  suggestion?: PageSuggestion;
  currentHtml?: string;
  instruction?: string;
  selectedElement?: {
    html: string;
    path: string;
    text?: string;
    stableId?: string;
    parentStableId?: string;
    screenshot?: string;
    markingFailed?: boolean;
  };
  history?: { role: "user" | "assistant"; content: string }[];
  attachmentImages?: string[];
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, pageId: reqPageId, currentHtml, instruction, suggestion } = body;
  if (!projectId || !currentHtml || !instruction || !suggestion) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  if (reqPageId && body.versionId) {
    const page = await getPage(projectId, reqPageId);
    if (page && page.currentVersionId !== body.versionId) {
      return NextResponse.json({
        error: "VERSION_CONFLICT",
        message: "页面已被更新，请刷新后重试。",
        latestVersionId: page.currentVersionId,
      }, { status: 409 });
    }
  }

  const runtimeAdapter = createAgentRuntime(getAgentModelConfig());
  const designMemory = await loadDesignMemory(projectId);

  const source = body.selectedElement ? "selection-optimization" as const : "chat-optimization" as const;

  const generator = runtimeAdapter.optimizePage({
    currentHtml,
    extractedText: body.extractedText ?? "",
    suggestion,
    selectedElement: body.selectedElement,
    userInstruction: instruction,
    skillRules: "",
    history: body.history,
    attachmentImages: body.attachmentImages,
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

        const isTextResponse = fullHtml.trimStart().startsWith("[TEXT]");
        if (reqPageId && !isTextResponse) {
          const { page, version } = await createPageVersion(
            projectId,
            reqPageId,
            fullHtml,
            instruction,
            suggestion.recommendedSkillIds ?? [],
            source,
          );

          const tokens = extractDesignTokens(fullHtml);
          const pageEntry: ProjectDesignMemoryPageEntry = {
            pageId: page.id,
            pageName: suggestion.name,
            register: suggestion.register,
            visualDirection: suggestion.visualDirection,
            extractedAt: new Date().toISOString(),
          };
          const existingMemory = designMemory
            ? { ...designMemory, pageContributions: designMemory.pageContributions.filter((p) => p.pageId !== page.id) }
            : null;
          const updatedMemory = mergeDesignMemory(existingMemory, tokens, pageEntry);
          await saveDesignMemory(projectId, updatedMemory);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            pageId: page.id,
            versionId: version.id,
            versionNumber: version.versionNumber,
            previewPath: version.previewPath,
          })}\n\n`));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "优化失败";
        console.error("[optimize] error:", err);
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
