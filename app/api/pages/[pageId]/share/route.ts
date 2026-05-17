import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { createShareLink, getPage, listSharesByPage } from "@/lib/storage";
import type { ShareLink } from "@/types";

type RouteParams = {
  params: { pageId: string };
};

type RequestBody = {
  projectId?: string;
  versionId?: string;
  expiresIn?: number;
  password?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId, versionId } = body;
  if (!projectId || !versionId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const page = await getPage(projectId, params.pageId);
  if (!page) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 });
  }

  const expiresInMs = (body.expiresIn ?? 7 * 24 * 60 * 60) * 1000;
  const now = new Date();

  const share: ShareLink = {
    id: nanoid(),
    shareToken: nanoid(32),
    projectId,
    pageId: params.pageId,
    versionId,
    passwordHash: body.password ? await bcrypt.hash(body.password, 10) : undefined,
    expiresAt: new Date(now.getTime() + expiresInMs).toISOString(),
    createdAt: now.toISOString(),
    accessCount: 0,
    isRevoked: false,
  };

  await createShareLink(share);

  return NextResponse.json({
    share: {
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: `/share/${share.shareToken}`,
      hasPassword: !!share.passwordHash,
      expiresAt: share.expiresAt,
    },
  });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const shares = await listSharesByPage(params.pageId);

  return NextResponse.json({
    shares: shares.map((s) => ({
      id: s.id,
      shareToken: s.shareToken,
      shareUrl: `/share/${s.shareToken}`,
      versionId: s.versionId,
      hasPassword: !!s.passwordHash,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      accessCount: s.accessCount,
    })),
  });
}
