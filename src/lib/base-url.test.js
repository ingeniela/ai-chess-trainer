import { describe, expect, it } from "vitest";

import { withBaseUrl } from "@/lib/base-url";

describe("withBaseUrl", () => {
  it("prefixes relative and root paths with the base url", () => {
    expect(withBaseUrl("quiz/index.json")).toBe("/quiz/index.json");
    expect(withBaseUrl("/quiz/index.json")).toBe("/quiz/index.json");
    expect(withBaseUrl("./quiz/index.json")).toBe("/quiz/index.json");
  });

  it("leaves absolute and data urls alone", () => {
    expect(withBaseUrl("https://example.com/a.json")).toBe(
      "https://example.com/a.json",
    );
    expect(withBaseUrl("data:image/png;base64,AA")).toBe(
      "data:image/png;base64,AA",
    );
  });

  it("returns the base url for empty input", () => {
    expect(withBaseUrl("")).toBe("/");
    expect(withBaseUrl(undefined)).toBe("/");
  });
});
