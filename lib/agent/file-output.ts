// Parse ④ generation output (===FILE: path ... ===END===) into FilePatch[].
import type { FilePatch } from "@/types/multi-agent";

import { FILE_BEGIN, FILE_END } from "./multi-agent-prompts";

const SAFE_PATH = /^src\/[\w./-]+$/;

/** Parse the full accumulated generation text into write patches. */
export function parseGeneratedFiles(fullText: string): FilePatch[] {
  const patches: FilePatch[] = [];
  const lines = fullText.split("\n");

  let path: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (path && SAFE_PATH.test(path)) {
      patches.push({ path, op: "write", content: buffer.join("\n").replace(/^\n+|\n+$/g, "") + "\n" });
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
