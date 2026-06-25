// Parse ④ generation output (===FILE: path ... ===END===) into FilePatch[].
import type { FilePatch } from "@/types/multi-agent";

import { FILE_BEGIN, FILE_END } from "./multi-agent-prompts";

const SAFE_PATH = /^src\/[\w./-]+$/;
const UNSUPPORTED_FONT_IMPORT = /^\s*@import\s+["']@fontsource\/[^"']+["'];?\s*$/;

function sanitizeGeneratedContent(relPath: string, content: string): string {
  if (!relPath.endsWith(".css")) return content;

  return content
    .split("\n")
    .filter((line) => !UNSUPPORTED_FONT_IMPORT.test(line))
    .join("\n");
}

/** Parse the full accumulated generation text into write patches. */
export function parseGeneratedFiles(fullText: string): FilePatch[] {
  const patches: FilePatch[] = [];
  const lines = fullText.split("\n");

  let path: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (path && SAFE_PATH.test(path)) {
      const content = sanitizeGeneratedContent(path, buffer.join("\n")).replace(/^\n+|\n+$/g, "") + "\n";
      patches.push({ path, op: "write", content });
    }
    path = null;
    buffer = [];
  };

  for (const line of lines) {
    const begin = line.trimStart();
    if (begin.startsWith(FILE_BEGIN)) {
      flush();
      // tolerate models that wrap the path symmetrically: "===FILE: src/x.tsx==="
      path = begin.slice(FILE_BEGIN.length).replace(/=+\s*$/, "").trim();
      continue;
    }
    if (line.trim().replace(/=/g, "") === "END") {
      flush();
      continue;
    }
    if (path !== null) buffer.push(line);
  }
  flush();

  return patches;
}
