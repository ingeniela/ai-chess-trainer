pus<div align="center">

# AI Chess Trainer

### Browser-based chess training with Stockfish and AI coaching

AI Chess Trainer is a frontend-only chess trainer for playing games, analyzing moves,
building tactical habits, reviewing mistakes, importing PGNs, and following a
daily training routine.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Stockfish](https://img.shields.io/badge/Stockfish-18-008000)](https://stockfishchess.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## What It Does

Most chess tools show a best move. AI Chess Trainer focuses on explaining the position:
what changed, what the engine prefers, what the threat is, and how a player can
learn from the move.

The app runs in the browser with React, Vite, chess.js, a Stockfish 18 WASM
engine, local IndexedDB storage, and optional AI coach integrations. There is no
custom backend required.

## Recent Highlights

- End Game action: manually finish an in-progress game, save it, and trigger post-game analysis.
- Automatic game database: completed, ended, and imported games are stored locally in IndexedDB.
- PGN import: paste a Chess.com or standard PGN, store it in the database, load it on the board, and analyze it.
- Database exports: download recorded games as JSON or as an animated GIF board replay.
- Daily Quest dashboard: a mission-style daily routine with XP, progress, streak map, and quick launch actions.
- Expanded training content: 64 JSON tactical quizzes, 48 tutorial entries, and 44 in-app puzzle trainer positions.
- Leave confirmation: changing modes during an active play session asks before leaving the game view.

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src="pics/s1.png" alt="Live Game with AI Coach" width="100%"/>
      <br/><sub><b>Play mode with engine and AI coach panels</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="pics/s2.png" alt="Training Mode" width="100%"/>
      <br/><sub><b>Training mode for tactical work</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="pics/s3.png" alt="Engine Analysis Panel" width="100%"/>
      <br/><sub><b>Stockfish analysis, best moves, hints, and move feedback</b></sub>
    </td>
  </tr>
</table>

## Main Modes

### Play

Play against Stockfish-powered Elo bots, a local offline bot, or use manual
two-player mode. The board supports legal move handling, last-move highlights,
premove handling, board flipping, PGN copy, undo/redo, review navigation, and
optional post-game reports.

Engine tools include:

- Live move feedback after player moves.
- Position analysis with candidate lines and board previews.
- Best move and hint actions.
- Threat detection cards.
- "Think Like a GM" coaching prompt.
- Move quality labels including Brilliant, Excellent, Good, Inaccuracy, Mistake, and Blunder.

### Daily

Daily Quest turns training into a short routine:

- Scout the Board: coordinate vision drill.
- Tactics Dungeon: tactical quiz session.
- Ranked Battle: play a focused game.
- Boss Review: review the most instructive moment.

Progress is saved in local storage with XP, level, daily completion, and a
seven-day streak map.

### Training

Training mode currently focuses on tactical quiz JSON files. It loads positions
onto the shared board, validates moves, gives feedback, tracks solved items, and
lets the AI coach answer questions in a separate training tab.

Content includes:

- 64 JSON tactical quizzes in `public/quiz`.
- 44 curated in-app tactical puzzle positions in `src/data/puzzles.js`.
- 21 endgame scenarios are available in the codebase for dedicated endgame workflows.
- Difficulty filters and guided solution flow.

### Tutorials

Tutorials are separated from the training sidebar and use their own mode. The
current tutorial library includes 48 entries covering opening systems and
tactical themes.

### Database

The Database mode is a local game library backed by IndexedDB. It records
completed games automatically and also stores manually ended games and imported
PGNs.

Available actions:

- Import PGN.
- Load a saved game back onto the board.
- Preview each move position before loading.
- Export a game as JSON.
- Export a simple animated GIF replay.
- Delete stored games.

### Vision

Vision mode is a coordinate-recognition drill. The app shows a target square,
the player clicks the board, and the panel tracks score, attempts, streak, and
best streak.

## AI Coach

AI coaching is optional. Without an API key, Stockfish analysis, local gameplay,
database storage, puzzles, tutorials, and vision training still work.

Supported providers are configured from the in-app Settings dialog:

- Google Gemini
- OpenAI
- OpenRouter

API keys and model preferences are stored in browser local storage. They are not
sent to any project-owned server.

## Game Analysis

Post-game analysis can run after checkmate, draw, PGN load, or the manual End
Game action. Reports include:

- White and Black accuracy.
- Move quality counts.
- Evaluation graph.
- Critical moment.
- Blunder and mistake review.
- Jump-to-position links from the report back to the board.

## Local Storage And Privacy

AI Chess Trainer is designed as a client-side application:

- Games are saved in IndexedDB.
- Daily quest and settings data are saved in local storage.
- API keys remain in local storage.
- No account system or custom backend is required.
- Stockfish analysis runs locally through the bundled WASM engine.

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
git clone https://github.com/Iamsdt/ai-chess-trainer.git
cd ai-chess-trainer
npm install
```

### Run Locally

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

### Configure AI

Open Settings in the app, choose a provider, paste your API key, and select a
model. `.env` variables are not required for the current app flow.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build production assets |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with automatic fixes |
| `npm run test` | Run Vitest |
| `npm run test:coverage` | Run Vitest with coverage summary |
| `npm run test:ui` | Open Vitest UI with coverage enabled |
| `npm run format` | Format source files with Prettier |

## Production Build

```bash
npm run build
npm run preview
```

The Vite production base path is `/chess/`, so the build is configured for a
GitHub Pages deployment at that repository path.

## GitHub Pages Deployment

The repository includes `.github/workflows/deploy.yml`. It builds and deploys
`dist` on every push to `main`.

To enable it:

1. Open the repository settings on GitHub.
2. Go to Pages.
3. Set the source to GitHub Actions.
4. Push to `main` or run the workflow manually.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 4, Radix UI primitives |
| Chess rules | chess.js |
| Board UI | react-chessboard |
| Engine | Stockfish 18 WASM |
| AI providers | Google Gemini, OpenAI, OpenRouter |
| State | Zustand, React state |
| Storage | IndexedDB, local storage |
| Tests | Vitest, Testing Library |
| Icons | lucide-react |

## Project Structure

```text
src/
  App.jsx                         App shell, mode routing, game orchestration
  components/
    board-panel.jsx               Main chessboard
    chat-panel.jsx                Engine and AI coach panel
    control-bar.jsx               Opponent, bot, new/end game controls
    daily-routine-panel.jsx       Daily Quest dashboard
    database-panel.jsx            Local game database, PGN import, exports
    game-report-dialog.jsx        Accuracy and move-quality report
    mode-rail.jsx                 Play/Daily/Training/Tutorials/Database/Vision navigation
    training-panel.jsx            Training mode shell
    training-puzzle-quiz-panel.jsx JSON quiz trainer
    training-opening-tutorial-panel.jsx Tutorial mode
  data/
    puzzles.js                    Curated tactical positions
    endgames.js                   Endgame scenarios
  hooks/
    use-ai-chat.js                AI provider chat integration
    use-engine-coach.js           Engine coaching actions and reports
    use-chess-clock.js            Clock logic
  lib/
    db.js                         IndexedDB persistence
    stockfish.js                  Stockfish WASM wrapper
    engine.js                     Local bot/engine helpers
    analyzer.js                   Game report analysis helpers
    openings.js                   Opening data
  store/
    use-game-store.js
    use-progress-store.js
public/
  quiz/                           JSON tactical quiz library
  tutorial/                       Tutorial JSON library
  stockfish-18-lite-single.*      Bundled Stockfish assets
```

## Contributing

Contributions are welcome. Useful areas include more quiz files, additional
tutorials, stronger PGN import handling, richer database filters, more report
insights, UI polish, and tests around game import/export flows.

## License

MIT License

Copyright (c) Shudipto Trafder
