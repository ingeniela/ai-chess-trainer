import {
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Cpu,
  Flag,
  LayoutGrid,
  MoreHorizontal,
  RotateCcw,
  Timer,
  User,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { TIME_CONTROLS } from "@/hooks/use-chess-clock";
import { BOT_PROFILES } from "@/lib/bot-profiles";

/**
 * Positions a portal menu under its trigger and closes it on outside click
 * or Escape. Shared by the select-style dropdowns and the "More" menu.
 * @param {boolean} open - Whether the menu is open
 * @param {(open: boolean) => void} setOpen - Setter for the open state
 * @returns {{ triggerRef: object, menuRef: object, menuStyle: object }} Refs and position style
 */
const usePortalMenu = (open, setOpen) => {
  const [menuStyle, setMenuStyle] = useState({});
  const triggerReference = useRef(null);
  const menuReference = useRef(null);

  useEffect(() => {
    if (!open || !triggerReference.current) return undefined;

    const updateMenuPosition = () => {
      const rect = triggerReference.current.getBoundingClientRect();
      const menuWidth = Math.max(rect.width, 200);
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - menuWidth - 8,
      );
      setMenuStyle({ left, minWidth: rect.width, top: rect.bottom + 4 });
    };

    const handlePointer = (event) => {
      if (
        !triggerReference.current?.contains(event.target) &&
        !menuReference.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerReference.current?.focus();
      }
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, setOpen]);

  // Move focus into the menu when it opens so keyboard users can navigate it.
  useEffect(() => {
    if (open) {
      menuReference.current
        ?.querySelector('[aria-checked="true"], [role^="menuitem"]')
        ?.focus();
    }
  }, [open]);

  return {
    triggerRef: triggerReference,
    menuRef: menuReference,
    menuStyle,
  };
};

/**
 * Arrow-key navigation between the items of an open menu.
 * @param {import("react").KeyboardEvent} event - Key event from the menu container
 */
const handleMenuArrowKeys = (event) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const items = [
    ...event.currentTarget.querySelectorAll(
      '[role^="menuitem"]:not([disabled])',
    ),
  ];
  const index = items.indexOf(document.activeElement);
  let next = 0;
  if (event.key === "ArrowDown") next = (index + 1) % items.length;
  if (event.key === "ArrowUp") {
    next = (index - 1 + items.length) % items.length;
  }
  if (event.key === "End") next = items.length - 1;
  items[next]?.focus();
};

const MENU_CLASS =
  "fixed z-[9999] min-w-[200px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl focus:outline-none";
const ITEM_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

// ── Select-style dropdown ─────────────────────────────────────────────────
/**
 * Compact labelled select used in the play toolbar.
 * @param {object} props - Component props
 * @param {string} props.label - Visible label
 * @param {import("react").ComponentType} [props.icon] - Optional leading icon
 * @param {Array<{value: string, label: string, desc?: string, icon?: import("react").ComponentType}>} props.options - Choices
 * @param {string} props.value - Selected value
 * @param {(value: string) => void} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Disable the control
 * @returns {import("react").JSX.Element} Dropdown
 */
