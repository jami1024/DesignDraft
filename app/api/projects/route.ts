import { NextResponse } from "next/server";

import { createProject, listProjects } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const projects = await listProjects();

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const name = typeof body === "object" && body !== null && "name" in body ? body.name : undefined;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
  }

  const project = await createProject({ name });

  return NextResponse.json({ project }, { status: 201 });
}
