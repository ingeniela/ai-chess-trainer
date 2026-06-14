/* eslint-disable max-lines-per-function */
import { Chess } from "chess.js";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

import BlunderReviewMode from "@/components/blunder-review-mode";
import BoardPanel, { playSound } from "@/components/board-panel";
import BoardVisionPanel from "@/components/board-vision-panel";
import ChatPanel from "@/components/chat-panel";
import ControlBar from "@/components/control-bar";
import DailyRoutinePanel from "@/components/daily-routine-panel";
import DatabasePanel from "@/components/database-panel";
import EndgameMode from "@/components/endgame-mode";
import GameReportDialog from "@/components/game-report-dialog";
import ModeRail from "@/components/mode-rail";
import MoveHistorySidebar from "@/components/move-history-sidebar";
import OpeningDrillMode from "@/components/opening-drill-mode";
import OpeningStatsPanel from "@/components/opening-stats-panel";
import PositionSetupDialog from "@/components/position-setup-dialog";
import PuzzleMode from "@/components/puzzle-mode";
import SettingsDialog from "@/components/settings-dialog";
import TrainingOpeningTutorialPanel from "@/components/training-opening-tutorial-panel";
import TrainingPanel from "@/components/training-panel";
import useAiChat from "@/hooks/use-ai-chat";
import { useChessClock, TIME_CONTROLS } from "@/hooks/use-chess-clock";
import useDarkMode from "@/hooks/use-dark-mode";
import useEngineCoach from "@/hooks/use-engine-coach";
import { getBotProfile } from "@/lib/bot-profiles";
import { migrateMoveHistory } from "@/lib/chess-helpers";
import { autoSave, loadAutoSave, saveGame } from "@/lib/db";
import { getBestMove } from "@/lib/engine";
import { recordOpeningResult, detectOpening } from "@/lib/opening-stats";
import { OPENINGS } from "@/lib/openings";
import {
  getStockfishEngine,
  destroyStockfishEngine,
  StockfishEngine,
} from "@/lib/stockfish";

// ── Local helpers ─────────────────────────────────────────────────────────────
const EMPTY_BOARD_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";
const BOARD_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BOARD_RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const createVisionCard = () => {
  const square = `${BOARD_FILES[Math.floor(Math.random() * 8)]}${
    BOARD_RANKS[Math.floor(Math.random() * 8)]
  }`;
  return {
    square,
    type: "coordinate",
  };
};

const getApiKey = () => localStorage.getItem("chess-coach-api-key") || "";
const getTextApiKey = () =>
  localStorage.getItem("chess-ai-provider") === "openrouter"
    ? localStorage.getItem("chess-openrouter-api-key") || ""
    : getApiKey();

const getGameResult = (game) => {
  if (!game.isGameOver()) return null;
  if (game.isDraw()) return "draw";
  if (game.isCheckmate()) return game.turn() === "w" ? "black" : "white";
  return "draw";
};

const getPlayerResult = (gameResult, playerColor) => {
  if (!gameResult) return null;
  if (gameResult === "draw") return "draw";
  const playerSide = playerColor === "black" ? "black" : "white";
  return gameResult === playerSide ? "win" : "loss";
};

const getStoredBoardColors = () => ({
  light: localStorage.getItem("chess-board-light") || "#edeed1",
  dark: localStorage.getItem("chess-board-dark") || "#779952",
});

const getStoredRightSidebarCollapsed = () =>
  localStorage.getItem("chess-right-sidebar-collapsed") === "true";

const getStoredMessages = () => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("chess-chat-messages") || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeCastlingTarget = (game, sourceSquare, targetSquare) => {
  if (!sourceSquare || !targetSquare) return targetSquare;

  const king = game.get(sourceSquare);
  const rook = game.get(targetSquare);
  if (
    !king ||
    !rook ||
    king.type !== "k" ||
    rook.type !== "r" ||
    king.color !== rook.color ||
    sourceSquare[1] !== targetSquare[1]
  ) {
    return targetSquare;
  }

  const destinationFile =
    targetSquare[0] === "h" ? "g" : targetSquare[0] === "a" ? "c" : null;
  if (!destinationFile) return targetSquare;

  const destination = `${destinationFile}${sourceSquare[1]}`;
  const canCastle = game
    .moves({ square: sourceSquare, verbose: true })
    .some((move) => move.to === destination);

  return canCastle ? destination : targetSquare;
};

// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const gameReference = useRef(new Chess());
  const [fen, setFen] = useState(gameReference.current.fen());
  const [messages, setMessages] = useState(getStoredMessages);
  const [moveHistory, setMoveHistory] = useState([]); // { san, fen, from, to }[]
  const [redoHistory, setRedoHistory] = useState([]);
  const [viewIndex, setViewIndex] = useState(null);
  const [previewMoveIndex, setPreviewMoveIndex] = useState(null);
  const viewIndexReference = useRef(null);
  useEffect(() => {
    viewIndexReference.current = viewIndex;
  }, [viewIndex]);

  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [moveQuality, setMoveQuality] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState(null);
  const [evalScore, setEvalScore] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [boardColors, setBoardColors] = useState(getStoredBoardColors);
  const [activeMode, setActiveMode] = useState("play");
  const [visionCard, setVisionCard] = useState(createVisionCard);
  const [visionScore, setVisionScore] = useState(0);
  const [visionAttempts, setVisionAttempts] = useState(0);
  const [visionStreak, setVisionStreak] = useState(0);
  const [visionBestStreak, setVisionBestStreak] = useState(0);
  const [visionFeedback, setVisionFeedback] = useState(null);
  const [visionSelection, setVisionSelection] = useState(null);
  const [modeRailCollapsed, setModeRailCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(
    getStoredRightSidebarCollapsed,
  );

  useEffect(() => {
    try {
      localStorage.setItem("chess-chat-messages", JSON.stringify(messages));
    } catch {
      /* ignore storage quota/private mode failures */
    }
  }, [messages]);

  useEffect(() => {
    document.documentElement.lang =
      localStorage.getItem("chess-language") || "en";

    const handleSettingsUpdate = () => {
      setBoardColors(getStoredBoardColors());
      document.documentElement.lang =
        localStorage.getItem("chess-language") || "en";
    };

    window.addEventListener("chess-settings-updated", handleSettingsUpdate);
    return () =>
      window.removeEventListener(
        "chess-settings-updated",
        handleSettingsUpdate,
      );
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "chess-right-sidebar-collapsed",
      String(rightSidebarCollapsed),
    );
  }, [rightSidebarCollapsed]);

  const [opponent, setOpponent] = useState("engine");
  const [difficulty, setDifficulty] = useState("club");
  const [playerColor, setPlayerColor] = useState("white");
  const playerColorReference = useRef(playerColor);
  useEffect(() => {
    playerColorReference.current = playerColor;
  }, [playerColor]);
  const opponentReference = useRef(opponent);
  useEffect(() => {
    opponentReference.current = opponent;
  }, [opponent]);
  const triggerAIMoveReference = useRef(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const effectiveViewIndex =
    previewMoveIndex === null ? viewIndex : previewMoveIndex;

  // ── Dark mode ────────────────────────────────────────────────────────────
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // ── Review mode ──────────────────────────────────────────────────────────
  const displayGame = useMemo(() => {
    if (effectiveViewIndex === null) return gameReference.current;
    const g = new Chess();
    if (effectiveViewIndex < 0) return g;
    const entry = moveHistory[effectiveViewIndex];
    if (entry?.fen) g.load(entry.fen);
    return g;
  }, [effectiveViewIndex, moveHistory]);

  const displayLastMoveSquares = useMemo(() => {
    if (effectiveViewIndex === null) return lastMoveSquares;
    if (effectiveViewIndex < 0) return null;
    const entry = moveHistory[effectiveViewIndex];
    return entry ? { from: entry.from, to: entry.to } : null;
  }, [effectiveViewIndex, moveHistory, lastMoveSquares]);

  // ── Training board state (declared early — used in displayBoardGame memo) ───
  // Shape: { fen: string|null, orientation: string, arrows: [], isTrainingActive: bool }
  const [bestMoveArrows, setBestMoveArrows] = useState([]);
  const [previewArrows, setPreviewArrows] = useState([]);
  const [previewSquares, setPreviewSquares] = useState([]);
  const [previewFen, setPreviewFen] = useState(null);
  const [trainingBoard, setTrainingBoard] = useState({
    fen: null,
    orientation: "white",
    arrows: [],
    isTrainingActive: false,
  });
  // Ref to training move handler set by TrainingPanel
  const trainingHandlerReference = useRef(null);

  // ── Training display overrides ────────────────────────────────────────────
  // When learning mode is on and a training scenario is loaded, override the
  // board with the training position.
  const emptyBoardGame = useMemo(
    () => new Chess(EMPTY_BOARD_FEN, { skipValidation: true }),
    [],
  );

  const displayBoardGame = useMemo(() => {
    if (activeMode === "vision") return emptyBoardGame;
    if (trainingBoard.isTrainingActive && trainingBoard.fen) {
      const g = new Chess();
      try {
        g.load(trainingBoard.fen);
      } catch {
        /* ignore */
      }
      return g;
    }
    if (previewFen) {
      const g = new Chess();
      try {
        g.load(previewFen);
      } catch {
        /* ignore */
      }
      return g;
    }
    return displayGame;
  }, [
    activeMode,
    emptyBoardGame,
    trainingBoard.isTrainingActive,
    trainingBoard.fen,
    previewFen,
    displayGame,
  ]);

  const displayBoardOrientation = trainingBoard.isTrainingActive
    ? trainingBoard.orientation
    : boardOrientation;

  const displayBoardArrows = trainingBoard.isTrainingActive
    ? trainingBoard.arrows
    : activeMode === "vision"
      ? []
      : previewArrows.length > 0
        ? previewArrows
        : bestMoveArrows;

  const visionPreviewSquares = useMemo(() => {
    if (activeMode !== "vision" || !visionSelection?.square) return [];
    const isCorrect = visionSelection.correct;
    return [
      {
        square: visionSelection.square,
        background: isCorrect
          ? "radial-gradient(circle, rgba(34, 197, 94, 0.42) 55%, rgba(34, 197, 94, 0.2) 56%)"
          : "radial-gradient(circle, rgba(239, 68, 68, 0.42) 55%, rgba(239, 68, 68, 0.2) 56%)",
        boxShadow: isCorrect
          ? "inset 0 0 0 4px rgba(34, 197, 94, 0.65), 0 0 16px rgba(34, 197, 94, 0.35)"
          : "inset 0 0 0 4px rgba(239, 68, 68, 0.65), 0 0 16px rgba(239, 68, 68, 0.35)",
      },
    ];
  }, [activeMode, visionSelection]);

  const displayPreviewSquares =
    activeMode === "vision" ? visionPreviewSquares : previewSquares;

  const displayBoardLastMove = trainingBoard.isTrainingActive
    ? null
    : activeMode === "vision"
      ? null
      : displayLastMoveSquares;

  const aiTimeoutReference = useRef(null);
  const autoSaveTimerReference = useRef(null);
  const completedGameSaveReference = useRef(null);
  const [positionSetupOpen, setPositionSetupOpen] = useState(false);

  // ── Game report ──────────────────────────────────────────────────────────
  const [gameReport, setGameReport] = useState(null);
  const [gameReportOpen, setGameReportOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [blunderReviewOpen, setBlunderReviewOpen] = useState(false);

  // ── Training modes ───────────────────────────────────────────────────────
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [openingDrillOpen, setOpeningDrillOpen] = useState(false);
  const [endgameOpen, setEndgameOpen] = useState(false);
  const [openingStatsOpen, setOpeningStatsOpen] = useState(false);
  const [trainingInitialModule, setTrainingInitialModule] = useState(null);

  // ── Chess clock ──────────────────────────────────────────────────────────
  const [clockEnabled, setClockEnabled] = useState(false);
  const [clockTimeControl, setClockTimeControl] = useState(TIME_CONTROLS[2]);

  // ── Annotations ──────────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState({});

  // ── Premove ──────────────────────────────────────────────────────────────
  const [premove, setPremove] = useState(null);
  const premoveReference = useRef(null);
  useEffect(() => {
    premoveReference.current = premove;
  }, [premove]);

  // ── Coach mode ───────────────────────────────────────────────────────────
  const [coachMode, setCoachMode] = useState("engine");
  const coachModeReference = useRef(coachMode);
  useEffect(() => {
    coachModeReference.current = coachMode;
  }, [coachMode]);
  const isLiveModeReference = useRef(isLiveMode);
  useEffect(() => {
    isLiveModeReference.current = isLiveMode;
  }, [isLiveMode]);

  // ── Chess clock hook ─────────────────────────────────────────────────────
  const clock = useChessClock({
    enabled: clockEnabled,
    timeControlMs: clockTimeControl?.time ?? 180_000,
    incrementMs: clockTimeControl?.inc ?? 2000,
    currentTurn: gameReference.current.turn(),
    isGameOver: gameReference.current.isGameOver(),
    isReviewMode: viewIndex !== null,
  });
  const clockReference = useRef(clock);
  useEffect(() => {
    clockReference.current = clock;
  });

  // ── Engine coach ─────────────────────────────────────────────────────────
  const {
    applyEvalScore,
    updateEvalBar,
    engineLiveAnalyzePlayerMove,
    runThreatDetection,
    handleEngineAnalyze,
    handleEngineBestMove,
    handleEngineHint,
    handleThinkLikeGM,
    triggerPostGameAnalysis,
    isAnalyzingRef,
  } = useEngineCoach({
    gameRef: gameReference,
    setMessages,
    setEvalScore,
    setIsLoading,
    setBestMoveArrows,
    setPreviewSquares,
    setIsAnalyzing,
    setAnalysisProgress,
    setGameReport,
    setGameReportOpen,
  });

  // ── AI board action callbacks (used by Google Gemini agent) ─────────────
  const handleAISetPosition = useCallback((newFen) => {
    try {
      const game = new Chess();
      game.load(newFen);
      gameReference.current = game;
      setFen(game.fen());
      setMoveHistory([]);
      setRedoHistory([]);
      setLastMoveSquares(null);
      setBestMoveArrows([]);
      setPreviewArrows([]);
      setPreviewSquares([]);
      setPreviewFen(null);
      setPreviewMoveIndex(null);
    } catch {
      // ignore invalid FEN from AI
    }
  }, []);

  const handleAIMakeMove = useCallback((san) => {
    try {
      const move = gameReference.current.move(san);
      if (move) {
        setRedoHistory([]);
        const newFen = gameReference.current.fen();
        setFen(newFen);
        setMoveHistory((previous) => [
          ...previous,
          {
            san: move.san,
            fen: newFen,
            from: move.from,
            to: move.to,
          },
        ]);
        setLastMoveSquares({ from: move.from, to: move.to });
        // Trigger opponent to respond
        if (
          opponentReference.current !== "manual" &&
          !gameReference.current.isGameOver() &&
          triggerAIMoveReference.current
        ) {
          const historyForEngine = gameReference.current
            .history({ verbose: true })
            .map((m) => ({ san: m.san, fen: m.after, from: m.from, to: m.to }));
          setTimeout(
            () => triggerAIMoveReference.current(newFen, historyForEngine),
            150,
          );
        }
      }
    } catch {
      // ignore invalid move from AI
    }
  }, []);

  const handleAIFlipBoard = useCallback((orientation) => {
    setBoardOrientation(orientation);
  }, []);

  // ── AI chat ──────────────────────────────────────────────────────────────
  const {
    handleSendMessage,
    evaluateLastMove,
    handleAskAI,
    handleLearnWithAI,
    tokenStats,
  } = useAiChat({
    gameRef: gameReference,
    messages,
    setMessages,
    setIsLoading,
    setMoveQuality,
    setCoachMode,
    boardActions: {
      setPosition: handleAISetPosition,
      makeMove: handleAIMakeMove,
      flipBoard: handleAIFlipBoard,
    },
  });

  // ── Auto-load last auto-save on mount ────────────────────────────────────
  useEffect(() => {
    loadAutoSave()
      .then((saved) => {
        if (!saved?.pgn || !saved?.moveHistory?.length) return;
        // eslint-disable-next-line promise/always-return
        try {
          const game = new Chess();
          game.loadPgn(saved.pgn);
          gameReference.current = game;
          setFen(game.fen());
          setMoveHistory(migrateMoveHistory(saved.moveHistory));
          setRedoHistory([]);
          if (saved.boardOrientation) {
            setBoardOrientation(saved.boardOrientation);
          }
          if (saved.opponent) {
            setOpponent(saved.opponent);
          }
          if (saved.difficulty) {
            setDifficulty(getBotProfile(saved.difficulty).id);
          }
          if (saved.playerColor) {
            setPlayerColor(saved.playerColor);
          }
          const hist = game.history({ verbose: true });
          if (hist.length > 0) {
            const last = hist.at(-1);
            setLastMoveSquares({ from: last.from, to: last.to });
          }
          setTimeout(() => {
            const sf = getStockfishEngine();
            sf.analyze(game.fen(), 10, 1)
              // eslint-disable-next-line promise/no-nesting
              .then((result) => applyEvalScore(result, game.fen()))
              // eslint-disable-next-line promise/no-nesting
              .catch(() => {});
          }, 800);
        } catch (error) {
          console.error("Failed to restore auto-save:", error);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save debounced 500 ms ───────────────────────────────────────────
  useEffect(() => {
    if (moveHistory.length === 0) return;
    clearTimeout(autoSaveTimerReference.current);
    autoSaveTimerReference.current = setTimeout(() => {
      autoSave({
        fen: gameReference.current.fen(),
        pgn: gameReference.current.pgn(),
        moveHistory,
        opponent,
        difficulty,
        boardOrientation,
        playerColor,
        name: `Auto-save · ${moveHistory.length} moves`,
      }).catch(console.error);
    }, 500);
  }, [fen, moveHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const game = gameReference.current;
    if (!game.isGameOver() || moveHistory.length === 0) return;

    const pgn = game.pgn();
    if (!pgn || completedGameSaveReference.current === pgn) return;

    const gameResult = getGameResult(game);
    const playerResult =
      opponent === "manual" ? null : getPlayerResult(gameResult, playerColor);
    const label =
      playerResult === "win"
        ? "Win"
        : playerResult === "loss"
          ? "Loss"
          : gameResult === "draw"
            ? "Draw"
            : gameResult === "white"
              ? "White won"
              : "Black won";

    completedGameSaveReference.current = pgn;
    saveGame({
      fen: game.fen(),
      pgn,
      moveHistory,
      opponent,
      difficulty,
      boardOrientation,
      playerColor,
      gameResult,
      playerResult,
      name: `${label} · ${moveHistory.length} moves · ${new Date().toLocaleDateString()}`,
      completedAt: Date.now(),
      isAutomaticRecord: true,
    }).catch((error) => {
      completedGameSaveReference.current = null;
      console.error("Failed to save completed game:", error);
    });
  }, [boardOrientation, difficulty, fen, moveHistory, opponent, playerColor]);

  // ── Load a saved game ────────────────────────────────────────────────────
  const handleLoadGame = useCallback(
    (saved) => {
      clearTimeout(aiTimeoutReference.current);
      destroyStockfishEngine();
      try {
        const game = new Chess();
        if (saved.pgn) game.loadPgn(saved.pgn);
        else if (saved.fen) game.load(saved.fen);
        completedGameSaveReference.current = game.isGameOver()
          ? game.pgn()
          : null;
        gameReference.current = game;
        setFen(game.fen());
        setMoveHistory(migrateMoveHistory(saved.moveHistory || []));
        setRedoHistory([]);
        setMoveQuality(null);
        setMessages([]);
        setIsAIThinking(false);
        setPreviewFen(null);
        setPreviewArrows([]);
        setEvalScore(null);
        setGameReport(null);
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setBlunderReviewOpen(false);
        isAnalyzingRef.current = false;
        setPremove(null);
        premoveReference.current = null;
        setAnnotations({});
        if (saved.boardOrientation) setBoardOrientation(saved.boardOrientation);
        if (saved.opponent) setOpponent(saved.opponent);
        if (saved.difficulty) setDifficulty(getBotProfile(saved.difficulty).id);
        if (saved.playerColor) setPlayerColor(saved.playerColor);
        const hist = game.history({ verbose: true });
        if (hist.length > 0) {
          const last = hist.at(-1);
          setLastMoveSquares({ from: last.from, to: last.to });
        } else {
          setLastMoveSquares(null);
        }
        const loadedFen = game.fen();
        setTimeout(() => {
          getStockfishEngine()
            .analyze(loadedFen, 10, 1)
            .then((result) => applyEvalScore(result, loadedFen))
            .catch(() => {});
        }, 500);
      } catch (error) {
        console.error("Failed to load saved game:", error);
      }
    },
    [applyEvalScore, isAnalyzingRef],
  );

  // ── Trigger AI/engine opponent move ──────────────────────────────────────
  const triggerAIMove = useCallback(
    async (currentFen, currentHistory) => {
      clearTimeout(aiTimeoutReference.current);
      setIsAIThinking(true);

      const executeMove = async () => {
        try {
          const game = gameReference.current;
          if (game.fen() !== currentFen) return;

          let uciFrom, uciTo, uciPromotion;

          if (opponent === "engine") {
            const sf = getStockfishEngine();
            const uciMove = await sf.getMove(currentFen, difficulty);
            if (!uciMove) return;
            const parsed = StockfishEngine.uciToMove(uciMove);
            if (!parsed) return;
            uciFrom = parsed.from;
            uciTo = parsed.to;
            uciPromotion = parsed.promotion;
          } else {
            const san = getBestMove(currentFen, difficulty);
            if (!san) return;
            const temporaryGame = new Chess(currentFen);
            const mv = temporaryGame.move(san);
            if (!mv) return;
            uciFrom = mv.from;
            uciTo = mv.to;
            uciPromotion = mv.promotion;
          }

          if (game.fen() !== currentFen) return;

          const move = game.move({
            from: uciFrom,
            to: uciTo,
            promotion: uciPromotion,
          });
          if (!move) return;

          const newHistory = [
            ...currentHistory,
            { san: move.san, fen: game.fen(), from: move.from, to: move.to },
          ];
          setFen(game.fen());
          setMoveHistory(newHistory);
          setLastMoveSquares({ from: move.from, to: move.to });
          clockReference.current.addIncrement(move.color);

          if (game.isCheckmate() || game.isStalemate() || game.isDraw()) {
            playSound("end");
            const gameResult = game.isCheckmate() ? move.color : "d";
            const openingMatch = detectOpening(
              newHistory.map((m) => m.san),
              OPENINGS,
            );
            if (openingMatch) {
              recordOpeningResult({
                eco: openingMatch.eco,
                name: openingMatch.name,
                gameResult,
                playerColor: playerColorReference.current[0],
              });
            }
            setTimeout(() => triggerPostGameAnalysis(newHistory), 1200);
          } else if (game.inCheck()) {
            playSound("check");
          } else if (move.captured) {
            playSound("capture");
          } else {
            playSound("move");
          }

          if (
            isLiveModeReference.current &&
            coachModeReference.current === "engine"
          ) {
            updateEvalBar(game.fen());
            runThreatDetection(
              game,
              move.color,
              move.to,
              move.san,
              newHistory.map((m) => m.san),
            );
          } else {
            updateEvalBar(game.fen());
            if (
              isLiveModeReference.current &&
              coachModeReference.current === "ai" &&
              getTextApiKey()
            ) {
              evaluateLastMove(
                move.san,
                game.fen(),
                newHistory.map((m) => m.san),
              );
            }
          }
        } catch (error) {
          console.error("Engine move error:", error);
        } finally {
          setIsAIThinking(false);
          const pm = premoveReference.current;
          if (pm && !gameReference.current.isGameOver()) {
            setPremove(null);
            premoveReference.current = null;
            setTimeout(
              () => handleMoveReference.current?.(pm.from, pm.to, pm.piece),
              60,
            );
          }
        }
      };

      if (opponent === "engine") {
        executeMove();
      } else {
        aiTimeoutReference.current = setTimeout(executeMove, 400);
      }
    },

    [
      difficulty,
      opponent,
      triggerPostGameAnalysis,
      updateEvalBar,
      runThreatDetection,
      evaluateLastMove,
    ],
  );

  // Keep triggerAIMoveReference in sync so handleAIMakeMove can call it
  useEffect(() => {
    triggerAIMoveReference.current = triggerAIMove;
  }, [triggerAIMove]);

  // ── Player color change ──────────────────────────────────────────────────
  const handlePlayerColorChange = useCallback(
    (color) => {
      if (moveHistory.length > 0) return;
      setPlayerColor(color);
      setBoardOrientation(color);
      if (color === "black" && opponent !== "manual") {
        setTimeout(() => triggerAIMove(gameReference.current.fen(), []), 150);
      }
    },
    [moveHistory.length, opponent, triggerAIMove],
  );

  // ── Review navigation ────────────────────────────────────────────────────
  const handleJumpToMove = useCallback((index) => {
    setPreviewMoveIndex(null);
    setViewIndex(index);
  }, []);
  const handleExitReview = useCallback(() => {
    setPreviewMoveIndex(null);
    setViewIndex(null);
  }, []);
  const handlePreviewHistoryMove = useCallback(
    (index) => {
      setPreviewFen(null);
      setPreviewSquares([]);
      setPreviewMoveIndex(index);
      const entry = moveHistory[index];
      if (entry?.from && entry?.to) {
        setPreviewArrows([
          {
            startSquare: entry.from,
            endSquare: entry.to,
            color: "#22c55e",
          },
        ]);
      }
    },
    [moveHistory],
  );
  const handleClearHistoryPreview = useCallback(() => {
    setPreviewMoveIndex(null);
    setPreviewFen(null);
    setPreviewArrows([]);
    setPreviewSquares([]);
  }, []);

  const handleNavigateBack = useCallback(() => {
    setViewIndex((previous) => {
      if (previous === null) {
        return moveHistory.length > 0 ? moveHistory.length - 1 : null;
      }
      return previous > 0 ? previous - 1 : -1;
    });
  }, [moveHistory.length]);

  const handleNavigateForward = useCallback(() => {
    setViewIndex((previous) => {
      if (previous === null) return null;
      const next = previous + 1;
      return next >= moveHistory.length ? null : next;
    });
  }, [moveHistory.length]);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleNavigateBack();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNavigateForward();
      } else if (
        event.key === "Escape" &&
        viewIndexReference.current !== null
      ) {
        handleExitReview();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNavigateBack, handleNavigateForward, handleExitReview]);

  // ── Reset training state when switching TO live mode ────────────────────
  useEffect(() => {
    if (
      isLiveMode ||
      (activeMode !== "training" && activeMode !== "tutorials")
    ) {
      trainingHandlerReference.current = null;
      setTrainingBoard({
        fen: null,
        orientation: "white",
        arrows: [],
        isTrainingActive: false,
      });
    }
  }, [isLiveMode, activeMode]);

  // ── Training board callbacks ─────────────────────────────────────────────
  const handleTrainingBoardUpdate = useCallback((state) => {
    setTrainingBoard({
      fen: state.fen ?? null,
      orientation: state.orientation ?? "white",
      arrows: state.arrows ?? [],
      isTrainingActive: state.isTrainingActive ?? false,
    });
  }, []);

  const handleRegisterMoveHandler = useCallback((function_) => {
    trainingHandlerReference.current = function_ ?? null;
  }, []);

  const handlePreviewLine = useCallback((startFen, moves, squares = []) => {
    if (!startFen || !Array.isArray(moves) || moves.length === 0) return;

    try {
      const previewGame = new Chess(startFen);
      const nextArrows = [];
      for (const [index, san] of moves.entries()) {
        const move = previewGame.move(san);
        if (!move) break;
        nextArrows.push({
          startSquare: move.from,
          endSquare: move.to,
          color: index === 0 ? "#22c55e" : "#60a5fa",
        });
      }
      setPreviewFen(previewGame.fen());
      setPreviewArrows(nextArrows);
      setPreviewSquares(squares);
    } catch {
      setPreviewFen(null);
      setPreviewArrows([]);
      setPreviewSquares([]);
    }
  }, []);

  const handlePreviewPosition = useCallback(
    (fen, arrows = [], squares = []) => {
      if (!fen) return;
      setPreviewFen(fen);
      setPreviewArrows(arrows);
      setPreviewSquares(squares);
    },
    [],
  );

  const handleClearPreviewLine = useCallback(() => {
    setPreviewFen(null);
    setPreviewArrows([]);
    setPreviewSquares([]);
  }, []);

  // ── Make a board move ────────────────────────────────────────────────────
  const handleMove = useCallback(
    (sourceSquare, targetSquare, piece) => {
      // ── Route to training handler when training is active ──
      if (trainingHandlerReference.current) {
        return Boolean(
          trainingHandlerReference.current(sourceSquare, targetSquare),
        );
      }

      const game = gameReference.current;
      const preFen = game.fen();
      const actualTargetSquare = normalizeCastlingTarget(
        game,
        sourceSquare,
        targetSquare,
      );

      if (viewIndexReference.current !== null) return false;

      // Queue if not player's turn
      if (
        opponent !== "manual" &&
        game.turn() !== playerColorReference.current[0]
      ) {
        const sourcePiece = game.get(sourceSquare);
        if (
          sourcePiece &&
          sourcePiece.color === playerColorReference.current[0]
        ) {
          let promotion;
          if (piece) {
            const isPawn = piece[1] === "P" || piece[1] === "p";
            const isLastRank =
              (piece[0] === "w" && actualTargetSquare[1] === "8") ||
              (piece[0] === "b" && actualTargetSquare[1] === "1");
            if (isPawn && isLastRank) promotion = "q";
          }
          const pm = {
            from: sourceSquare,
            to: actualTargetSquare,
            promotion,
            piece,
          };
          setPremove(pm);
          premoveReference.current = pm;
        }
        return false;
      }

      // Detect pawn promotion
      let promotion;
      if (piece) {
        const isPawn = piece[1] === "P" || piece[1] === "p";
        const isLastRank =
          (piece[0] === "w" && actualTargetSquare[1] === "8") ||
          (piece[0] === "b" && actualTargetSquare[1] === "1");
        if (isPawn && isLastRank) promotion = "q";
      } else {
        const p = game.get(sourceSquare);
        if (p?.type === "p") {
          const isLastRank =
            (p.color === "w" && actualTargetSquare[1] === "8") ||
            (p.color === "b" && actualTargetSquare[1] === "1");
          if (isLastRank) promotion = "q";
        }
      }

      let move = null;
      try {
        move = game.move({
          from: sourceSquare,
          to: actualTargetSquare,
          promotion,
        });
      } catch {
        return false;
      }
      if (!move) return false;

      setRedoHistory([]);
      setFen(game.fen());
      setMoveHistory((previous) => [
        ...previous,
        { san: move.san, fen: game.fen(), from: move.from, to: move.to },
      ]);
      setMoveQuality(null);
      setLastMoveSquares({ from: sourceSquare, to: actualTargetSquare });
      setBestMoveArrows([]);
      setPreviewArrows([]);
      setPreviewSquares([]);
      clockReference.current.addIncrement(move.color);
      setPremove(null);
      premoveReference.current = null;

      const newMoveHistory = [
        ...moveHistory,
        { san: move.san, fen: game.fen(), from: move.from, to: move.to },
      ];

      if (game.isCheckmate() || game.isStalemate() || game.isDraw()) {
        playSound("end");
        const playerGameResult = game.isCheckmate() ? move.color : "d";
        const openingMatchPlayer = detectOpening(
          newMoveHistory.map((m) => m.san),
          OPENINGS,
        );
        if (openingMatchPlayer) {
          recordOpeningResult({
            eco: openingMatchPlayer.eco,
            name: openingMatchPlayer.name,
            gameResult: playerGameResult,
            playerColor: playerColorReference.current[0],
          });
        }
        setTimeout(() => triggerPostGameAnalysis(newMoveHistory), 1200);
      } else if (game.inCheck()) {
        playSound("check");
      } else if (move.captured) {
        playSound("capture");
      } else {
        playSound("move");
      }

      const postFen = game.fen();

      if (isLiveMode && coachMode === "engine") {
        const playerAnalysis = engineLiveAnalyzePlayerMove(
          preFen,
          move.san,
          postFen,
          newMoveHistory.length,
        );
        if (opponent !== "manual" && !game.isGameOver()) {
          playerAnalysis
            .then(() => triggerAIMove(postFen, newMoveHistory))
            .catch(() => triggerAIMove(postFen, newMoveHistory));
        }
      } else {
        updateEvalBar(postFen);
        if (isLiveMode && coachMode === "ai" && getTextApiKey()) {
          evaluateLastMove(
            move.san,
            postFen,
            newMoveHistory.map((m) => m.san),
          );
        }
        if (opponent !== "manual" && !game.isGameOver()) {
          triggerAIMove(postFen, newMoveHistory);
        }
      }

      return move;
    },

    [
      isLiveMode,
      coachMode,
      moveHistory,
      opponent,
      triggerAIMove,
      triggerPostGameAnalysis,
      updateEvalBar,
      engineLiveAnalyzePlayerMove,
      evaluateLastMove,
    ],
  );

  const handleMoveReference = useRef(handleMove);
  useEffect(() => {
    handleMoveReference.current = handleMove;
  }, [handleMove]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    setViewIndex(null);
    setPreviewMoveIndex(null);
    setPreviewFen(null);
    setPreviewArrows([]);
    const game = gameReference.current;
    const lastEntry = moveHistory.at(-1);
    const undone = game.undo();
    if (undone) {
      setFen(game.fen());
      setMoveHistory((previous) => previous.slice(0, -1));
      if (lastEntry) {
        setRedoHistory((previous) => [lastEntry, ...previous]);
      }
      setMoveQuality(null);
      const history = game.history({ verbose: true });
      if (history.length > 0) {
        const last = history.at(-1);
        setLastMoveSquares({ from: last.from, to: last.to });
      } else {
        setLastMoveSquares(null);
      }
      playSound("move");
    }
  }, [moveHistory]);

  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0 || viewIndexReference.current !== null) return;

    const [nextEntry, ...remaining] = redoHistory;
    const game = gameReference.current;
    let move = null;
    try {
      move = game.move(nextEntry.san);
    } catch {
      move = null;
    }
    if (!move) {
      setRedoHistory(remaining);
      return;
    }

    const entry = {
      san: move.san,
      fen: game.fen(),
      from: move.from,
      to: move.to,
    };
    setRedoHistory(remaining);
    setFen(game.fen());
    setMoveHistory((previous) => [...previous, entry]);
    setMoveQuality(null);
    setLastMoveSquares({ from: move.from, to: move.to });
    setBestMoveArrows([]);
    setPreviewFen(null);
    setPreviewArrows([]);
    setPreviewSquares([]);
    playSound(move.captured ? "capture" : game.inCheck() ? "check" : "move");
    updateEvalBar(game.fen());
  }, [redoHistory, updateEvalBar]);

  // ── New game ─────────────────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    clearTimeout(aiTimeoutReference.current);
    destroyStockfishEngine();
    completedGameSaveReference.current = null;
    gameReference.current = new Chess();
    setFen(gameReference.current.fen());
    setMoveHistory([]);
    setRedoHistory([]);
    setViewIndex(null);
    setPreviewMoveIndex(null);
    setPreviewFen(null);
    setMoveQuality(null);
    setMessages([]);
    setLastMoveSquares(null);
    setIsAIThinking(false);
    setEvalScore(null);
    setBestMoveArrows([]);
    setPreviewArrows([]);
    setPreviewSquares([]);
    setGameReport(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setBlunderReviewOpen(false);
    isAnalyzingRef.current = false;
    clockReference.current.reset();
    setPremove(null);
    premoveReference.current = null;
    setAnnotations({});
    if (playerColorReference.current === "black" && opponent !== "manual") {
      setTimeout(() => triggerAIMove(gameReference.current.fen(), []), 150);
    }
  }, [opponent, triggerAIMove, isAnalyzingRef]);

  // ── Load position from FEN/PGN ───────────────────────────────────────────
  const handleLoadPosition = useCallback(
    ({ type, fen: loadFen, pgn, game: loadedGame }) => {
      clearTimeout(aiTimeoutReference.current);
      destroyStockfishEngine();
      try {
        const g = loadedGame || new Chess();
        if (!loadedGame) {
          if (type === "fen") g.load(loadFen);
          else if (type === "pgn") g.loadPgn(pgn);
        }
        completedGameSaveReference.current = g.isGameOver() ? g.pgn() : null;
        gameReference.current = g;
        setFen(g.fen());
        const hist = g.history({ verbose: true });
        const temporaryG = new Chess();
        const newHistory = hist.map((m) => {
          temporaryG.move(m);
          return { san: m.san, fen: temporaryG.fen(), from: m.from, to: m.to };
        });
        setMoveHistory(newHistory);
        setRedoHistory([]);
        setViewIndex(null);
        setPreviewMoveIndex(null);
        setPreviewFen(null);
        setBestMoveArrows([]);
        setPreviewArrows([]);
        setMoveQuality(null);
        setMessages([]);
        setIsAIThinking(false);
        setEvalScore(null);
        setGameReport(null);
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setBlunderReviewOpen(false);
        isAnalyzingRef.current = false;
        setPremove(null);
        premoveReference.current = null;
        setAnnotations({});
        if (hist.length > 0) {
          const last = hist.at(-1);
          setLastMoveSquares({ from: last.from, to: last.to });
        } else {
          setLastMoveSquares(null);
        }
        setPositionSetupOpen(false);
        if (g.isGameOver() && newHistory.length > 0) {
          setTimeout(() => triggerPostGameAnalysis(newHistory), 1200);
        }
      } catch (error) {
        console.error("Failed to load position:", error);
      }

      return true;
    },
    [triggerPostGameAnalysis, isAnalyzingRef],
  );

  // ── Copy PGN ─────────────────────────────────────────────────────────────
  const handleCopyPgn = useCallback(() => {
    navigator.clipboard
      .writeText(gameReference.current.pgn())
      .catch(console.error);
  }, []);

  // ── Annotation change ────────────────────────────────────────────────────
  const handleAnnotationChange = useCallback((index, text) => {
    setAnnotations((previous) => {
      if (!text) {
        const next = { ...previous };
        delete next[index];
        return next;
      }
      return { ...previous, [index]: text };
    });
  }, []);

  // ── Load endgame scenario ────────────────────────────────────────────────
  const handleLoadEndgameScenario = useCallback(
    ({ fen: scenarioFen, playerColor: pc }) => {
      setOpponent("engine");
      setPlayerColor(pc);
      setBoardOrientation(pc);
      handleLoadPosition({ type: "fen", fen: scenarioFen });
    },
    [handleLoadPosition],
  );

  // ── Pre-warm Stockfish ───────────────────────────────────────────────────
  const nextVisionCard = useCallback(() => {
    setVisionCard(createVisionCard());
    setVisionFeedback(null);
    setVisionSelection(null);
  }, []);

  const recordVisionAnswer = useCallback((square, correct, message) => {
    setVisionAttempts((value) => value + 1);
    setVisionFeedback({ correct, message });
    setVisionSelection({ square, correct });
    if (correct) {
      setVisionScore((value) => value + 1);
      setVisionStreak((value) => {
        const next = value + 1;
        setVisionBestStreak((best) => Math.max(best, next));
        return next;
      });
      window.setTimeout(() => {
        setVisionCard(createVisionCard());
        setVisionFeedback(null);
        setVisionSelection(null);
      }, 650);
    } else {
      setVisionStreak(0);
    }
  }, []);

  const handleVisionSquareSelect = useCallback(
    (square) => {
      if (visionCard.type !== "coordinate") return;
      const correct = square === visionCard.square;
      recordVisionAnswer(
        square,
        correct,
        correct
          ? `Correct: ${visionCard.square}.`
          : `Not ${square}. Find ${visionCard.square}.`,
      );
    },
    [recordVisionAnswer, visionCard],
  );

  const resetVisionDrill = useCallback(() => {
    setVisionCard(createVisionCard());
    setVisionScore(0);
    setVisionAttempts(0);
    setVisionStreak(0);
    setVisionBestStreak(0);
    setVisionFeedback(null);
    setVisionSelection(null);
  }, []);
  useEffect(() => {
    if (opponent === "engine") {
      getStockfishEngine().init().catch(console.error);
    }
  }, [opponent]);

  const handleModeChange = useCallback((mode) => {
    setActiveMode(mode);
    if (mode === "play") {
      setIsLiveMode(true);
      setPuzzleOpen(false);
      setTrainingInitialModule(null);
      return;
    }
    setIsLiveMode(false);
    setPuzzleOpen(false);
    setTrainingInitialModule(null);
  }, []);

  const handleStartRoutineTask = useCallback((target) => {
    setRightSidebarCollapsed(false);
    if (target === "vision") {
      setActiveMode("vision");
      setIsLiveMode(false);
      setPuzzleOpen(false);
      return;
    }
    if (target === "tactics") {
      setActiveMode("training");
      setIsLiveMode(false);
      setPuzzleOpen(false);
      setTrainingInitialModule("puzzle");
      return;
    }
    if (target === "review") {
      setActiveMode("play");
      setCoachMode("engine");
      setIsLiveMode(true);
      setPuzzleOpen(false);
      return;
    }
    setActiveMode("play");
    setIsLiveMode(true);
    setPuzzleOpen(false);
    setTrainingInitialModule(null);
  }, []);

  const handleTutorialsBack = useCallback(() => {
    handleModeChange("play");
  }, [handleModeChange]);

  const moveHistoryPanel = (
    <MoveHistorySidebar
      game={gameReference.current}
      moveHistory={moveHistory}
      evalScore={evalScore}
      moveQuality={moveQuality}
      viewIndex={viewIndex}
      onJumpToMove={handleJumpToMove}
      onExitReview={handleExitReview}
      onNavigateBack={handleNavigateBack}
      onNavigateForward={handleNavigateForward}
      onFlipBoard={() =>
        setBoardOrientation((o) => (o === "white" ? "black" : "white"))
      }
      onUndo={handleUndo}
      onRedo={handleRedo}
      canRedo={redoHistory.length > 0}
      onCopyPgn={handleCopyPgn}
      isAnalyzing={isAnalyzing}
      analysisProgress={analysisProgress}
      gameReport={gameReport}
      onViewReport={() => setGameReportOpen(true)}
      clockEnabled={clockEnabled}
      timeWhite={clock.timeWhite}
      timeBlack={clock.timeBlack}
      currentTurn={gameReference.current.turn()}
      clockFlagged={clock.flagged}
      annotations={annotations}
      onAnnotationChange={handleAnnotationChange}
      onPreviewMove={handlePreviewHistoryMove}
      onClearPreview={handleClearHistoryPreview}
    />
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen">
      <ControlBar
        onNewGame={handleNewGame}
        opponent={opponent}
        onOpponentChange={setOpponent}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        isGameInProgress={moveHistory.length > 0}
        onSetPosition={() => setPositionSetupOpen(true)}
        onOpenPuzzles={() => setPuzzleOpen(true)}
        onOpenOpeningDrill={() => setOpeningDrillOpen(true)}
        onOpenEndgame={() => setEndgameOpen(true)}
        onOpenOpeningStats={() => setOpeningStatsOpen(true)}
        clockEnabled={clockEnabled}
        clockTimeControl={clockTimeControl}
        onToggleClock={() => setClockEnabled((enabled) => !enabled)}
        onSetTimeControl={setClockTimeControl}
      />

      <div
        className="grid flex-1 grid-cols-1 grid-rows-[auto_auto_620px] overflow-y-auto lg:grid-cols-[var(--app-grid-columns)] lg:grid-rows-none lg:overflow-hidden"
        style={{
          "--app-grid-columns": modeRailCollapsed
            ? `56px minmax(0,1fr) ${rightSidebarCollapsed ? "48px" : "440px"}`
            : `196px minmax(0,1fr) ${rightSidebarCollapsed ? "48px" : "440px"}`,
        }}
      >
        <ModeRail
          activeMode={activeMode}
          collapsed={modeRailCollapsed}
          isDarkMode={isDarkMode}
          onModeChange={handleModeChange}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleDarkMode={toggleDarkMode}
          onToggleCollapsed={() => setModeRailCollapsed((value) => !value)}
        />

        {activeMode === "daily" ? (
          <div className="min-h-[620px] overflow-hidden bg-background p-2 sm:p-3 lg:col-span-2 lg:min-h-0 lg:p-4">
            <DailyRoutinePanel onStartTask={handleStartRoutineTask} />
          </div>
        ) : (
          <>
            <div className="flex min-h-[360px] items-center justify-center overflow-hidden bg-background p-2 sm:min-h-[520px] sm:p-3 lg:min-h-0 lg:p-4">
              <BoardPanel
                game={displayBoardGame}
                onMove={handleMove}
                lastMoveSquares={displayBoardLastMove}
                isAIThinking={isAIThinking && !trainingBoard.isTrainingActive}
                boardOrientation={displayBoardOrientation}
                isReviewMode={
                  effectiveViewIndex !== null && !trainingBoard.isTrainingActive
                }
                arrows={displayBoardArrows}
                previewSquares={displayPreviewSquares}
                onSquareSelect={
                  activeMode === "vision" ? handleVisionSquareSelect : null
                }
                hideHud={activeMode === "vision"}
                hideStatus={activeMode === "vision"}
                premove={premove}
                playerColor={playerColor}
                onPlayerColorChange={handlePlayerColorChange}
                isGameInProgress={moveHistory.length > 0}
                onCancelPremove={() => {
                  setPremove(null);
                  premoveReference.current = null;
                }}
                boardColors={boardColors}
              />
            </div>

            <div className="relative min-h-0 min-w-0 border-t border-border bg-card lg:border-l lg:border-t-0">
              {rightSidebarCollapsed ? (
                <div className="flex h-full items-start justify-center pt-3">
                  <button
                    onClick={() => setRightSidebarCollapsed(false)}
                    className="rounded-md border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
                    title="Open right sidebar"
                  >
                    Open
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setRightSidebarCollapsed(true)}
                    className="absolute right-3 top-14 z-50 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-secondary"
                    title="Close right sidebar"
                  >
                    Close
                  </button>
                  {activeMode === "vision" ? (
                    <BoardVisionPanel
                      card={visionCard}
                      score={visionScore}
                      attempts={visionAttempts}
                      streak={visionStreak}
                      bestStreak={visionBestStreak}
                      feedback={visionFeedback}
                      onNext={nextVisionCard}
                      onReset={resetVisionDrill}
                    />
                  ) : activeMode === "database" ? (
                    <DatabasePanel
                      onLoadGame={handleLoadGame}
                      onPreviewPosition={handlePreviewPosition}
                      onClearPreview={handleClearPreviewLine}
                    />
                  ) : activeMode === "training" ? (
                    <TrainingPanel
                      initialModule={trainingInitialModule}
                      onBoardUpdate={handleTrainingBoardUpdate}
                      onRegisterMoveHandler={handleRegisterMoveHandler}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      onAskAI={handleAskAI}
                      onLearnWithAI={handleLearnWithAI}
                      tokenStats={tokenStats}
                      setMessages={setMessages}
                    />
                  ) : activeMode === "tutorials" ? (
                    <TrainingOpeningTutorialPanel
                      onBoardUpdate={handleTrainingBoardUpdate}
                      onRegisterMoveHandler={handleRegisterMoveHandler}
                      onBack={handleTutorialsBack}
                    />
                  ) : (
                    <ChatPanel
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      coachMode={coachMode}
                      onCoachModeChange={setCoachMode}
                      isLiveMode={isLiveMode}
                      onEngineAnalyze={handleEngineAnalyze}
                      onEngineBestMove={handleEngineBestMove}
                      onEngineHint={handleEngineHint}
                      onThinkLikeGM={() => {
                        setCoachMode("ai");
                        handleThinkLikeGM(moveHistory.map((m) => m.san));
                      }}
                      onAskAI={handleAskAI}
                      onLearnWithAI={handleLearnWithAI}
                      tokenStats={tokenStats}
                      historyPanel={moveHistoryPanel}
                      onPreviewLine={handlePreviewLine}
                      onPreviewPosition={handlePreviewPosition}
                      onClearPreview={handleClearPreviewLine}
                      onJumpToMove={handleJumpToMove}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dialogs & Overlays */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <GameReportDialog
        open={gameReportOpen}
        onOpenChange={setGameReportOpen}
        report={gameReport}
        moveHistory={moveHistory}
        onJumpToMove={handleJumpToMove}
        onReviewBlunders={() => setBlunderReviewOpen(true)}
      />

      {blunderReviewOpen && gameReport?.blunders?.length > 0 && (
        <BlunderReviewMode
          blunders={gameReport.blunders}
          onClose={() => setBlunderReviewOpen(false)}
        />
      )}

      <PositionSetupDialog
        open={positionSetupOpen}
        onOpenChange={setPositionSetupOpen}
        onLoadPosition={handleLoadPosition}
      />

      {puzzleOpen && <PuzzleMode onClose={() => setPuzzleOpen(false)} />}
      {openingDrillOpen && (
        <OpeningDrillMode onClose={() => setOpeningDrillOpen(false)} />
      )}
      {endgameOpen && (
        <EndgameMode
          onClose={() => setEndgameOpen(false)}
          onLoadScenario={handleLoadEndgameScenario}
        />
      )}
      <OpeningStatsPanel
        open={openingStatsOpen}
        onClose={() => setOpeningStatsOpen(false)}
      />
    </div>
  );
};

export default App;
