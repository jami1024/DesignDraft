import { NextResponse } from "next/server";

import { revokeShare } from "@/lib/storage";

type RouteParams = {
  params: { pageId: string; shareId: string };
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const revoked = await revokeShare(params.shareId);

  if (!revoked) {
    return NextResponse.json({ error: "分享链接不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
