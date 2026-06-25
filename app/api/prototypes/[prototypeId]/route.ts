import { NextResponse } from "next/server";

import { getPrototype } from "@/lib/storage";

export const runtime = "nodejs";

type RouteContext = { params: { prototypeId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  const prototype = await getPrototype(projectId, params.prototypeId);
  if (!prototype) return NextResponse.json({ error: "原型不存在" }, { status: 404 });
  return NextResponse.json({ prototype });
}
