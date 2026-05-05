import { describe, expect, it } from "vitest";

import {
  getCraftRules,
  getSkillById,
  listCraftRuleIds,
  listSkills,
  resolveSkillContext,
} from "./registry";

describe("skill registry", () => {
  it("lists built-in UI skills", async () => {
    const skills = await listSkills();

    expect(skills.map((skill) => skill.id)).toEqual(
      expect.arrayContaining(["web-landing", "dashboard", "pitch-page", "impeccable-review"]),
    );
  });

  it("loads a skill manifest and body", async () => {
    const skill = await getSkillById("web-landing");

    expect(skill).toMatchObject({
      id: "web-landing",
      name: "Web Landing Page",
      mode: "prototype",
      previewType: "html",
      recommendedFor: expect.arrayContaining(["landing-page"]),
      craft: { requires: expect.arrayContaining(["typography", "color", "anti-ai-slop"]) },
    });
    expect(skill?.body).toContain("单文件 HTML");
  });

  it("loads craft rules", async () => {
    expect(await listCraftRuleIds()).toEqual(
      expect.arrayContaining(["typography", "color", "layout", "anti-ai-slop", "accessibility"]),
    );

    const rules = await getCraftRules(["typography", "anti-ai-slop"]);
    expect(rules).toContain("字体层级");
    expect(rules).toContain("避免 AI 味");
  });

  it("resolves combined skill context", async () => {
    const context = await resolveSkillContext(["web-landing"]);

    expect(context).toContain("# Skill: Web Landing Page");
    expect(context).toContain("# Craft: typography");
    expect(context).toContain("# Craft: anti-ai-slop");
  });
});
