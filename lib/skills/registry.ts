import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type SkillMode = "prototype" | "review" | "template" | "design-system";

type SkillManifest = {
  id: string;
  name: string;
  mode: SkillMode;
  scenario: string;
  previewType: string;
  recommendedFor: string[];
  craft: {
    requires: string[];
  };
  outputs: {
    primary: string;
  };
  capabilities: {
    selectionOptimization: boolean;
  };
};

export type BuiltInSkill = SkillManifest & {
  body: string;
};

const SKILLS_ROOT = path.join(process.cwd(), "lib", "skills");
const CRAFT_ROOT = path.join(SKILLS_ROOT, "craft");

export async function listSkills(): Promise<BuiltInSkill[]> {
  const entries = await readdir(SKILLS_ROOT, { withFileTypes: true });
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name !== "craft")
      .map((entry) => readSkill(entry.name)),
  );

  return skills.filter((skill): skill is BuiltInSkill => skill !== null).sort((left, right) => left.id.localeCompare(right.id));
}

export async function getSkillById(skillId: string): Promise<BuiltInSkill | null> {
  return readSkill(skillId);
}

export async function listCraftRuleIds(): Promise<string[]> {
  const entries = await readdir(CRAFT_ROOT, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .sort();
}

export async function getCraftRules(ruleIds: string[]): Promise<string> {
  const uniqueRuleIds = Array.from(new Set(ruleIds.filter(isSafeSlug)));
  const rules = await Promise.all(
    uniqueRuleIds.map(async (ruleId) => {
      const content = await readFile(path.join(CRAFT_ROOT, `${ruleId}.md`), "utf8").catch(() => null);
      return content ? content.trim() : null;
    }),
  );

  return rules.filter((rule): rule is string => rule !== null).join("\n\n");
}

export async function resolveSkillContext(skillIds: string[]): Promise<string> {
  const skills = (await Promise.all(skillIds.map((skillId) => getSkillById(skillId)))).filter(
    (skill): skill is BuiltInSkill => skill !== null,
  );
  const craftRuleIds = skills.flatMap((skill) => skill.craft.requires);
  const craftRules = await getCraftRules(craftRuleIds);
  const skillBlocks = skills
    .map((skill) => `# Skill: ${skill.name}\n\n${skill.body.trim()}`)
    .join("\n\n---\n\n");

  return [skillBlocks, craftRules].filter(Boolean).join("\n\n---\n\n");
}

async function readSkill(skillId: string): Promise<BuiltInSkill | null> {
  if (!isSafeSlug(skillId)) return null;

  const skillPath = path.join(SKILLS_ROOT, skillId, "SKILL.md");
  const raw = await readFile(skillPath, "utf8").catch(() => null);
  if (!raw) return null;

  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;

  return {
    ...parsed.manifest,
    body: parsed.body,
  };
}

function parseFrontmatter(raw: string): { manifest: SkillManifest; body: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const manifest = parseSimpleYaml(match[1]);

  if (!isSkillManifest(manifest)) return null;

  return {
    manifest,
    body: match[2].trim(),
  };
}

function parseSimpleYaml(source: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> | unknown[] }> = [{ indent: -1, value: root }];
  const lines = source.split("\n");

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    const line = rawLine.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (line.startsWith("- ")) {
      if (Array.isArray(parent)) {
        parent.push(parseScalar(line.slice(2)));
      }
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (value) {
      if (isRecord(parent)) {
        parent[key] = parseScalar(value);
      }
      continue;
    }

    const nextLine = lines[lines.indexOf(rawLine) + 1]?.trim();
    const container: Record<string, unknown> | unknown[] = nextLine?.startsWith("- ") ? [] : {};
    if (isRecord(parent)) {
      parent[key] = container;
      stack.push({ indent, value: container });
    }
  }

  return root;
}

function parseScalar(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  return value.replace(/^['"]|['"]$/g, "");
}

function isSkillManifest(value: Record<string, unknown>): value is SkillManifest {
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.mode === "string" &&
    typeof value.scenario === "string" &&
    typeof value.previewType === "string" &&
    Array.isArray(value.recommendedFor) &&
    isRecord(value.craft) &&
    Array.isArray(value.craft.requires) &&
    isRecord(value.outputs) &&
    typeof value.outputs.primary === "string" &&
    isRecord(value.capabilities) &&
    typeof value.capabilities.selectionOptimization === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeSlug(value: string) {
  return /^[a-z0-9][a-z0-9-]*$/.test(value);
}
