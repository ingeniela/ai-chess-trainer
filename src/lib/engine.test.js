import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

import { getBotProfile } from "@/lib/bot-profiles";
import { getBestMove } from "@/lib/engine";

describe("getBestMove (local bot)", () => {
  it("returns a legal move for every bot profile", () => {
    const fen = new Chess().fen();
    for (const id of ["casual", "club", "master"]) {
      const san = getBestMove(fen, id);
      expect(new Chess(fen).moves()).toContain(san);
    }
  });

  it("returns null when there is no legal move", () => {
    // Fool's mate: White is checkmated.
    const mated = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
    expect(getBestMove(mated, "club")).toBeNull();
  });

  it("stronger bots grab a free queen", () => {
    expect(getBotProfile("master").elo).toBeGreaterThan(800);
    // Black queen hangs on d4; White knight on f3 can take it.
    const fen = "rnb1kbnr/pppp1ppp/8/4p3/3q4/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 3";
    expect(getBestMove(fen, "master")).toBe("Nxd4");
  });
});
