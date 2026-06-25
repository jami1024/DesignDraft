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
