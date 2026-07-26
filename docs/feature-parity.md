# C++ to browser feature parity

| Original C++ feature | Browser implementation |
|---|---|
| `char board[5][5]` | Nested JavaScript arrays |
| Console grid | Interactive 5×5 HTML button grid |
| X and O beads | Styled circular X and O pieces |
| Player name input | Setup form |
| Computer name detection | Explicit Player vs Computer mode |
| Coin toss | Heads/Tails setup control |
| `isValidmove` | `getMoveDetails` simple-move validation |
| `isValidCapture` | `getMoveDetails` capture validation |
| `can_capture_again` | Same-player continuation message |
| `hasAnyMove` | Full-board valid-move scan |
| `computer_move` | Capture-first computer strategy |
| `save_game` / `loadGame` | Browser `localStorage` |
| Board history arrays | JavaScript snapshot history |
| Undo / redo | Undo and Redo buttons |
| Console messages | Visible game status and game log |
| Windows console UI | Responsive HTML/CSS interface |

## Important translation decisions

- The original C++ source is kept intact in `cpp/Bead12.cpp`.
- The web version does not attempt to compile C++ in the browser.
- Browser save data remains on the current device rather than creating `savegame.txt`.
- The visual board uses click-based input instead of row and column numbers.
- The computer keeps the original capture-first, otherwise first-valid-move strategy.