export const Dropdown = ({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const { triggerRef, menuRef, menuStyle } = usePortalMenu(open, setOpen);
  const menuId = useId();
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={disabled ? "Cannot change this during a game" : undefined}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-secondary/80"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="hidden text-foreground @2xl:inline">{label}:</span>
        <span className="sr-only @2xl:hidden">{label}:</span>
        <span className="font-semibold text-primary">
          {selected?.label || value}
        </span>
        {!disabled && (
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            aria-label={label}
            className={MENU_CLASS}
            style={menuStyle}
            onKeyDown={handleMenuArrowKeys}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`${ITEM_CLASS} ${
                  opt.value === value
                    ? "bg-primary/5 text-primary"
                    : "text-foreground"
                }`}
              >
                {opt.icon && <opt.icon className="h-3.5 w-3.5" />}
                <span>{opt.label}</span>
                {opt.desc && (
                  <span className="ml-auto pl-3 text-muted-foreground">
                    {opt.desc}
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

// ── "More" menu: position setup, clock and opening stats ──────────────────
const MoreMenu = ({
  isGameInProgress,
  onSetPosition,
  onOpenOpeningStats,
  clockEnabled,
  clockTimeControl,
  onToggleClock,
  onSetTimeControl,
}) => {
  const [open, setOpen] = useState(false);
  const { triggerRef, menuRef, menuStyle } = usePortalMenu(open, setOpen);
  const menuId = useId();

  const run = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="relative shrink-0">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="More game options"
      >
        {clockEnabled ? (
          <Timer className="h-4 w-4 text-primary" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
        <span className="hidden @2xl:inline">More</span>
      </Button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            aria-label="More game options"
            className={MENU_CLASS}
            style={menuStyle}
            onKeyDown={handleMenuArrowKeys}
          >
            <button
              type="button"
              role="menuitem"
              className={ITEM_CLASS}
              onClick={() => run(onSetPosition)}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Set position (FEN / PGN)
            </button>
            <button
              type="button"
              role="menuitem"
              className={ITEM_CLASS}
              onClick={() => run(onOpenOpeningStats)}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Opening statistics
            </button>

            <div className="my-1 border-t border-border" role="separator" />
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={clockEnabled}
              disabled={isGameInProgress}
              title={
                isGameInProgress
                  ? "Start a new game to change the clock"
                  : undefined
              }
              className={ITEM_CLASS}
              onClick={onToggleClock}
            >
              <Timer className="h-3.5 w-3.5" />
              Chess clock
              <span
                className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  clockEnabled
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {clockEnabled ? "ON" : "OFF"}
              </span>
            </button>
            {clockEnabled && (
              <div
                className="grid grid-cols-4 gap-1 px-2 pb-2 pt-1"
                role="group"
                aria-label="Time control"
              >
                {TIME_CONTROLS.map((control) => {
                  const active = clockTimeControl?.label === control.label;
                  return (
                    <button
                      key={control.label}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      aria-label={control.label}
                      title={control.label}
                      disabled={isGameInProgress}
                      onClick={() => onSetTimeControl(control)}
                      className={`rounded px-1 py-1 text-[11px] font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/70"
                      }`}
                    >
                      {control.display}
                    </button>
                  );
                })}
              </div>
            )}
            {clockEnabled && (
              <p className="flex items-center gap-1 px-3 pb-2 text-[10px] text-muted-foreground">
                <Check className="h-3 w-3" />
                Starts on the first move. Flag fall ends the game.
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

const OPPONENT_OPTIONS = [
  { value: "engine", label: "Elo Bot", icon: Cpu, desc: "Stockfish" },
  { value: "ai", label: "Local Bot", icon: Bot, desc: "offline" },
  { value: "manual", label: "Manual", icon: User, desc: "2 players" },
];

const BOT_OPTIONS = BOT_PROFILES.map((profile) => ({
  value: profile.id,
  label: profile.name,
  desc: `${profile.elo} Elo`,
  icon: profile.icon,
}));

// ── ControlBar ─────────────────────────────────────────────────────────────
/**
 * Play-mode toolbar shown above the board. Props mirror the play state held
 * by App.
 * @returns {import("react").JSX.Element} Toolbar
 */
const ControlBar = ({
  onNewGame,
  onEndGame,
  canEndGame = false,
  opponent,
  onOpponentChange,
  difficulty,
  onDifficultyChange,
  isGameInProgress = false,
  onSetPosition,
  onOpenOpeningStats,
  clockEnabled = false,
  clockTimeControl,
  onToggleClock,
  onSetTimeControl,
}) => (
  <div className="@container mb-2 flex w-full shrink-0 justify-center lg:mb-3">
    <div
      role="toolbar"
      aria-label="Game controls"
      className="flex max-w-full items-center justify-start gap-1.5 overflow-x-auto rounded-lg [scrollbar-width:none] border border-border/70 bg-card px-2 py-1.5 shadow-sm @sm:justify-center-safe lg:gap-2 lg:px-3 lg:py-2"
    >
      <Dropdown
        label="Opponent"
        icon={opponent === "manual" ? User : opponent === "ai" ? Bot : Cpu}
        options={OPPONENT_OPTIONS}
        value={opponent}
        onChange={onOpponentChange}
      />

      {opponent !== "manual" && (
        <Dropdown
          label="Bot"
          options={BOT_OPTIONS}
          value={difficulty}
          onChange={onDifficultyChange}
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onNewGame}
        className="shrink-0"
        aria-label="New game"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden @lg:inline">New Game</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onEndGame}
        disabled={!canEndGame}
        className="shrink-0"
        aria-label="End game"
      >
        <Flag className="h-4 w-4" />
        <span className="hidden @lg:inline">End Game</span>
      </Button>

      <MoreMenu
        isGameInProgress={isGameInProgress}
        onSetPosition={onSetPosition}
        onOpenOpeningStats={onOpenOpeningStats}
        clockEnabled={clockEnabled}
        clockTimeControl={clockTimeControl}
        onToggleClock={onToggleClock}
        onSetTimeControl={onSetTimeControl}
      />
    </div>
  </div>
);

export default ControlBar;
