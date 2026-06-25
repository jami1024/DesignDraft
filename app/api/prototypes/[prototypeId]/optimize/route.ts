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
    return NextResponse.json(
      { error: "VERSION_CONFLICT", message: "原型已被更新，请刷新后重试。", latestVersionId: prototype.currentVersionId },
      { status: 409 },
    );
  }

  const selectedElement = body.selectedElement && typeof body.selectedElement.html === "string"
    ? {
        html: body.selectedElement.html,
        ...(typeof body.selectedElement.text === "string" ? { text: body.selectedElement.text } : {}),
        ...(typeof body.selectedElement.path === "string" ? { path: body.selectedElement.path } : {}),
      }
    : undefined;

  const projectId = body.projectId;
  const versionId = body.versionId;
  const instruction = body.instruction;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      try {
        for await (const event of optimizePrototype({
          projectId,
          prototypeId: params.prototypeId,
          versionId,
          instruction,
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
