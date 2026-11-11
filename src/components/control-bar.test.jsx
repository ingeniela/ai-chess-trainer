// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ControlBar from "@/components/control-bar";
import { TIME_CONTROLS } from "@/hooks/use-chess-clock";

const renderBar = (overrides = {}) => {
  const props = {
    onNewGame: vi.fn(),
    onEndGame: vi.fn(),
    canEndGame: true,
    opponent: "engine",
    onOpponentChange: vi.fn(),
    difficulty: "club",
    onDifficultyChange: vi.fn(),
    isGameInProgress: false,
    onSetPosition: vi.fn(),
    onOpenOpeningStats: vi.fn(),
    clockEnabled: false,
    clockTimeControl: TIME_CONTROLS[2],
    onToggleClock: vi.fn(),
    onSetTimeControl: vi.fn(),
    ...overrides,
  };
  render(<ControlBar {...props} />);
  return props;
};

const openMore = () =>
  fireEvent.click(screen.getByRole("button", { name: "More game options" }));

describe("ControlBar", () => {
  afterEach(cleanup);

  it("exposes an accessible toolbar with game actions", () => {
    const props = renderBar();
    expect(screen.getByRole("toolbar", { name: "Game controls" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    fireEvent.click(screen.getByRole("button", { name: "End game" }));
    expect(props.onNewGame).toHaveBeenCalledOnce();
    expect(props.onEndGame).toHaveBeenCalledOnce();
  });

  it("disables End Game when there is nothing to end", () => {
    renderBar({ canEndGame: false });
    expect(screen.getByRole("button", { name: "End game" }).disabled).toBe(
      true,
    );
  });

  it("selects an opponent from the dropdown menu", () => {
    const props = renderBar();
    const trigger = screen.getByRole("button", { name: /Opponent/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Manual/ }));
    expect(props.onOpponentChange).toHaveBeenCalledWith("manual");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("hides the bot picker for two-player games", () => {
    renderBar({ opponent: "manual" });
    expect(screen.queryByRole("button", { name: /Bot:/ })).toBeNull();
  });

  it("closes menus with Escape", () => {
    renderBar();
    openMore();
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("offers position setup and the clock under More", () => {
    const props = renderBar();
    openMore();
    fireEvent.click(screen.getByRole("menuitem", { name: /Set position/ }));
    expect(props.onSetPosition).toHaveBeenCalledOnce();

    openMore();
    fireEvent.click(
      screen.getByRole("menuitemcheckbox", { name: /Chess clock/ }),
    );
    expect(props.onToggleClock).toHaveBeenCalledOnce();
  });

  it("lists time controls when the clock is on and locks them mid-game", () => {
    const props = renderBar({ clockEnabled: true });
    openMore();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Rapid 10+0" }));
    expect(props.onSetTimeControl).toHaveBeenCalledWith(
      TIME_CONTROLS.find((control) => control.label === "Rapid 10+0"),
    );
    cleanup();

    renderBar({ clockEnabled: true, isGameInProgress: true });
    openMore();
    expect(
      screen.getByRole("menuitemradio", { name: "Rapid 10+0" }).disabled,
    ).toBe(true);
  });
});
