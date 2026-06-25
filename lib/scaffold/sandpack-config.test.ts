import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const scaffoldDir = path.join(process.cwd(), "lib", "scaffold", "template");

describe("Sandpack scaffold config", () => {
  it("inlines Tailwind config in PostCSS instead of forcing Sandpack to load tailwind.config.ts", () => {
    const postcss = readFileSync(path.join(scaffoldDir, "postcss.config.js"), "utf8");
    const filesRoute = readFileSync(path.join(process.cwd(), "app", "api", "agent", "files", "route.ts"), "utf8");

    expect(postcss).toContain("content:");
    expect(postcss).toContain("theme:");
    expect(postcss).not.toContain("tailwindcss: {}");
    expect(filesRoute).not.toContain('"tailwind.config.ts"');
  });
});
