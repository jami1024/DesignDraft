import { NextResponse } from "next/server";

import { analyze } from "@/lib/agent/orchestrator";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { projectId?: string; extractedText?: string; userHints?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, extractedText, userHints } = body;
  if (!projectId || !extractedText) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }
  if (!(await getProject(projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  try {
    const product = await analyze(projectId, extractedText, userHints);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "分析失败" }, { status: 500 });
  }
}
