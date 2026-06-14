import { Crosshair, Eye, RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

const BoardVisionPanel = ({
  card,
  score,
  attempts,
  streak,
  bestStreak,
  feedback,
  onNext,
  onReset,
}) => {
  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Board Vision Drills</h2>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Build the board map by finding coordinates quickly without counting
          files.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-secondary/30 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Score
            </p>
            <p className="text-lg font-bold tabular-nums">{score}</p>
          </div>
          <div className="rounded-md border border-border bg-secondary/30 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Accuracy
            </p>
            <p className="text-lg font-bold tabular-nums">{accuracy}%</p>
          </div>
          <div className="rounded-md border border-border bg-secondary/30 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Streak
            </p>
            <p className="text-lg font-bold tabular-nums">{streak}</p>
          </div>
        </div>

        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Crosshair className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">
              Current flashcard
            </span>
          </div>

          <p className="text-sm text-muted-foreground">Find this square</p>
          <p className="mt-2 font-mono text-4xl font-black tracking-normal">
            {card.square}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Click the matching coordinate on the empty board.
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              feedback.correct
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="rounded-md border border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">Best streak</span>
            <span className="ml-auto font-mono text-sm font-bold">
              {bestStreak}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Fast coordinate recognition helps when reading notation, following
            engine lines, and visualizing future moves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button onClick={onNext}>Next Card</Button>
      </div>
    </div>
  );
};

export default BoardVisionPanel;
