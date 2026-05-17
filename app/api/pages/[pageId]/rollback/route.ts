import { NextResponse } from "next/server";

import { createPageVersion, getPage, readPageHtml } from "@/lib/storage";

type RouteParams = {
  params: { pageId: string };
};

type RequestBody = {
  projectId?: string;
  targetVersionId?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, targetVersionId } = body;
  if (!projectId || !targetVersionId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const page = await getPage(projectId, params.pageId);
  if (!page) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 });
  }

  if (!page.versionIds.includes(targetVersionId)) {
    return NextResponse.json({ error: "目标版本不存在" }, { status: 404 });
  }

  const html = await readPageHtml(projectId, params.pageId, targetVersionId);
  if (!html) {
    return NextResponse.json({ error: "版本 HTML 不存在" }, { status: 404 });
  }

  const { page: updatedPage, version } = await createPageVersion(
    projectId,
    params.pageId,
    html,
    `回退至 ${targetVersionId}`,
    [],
    "rollback",
  );

  return NextResponse.json({
    page: updatedPage,
    version,
  });
}
