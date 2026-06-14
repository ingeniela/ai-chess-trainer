import { Chess } from "chess.js";
import {
  Database,
  Download,
  FileJson,
  Film,
  Upload,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { migrateMoveHistory } from "@/lib/chess-helpers";
import { deleteGame, listGames, saveGame } from "@/lib/db";

const BOARD_SIZE = 320;
const SQUARE_SIZE = BOARD_SIZE / 8;
const START_FEN = new Chess().fen();

const PIECES = {
  wp: "P",
  wn: "N",
  wb: "B",
  wr: "R",
  wq: "Q",
  wk: "K",
  bp: "p",
  bn: "n",
  bb: "b",
  br: "r",
  bq: "q",
  bk: "k",
};

const GIF_PALETTE = [
  [238, 238, 210],
  [118, 150, 86],
  [246, 190, 80],
  [248, 248, 248],
  [32, 32, 32],
  [24, 24, 24],
];

const padPalette = () => {
  const bytes = [];
  for (let index = 0; index < 256; index += 1) {
    const color = GIF_PALETTE[index] ?? [0, 0, 0];
    bytes.push(...color);
  }
  return bytes;
};

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const resultLabel = (game) => {
  if (game.playerResult === "win") return "Win";
  if (game.playerResult === "loss") return "Loss";
  if (game.playerResult === "draw") return "Draw";
  if (game.gameResult === "white") return "White won";
  if (game.gameResult === "black") return "Black won";
  if (game.gameResult === "draw") return "Draw";
  return "Recorded";
};

const resultClass = (game) => {
  if (game.playerResult === "win") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }
  if (game.playerResult === "loss") {
    return "border-red-500/30 bg-red-500/10 text-red-400";
  }
  if (game.playerResult === "draw") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }
  return "border-border bg-muted/30 text-muted-foreground";
};

const sanitizeName = (value) =>
  String(value || "game")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const downloadJson = (game) => {
  const payload = JSON.stringify(game, null, 2);
  downloadBlob(
    new window.Blob([payload], { type: "application/json" }),
    `${sanitizeName(game.name)}.json`,
  );
};

const stringBytes = (value) =>
  [...value].map((character) => character.charCodeAt(0));

const littleEndian = (value) => [value & 0xff, (value >> 8) & 0xff];

const packCodes = (codes) => {
  const bytes = [];
  let buffer = 0;
  let bitCount = 0;

  for (const code of codes) {
    buffer |= code << bitCount;
    bitCount += 9;
    while (bitCount >= 8) {
      bytes.push(buffer & 0xff);
      buffer >>= 8;
      bitCount -= 8;
    }
  }

  if (bitCount > 0) {
    bytes.push(buffer & 0xff);
  }

  return bytes;
};

const buildImageDataBlocks = (indices) => {
  const clear = 256;
  const end = 257;
  const codes = [];

  for (let index = 0; index < indices.length; index += 250) {
    codes.push(clear, ...indices.slice(index, index + 250));
  }
  codes.push(end);

  const packed = packCodes(codes);
  const blocks = [8];
  for (let index = 0; index < packed.length; index += 255) {
    const block = packed.slice(index, index + 255);
    blocks.push(block.length, ...block);
  }
  blocks.push(0);
  return blocks;
};

const nearestPaletteIndex = (red, green, blue) => {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < GIF_PALETTE.length; index += 1) {
    const [pr, pg, pb] = GIF_PALETTE[index];
    const distance =
      (red - pr) * (red - pr) +
      (green - pg) * (green - pg) +
      (blue - pb) * (blue - pb);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
};

const drawBoardFrame = (context, fen, lastMove) => {
  const game = new Chess(fen);
  const board = game.board();
  context.fillStyle = "#181818";
  context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const x = file * SQUARE_SIZE;
      const y = rank * SQUARE_SIZE;
      const square = `${"abcdefgh"[file]}${8 - rank}`;
      const highlighted = lastMove?.from === square || lastMove?.to === square;
      context.fillStyle = highlighted
        ? "#f6be50"
        : (rank + file) % 2 === 0
          ? "#eeeed2"
          : "#769656";
      context.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

      const piece = board[rank][file];
      if (piece) {
        context.fillStyle = piece.color === "w" ? "#f8f8f8" : "#202020";
        context.font = "bold 24px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
          PIECES[`${piece.color}${piece.type}`],
          x + SQUARE_SIZE / 2,
          y + SQUARE_SIZE / 2 + 1,
        );
      }
    }
  }
};

