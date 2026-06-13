import { describe, expect, it } from "vitest";

import { buildMyMoveCard } from "@/lib/intelligence";

describe("buildMyMoveCard", () => {
  it("classifies white moves from White's perspective when Black is next to move", () => {
    const card = buildMyMoveCard(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "d4",
      {
        bestMove: "e2e4",
        scoreCp: 50,
        isMate: false,
        mateIn: null,
        pv: ["e2e4", "e7e5"],
      },
      {
        scoreCp: 500,
        isMate: false,
        mateIn: null,
      },
      1000,
      0,
    );

    expect(card.evalAfter).toBe("-5.00");
    expect(card.cpLost).toBe(550);
    expect(card.quality).toBe("Blunder");
    expect(card.suggestion.bestMove).toBe("e4");
  });

  it("classifies black moves from Black's perspective when White is next to move", () => {
    const card = buildMyMoveCard(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      "c5",
      {
        bestMove: "e7e5",
        scoreCp: 30,
        isMate: false,
        mateIn: null,
        pv: ["e7e5", "g1f3"],
      },
      {
        scoreCp: 250,
        isMate: false,
        mateIn: null,
      },
      1000,
      0,
    );

    expect(card.evalAfter).toBe("+2.50");
    expect(card.cpLost).toBe(280);
    expect(card.quality).toBe("Mistake");
    expect(card.suggestion.bestMove).toBe("e5");
  });
});
