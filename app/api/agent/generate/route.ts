import { NextResponse } from "next/server";

import { generate } from "@/lib/agent/orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId } = body;
  if (!projectId) return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
  if (!(await getProject(projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const event of generate(projectId)) {
          send(event);
        }
        send({ type: "end" });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : "生成失败" });
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
