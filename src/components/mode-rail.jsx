import {
  Bot,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Gamepad2,
  GraduationCap,
  ScanEye,
  Moon,
  BookOpenCheck,
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
    id: "training",
    label: "Training",
    icon: GraduationCap,
  },
  {
    id: "tutorials",
    label: "Tutorials",
    icon: BookOpenCheck,
  },
  {
    id: "database",
    label: "Database",
    icon: Database,
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
  <aside className="flex flex-row items-center gap-1 border-b border-sidebar-border bg-sidebar px-2 py-2 text-sidebar-foreground shadow-sm lg:flex-col lg:items-stretch lg:gap-0 lg:border-b-0 lg:border-r lg:px-3 lg:py-4">
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
    <nav
      aria-label="Training modes"
      className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto lg:flex-none lg:flex-col lg:gap-1.5 lg:overflow-visible"
    >
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            title={collapsed ? mode.label : undefined}
            aria-current={active ? "page" : undefined}
            className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-11 lg:flex-row lg:gap-2 lg:px-3 lg:py-0 lg:text-sm ${
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
            <span
              className={`max-w-full truncate leading-tight ${collapsed ? "lg:hidden" : ""}`}
            >
              {mode.label}
            </span>
          </button>
        );
      })}
    </nav>
    <div
      className={`flex shrink-0 flex-col items-center gap-0.5 border-l border-sidebar-border/70 pl-1 lg:mt-auto lg:flex-row lg:gap-1 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-3 ${
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
      <div className="flex flex-col items-center gap-0.5 lg:flex-row lg:gap-1">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9 lg:w-9"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
          }
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9 lg:w-9"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  </aside>
);

export default ModeRail;
