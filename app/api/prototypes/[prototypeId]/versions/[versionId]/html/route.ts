import { NextResponse } from "next/server";

import { readPrototypeHtml } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string; versionId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  const html = await readPrototypeHtml(projectId, params.prototypeId, params.versionId);
  if (!html) return NextResponse.json({ error: "原型版本不存在" }, { status: 404 });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; font-src data:;",
    },
  });
}
