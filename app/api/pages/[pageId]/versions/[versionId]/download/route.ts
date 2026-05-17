import { NextResponse } from "next/server";

import { getPage, readPageHtml } from "@/lib/storage";

type RouteParams = {
  params: { pageId: string; versionId: string };
};

export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
  }

  const page = await getPage(projectId, params.pageId);
  if (!page) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 });
  }

  const html = await readPageHtml(projectId, params.pageId, params.versionId);
  if (!html) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }

  const filename = `${page.name}-${params.versionId}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
