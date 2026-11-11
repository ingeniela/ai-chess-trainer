import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

import {
  createVisionCard,
  getGameResult,
  getPlayerResult,
} from "@/lib/game-result";

describe("getGameResult", () => {
  it("is null while the game is running", () => {
    expect(getGameResult(new Chess())).toBeNull();
  });

  it("detects checkmate winners", () => {
    const foolsMate = new Chess();
    for (const san of ["f3", "e5", "g4", "Qh4#"]) foolsMate.move(san);
    expect(getGameResult(foolsMate)).toBe("black");
  });

  it("detects draws", () => {
    const stalemate = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(getGameResult(stalemate)).toBe("draw");
  });
});

describe("getPlayerResult", () => {
  it.each([
    ["white", "white", "win"],
    ["white", "black", "loss"],
    ["black", "black", "win"],
    ["draw", "white", "draw"],
    [null, "white", null],
  ])("%s with player %s → %s", (result, color, expected) => {
    expect(getPlayerResult(result, color)).toBe(expected);
  });
});

describe("createVisionCard", () => {
  it("produces valid squares", () => {
    expect(createVisionCard(() => 0).square).toBe("a1");
    expect(createVisionCard(() => 0.99).square).toBe("h8");
    expect(createVisionCard().square).toMatch(/^[a-h][1-8]$/);
  });
});
