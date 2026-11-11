import { describe, expect, it } from "vitest";

import { classifyMove, QUALITY_LEVELS } from "@/lib/analyzer";

describe("classifyMove", () => {
  it.each([
    [0, "Brilliant"],
    [15, "Brilliant"],
    [16, "Excellent"],
    [70, "Good"],
    [150, "Inaccuracy"],
    [300, "Mistake"],
    [301, "Blunder"],
    [5000, "Blunder"],
  ])("maps %i centipawns lost to %s", (cpLost, label) => {
    expect(classifyMove(cpLost).label).toBe(label);
  });

  it("keeps thresholds strictly increasing", () => {
    const maxima = QUALITY_LEVELS.map((level) => level.max);
    expect([...maxima].sort((a, b) => a - b)).toEqual(maxima);
  });
});