const canvasToPaletteIndices = (context) => {
  const { data } = context.getImageData(0, 0, BOARD_SIZE, BOARD_SIZE);
  const indices = [];
  for (let index = 0; index < data.length; index += 4) {
    indices.push(
      nearestPaletteIndex(data[index], data[index + 1], data[index + 2]),
    );
  }
  return indices;
};

const buildGifBlob = (game) => {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_SIZE;
  canvas.height = BOARD_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const moves = migrateMoveHistory(game.moveHistory ?? []);
  const frames = [
    { fen: START_FEN, move: null },
    ...moves.map((move) => ({
      fen: move.fen,
      move,
    })),
  ].filter((frame) => frame.fen);

  const bytes = [
    ...stringBytes("GIF89a"),
    ...littleEndian(BOARD_SIZE),
    ...littleEndian(BOARD_SIZE),
    0xf7,
    0,
    0,
    ...padPalette(),
    ...stringBytes("!\xff\u000bNETSCAPE2.0\u0003\u0001\u0000\u0000\u0000"),
  ];

  for (const frame of frames) {
    drawBoardFrame(context, frame.fen, frame.move);
    bytes.push(
      0x21,
      0xf9,
      4,
      0,
      ...littleEndian(80),
      0,
      0,
      0x2c,
      0,
      0,
      0,
      0,
      ...littleEndian(BOARD_SIZE),
      ...littleEndian(BOARD_SIZE),
      0,
      ...buildImageDataBlocks(canvasToPaletteIndices(context)),
    );
  }

  bytes.push(0x3b);
  return new window.Blob([new Uint8Array(bytes)], { type: "image/gif" });
};

const downloadGif = (game) => {
  downloadBlob(buildGifBlob(game), `${sanitizeName(game.name)}.gif`);
};

const parsePgnHeaders = (pgn) => {
  const headers = {};
  const headerPattern = /^\[([A-Za-z0-9_]+)\s+"([^"]*)"\]$/gm;
  let match = headerPattern.exec(pgn);
  while (match) {
    const [, key, value] = match;
    headers[key] = value;
    match = headerPattern.exec(pgn);
  }
  return headers;
};

const gameResultFromHeader = (result) => {
  if (result === "1-0") return "white";
  if (result === "0-1") return "black";
  if (result === "1/2-1/2") return "draw";
  return null;
};

const buildMoveHistoryFromGame = (game) =>
  game.history({ verbose: true }).map((move) => ({
    san: move.san,
    fen: move.after,
    from: move.from,
    to: move.to,
  }));

const buildImportedGame = (pgn) => {
  const cleanPgn = pgn.trim();
  if (!cleanPgn) {
    throw new Error("Paste a PGN game first.");
  }

  const game = new Chess();
  game.loadPgn(cleanPgn);
  const headers = parsePgnHeaders(cleanPgn);
  const moveHistory = buildMoveHistoryFromGame(game);

  if (moveHistory.length === 0) {
    throw new Error("No moves were found in that PGN.");
  }

  const white = headers.White || "White";
  const black = headers.Black || "Black";
  const result = headers.Result || "*";

  return {
    fen: game.fen(),
    pgn: game.pgn(),
    moveHistory,
    opponent: "imported",
    difficulty: "Chess.com",
    boardOrientation: "white",
    playerColor: "white",
    gameResult: gameResultFromHeader(result),
    playerResult: null,
    name: `${white} vs ${black} · ${result}`,
    completedAt: Date.now(),
    isImported: true,
    importSource: headers.Site || "PGN",
    importedHeaders: headers,
  };
};

