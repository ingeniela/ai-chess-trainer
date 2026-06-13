# AI Chess Trainer Improvement Roadmap

## Shipped foundation

- Live engine cards are tied to a move number and can jump back to the board position.
- The right sidebar collapse state is remembered between reloads.
- Challenge hints and reveals resolve both SAN and UCI solution moves.
- Castling supports dragging or clicking the king onto the rook when legal.

## Next implementation batches

1. **Coach trust**
   - Add a compact timeline showing which card belongs to which move.
   - Show whether a suggestion is for the current position or a past position.
   - Add a one-click "show line" playback for engine continuations.

2. **Adaptive bots**
   - Track recent game results by bot profile.
   - Recommend a lower or higher Elo bot after repeated wins/losses.
   - Add bot style notes to the post-game report.

3. **Focused game review**
   - Generate a short review with only the 3-5 most important moments.
   - Group moments by opening, tactic, endgame, and time-management themes.
   - Let each review card jump to its move and replay the best line.

4. **Challenge experience**
   - Add step-by-step solution playback after reveal.
   - Add retry from original position without changing puzzle order.
   - Track failed puzzle themes and schedule spaced review.

5. **Training paths**
   - Build guided modules for forks, pins, mates, openings, and endgames.
   - Gate each path with examples, drills, mixed review, and progress badges.

6. **Mobile layout**
   - Replace the right sidebar with a bottom sheet on narrow screens.
   - Keep the board as the first-priority viewport element.
   - Add compact tabs for Engine, Coach, and History.

7. **Performance**
   - Lazy-load training, challenges, reports, and Stockfish-heavy views.
   - Split large UI chunks to reduce initial bundle size.
