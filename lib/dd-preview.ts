// Shared protocol between the in-preview element selector (shipped into the
// Sandpack app as src/dd-selector.ts) and the workbench preview component.
export const DD_PREVIEW_SOURCE = "designdraft";

export type ReactSelectedElement = {
  ddId: string; // "<file>:<line>:<col>" from the build-time babel stamp, or "" if absent
  file: string | null;
  line: number | null;
  column: number | null;
  tagName: string;
  text: string;
  html: string;
};
