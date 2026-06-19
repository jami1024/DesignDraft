import { NextResponse } from "next/server";

import { confirmDirection } from "@/lib/agent/orchestrator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: string; directionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, directionId } = body;
  if (!projectId || !directionId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  try {
    const design = await confirmDirection(projectId, directionId);
    return NextResponse.json({ design });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "确认失败" }, { status: 500 });
  }
}
