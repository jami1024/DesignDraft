import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build-time element tagging: stamps every JSX element with a stable
// data-dd-id="<relativeFile>:<line>:<col>" so the preview's element selector
// can map a clicked DOM node back to its exact source location for surgical
// edits. Runs through @vitejs/plugin-react's babel pass.
function ddTagPlugin({ types: t }: { types: typeof import("@babel/types") }) {
  return {
    name: "designdraft-dd-id",
    visitor: {
      JSXOpeningElement(path: any, state: any) {
        const node = path.node;
        const already = node.attributes.some(
          (a: any) => a.type === "JSXAttribute" && a.name?.name === "data-dd-id",
        );
        if (already || !node.loc) return;

        const filename: string = state.file?.opts?.filename ?? "";
        const i = filename.lastIndexOf("/src/");
        const rel = i >= 0 ? filename.slice(i + 1) : filename.split("/").pop() ?? "unknown";
        const value = `${rel}:${node.loc.start.line}:${node.loc.start.column}`;

        node.attributes.push(
          t.jsxAttribute(t.jsxIdentifier("data-dd-id"), t.stringLiteral(value)),
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react({ babel: { plugins: [ddTagPlugin] } })],
});
