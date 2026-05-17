import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { getPageVersionHtmlPath, pathExists } from "@/lib/storage";

type RouteParams = {
  params: {
    projectId: string;
    pageId: string;
    version: string;
  };
};

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data: https:",
  "connect-src 'none'",
  "frame-ancestors 'self'",
].join("; ");

export async function GET(_request: Request, { params }: RouteParams) {
  const { projectId, pageId, version } = params;

  if (!/^v\d+$/.test(version)) {
    return NextResponse.json({ error: "无效的版本号" }, { status: 400 });
  }

  const htmlPath = getPageVersionHtmlPath(projectId, pageId, version);

  if (!(await pathExists(htmlPath))) {
    return NextResponse.json({ error: "页面版本不存在" }, { status: 404 });
  }

  const html = await readFile(htmlPath, "utf8");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CSP_HEADER,
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}
