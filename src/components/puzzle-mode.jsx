import { Chess } from "chess.js";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  ListChecks,
  SkipForward,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";

import { Button } from "@/components/ui/button";
import {
  loadQuizByFile,
  loadQuizCatalog,
  shuffleQuizEntries,
} from "@/lib/puzzle-quizzes";

const DIFFICULTY_STYLE = {
  easy: "bg-lime-300/20 text-lime-100 border-lime-300/30",
  medium: "bg-amber-300/20 text-amber-100 border-amber-300/30",
  hard: "bg-red-300/20 text-red-100 border-red-300/30",
};

const THEME_ICON = {
  checkmate: "K",
  fork: "N",
  pin: "B",
  skewer: "R",
  discovered: "*",
  deflection: "D",
  "back-rank": "R",
  hanging: "Q",
  promotion: "P",
};

const TEACHER_MESSAGE = {
  idle: "Start with forcing moves: checks, captures, and threats. I will react after each attempt.",
  "correct-step": "Good. Keep calculating the forced line after the reply.",
  wrong:
    "That misses the tactic. Look for loose pieces, overloaded defenders, or king exposure.",
  solved: "Excellent. You found the tactic and completed the problem.",
  revealed:
    "Study the highlighted solution. Focus on why the first move forces the rest.",
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#242421] text-white">
    Loading challenges...
  </div>
);

