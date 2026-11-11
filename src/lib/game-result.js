const BOARD_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const BOARD_RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

/**
 * Winner of a finished chess.js game.
 * @param {import("chess.js").Chess} game - Game to inspect
 * @returns {"white" | "black" | "draw" | null} Result, or null while the game is running
 */
export const getGameResult = (game) => {
  if (!game.isGameOver()) return null;
  if (game.isDraw()) return "draw";
  if (game.isCheckmate()) return game.turn() === "w" ? "black" : "white";
  return "draw";
};

/**
 * Result from the player's point of view.
 * @param {"white" | "black" | "draw" | null} gameResult - Overall result
 * @param {"white" | "black"} playerColor - Side the player controls
 * @returns {"win" | "loss" | "draw" | null} Player outcome
 */
export const getPlayerResult = (gameResult, playerColor) => {
  if (!gameResult) return null;
  if (gameResult === "draw") return "draw";
  const playerSide = playerColor === "black" ? "black" : "white";
  return gameResult === playerSide ? "win" : "loss";
};

/**
 * Random square prompt for the board-vision drill.
 * @param {() => number} [random] - Random source, injectable for tests
 * @returns {{ square: string, type: "coordinate" }} Drill card
 */
export const createVisionCard = (random = Math.random) => ({
  square: `${BOARD_FILES[Math.floor(random() * 8)]}${
    BOARD_RANKS[Math.floor(random() * 8)]
  }`,
  type: "coordinate",
});
