import {
  Bot,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  Gamepad2,
  GraduationCap,
  ScanEye,
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
    id: "daily",
    label: "Daily",
    icon: CalendarCheck,
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
  {
    id: "vision",
    label: "Vision",
    icon: ScanEye,
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
  <aside className="flex flex-col border-b border-sidebar-border bg-sidebar px-2 py-2 text-sidebar-foreground shadow-sm lg:border-b-0 lg:border-r lg:px-3 lg:py-4">
    <div
      className={`mb-4 hidden items-center gap-2 lg:flex ${
        collapsed ? "justify-center" : "justify-between"
      }`}
    >
      <div
        className={`min-w-0 items-center gap-2 ${collapsed ? "hidden" : "flex"}`}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-4 tracking-normal">
            Ai Chess Trainer
          </p>
          <p className="truncate text-[11px] font-medium leading-4 text-muted-foreground">
            Chess coach
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        title={collapsed ? "Expand game modes" : "Collapse game modes"}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
      </button>
    </div>
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            title={collapsed ? mode.label : undefined}
            className={`group relative flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors lg:h-11 ${
              collapsed ? "lg:px-0" : "lg:justify-start lg:px-2.5"
            } ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                active
                  ? "bg-primary-foreground/16 text-primary-foreground"
                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
              {mode.label}
            </span>
          </button>
        );
      })}
    </nav>
    <div
      className={`mt-2 flex items-center gap-1 border-t border-sidebar-border/70 pt-2 lg:mt-auto lg:pt-3 ${
        collapsed ? "lg:flex-col" : "lg:justify-between"
      }`}
    >
      <span
        className={`hidden text-[11px] font-semibold uppercase tracking-normal text-muted-foreground lg:block ${
          collapsed ? "lg:hidden" : ""
        }`}
      >
        Options
      </span>
      <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleDarkMode}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
      </div>
    </div>
  </aside>
);

export default ModeRail;

