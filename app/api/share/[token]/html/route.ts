import { NextResponse } from "next/server";

import { getShareByToken, incrementShareAccess, readPageHtml } from "@/lib/storage";

type RouteParams = {
  params: { token: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const share = await getShareByToken(params.token);

  if (!share) {
    return NextResponse.json({ error: "链接不存在" }, { status: 404 });
  }

  if (new Date(share.expiresAt) < new Date()) {
    return NextResponse.json({ error: "链接已过期" }, { status: 410 });
  }

  const html = await readPageHtml(share.projectId, share.pageId, share.versionId);
  if (!html) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 });
  }

  await incrementShareAccess(params.token);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'none'; frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
