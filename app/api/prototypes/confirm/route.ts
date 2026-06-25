import { NextResponse } from "next/server";

import { confirmPrototypeDirection } from "@/lib/agent/prototype-orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: unknown; directionId?: unknown };
  try {
    body = (await request.json()) as { projectId?: unknown; directionId?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }
  if (typeof body.directionId !== "string" || !body.directionId.trim()) {
    return NextResponse.json({ error: "方案 ID 不能为空" }, { status: 400 });
  }
  if (!(await getProject(body.projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  try {
    const directionsFile = await confirmPrototypeDirection(body.projectId, body.directionId);
    return NextResponse.json({ directionsFile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "确认失败" }, { status: 500 });
  }
}
