import { describe, expect, it } from "vitest";

import { parseGeneratedFiles } from "./file-output";

describe("parseGeneratedFiles", () => {
  it("removes font package imports that cannot be installed by generated src files", () => {
    const files = parseGeneratedFiles([
      "===FILE: src/index.css",
      "@import '@fontsource/ibm-plex-sans/400.css';",
      '@import "@fontsource/ibm-plex-sans/600.css";',
      "",
      "@tailwind base;",
      "===END===",
    ].join("\n"));

    expect(files).toEqual([
      {
        path: "src/index.css",
        op: "write",
        content: "@tailwind base;\n",
      },
    ]);
  });
});
