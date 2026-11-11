// @vitest-environment happy-dom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AiMarkdown from "@/components/ai-markdown";

const FENCE = "```";

describe("AiMarkdown", () => {
  afterEach(cleanup);

  it("renders inline code inline and fenced code as a block", () => {
    const source = `Play \`Nf3\` here.\n\n${FENCE}\n1. e4 e5\n2. Nf3\n${FENCE}`;
    const { container } = render(<AiMarkdown>{source}</AiMarkdown>);
    const codes = container.querySelectorAll("code");
    expect(codes).toHaveLength(2);
    expect(codes[0].className).not.toContain("block");
    expect(codes[1].className).toContain("block");
  });

  it("opens links safely in a new tab", () => {
    const { container } = render(
      <AiMarkdown>{"[Lichess](https://lichess.org)"}</AiMarkdown>,
    );
    const link = container.querySelector("a");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("never renders raw HTML from the model", () => {
    const source = `<img src="x" onerror="alert(1)"> **bold**`;
    const { container } = render(<AiMarkdown>{source}</AiMarkdown>);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("bold");
  });
});
