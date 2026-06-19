import { NextResponse } from "next/server";

import { plan } from "@/lib/agent/orchestrator";
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

  try {
    const design = await plan(projectId);
    return NextResponse.json({ design });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "规划失败" }, { status: 500 });
  }
}
