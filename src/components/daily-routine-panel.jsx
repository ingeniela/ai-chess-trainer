import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const STORAGE_KEY = "chess-daily-routine-progress";

const TASKS = [
  {
    id: "warmup",
    title: "Warm-up",
    duration: "5 mins",
    action: "Start Board Vision",
    target: "vision",
    detail:
      "Do basic tactical puzzles or a board vision coordinate drill to activate your brain.",
  },
  {
    id: "tactics",
    title: "Targeted Tactics",
    duration: "15 mins",
    action: "Open Puzzles",
    target: "tactics",
    detail:
      "Solve puzzles slowly. Do not move until you calculate the full sequence in your head.",
  },
  {
    id: "game",
    title: "Play One Meaningful Game",
    duration: "15 mins",
    action: "Go to Play",
    target: "play",
    detail:
      "Play one rapid game, 10 to 15 minutes per side. Avoid blitz and bullet for improvement work.",
  },
  {
    id: "review",
    title: "AI Game Review",
    duration: "10 mins",
    action: "Open Engine Review",
    target: "review",
    detail:
      "Review the game, find the single most instructive moment, and write it down.",
  },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDay = (dateKey) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));

const readProgress = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getRecentDays = (count = 7) => {
  const days = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
};

const DailyRoutinePanel = ({ onStartTask }) => {
  const [progress, setProgress] = useState(readProgress);
  const currentDay = todayKey();
  const todayProgress = progress[currentDay] || {};
  const completedCount = TASKS.filter((task) => todayProgress[task.id]).length;
  const percent = Math.round((completedCount / TASKS.length) * 100);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const recentDays = useMemo(() => getRecentDays(), []);

  const toggleTask = (taskId) => {
    setProgress((previous) => ({
      ...previous,
      [currentDay]: {
        ...(previous[currentDay] || {}),
        [taskId]: !(previous[currentDay] || {})[taskId],
      },
    }));
  };

  const resetToday = () => {
    setProgress((previous) => ({
      ...previous,
      [currentDay]: {},
    }));
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Daily Routine</h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          A simple improvement loop: warm up, calculate, play slowly, then
          review one instructive moment.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="rounded-md border border-border bg-secondary/30 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Today
              </p>
              <p className="text-sm font-semibold">{formatDay(currentDay)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums">{percent}%</p>
              <p className="text-[11px] text-muted-foreground">
                {completedCount}/{TASKS.length} done
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {TASKS.map((task) => {
            const done = Boolean(todayProgress[task.id]);
            return (
              <div
                key={task.id}
                className={`rounded-md border px-3 py-3 transition-colors ${
                  done
                    ? "border-emerald-500/35 bg-emerald-500/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {task.duration}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {task.detail}
                    </p>
                    <button
                      type="button"
                      onClick={() => onStartTask?.(task.target)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {task.action}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border border-border px-3 py-3">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Last 7 days</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {recentDays.map((day) => {
              const count = TASKS.filter((task) => progress[day]?.[task.id])
                .length;
              const dayPercent = Math.round((count / TASKS.length) * 100);
              return (
                <div key={day} className="text-center">
                  <div className="flex h-16 items-end rounded bg-secondary/40 px-1">
                    <div
                      className="w-full rounded-sm bg-primary/80"
                      style={{ height: `${Math.max(8, dayPercent)}%` }}
                      title={`${formatDay(day)}: ${count}/${TASKS.length}`}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDay(day).split(" ")[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold">Rule for today</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            For tactics, calculate the full line before touching the board.
            Accuracy matters more than speed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
        <Button variant="outline" onClick={resetToday}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button onClick={() => onStartTask?.("vision")}>
          <ListChecks className="h-4 w-4" />
          Start
        </Button>
      </div>
    </div>
  );
};

export default DailyRoutinePanel;
