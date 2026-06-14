import {
  BarChart3,
  Brain,
  CheckCircle2,
  Flame,
  ListChecks,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const STORAGE_KEY = "chess-daily-routine-progress";

const TASKS = [
  {
    id: "warmup",
    title: "Scout the Board",
    duration: "5 min",
    xp: 50,
    action: "Start Vision",
    target: "vision",
    icon: Target,
    detail: "Hit a quick coordinate drill and wake up your board vision.",
  },
  {
    id: "tactics",
    title: "Tactics Dungeon",
    duration: "15 min",
    xp: 150,
    action: "Enter Quizzes",
    target: "tactics",
    icon: Swords,
    detail: "Solve slowly. Calculate the full line before making a move.",
  },
  {
    id: "game",
    title: "Ranked Battle",
    duration: "15 min",
    xp: 150,
    action: "Play Game",
    target: "play",
    icon: ShieldCheck,
    detail: "Play one meaningful game. Avoid blitz habits and make plans.",
  },
  {
    id: "review",
    title: "Boss Review",
    duration: "10 min",
    xp: 100,
    action: "Review Game",
    target: "review",
    icon: Brain,
    detail: "Find the single move that taught you the most today.",
  },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDay = (dateKey) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
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
  for (let offset = count - 1; offset >= 0; offset -= 1) {
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
  const completedTasks = TASKS.filter((task) => todayProgress[task.id]);
  const completedCount = completedTasks.length;
  const totalXp = TASKS.reduce((sum, task) => sum + task.xp, 0);
  const earnedXp = completedTasks.reduce((sum, task) => sum + task.xp, 0);
  const percent = Math.round((earnedXp / totalXp) * 100);
  const level = Math.max(1, Math.floor(earnedXp / 100) + 1);

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-secondary/30 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-normal">
                Daily Quest
              </h2>
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                Level {level}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDay(currentDay)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-2 text-right">
            <p className="text-2xl font-black tabular-nums">{earnedXp}</p>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              XP earned
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Quest progress</span>
            <span>
              {completedCount}/{TASKS.length} missions
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {TASKS.map((task) => {
            const done = Boolean(todayProgress[task.id]);
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className={`rounded-lg border p-4 transition-colors ${
                  done
                    ? "border-emerald-500/35 bg-emerald-500/10"
                    : "border-border bg-card hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                        : "border-primary/25 bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {task.title}
                        </p>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {task.duration} · {task.xp} XP
                        </p>
                      </div>
                      <Checkbox
                        checked={done}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {task.detail}
                    </p>
                    <Button
                      size="sm"
                      variant={done ? "outline" : "default"}
                      className="mt-3 h-8 text-xs"
                      onClick={() => onStartTask?.(task.target)}
                    >
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      {task.action}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">Streak Map</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {recentDays.map((day) => {
                const count = TASKS.filter(
                  (task) => progress[day]?.[task.id],
                ).length;
                const dayPercent = Math.round((count / TASKS.length) * 100);
                return (
                  <div key={day} className="text-center">
                    <div className="flex h-20 items-end rounded-md border border-border bg-card px-1.5 py-1.5">
                      <div
                        className="w-full rounded-sm bg-primary"
                        style={{ height: `${Math.max(8, dayPercent)}%` }}
                        title={`${formatDay(day)}: ${count}/${TASKS.length}`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                      {formatDay(day).slice(0, 3)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-bold">Daily Rule</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Before every tactic, name the candidate moves first. Then move
              only after you can explain the full line.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">
                Finish all missions to complete today&apos;s quest.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border bg-card p-3">
        <Button variant="outline" onClick={resetToday}>
          <RotateCcw className="h-4 w-4" />
          Reset Quest
        </Button>
        <Button onClick={() => onStartTask?.("vision")}>
          <ListChecks className="h-4 w-4" />
          Start Quest
        </Button>
      </div>
    </div>
  );
};

export default DailyRoutinePanel;
