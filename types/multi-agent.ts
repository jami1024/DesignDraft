// Multi-agent pipeline contracts (multi-file React direction).
// Coexists with the legacy single-file HTML types in ./index.ts during migration.
import type { DesignRegister } from "./index";

// ----- ② PRODUCT.md (requirement analysis output) -----

export type ProductSpec = {
  register: DesignRegister; // top-level routing
  summary: string;
  audience: string;
  brandVoice: string[]; // 3 tone words
  primaryFlow: string;
  views: ViewSpec[];
  contentScope: string;
  constraints: string;
  openQuestions: string[];
};

export type ViewSpec = {
  id: string; // kebab-case, e.g. "dashboard"
  name: string; // display name
  purpose: string;
  sections: string[];
  route: string; // in-app route, e.g. "/dashboard"
};

// ----- ③ DESIGN.md (UI planning output, user-confirm gate) -----

export type ColorStrategy = "Restrained" | "Committed" | "Full palette" | "Drenched";

export type DesignTokens = {
  paletteOklch: {
    primary: string;
    accent: string;
    neutral: string;
    background: string;
    foreground: string;
  };
  semantic: { success: string; error: string; warning: string };
  spacingBase: 4;
  typeScale: { ratio: number; steps: string[] };
  fonts: { display: string; body: string };
  radius: string;
  shadow: string;
  motion: string;
};

export type AgentDesignDirection = {
  id: string;
  name: string; // 2-4 char CN name
  colorStrategy: ColorStrategy;
  themeRationale: string;
  tokens: DesignTokens;
  layoutPlan: string;
};

export type DesignSpec = {
  directions: AgentDesignDirection[];
  selectedDirectionId: string | null; // confirm gate writes this
};

// ----- ④ generation / ⑥ optimization output -----

export type FilePatch = {
  path: string; // relative to repo root, e.g. "src/views/Dashboard.tsx"
  op: "write" | "edit" | "delete";
  content?: string;
};

// ----- ⑤ review output -----

export type ReviewSeverity = "high" | "medium" | "low";

export type ReviewIssue = {
  severity: ReviewSeverity;
  area: string;
  file: string;
  description: string;
  fix: string;
};

export type ReviewHardGate = {
  tscPass: boolean;
  eslintPass: boolean;
  sandpackCompile: boolean;
  detectViolations: string[];
};

export type ReviewScores = {
  hierarchy: number;
  spacing: number;
  contrastA11y: number;
  responsive: number;
  copy: number;
  antiAiSlop: number;
};

export type ReviewResult = {
  verdict: "PASS" | "NEEDS_REVISION";
  hardGate: ReviewHardGate;
  scores: ReviewScores;
  issues: ReviewIssue[];
};

// ----- optimization request (⑥) -----

export type OptimizeRequest = {
  instruction: string;
  // point-select target (optional); when absent it's a chat-style edit
  selectedElement?: {
    stableId?: string;
    outerHtml?: string;
    componentFile?: string; // resolved by the file index
  };
  // directed operator, e.g. "bolder" | "quieter" | "distill" | "adapt" | "delight" | "harden"
  operator?: string;
};
