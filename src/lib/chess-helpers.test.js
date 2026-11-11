import { describe, expect, it } from "vitest";

import { fmtScore, migrateMoveHistory, pvToSan } from "@/lib/chess-helpers";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("pvToSan", () => {
  it("converts a UCI principal variation to SAN", () => {
    expect(pvToSan(START, ["e2e4", "e7e5", "g1f3"])).toEqual(["e4", "e5", "Nf3"]);
  });

  it("caps the line at six moves", () => {
    const pv = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4"];
    expect(pvToSan(START, pv)).toHaveLength(6);
  });

  it("returns an empty list for illegal input instead of throwing", () => {
    expect(pvToSan(START, ["e2e5"])).toEqual([]);
    expect(pvToSan("not a fen", ["e2e4"])).toEqual([]);
    expect(pvToSan(START, null)).toEqual([]);
  });
});

describe("fmtScore", () => {
  it("formats scores from White's perspective", () => {
    expect(fmtScore(30, false, null, true)).toBe("+0.30  (slight White edge)");
    expect(fmtScore(30, false, null, false)).toBe("-0.30  (slight Black edge)");
    expect(fmtScore(10, false, null, true)).toBe("+0.10  (equal)");
    expect(fmtScore(250, false, null, true)).toBe(
      "+2.50  (White is clearly better)",
    );
  });

  it("formats mates and missing scores", () => {
    expect(fmtScore(null, true, 2, true)).toBe("Mate in 2 — White wins");
    expect(fmtScore(null, true, -3, true)).toBe("Mate in 3 — Black wins");
    expect(fmtScore(null, false, null, true)).toBe("—");
  });
});

describe("migrateMoveHistory", () => {
  it("upgrades legacy SAN arrays to move objects", () => {
    const migrated = migrateMoveHistory(["e4", "e5"]);
    expect(migrated).toHaveLength(2);
    expect(migrated[0]).toMatchObject({ san: "e4", from: "e2", to: "e4" });
    expect(migrated[1].fen).toContain(" w ");
  });

  it("leaves new-format histories untouched", () => {
    const moves = [{ san: "e4", fen: "x", from: "e2", to: "e4" }];
    expect(migrateMoveHistory(moves)).toBe(moves);
    expect(migrateMoveHistory([])).toEqual([]);
    expect(migrateMoveHistory(null)).toEqual([]);
  });
});
