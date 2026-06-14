import { Chess } from "chess.js";
import {
  ArrowLeftRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Check,
  ChevronLeft,
  GraduationCap,
  Info,
  ListChecks,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  loadTutorialByFile,
  loadTutorialCatalog,
  normalizeSan,
} from "@/lib/opening-tutorials";
import { TYPE_TUTORIAL } from "@/lib/progress";
import useProgressStore from "@/store/use-progress-store";

const CAT_STYLE = {
  open: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "semi-open": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  closed: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  flank: "text-green-400 bg-green-500/10 border-green-500/20",
};

const Badge = ({ label, className }) => (
  <span
    className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${className}`}
  >
    {label}
  </span>
);

const BEGINNER_LESSONS = [
  {
    title: "The board and coordinates",
    fen: "8/8/8/8/8/8/8/4K2k w - - 0 1",
    summary:
      "Chess is played on 64 squares. Files run a-h from White's left to right, and ranks run 1-8 from White's side upward.",
    ideas: [
      "White starts on ranks 1 and 2; Black starts on ranks 8 and 7.",
      "A square name combines file and rank, like e4 or g7.",
      "Every move is easier to learn when you can name the starting and ending squares.",
    ],
  },
  {
    title: "How the pieces move",
    fen: "4k3/8/8/3q4/3N4/8/8/4K3 w - - 0 1",
    summary:
      "Each piece has a movement pattern. Rooks move straight, bishops move diagonally, queens do both, knights jump in an L shape, kings move one square, and pawns move forward.",
    ideas: [
      "Knights are the only pieces that jump over other pieces.",
      "Long-range pieces are strongest on open lines.",
      "Before moving, ask what your piece attacks after it lands.",
    ],
  },
  {
    title: "Check, checkmate, and stalemate",
    fen: "7k/6pp/8/8/8/8/6PP/6KQ w - - 0 1",
    summary:
      "Check means the king is attacked. Checkmate means the king is attacked and has no legal escape. Stalemate means the player is not in check but has no legal move.",
    ideas: [
      "When in check, you must move the king, block the attack, or capture the attacker.",
      "A checkmate controls the king's square and every escape square.",
      "Do not accidentally stalemate a helpless king when you are winning.",
    ],
  },
  {
    title: "Opening goals",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 1",
    summary:
      "The opening is not about memorizing moves first. It is about reaching a playable position with active pieces and a safe king.",
    ideas: [
      "Fight for the center with pawns and pieces.",
      "Develop knights and bishops before moving the same piece repeatedly.",
      "Castle early when the center may open.",
    ],
  },
  {
    title: "Captures and material",
    fen: "4k3/8/8/4q3/3N4/8/8/4K3 w - - 0 1",
    summary:
      "Material is the value of your army. Pawns are worth about 1, knights and bishops 3, rooks 5, and queens 9, but activity and king safety can matter more.",
    ideas: [
      "Do not capture automatically; check if the piece is defended.",
      "Winning a queen for a knight is usually a huge gain.",
      "A forcing move with check can be stronger than a simple capture.",
    ],
  },
  {
    title: "Basic tactics",
    fen: "8/8/4k3/5q2/8/8/2N5/4K3 w - - 0 1",
    summary:
      "Tactics are short forcing sequences. The core patterns are forks, pins, skewers, discovered attacks, deflections, and back-rank mates.",
    ideas: [
      "Always scan checks, captures, and threats first.",
      "A fork attacks two targets at once.",
      "A pin or skewer uses a line piece to exploit what stands behind the target.",
    ],
  },
  {
    title: "Simple plans",
    fen: "7k/8/8/3p4/3P4/2N2N2/PPP2PPP/4K3 w - - 0 1",
    summary:
      "A plan is a small goal for the next few moves. Improve the worst piece, challenge the center, create a passed pawn, or attack a weakness.",
    ideas: [
      "If there is no tactic, improve your least active piece.",
      "Pawns create space but also leave squares behind.",
      "A weakness is a pawn or square that is hard to defend.",
    ],
  },
  {
    title: "Endgame basics",
    fen: "8/8/8/4k3/4P3/4K3/8/8 w - - 0 1",
    summary:
      "Endgames reward king activity and pawn knowledge. The king becomes a fighting piece once queens and many pieces are gone.",
    ideas: [
      "Bring your king toward the center and toward passed pawns.",
      "Passed pawns must be pushed, supported, and sometimes used as decoys.",
      "Opposition means using your king to take key squares from the enemy king.",
    ],
  },
];

const buildCorrectionArrow = (fen, san) => {
  try {
    const preview = new Chess(fen);
    const move = preview.move(san);
    if (!move) return [];

    return [
      {
        startSquare: move.from,
        endSquare: move.to,
        color: "#22c55e",
      },
    ];
  } catch {
    return [];
  }
};

const TrainingOpeningTutorialPanel = ({
  onBoardUpdate,
  onRegisterMoveHandler,
  onBack,
}) => {
  const [phase, setPhase] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [solveFilter, setSolveFilter] = useState("all"); // "all" | "solved" | "unsolved"
  const [catalog, setCatalog] = useState([]);
  const [catalogState, setCatalogState] = useState("loading");
  const [catalogError, setCatalogError] = useState("");
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState(null);
  const [tutorialError, setTutorialError] = useState("");
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [tutorialSection, setTutorialSection] = useState("zero");
  const [beginnerLessonIndex, setBeginnerLessonIndex] = useState(0);

  const { fetchProgress, isSolved, solveItem, getSolvedCount } =
    useProgressStore();

  const chessReference = useRef(new Chess());
  const opponentTimerReference = useRef(null);
  const wrongMoveTimerReference = useRef(null);

  const beginnerLesson = BEGINNER_LESSONS[beginnerLessonIndex];

  const pushBoardState = useCallback(
    (arrows = [], orientation = boardOrientation) => {
      onBoardUpdate({
        fen: chessReference.current.fen(),
        orientation,
        arrows,
        isTrainingActive: true,
      });
    },
    [boardOrientation, onBoardUpdate],
  );

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setCatalogState("loading");
      setCatalogError("");

      try {
        const data = await loadTutorialCatalog();
        if (cancelled) return;
        setCatalog(data.items);
        setCatalogState("ready");
      } catch (error) {
        if (cancelled) return;
        setCatalogState("error");
        setCatalogError(
          error instanceof Error ? error.message : "Failed to load tutorials.",
        );
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
      clearTimeout(opponentTimerReference.current);
      clearTimeout(wrongMoveTimerReference.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "list") return;

    onRegisterMoveHandler(null);

    if (tutorialSection === "zero") {
      onBoardUpdate({
        fen: beginnerLesson.fen,
        orientation: "white",
        arrows: [],
        isTrainingActive: true,
      });
      return;
    }

    onBoardUpdate({
      fen: null,
      orientation: "white",
      arrows: [],
      isTrainingActive: false,
    });
  }, [
    beginnerLesson.fen,
    onBoardUpdate,
    onRegisterMoveHandler,
    phase,
    tutorialSection,
  ]);

  useEffect(() => {
    const loadProgress = async () => {
      await fetchProgress();
    };
    loadProgress();
  }, [fetchProgress]);

  const resetTutorial = useCallback(
    (tutorial) => {
      clearTimeout(opponentTimerReference.current);
      clearTimeout(wrongMoveTimerReference.current);
      chessReference.current = new Chess();
      setSelectedTutorial(tutorial);
      setCurrentStepIndex(0);
      setStatus("idle");
      setTutorialError("");
      setBoardOrientation(tutorial.defaultOrientation ?? "white");
      setFeedback({
        type: "info",
        text:
          tutorial.steps[0]?.instruction ||
          tutorial.summary ||
          "Follow the tutorial step by step.",
      });

      onBoardUpdate({
        fen: chessReference.current.fen(),
        orientation: tutorial.defaultOrientation ?? "white",
        arrows: [],
        isTrainingActive: true,
      });
    },
    [onBoardUpdate],
  );

  const openTutorial = useCallback(
    async (entry) => {
      try {
        const tutorial = await loadTutorialByFile(entry.file);
        resetTutorial(tutorial);
        setPhase("training");
      } catch (error) {
        setTutorialError(
          error instanceof Error ? error.message : "Failed to open tutorial.",
        );
      }
    },
    [resetTutorial],
  );

  const currentStep = selectedTutorial?.steps[currentStepIndex] ?? null;
  const previousStep =
    selectedTutorial && currentStepIndex > 0
      ? selectedTutorial.steps[currentStepIndex - 1]
      : null;

  useEffect(() => {
    clearTimeout(opponentTimerReference.current);

    if (
      phase !== "training" ||
      !selectedTutorial ||
      !currentStep ||
      currentStep.actor !== "opponent"
    ) {
      return undefined;
    }

    setStatus("opponent");
    setFeedback({
      type: "info",
      text:
        currentStep.instruction ||
        `${selectedTutorial.side === "black" ? "White" : "Black"} demonstrates ${currentStep.san}.`,
    });

    opponentTimerReference.current = setTimeout(() => {
      try {
        const move = chessReference.current.move(currentStep.san);
        if (!move) {
          throw new Error(`Illegal tutorial move: ${currentStep.san}`);
        }

        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        pushBoardState(currentStep.arrows ?? []);

        if (nextIndex >= selectedTutorial.steps.length) {
          setStatus("complete");
          setFeedback({
            type: "success",
            text: selectedTutorial.completionSummary || "Tutorial complete.",
          });
          if (selectedTutorial?.id) {
            solveItem(selectedTutorial.id, TYPE_TUTORIAL);
          }
          return;
        }

        setStatus("idle");
      } catch (error) {
        setTutorialError(
          error instanceof Error
            ? error.message
            : "Failed to continue the tutorial.",
        );
      }
    }, 900);

    return () => clearTimeout(opponentTimerReference.current);
  }, [
    currentStep,
    currentStepIndex,
    phase,
    pushBoardState,
    selectedTutorial,
    solveItem,
  ]);

  const handleTrainingMove = useCallback(
    (from, to) => {
      const game = chessReference.current;
      if (
        !game ||
        !selectedTutorial ||
        !currentStep ||
        currentStep.actor !== "player" ||
        status === "complete"
      ) {
        return false;
      }

      try {
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;

        if (normalizeSan(move.san) === currentStep.san) {
          const nextIndex = currentStepIndex + 1;
          setCurrentStepIndex(nextIndex);
          pushBoardState(currentStep.arrows ?? []);
          setFeedback({
            type: "info",
            text:
              currentStep.coaching ||
              currentStep.instruction ||
              `Correct: ${currentStep.san}`,
          });

          if (nextIndex >= selectedTutorial.steps.length) {
            setStatus("complete");
            setFeedback({
              type: "success",
              text: selectedTutorial.completionSummary || "Tutorial complete.",
            });
            if (selectedTutorial?.id) {
              solveItem(selectedTutorial.id, TYPE_TUTORIAL);
            }
          } else {
            setStatus("idle");
          }

          return true;
        }

        game.undo();
        setStatus("wrong");
        setFeedback({
          type: "error",
          text:
            currentStep.hint ||
            `Not quite. Find ${currentStep.san} and follow the plan.`,
        });
        pushBoardState(buildCorrectionArrow(game.fen(), currentStep.san));

        clearTimeout(wrongMoveTimerReference.current);
        wrongMoveTimerReference.current = setTimeout(() => {
          setStatus((value) => (value === "wrong" ? "idle" : value));
          pushBoardState(currentStep.arrows ?? []);
        }, 2000);
        return false;
      } catch {
        return false;
      }
    },
    [
      currentStep,
      currentStepIndex,
      pushBoardState,
      selectedTutorial,
      status,
      solveItem,
    ],
  );

  useEffect(() => {
    if (phase !== "training") {
      onRegisterMoveHandler(null);
      return () => onRegisterMoveHandler(null);
    }

    onRegisterMoveHandler(handleTrainingMove);
    return () => onRegisterMoveHandler(null);
  }, [handleTrainingMove, onRegisterMoveHandler, phase]);

  const handleBackToList = () => {
    clearTimeout(opponentTimerReference.current);
    clearTimeout(wrongMoveTimerReference.current);
    onRegisterMoveHandler(null);
    onBoardUpdate({
      fen: null,
      orientation: "white",
      arrows: [],
      isTrainingActive: false,
    });
    setPhase("list");
    setSelectedTutorial(null);
    setCurrentStepIndex(0);
    setStatus("idle");
    setTutorialError("");
  };

  const displayed = catalog
    .filter((entry) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return [entry.title, entry.eco, entry.summary, ...(entry.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((entry) => {
      if (solveFilter === "all") return true;
      if (solveFilter === "solved") return isSolved(entry.id, TYPE_TUTORIAL);
      if (solveFilter === "unsolved") return !isSolved(entry.id, TYPE_TUTORIAL);
      return true;
    });

  const solvedCount = getSolvedCount(TYPE_TUTORIAL);

  if (phase === "list") {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-150">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Tutorials</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {tutorialSection === "zero"
              ? `${BEGINNER_LESSONS.length} lessons`
              : `${catalog.length} tutorials`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 border-b border-border p-2">
          {[
            {
              key: "zero",
              label: "Learn chess from zero",
              icon: GraduationCap,
            },
            { key: "openings", label: "Opening Tutorials", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTutorialSection(key)}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold transition-colors ${
                tutorialSection === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {tutorialSection === "zero" && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-primary">
                  Learn chess from zero
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Start here if you are new to chess. Each lesson changes the
                board and gives you the exact ideas to remember before you move
                into tactics, openings, and endgames.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {BEGINNER_LESSONS.map((lesson, index) => (
                <button
                  key={lesson.title}
                  type="button"
                  onClick={() => setBeginnerLessonIndex(index)}
                  className={`rounded-md border px-2 py-2 text-left transition-colors ${
                    beginnerLessonIndex === index
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted/50"
                  }`}
                >
                  <span className="block text-[10px] font-mono text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold">
                    {lesson.title}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {beginnerLesson.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {beginnerLesson.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {beginnerLesson.ideas.map((idea) => (
                  <div key={idea} className="flex gap-2 text-[11px]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="leading-relaxed text-muted-foreground">
                      {idea}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={beginnerLessonIndex === 0}
                onClick={() =>
                  setBeginnerLessonIndex((index) => Math.max(0, index - 1))
                }
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Previous
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() =>
                  setBeginnerLessonIndex((index) =>
                    Math.min(BEGINNER_LESSONS.length - 1, index + 1),
                  )
                }
                disabled={beginnerLessonIndex === BEGINNER_LESSONS.length - 1}
              >
                Next Lesson
              </Button>
            </div>
          </div>
        )}

        {tutorialSection === "openings" && (
          <>
            <div className="px-3 py-2 border-b border-border shrink-0 space-y-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tutorials..."
                className="w-full bg-muted/50 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  The library is loaded from `/public/tutorial/*.json` so you
                  can keep adding curated lessons.
                </p>
                <div className="flex gap-1 shrink-0">
                  {[
                    { key: "all", label: "All" },
                    { key: "unsolved", label: "To Learn" },
                    { key: "solved", label: "Done" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSolveFilter(key)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                        solveFilter === key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {label}
                      {key === "solved" && solvedCount > 0 && (
                        <span className="ml-1 text-primary/60">
                          ({solvedCount})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-2 py-2 space-y-1.5">
              {catalogState === "loading" && (
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  Loading tutorial library...
                </div>
              )}

              {catalogState === "error" && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                  {catalogError}
                </div>
              )}

              {tutorialError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                  {tutorialError}
                </div>
              )}

              {displayed.map((entry) => {
                const solved = isSolved(entry.id, TYPE_TUTORIAL);
                return (
                  <button
                    key={entry.id}
                    onClick={() => openTutorial(entry)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-primary/60">
                            {entry.eco}
                          </span>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {entry.title}
                          </p>
                          {solved && (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {entry.summary}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                          <span className="rounded border border-border px-1.5 py-0.5">
                            Play as {entry.side}
                          </span>
                          <span className="rounded border border-border px-1.5 py-0.5">
                            {entry.stepCount} steps
                          </span>
                          <span className="rounded border border-border px-1.5 py-0.5 capitalize">
                            {entry.difficulty}
                          </span>
                        </div>
                      </div>
                      <Badge
                        label={entry.category}
                        className={
                          CAT_STYLE[entry.category] ||
                          "text-muted-foreground bg-muted/30 border-border"
                        }
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const totalSteps = selectedTutorial?.steps.length ?? 0;
  const progressPct =
    totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : 0;
  const progressMoves =
    selectedTutorial?.steps.slice(0, currentStepIndex) ?? [];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
        <button
          onClick={handleBackToList}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <BookOpen className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">
            {selectedTutorial?.title}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {selectedTutorial?.eco} · Play as {selectedTutorial?.side}
          </p>
        </div>
        <button
          onClick={() => {
            const nextOrientation =
              boardOrientation === "white" ? "black" : "white";
            setBoardOrientation(nextOrientation);
            pushBoardState([], nextOrientation);
          }}
          className="text-muted-foreground hover:text-foreground"
          title="Flip board"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>
            Step {Math.min(currentStepIndex + 1, totalSteps || 1)} of{" "}
            {totalSteps}
          </span>
          <span className="text-primary font-medium">{progressPct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {feedback && (
          <div
            className={`rounded-xl p-3 text-xs leading-relaxed border ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : feedback.type === "error"
                  ? "bg-red-950/40 border-red-500/40 text-red-300"
                  : "bg-muted/40 border-border text-foreground/80"
            }`}
          >
            {feedback.type === "success" && (
              <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />
            )}
            {feedback.type === "error" && (
              <XCircle className="h-3.5 w-3.5 inline mr-1.5" />
            )}
            {feedback.type === "info" && (
              <Info className="h-3.5 w-3.5 inline mr-1.5" />
            )}
            {feedback.text}
          </div>
        )}

        <div className="rounded-xl p-3 bg-muted/30 border border-border space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold text-cyan-400">
              Tutorial Overview
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {selectedTutorial?.description}
          </p>
        </div>

        {currentStep && status !== "complete" && (
          <div className="rounded-xl p-3 bg-muted/30 border border-border space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                {currentStep.actor === "player" ? "Your move" : "Coach move"}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {currentStep.san}
              </span>
            </div>
            <p className="text-[11px] text-foreground/90 leading-relaxed">
              {currentStep.title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {currentStep.coaching || currentStep.instruction}
            </p>
          </div>
        )}

        {progressMoves.length > 0 && (
          <div className="rounded-xl p-3 bg-muted/20 border border-border space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Script progress
            </p>
            <div className="flex flex-wrap gap-1">
              {progressMoves.map((step, index) => (
                <span
                  key={`${index}-${step.actor}-${step.san}`}
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                    step.actor === "player"
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground"
                  }`}
                >
                  {Math.floor(index / 2) + 1}
                  {index % 2 === 0 ? ". " : "... "}
                  {step.san}
                </span>
              ))}
            </div>
          </div>
        )}

        {previousStep && status !== "complete" && (
          <div className="rounded-xl p-3 bg-muted/20 border border-border space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Last move explained
            </p>
            <p className="text-[11px] text-foreground/90 leading-relaxed">
              {previousStep.title} · {previousStep.san}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {previousStep.coaching || previousStep.instruction}
            </p>
          </div>
        )}

        {status === "complete" && (
          <div className="rounded-xl p-3 bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-[11px] font-semibold text-yellow-400">
                {selectedTutorial?.completionTitle || "Tutorial complete"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {selectedTutorial?.completionSummary}
            </p>
          </div>
        )}

        {selectedTutorial?.objectives?.length > 0 && (
          <div className="rounded-xl p-3 bg-muted/20 border border-border space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Objectives
            </p>
            {selectedTutorial.objectives.map((objective) => (
              <p
                key={objective}
                className="text-[11px] text-muted-foreground leading-relaxed"
              >
                {objective}
              </p>
            ))}
          </div>
        )}

        {selectedTutorial?.plans?.length > 0 && (
          <div className="rounded-xl p-3 bg-muted/20 border border-border space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Core plans
            </p>
            {selectedTutorial.plans.map((plan) => (
              <p
                key={plan}
                className="text-[11px] text-muted-foreground leading-relaxed"
              >
                {plan}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-border shrink-0 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={() => selectedTutorial && resetTutorial(selectedTutorial)}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restart
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={handleBackToList}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Tutorial Library
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingOpeningTutorialPanel;