const DatabasePanel = ({ onLoadGame, onPreviewPosition, onClearPreview }) => {
  const [games, setGames] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(-1);
  const [importPgn, setImportPgn] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const refreshGames = useCallback(() => {
    listGames()
      .then((items) => {
        setGames(items);
        setSelectedId((current) => current ?? items[0]?.id ?? null);
        return items;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  const selectedGame = games.find((game) => game.id === selectedId) ?? null;
  const moves = useMemo(
    () => migrateMoveHistory(selectedGame?.moveHistory ?? []),
    [selectedGame],
  );

  const previewMove = useCallback(
    (index) => {
      setSelectedMoveIndex(index);
      if (index < 0) {
        onPreviewPosition?.(START_FEN, [], []);
        return;
      }
      const move = moves[index];
      if (!move?.fen) return;
      onPreviewPosition?.(move.fen, [
        {
          startSquare: move.from,
          endSquare: move.to,
          color: "#22c55e",
        },
      ]);
    },
    [moves, onPreviewPosition],
  );

  const handleDelete = async (id) => {
    await deleteGame(id);
    if (selectedId === id) {
      setSelectedId(null);
      onClearPreview?.();
    }
    refreshGames();
  };

  const handleImportPgn = async () => {
    setImportError("");
    setImportSuccess("");
    try {
      const importedGame = buildImportedGame(importPgn);
      const id = await saveGame(importedGame);
      setSelectedId(id);
      setSelectedMoveIndex(-1);
      setImportPgn("");
      setImportSuccess("Imported. Load it to analyze the game on this board.");
      refreshGames();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not import that PGN.",
      );
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Database</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {games.length} games
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(150px,38%)_minmax(0,1fr)]">
        <div className="overflow-y-auto border-b border-border p-2">
          <div className="mb-2 rounded-lg border border-border bg-muted/20 p-2">
            <div className="mb-2 flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold">Import Chess.com PGN</p>
            </div>
            <textarea
              value={importPgn}
              onChange={(event) => {
                setImportPgn(event.target.value);
                setImportError("");
                setImportSuccess("");
              }}
              placeholder='Paste PGN here, e.g. [Event "Live Chess"] ... 1. e4 e5 ...'
              className="min-h-20 w-full resize-y rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
            />
            <Button
              size="sm"
              className="mt-2 h-8 w-full text-xs"
              onClick={handleImportPgn}
              disabled={!importPgn.trim()}
            >
              <Upload className="mr-1 h-3.5 w-3.5" />
              Import PGN
            </Button>
            {importError && (
              <p className="mt-1.5 text-[11px] text-red-400">{importError}</p>
            )}
            {importSuccess && (
              <p className="mt-1.5 text-[11px] text-emerald-400">
                {importSuccess}
              </p>
            )}
          </div>

          {games.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Completed and imported games will appear here.
            </div>
          ) : (
            <div className="space-y-1.5">
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(game.id);
                    setSelectedMoveIndex(-1);
                    onClearPreview?.();
                  }}
                  className={`w-full rounded-lg border p-2 text-left transition-colors ${
                    selectedId === game.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {game.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDate(game.timestamp)} ·{" "}
                        {game.moveHistory?.length ?? 0} moves
                      </p>
                    </div>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${resultClass(game)}`}
                    >
                      {resultLabel(game)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-3">
          {!selectedGame ? (
            <div className="text-xs text-muted-foreground">
              Select a recorded game to inspect it.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {selectedGame.name}
                  </p>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${resultClass(selectedGame)}`}
                  >
                    {resultLabel(selectedGame)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {selectedGame.opponent ?? "engine"} ·{" "}
                  {selectedGame.difficulty ?? "default"} ·{" "}
                  {selectedGame.playerColor ?? "white"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onLoadGame(selectedGame)}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Load Game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => previewMove(-1)}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => downloadJson(selectedGame)}
                >
                  <FileJson className="mr-1 h-3.5 w-3.5" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => downloadGif(selectedGame)}
                >
                  <Film className="mr-1 h-3.5 w-3.5" />
                  GIF
                </Button>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Move Record
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedGame.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete game"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {moves.map((move, index) => (
                    <button
                      key={`${move.san}-${move.fen}`}
                      type="button"
                      onClick={() => previewMove(index)}
                      className={`truncate rounded border px-2 py-1 text-left text-[11px] transition-colors ${
                        selectedMoveIndex === index
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      {Math.floor(index / 2) + 1}
                      {index % 2 === 0 ? ". " : "... "}
                      {move.san}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabasePanel;
