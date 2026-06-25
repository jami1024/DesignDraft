import { describe, expect, it } from "vitest";

import tailwindConfig from "../tailwind.config";

describe("tailwind theme colors", () => {
  it("exposes project color scales used by UI classes", () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, unknown>;

    expect(colors.primary).toMatchObject({
      50: "#EFF6FF",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
    });
    expect(colors["warm-gray"]).toMatchObject({
      50: "#FAFAF9",
      200: "#E7E5E4",
      700: "#44403C",
      900: "#1C1917",
    });
  });
});
