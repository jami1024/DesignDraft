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

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".md", ".txt", ".pdf", ".docx"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
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

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 413 });
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `不支持的文件类型：${ext || "无扩展名"}，仅支持 .md/.txt/.pdf/.docx` }, { status: 415 });
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "不支持的文件 MIME 类型" }, { status: 415 });
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
