import { Gamepad2, GraduationCap, Puzzle } from "lucide-react";

const MODES = [
  {
    id: "play",
    label: "Play",
    icon: Gamepad2,
  },
  {
    id: "challenges",
    label: "Challenges",
    icon: Puzzle,
  },
  {
    id: "training",
    label: "Training",
    icon: GraduationCap,
  },
];

const ModeRail = ({ activeMode, onModeChange }) => (
  <aside className="border-b border-border bg-card px-2 py-2 lg:border-b-0 lg:border-r lg:py-3">
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors lg:h-12 lg:justify-start ${
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 lg:h-5 lg:w-5 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span className="truncate">{mode.label}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);

export default ModeRail;
