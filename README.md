# Bara Tehni (12 Beads)

A coursework board game originally developed in C++ and recreated as a playable browser experience using HTML, CSS, and Vanilla JavaScript.


## Project overview

- **Original language:** C++
- **Course:** Programming Fundamentals
- **Year:** 2025
- **Browser version:** HTML, CSS, and Vanilla JavaScript
- **Deployment target:** Vercel

The browser recreation preserves the main functionality of the original coursework:

- Fixed 5×5 board
- Twelve beads per player
- X and O player pieces
- One-square movement in eight directions
- Two-square captures over an opponent
- Additional turn when another capture is available
- Player vs Player mode
- Player vs Computer mode
- Coin toss to determine the starting player
- Bead counters
- No-valid-move win condition
- Save and load using browser storage
- Undo and redo
- Responsive UI

## Repository structure

```text
bara-tehni-project/
├── cpp/
│   ├── Bead12.cpp
│   └── README.md
├── docs/
│   └── feature-parity.md
├── index.html
├── styles.css
├── script.js
├── vercel.json
├── .gitignore
└── README.md
```

## Run the web version locally

No build tools or dependencies are required.

### Option 1: Open directly

Open `index.html` in a modern browser.

### Option 2: Use a local static server

```bash
npx serve .
```

Then open the URL printed in the terminal.

## Compile the original C++ version

The original source uses `windows.h` for console color and `Sleep`, so compile it on Windows:

```powershell
g++ .\cpp\Bead12.cpp -o .\BaraTehni.exe
.\BaraTehni.exe
```

## Save-game behavior

The C++ version writes to `savegame.txt`. The browser version uses `localStorage`, which keeps the save inside the current browser and device.

## Academic integrity note

The original C++ file is preserved in the `cpp` folder. The web version is a separate interface recreation that translates the same rules and game state into browser-based interaction.

## Author

**Faizan Muhammad**
