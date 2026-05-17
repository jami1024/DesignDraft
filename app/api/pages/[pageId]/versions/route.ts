import { NextResponse } from "next/server";

import { getPage, getPageVersion } from "@/lib/storage";

type RouteParams = {
  params: { pageId: string };
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

  const versions = await Promise.all(
    page.versionIds.map((vid) => getPageVersion(projectId, params.pageId, vid)),
  );

  return NextResponse.json({
    versions: versions
      .filter((v) => v !== null)
      .sort((a, b) => b.versionNumber - a.versionNumber),
    currentVersionId: page.currentVersionId,
  });
}
