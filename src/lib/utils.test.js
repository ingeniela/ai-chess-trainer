// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollIntoViewWithin } from "@/lib/utils";

const rect = (top, bottom) => ({
  top,
  bottom,
  left: 0,
  right: 0,
  width: 0,
  height: bottom - top,
});

const setup = () => {
  const page = document.createElement("div");
  const panel = document.createElement("div");
  const item = document.createElement("div");
  panel.style.overflowY = "auto";
  page.style.overflowY = "auto";
  panel.append(item);
  page.append(panel);
  document.body.append(page);
  for (const element of [page, panel]) {
    Object.defineProperty(element, "scrollHeight", { value: 1000 });
    Object.defineProperty(element, "clientHeight", { value: 100 });
    element.scrollBy = vi.fn();
  }
  panel.getBoundingClientRect = () => rect(0, 100);
  item.getBoundingClientRect = () => rect(150, 180);
  return { page, panel, item };
};

describe("scrollIntoViewWithin", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls only the nearest scrollable ancestor", () => {
    const { page, panel, item } = setup();
    scrollIntoViewWithin(item);
    expect(panel.scrollBy).toHaveBeenCalledWith({
      top: 80,
      behavior: "smooth",
    });
    expect(page.scrollBy).not.toHaveBeenCalled();
  });

  it("does nothing for a missing element or an already visible one", () => {
    const { panel, item } = setup();
    scrollIntoViewWithin(null);
    item.getBoundingClientRect = () => rect(20, 40);
    scrollIntoViewWithin(item, { align: "nearest" });
    expect(panel.scrollBy).not.toHaveBeenCalled();
  });
});
