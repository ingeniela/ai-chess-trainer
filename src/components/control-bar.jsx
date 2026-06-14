import { Flag, RotateCcw, User, Bot, Cpu, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { BOT_PROFILES } from "@/lib/bot-profiles";

// ── Simple dropdown component ─────────────────────────────────────────────
/**
 *
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
  const [menuStyle, setMenuStyle] = useState({});
  const reference = useRef(null);
  const menuReference = useRef(null);

  useEffect(() => {
    if (!open || !reference.current) {
      return undefined;
    }

    const updateMenuPosition = () => {
      const rect = reference.current.getBoundingClientRect();
      setMenuStyle({
        left: rect.left,
        minWidth: rect.width,
        top: rect.bottom + 4,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    /**
     *
     */
    const handle = (e) => {
      if (
        reference.current &&
        !reference.current.contains(e.target) &&
        !menuReference.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={reference} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={disabled ? "Cannot change sides during a game" : undefined}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary border border-border text-xs font-medium transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-secondary/80 cursor-pointer"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-foreground">{label}:</span>
        <span className="text-primary font-semibold">
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
            ref={menuReference}
            className="fixed z-[9999] min-w-[160px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl"
            style={menuStyle}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors text-left ${
                  opt.value === value
                    ? "text-primary bg-primary/5"
                    : "text-foreground"
                }`}
              >
                {opt.icon && <opt.icon className="h-3.5 w-3.5" />}
                <span>{opt.label}</span>
                {opt.desc && (
                  <span className="text-muted-foreground ml-auto">
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
 *
 */
const ControlBar = ({
  onNewGame,
  onEndGame,
  canEndGame = false,
  opponent,
  onOpponentChange,
  difficulty,
  onDifficultyChange,
  // Train
}) => (
  <div className="relative z-30 flex items-center gap-2 overflow-x-auto overflow-y-visible border-b border-border bg-card px-2 py-2 sm:px-4 lg:justify-between">
    {/* Center — controls */}
    <div className="flex min-w-max items-center gap-2 lg:min-w-0 lg:flex-wrap">
      {/* Opponent selector */}
      <Dropdown
        label="Opponent"
        icon={opponent === "manual" ? User : opponent === "ai" ? Bot : Cpu}
        options={OPPONENT_OPTIONS}
        value={opponent}
        onChange={onOpponentChange}
      />

      {/* Difficulty — visible when opponent is AI or Chess Engine */}
      {opponent !== "manual" && (
        <Dropdown
          label="Bot"
          options={BOT_OPTIONS}
          value={difficulty}
          onChange={onDifficultyChange}
        />
      )}

      {/* Play as — pick side; disabled once game has started 
        {opponent !== "manual" && (
          <Dropdown
            label="Play as"
            icon={playerColor === "white" ? Crown : CircleUser}
            options={PLAYER_COLOR_OPTIONS}
            value={playerColor}
            onChange={onPlayerColorChange}
            disabled={isGameInProgress}
          />
        )} */}

      <Button variant="ghost" size="sm" onClick={onNewGame}>
        <RotateCcw className="h-4 w-4" />
        New Game
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onEndGame}
        disabled={!canEndGame}
      >
        <Flag className="h-4 w-4" />
        End Game
      </Button>

      {/* <Button variant="ghost" size="sm" onClick={onSetPosition}>
        <LayoutGrid className="h-4 w-4" />
        Set Position
      </Button> */}

      {/* <TrainDropdown
        onOpenPuzzles={onOpenPuzzles}
        onOpenOpeningDrill={onOpenOpeningDrill}
        onOpenEndgame={onOpenEndgame}
        onOpenOpeningStats={onOpenOpeningStats}
        clockEnabled={clockEnabled}
        clockTimeControl={clockTimeControl}
        onToggleClock={onToggleClock}
        onSetTimeControl={onSetTimeControl}
      /> */}
    </div>

    {/* Right — dark mode + settings */}
    <div className="shrink-0" />
  </div>
);

export default ControlBar;
