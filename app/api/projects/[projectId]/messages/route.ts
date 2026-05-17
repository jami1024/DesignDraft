import { NextResponse } from "next/server";

import { getProject, loadChatMessages, saveChatMessages } from "@/lib/storage";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } },
) {
  const project = await getProject(params.projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const messages = await loadChatMessages(project.id);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } },
) {
  const project = await getProject(params.projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = (await request.json()) as { messages?: ChatMessage[] };
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages 必须是数组" }, { status: 400 });
  }

  await saveChatMessages(project.id, body.messages);
  return NextResponse.json({ ok: true });
}
