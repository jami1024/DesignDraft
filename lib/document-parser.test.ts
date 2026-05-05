import { describe, expect, it } from "vitest";

import { parsePlainTextDocument, validatePlainTextUpload } from "./document-parser";

describe("document parser", () => {
  it("parses markdown and text files as utf8 text", async () => {
    await expect(parsePlainTextDocument(new File(["# 标题\n需求内容"], "brief.md", { type: "text/markdown" }))).resolves.toBe(
      "# 标题\n需求内容",
    );
    await expect(parsePlainTextDocument(new File(["普通文本"], "brief.txt", { type: "text/plain" }))).resolves.toBe(
      "普通文本",
    );
  });

  it("rejects unsupported file types", () => {
    const file = new File(["fake"], "brief.pdf", { type: "application/pdf" });

    expect(() => validatePlainTextUpload(file)).toThrow("仅支持 .md 和 .txt 文件");
  });

  it("rejects empty files", async () => {
    const file = new File(["   "], "empty.md", { type: "text/markdown" });

    await expect(parsePlainTextDocument(file)).rejects.toThrow("文档内容不能为空");
  });
});
