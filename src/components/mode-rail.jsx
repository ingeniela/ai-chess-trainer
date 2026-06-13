import {
  ChevronsLeft,
  ChevronsRight,
  Gamepad2,
  GraduationCap,
  Moon,
  Puzzle,
  Settings,
  Sun,
} from "lucide-react";

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

const ModeRail = ({
  activeMode,
  collapsed,
  isDarkMode,
  onModeChange,
  onOpenSettings,
  onToggleDarkMode,
  onToggleCollapsed,
}) => (
  <aside className="flex flex-col border-b border-border bg-card px-2 py-2 lg:border-b-0 lg:border-r lg:py-3">
    <div className="mb-2 hidden items-center justify-end lg:flex">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={collapsed ? "Expand game modes" : "Collapse game modes"}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
      </button>
    </div>
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            title={collapsed ? mode.label : undefined}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors lg:h-12 ${
              collapsed ? "lg:px-0" : "lg:justify-start"
            } ${
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
            <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
              {mode.label}
            </span>
          </button>
        );
      })}
    </nav>
    <div
      className={`mt-2 flex items-center gap-1 border-t border-border/60 pt-2 lg:mt-auto ${
        collapsed ? "lg:flex-col" : "lg:justify-end"
      }`}
    >
      <button
        type="button"
        onClick={onToggleDarkMode}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  </aside>
);

export default ModeRail;
