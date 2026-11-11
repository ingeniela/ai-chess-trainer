import { describe, expect, it } from "vitest";

import {
  BOT_PROFILES,
  getBotProfile,
  getBotProfileLabel,
} from "@/lib/bot-profiles";

describe("bot profiles", () => {
  it("has unique ids sorted by rising Elo", () => {
    const ids = BOT_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
    const elos = BOT_PROFILES.map((profile) => profile.elo);
    expect([...elos].sort((a, b) => a - b)).toEqual(elos);
  });

  it("maps legacy difficulty names and falls back to the club bot", () => {
    expect(getBotProfile("easy").id).toBe("casual");
    expect(getBotProfile("medium").id).toBe("club");
    expect(getBotProfile("hard").id).toBe("master");
    expect(getBotProfile("does-not-exist").id).toBe("club");
    expect(getBotProfile().id).toBe("club");
  });

  it("builds a readable label", () => {
    const club = getBotProfile("club");
    expect(getBotProfileLabel("club")).toBe(`${club.name} (${club.elo})`);
  });
});
