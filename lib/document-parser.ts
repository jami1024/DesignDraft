const MAX_TEXT_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);

export function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

export function validatePlainTextUpload(file: File) {
  const extension = getFileExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error("仅支持 .md 和 .txt 文件");
  }

  if (file.size > MAX_TEXT_FILE_SIZE) {
    throw new Error("文件大小不能超过 10MB");
  }
}

export async function parsePlainTextDocument(file: File) {
  validatePlainTextUpload(file);

  const text = await file.text();

  if (!text.trim()) {
    throw new Error("文档内容不能为空");
  }

  return text;
}

export function createTextPreview(text: string, maxLength = 500) {
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

export function getMimeTypeForPlainTextFile(fileName: string) {
  return getFileExtension(fileName) === ".md" ? "text/markdown" : "text/plain";
}
