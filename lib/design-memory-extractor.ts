import type {
  DesignRegister,
  ProjectDesignMemory,
  ProjectDesignMemoryPageEntry,
} from "@/types";

const MAX_PALETTE_COLORS = 16;

const IGNORED_COLORS = new Set([
  "#000", "#000000", "#fff", "#ffffff",
  "rgb(0, 0, 0)", "rgb(255, 255, 255)",
  "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 1)", "rgba(255, 255, 255, 1)",
]);

const SYSTEM_FONTS = new Set([
  "system-ui", "sans-serif", "serif", "monospace", "cursive", "fantasy",
  "-apple-system", "blinkmacsystemfont", "segoe ui",
  "ui-sans-serif", "ui-serif", "ui-monospace",
]);

type ExtractedDesignTokens = {
  colors: string[];
  fontFamilies: string[];
  displayFont?: string;
  bodyFont?: string;
  monoFont?: string;
};

function extractStyleBlocks(html: string): string {
  const blocks: string[] = [];
  const pattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    blocks.push(match[1]);
  }
  return blocks.join("\n");
}

function extractColors(css: string): string[] {
  const colorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/gi;
  const colorSet = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = colorPattern.exec(css)) !== null) {
    const normalized = match[0].toLowerCase().replace(/\s+/g, " ");
    if (!IGNORED_COLORS.has(normalized)) {
      colorSet.add(normalized);
    }
  }
  return Array.from(colorSet).slice(0, MAX_PALETTE_COLORS);
}

function extractFonts(html: string, css: string) {
  const families = new Set<string>();

  const linkPattern = /<link[^>]*href="([^"]*fonts\.googleapis\.com\/css2?\?[^"]*)"[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) !== null) {
    const familyPattern = /family=([^&:]+)/g;
    let fm: RegExpExecArray | null;
    while ((fm = familyPattern.exec(match[1])) !== null) {
      const name = decodeURIComponent(fm[1].replace(/\+/g, " ")).trim();
      if (name) families.add(name);
    }
  }

  let displayFont: string | undefined;
  let bodyFont: string | undefined;
  let monoFont: string | undefined;

  const rulePattern = /([^{}]+)\{([^}]*font-family\s*:[^}]*)\}/gi;
  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1].toLowerCase();
    const fontMatch = /font-family\s*:\s*['"]?([^'";,}]+)/.exec(match[2]);
    if (!fontMatch) continue;

    const fontName = fontMatch[1].trim().replace(/^['"]|['"]$/g, "");
    if (SYSTEM_FONTS.has(fontName.toLowerCase())) continue;

    families.add(fontName);

    if (/\b(h[1-6]|\.heading|\.title|\.hero|\.display)\b/.test(selector)) {
      if (!displayFont) displayFont = fontName;
    } else if (/\b(body|\.text|^p\b|\.prose|\.body)\b/.test(selector)) {
      if (!bodyFont) bodyFont = fontName;
    } else if (/\b(code|pre|\.mono|kbd|\.code)\b/.test(selector)) {
      if (!monoFont) monoFont = fontName;
    }
  }

  const familyList = Array.from(families);
  if (!displayFont && familyList.length >= 1) displayFont = familyList[0];
  if (!bodyFont && familyList.length >= 2) bodyFont = familyList[1];

  return { families: familyList, display: displayFont, body: bodyFont, mono: monoFont };
}

export function extractDesignTokens(html: string): ExtractedDesignTokens {
  const css = extractStyleBlocks(html);
  const colors = extractColors(css);
  const fonts = extractFonts(html, css);

  return {
    colors,
    fontFamilies: fonts.families,
    displayFont: fonts.display,
    bodyFont: fonts.body,
    monoFont: fonts.mono,
  };
}

function extractVisualKeywords(visualDirection: string): string[] {
  return visualDirection
    .split(/[,，、;；\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 5);
}

export function mergeDesignMemory(
  existing: ProjectDesignMemory | null,
  tokens: ExtractedDesignTokens,
  pageEntry: ProjectDesignMemoryPageEntry,
): ProjectDesignMemory {
  if (!existing) {
    return {
      version: 1,
      palette: { colors: tokens.colors },
      typography: {
        families: tokens.fontFamilies,
        display: tokens.displayFont,
        body: tokens.bodyFont,
        mono: tokens.monoFont,
      },
      register: pageEntry.register,
      visualCharacteristics: extractVisualKeywords(pageEntry.visualDirection),
      pageContributions: [pageEntry],
      updatedAt: new Date().toISOString(),
    };
  }

  const mergedColors = Array.from(
    new Set([...existing.palette.colors, ...tokens.colors]),
  ).slice(0, MAX_PALETTE_COLORS);

  const mergedFamilies = Array.from(
    new Set([...existing.typography.families, ...tokens.fontFamilies]),
  );

  const newKeywords = extractVisualKeywords(pageEntry.visualDirection);
  const mergedVisual = Array.from(
    new Set([...existing.visualCharacteristics, ...newKeywords]),
  ).slice(0, 8);

  const contributions = [...existing.pageContributions, pageEntry];
  const registerCounts = contributions.reduce(
    (acc, p) => {
      if (p.register) acc[p.register] = (acc[p.register] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const dominantRegister =
    (Object.entries(registerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | DesignRegister
      | undefined) ?? existing.register;

  return {
    version: 1,
    palette: {
      colors: mergedColors,
      colorStrategy: existing.palette.colorStrategy,
    },
    typography: {
      families: mergedFamilies,
      display: existing.typography.display ?? tokens.displayFont,
      body: existing.typography.body ?? tokens.bodyFont,
      mono: existing.typography.mono ?? tokens.monoFont,
    },
    register: dominantRegister,
    visualCharacteristics: mergedVisual,
    pageContributions: contributions,
    updatedAt: new Date().toISOString(),
  };
}
