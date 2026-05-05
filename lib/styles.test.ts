import { describe, expect, it } from "vitest";

import { getStylePresetById, listStylePresets } from "./styles";

describe("style presets", () => {
  it("lists visual direction presets", () => {
    const presets = listStylePresets();

    expect(presets.map((preset) => preset.id)).toEqual([
      "modern-minimal",
      "warm-soft",
      "tech-utility",
      "editorial",
      "playful-vibrant",
    ]);
  });

  it("gets a preset by id", () => {
    const preset = getStylePresetById("modern-minimal");

    expect(preset).toMatchObject({
      id: "modern-minimal",
      name: "Modern Minimal",
      recommendedFor: expect.arrayContaining(["SaaS", "工具产品"]),
    });
  });
});
