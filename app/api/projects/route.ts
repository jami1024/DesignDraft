import { NextResponse } from "next/server";

import { normalizeCreationContext } from "@/lib/prototype-validation";
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
  const textInput = typeof body === "object" && body !== null && "textInput" in body ? body.textInput : undefined;
  const creationContext =
    typeof body === "object" && body !== null && "creationContext" in body ? body.creationContext : undefined;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
  }

  let normalizedCreationContext;

  if (creationContext !== undefined) {
    try {
      normalizedCreationContext = normalizeCreationContext(creationContext);
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建上下文无效";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const project = await createProject({
    name,
    ...(typeof textInput === "string" && textInput.trim() ? { textInput: textInput.trim() } : {}),
    ...(normalizedCreationContext ? { creationContext: normalizedCreationContext } : {}),
  });

  return NextResponse.json({ project }, { status: 201 });
}
