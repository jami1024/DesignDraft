import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import {
  createTextPreview,
  getMimeTypeForPlainTextFile,
  parsePlainTextDocument,
} from "@/lib/document-parser";
import {
  createSourceDocument,
  getProject,
  getProjectExtractedPath,
  getProjectUploadsPath,
} from "@/lib/storage";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]/g, "_");
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效表单" }, { status: 400 });
  }

  const projectId = formData.get("projectId");
  const file = formData.get("file");

  if (typeof projectId !== "string" || !projectId.trim()) {
    return NextResponse.json({ error: "项目 ID 不能为空" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传文件" }, { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  let extractedText: string;
  try {
    extractedText = await parsePlainTextDocument(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "文档解析失败" },
      { status: 400 },
    );
  }

  const draftDocumentId = nanoid();
  const safeFileName = sanitizeFileName(file.name);
  const originalPath = path.join(getProjectUploadsPath(project.id), `${draftDocumentId}-${safeFileName}`);
  const extractedTextPath = path.join(getProjectExtractedPath(project.id), `${draftDocumentId}.txt`);

  await writeFile(originalPath, Buffer.from(await file.arrayBuffer()));
  await writeFile(extractedTextPath, extractedText, "utf8");

  const document = await createSourceDocument({
    projectId: project.id,
    originalFileName: file.name,
    mimeType: file.type || getMimeTypeForPlainTextFile(file.name),
    originalPath,
    extractedTextPath,
  });

  return NextResponse.json(
    {
      document,
      extractedTextPreview: createTextPreview(extractedText),
    },
    { status: 201 },
  );
}