const ErrorOverlay = ({ loadError, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#242421] p-4">
    <div className="max-w-md rounded-xl bg-card p-5 text-sm text-foreground">
      <p className="font-semibold">Challenge load failed</p>
      <p className="mt-2 text-muted-foreground">
        {loadError || "No puzzles available."}
      </p>
      <Button onClick={onClose} className="mt-4 w-full">
        Close
      </Button>
    </div>
  </div>
);

const ChallengeHeader = ({ onClose, puzzle, puzzleIndex, quizEntries }) => (
  <header className="flex items-center justify-between bg-[#143719] px-7 py-5">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-700/80 text-2xl font-black shadow-lg">
        {THEME_ICON[puzzle.theme] ?? "P"}
      </div>
      <div>
        <h2 className="text-3xl font-bold leading-none">Problems</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-lime-200/70">
          Puzzle {puzzleIndex + 1} / {quizEntries.length}
        </p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      title="Close challenges"
    >
      <X className="h-4 w-4" />
    </button>
  </header>
);

const TeacherBubble = ({ status }) => (
  <div className="mb-6 flex items-start gap-3">
    <div className="mt-5 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-900/70">
      <GraduationCap className="h-11 w-11 text-lime-100" />
    </div>
    <div className="relative rounded-xl bg-white px-5 py-4 text-slate-900 shadow-lg">
      <div className="absolute left-[-10px] top-7 h-0 w-0 border-y-8 border-r-[12px] border-y-transparent border-r-white" />
      <p className="text-base font-semibold leading-snug">
        {TEACHER_MESSAGE[status] || TEACHER_MESSAGE.idle}
      </p>
    </div>
  </div>
);

/**
 * Renders the challenge/puzzle board with a teacher sidebar.
 */
export default function PuzzleMode({ onClose, initialDifficulty = null }) {
  const [quizEntries, setQuizEntries] = useState([]);
  const [catalogState, setCatalogState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ solved: 0, failed: 0 });
  const [chess, setChess] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [fen, setFen] = useState("");
  const [solutionStep, setSolutionStep] = useState(0);
  const [status, setStatus] = useState("idle");
  const [wrongMoves, setWrongMoves] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [arrows, setArrows] = useState([]);
  const [lastMoveSquares, setLastMoveSquares] = useState({});
  const engineTimeoutReference = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setCatalogState("loading");
      setLoadError("");
      try {
        const data = await loadQuizCatalog();
        if (cancelled) return;
        const filtered = initialDifficulty
          ? data.items.filter((entry) => entry.difficulty === initialDifficulty)
          : data.items;
        setQuizEntries(shuffleQuizEntries(filtered));
        setPuzzleIndex(0);
        setCatalogState("ready");
      } catch (error) {
        if (cancelled) return;
        setCatalogState("error");
        setLoadError(
          error instanceof Error ? error.message : "Failed to load quizzes.",
        );
      }
    };

    loadCatalog();
    return () => {
      cancelled = true;
      clearTimeout(engineTimeoutReference.current);
    };
  }, [initialDifficulty]);

  useEffect(() => {
    const entry = quizEntries[puzzleIndex];
    if (!entry) return undefined;

    let cancelled = false;

    const loadPuzzle = async () => {
      clearTimeout(engineTimeoutReference.current);
      try {
        const nextPuzzle = await loadQuizByFile(entry.file);
        if (cancelled) return;
        const game = new Chess(nextPuzzle.fen);
        setPuzzle(nextPuzzle);
        setChess(game);
        setFen(nextPuzzle.fen);
        setSolutionStep(0);
        setStatus("idle");
        setWrongMoves(0);
        setHintUsed(false);
        setArrows([]);
        setLastMoveSquares({});
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to open quiz.",
        );
      }
    };

    loadPuzzle();
    return () => {
      cancelled = true;
    };
  }, [puzzleIndex, quizEntries]);

  const playEngineMove = useCallback(
    (game, step) => {
      const solution = puzzle?.solution;
      if (!solution || step >= solution.length) return;

      const uci = solution[step];
      engineTimeoutReference.current = setTimeout(() => {
        try {
          const move = game.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: uci[4] || "q",
          });
          if (!move) return;
          setFen(game.fen());
          setLastMoveSquares({ [move.from]: true, [move.to]: true });
          setSolutionStep(step + 1);
          setStatus("idle");
          setArrows([]);
        } catch {
          /* ignore */
        }
      }, 550);
    },
    [puzzle],
  );

  const handleDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (!chess || !puzzle || !targetSquare) return false;
      if (status === "solved" || status === "revealed") return false;

      let move = null;
      try {
        move = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
      } catch {
        return false;
      }
      if (!move) return false;

      const expectedUci = puzzle.solution[solutionStep];
      const expectedFrom = expectedUci.slice(0, 2);
      const expectedTo = expectedUci.slice(2, 4);

      if (sourceSquare === expectedFrom && targetSquare === expectedTo) {
        setFen(chess.fen());
        setLastMoveSquares({ [sourceSquare]: true, [targetSquare]: true });
        setArrows([]);

        const nextStep = solutionStep + 1;
        if (nextStep >= puzzle.solution.length) {
          setStatus("solved");
          setSessionStats((stats) => ({ ...stats, solved: stats.solved + 1 }));
        } else {
          setStatus("correct-step");
          playEngineMove(chess, nextStep);
        }
        return true;
      }

      chess.undo();
      setWrongMoves((count) => count + 1);
      setStatus("wrong");
      setTimeout(
        () => setStatus((current) => (current === "wrong" ? "idle" : current)),
        1200,
      );
      return false;
    },
    [chess, puzzle, playEngineMove, solutionStep, status],
  );

  const handleHint = useCallback(() => {
    if (!puzzle) return;
    const uci = puzzle.solution[solutionStep];
    const from = uci?.slice(0, 2);
    const to = uci?.slice(2, 4);
    if (from && to) {
      setArrows([{ startSquare: from, endSquare: to, color: "#facc15" }]);
    }
    setHintUsed(true);
  }, [puzzle, solutionStep]);

  const handleReveal = useCallback(() => {
    if (!puzzle || !chess) return;
    setSessionStats((stats) => ({ ...stats, failed: stats.failed + 1 }));
    const solutionArrows = [];
    for (const uci of puzzle.solution.slice(solutionStep)) {
      try {
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        chess.move({ from, to, promotion: uci[4] || "q" });
        solutionArrows.push({
          startSquare: from,
          endSquare: to,
          color: "#86efac",
        });
      } catch {
        /* ignore */
      }
    }
    setFen(chess.fen());
    setLastMoveSquares({});
    setArrows(solutionArrows);
    setStatus("revealed");
  }, [chess, puzzle, solutionStep]);

  const goNext = useCallback(() => {
    clearTimeout(engineTimeoutReference.current);
    if (puzzleIndex < quizEntries.length - 1) {
      setPuzzleIndex((index) => index + 1);
    }
  }, [puzzleIndex, quizEntries.length]);

  const goPrevious = useCallback(() => {
    clearTimeout(engineTimeoutReference.current);
    if (puzzleIndex > 0) setPuzzleIndex((index) => index - 1);
  }, [puzzleIndex]);

  const boardOrientation = useMemo(() => {
    if (!puzzle?.fen) return "white";
    return new Chess(puzzle.fen).turn() === "w" ? "white" : "black";
  }, [puzzle]);

  const squareStyles = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(lastMoveSquares).map((square) => [
          square,
          { backgroundColor: "rgba(250, 204, 21, 0.42)" },
        ]),
      ),
    [lastMoveSquares],
  );

  if (catalogState === "loading" || (catalogState === "ready" && !puzzle)) {
    return <LoadingOverlay />;
  }

  if (catalogState === "error") {
    return <ErrorOverlay loadError={loadError} onClose={onClose} />;
  }

  const progressPercent = Math.round(
    (solutionStep / Math.max(1, puzzle.solution.length)) * 100,
  );
  const canAct =
    status === "idle" || status === "wrong" || status === "correct-step";

  return (
    <div className="fixed inset-0 z-50 bg-[#242421] p-2">
      <div className="grid h-full grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_570px]">
        <main className="flex min-h-0 items-center justify-center overflow-hidden bg-[#1f1f1d] p-1">
          <div className="w-full max-w-[min(calc(100vh-24px),calc(100vw-600px))]">
            <Chessboard
              options={{
                id: "challenge-board",
                position: fen,
                onPieceDrop: handleDrop,
                boardOrientation,
                allowDragging: status !== "solved" && status !== "revealed",
                boardStyle: { borderRadius: "0px" },
                darkSquareStyle: { backgroundColor: "#739954" },
                lightSquareStyle: { backgroundColor: "#ecefce" },
                squareStyles,
                arrows,
                showNotation: true,
                clearArrowsOnPositionChange: false,
              }}
            />
          </div>
        </main>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-sm bg-[#163f1f] text-white">
          <ChallengeHeader
            onClose={onClose}
            puzzle={puzzle}
            puzzleIndex={puzzleIndex}
            quizEntries={quizEntries}
          />

          <section className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(135deg,rgba(255,255,255,.04)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.04)_50%,rgba(255,255,255,.04)_75%,transparent_75%,transparent)] bg-[length:120px_120px] p-7">
            <TeacherBubble status={status} />

            <div className="mb-5 rounded-2xl bg-black/20 p-4 shadow-inner">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      DIFFICULTY_STYLE[puzzle.difficulty] ||
                      DIFFICULTY_STYLE.easy
                    }`}
                  >
                    {puzzle.difficulty} - {puzzle.theme}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">{puzzle.title}</h3>
                </div>
                <GraduationCap className="h-6 w-6 text-lime-200" />
              </div>
              <p className="text-sm leading-relaxed text-white/80">
                {puzzle.description}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-lime-400/15 p-3">
                <div className="flex items-center gap-2 text-lime-100">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Solved</span>
                </div>
                <p className="mt-1 text-2xl font-black">
                  {sessionStats.solved}
                </p>
              </div>
              <div className="rounded-xl bg-red-400/15 p-3">
                <div className="flex items-center gap-2 text-red-100">
                  <ListChecks className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase">Missed</span>
                </div>
                <p className="mt-1 text-2xl font-black">
                  {sessionStats.failed}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>Line progress</span>
                <span>
                  {solutionStep}/{puzzle.solution.length}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-lime-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 text-sm font-semibold ${
                status === "solved"
                  ? "border-lime-300/50 bg-lime-300/15 text-lime-100"
                  : status === "wrong"
                    ? "border-red-300/50 bg-red-500/20 text-red-50"
                    : status === "correct-step"
                      ? "border-sky-300/50 bg-sky-500/20 text-sky-50"
                      : status === "revealed"
                        ? "border-yellow-300/50 bg-yellow-500/20 text-yellow-50"
                        : "border-white/15 bg-black/20 text-white/75"
              }`}
            >
              {status === "idle" && "Find the best move on the board."}
              {status === "correct-step" && "Good move. Continue the line."}
              {status === "wrong" && `Incorrect attempt #${wrongMoves}.`}
              {status === "solved" && "Solved. Nice calculation."}
              {status === "revealed" && "Solution revealed on the board."}
            </div>
          </section>

          <footer className="border-t border-white/10 bg-[#1b4a24] p-7">
            <div className="mb-5 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrevious}
                disabled={puzzleIndex === 0}
                className="bg-black/20 text-white hover:bg-black/30 hover:text-white"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goNext}
                disabled={puzzleIndex >= quizEntries.length - 1}
                className="ml-auto bg-black/20 text-white hover:bg-black/30 hover:text-white"
              >
                Skip
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {canAct ? (
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <Button
                  variant="ghost"
                  onClick={handleHint}
                  className="h-14 bg-white/10 text-lime-100 hover:bg-white/15 hover:text-white"
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {hintUsed ? "Hint shown" : "Hint"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReveal}
                  className="h-14 bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Reveal
                </Button>
              </div>
            ) : (
              <Button
                onClick={goNext}
                disabled={puzzleIndex >= quizEntries.length - 1}
                className="h-16 w-full bg-[#70b548] text-lg font-black text-white shadow-lg hover:bg-[#7fc653]"
              >
                <ChevronRight className="mr-2 h-5 w-5" />
                {puzzleIndex >= quizEntries.length - 1
                  ? "All problems done"
                  : "Next problem"}
              </Button>
            )}
          </footer>
        </aside>
      </div>
    </div>
  );
}
