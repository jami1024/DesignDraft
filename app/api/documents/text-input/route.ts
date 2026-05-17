import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { createTextPreview } from "@/lib/document-parser";
import { createSourceDocument, getProject, getProjectExtractedPath, updateProject } from "@/lib/storage";

export const runtime = "nodejs";

type TextInputRequestBody = {
  projectId?: unknown;
  text?: unknown;
};

export async function POST(request: Request) {
  let body: TextInputRequestBody;

  try {
    body = (await request.json()) as TextInputRequestBody;
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  if (typeof body.projectId !== "string" || !body.projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }

  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "文本需求不能为空" }, { status: 400 });
  }

  if (body.text.length > 100_000) {
    return NextResponse.json({ error: "文本内容过长，最多 100,000 字符" }, { status: 413 });
  }

  const project = await getProject(body.projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const text = body.text.trim();
  const draftDocumentId = nanoid();
  const extractedTextPath = path.join(getProjectExtractedPath(project.id), `${draftDocumentId}.txt`);

  await writeFile(extractedTextPath, text, "utf8");

  const document = await createSourceDocument({
    projectId: project.id,
    originalFileName: "文本需求.txt",
    mimeType: "text/plain",
    originalPath: extractedTextPath,
    extractedTextPath,
  });

  await updateProject(project.id, { textInput: text });

  return NextResponse.json(
    {
      document,
      extractedTextPreview: createTextPreview(text),
    },
    { status: 201 },
  );
}
