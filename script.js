'use strict';

/*
 * Add the public repository URL after pushing this folder to GitHub.
 * Example:
 * const REPOSITORY_URL = "https://github.com/FAIZANMUHAMMAD-311/bara-tehni";
 */
const REPOSITORY_URL = "https://github.com/FAIZANMUHAMMAD-311/pf-2025-bara-tehni-coursework";

const BOARD_SIZE = 5;
const STORAGE_KEY = "faizan-bara-tehni-save-v1";
const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const INITIAL_BOARD = [
  ["X", "X", "X", "X", "X"],
  ["X", "X", "X", "X", "X"],
  ["X", "X", ".", "O", "O"],
  ["O", "O", "O", "O", "O"],
  ["O", "O", "O", "O", "O"],
];

const elements = {
  setupForm: document.querySelector("#setup-form"),
  gameMode: document.querySelector("#game-mode"),
  playerTwoField: document.querySelector("#player-two-field"),
  playerOneName: document.querySelector("#player-one-name"),
  playerTwoName: document.querySelector("#player-two-name"),
  board: document.querySelector("#board"),
  moveMessage: document.querySelector("#move-message"),
  turnPill: document.querySelector("#turn-pill"),
  coinResult: document.querySelector("#coin-result"),
  playerOneLabel: document.querySelector("#player-one-label"),
  playerTwoLabel: document.querySelector("#player-two-label"),
  playerOneCount: document.querySelector("#player-one-count"),
  playerTwoCount: document.querySelector("#player-two-count"),
  scorePlayerOneName: document.querySelector("#score-player-one-name"),
  scorePlayerTwoName: document.querySelector("#score-player-two-name"),
  scorePlayerOne: document.querySelector("#score-player-one"),
  scorePlayerTwo: document.querySelector("#score-player-two"),
  saveButton: document.querySelector("#save-button"),
  loadButton: document.querySelector("#load-button"),
  undoButton: document.querySelector("#undo-button"),
  redoButton: document.querySelector("#redo-button"),
  resetButton: document.querySelector("#reset-button"),
  clearLogButton: document.querySelector("#clear-log-button"),
  gameLog: document.querySelector("#game-log"),
  repositoryButton: document.querySelector("#repository-button"),
};

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function createState() {
  return {
    board: cloneBoard(INITIAL_BOARD),
    players: {
      1: { name: "Player 1", symbol: "X" },
      2: { name: "Computer", symbol: "O" },
    },
    beadCounts: { 1: 12, 2: 12 },
    currentPlayer: 1,
    selected: null,
    gameMode: "computer",
    gameStarted: false,
    gameOver: false,
    botThinking: false,
    coinResult: "Not tossed",
    message: "Configure the players and start a new game.",
    logs: [],
  };
}

let state = createState();
let history = [];
let historyIndex = -1;
let botTimeout = null;

function snapshotState() {
  return JSON.parse(JSON.stringify(state));
}

function restoreSnapshot(snapshot) {
  state = JSON.parse(JSON.stringify(snapshot));
  state.botThinking = false;
  clearBotTimer();
  render();
  maybeScheduleComputerTurn();
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshotState());
  historyIndex = history.length - 1;
}

function clearBotTimer() {
  if (botTimeout) {
    window.clearTimeout(botTimeout);
    botTimeout = null;
  }
}

function addLog(message) {
  state.logs.push(message);
  if (state.logs.length > 60) {
    state.logs.shift();
  }
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getPlayerSymbol(playerNumber = state.currentPlayer) {
  return state.players[playerNumber].symbol;
}

function getOpponentNumber(playerNumber = state.currentPlayer) {
  return playerNumber === 1 ? 2 : 1;
}

function getMoveDetails(fromRow, fromCol, toRow, toCol, playerSymbol) {
  if (!inBounds(fromRow, fromCol) || !inBounds(toRow, toCol)) {
    return { valid: false };
  }

  if (state.board[fromRow][fromCol] !== playerSymbol) {
    return { valid: false };
  }

  if (state.board[toRow][toCol] !== ".") {
    return { valid: false };
  }

  const rowDifference = toRow - fromRow;
  const columnDifference = toCol - fromCol;

  const isSimpleMove =
    Math.abs(rowDifference) <= 1 &&
    Math.abs(columnDifference) <= 1 &&
    !(rowDifference === 0 && columnDifference === 0);

  if (isSimpleMove) {
    return { valid: true, type: "move" };
  }

  const isCaptureDistance =
    [-2, 0, 2].includes(rowDifference) &&
    [-2, 0, 2].includes(columnDifference) &&
    !(rowDifference === 0 && columnDifference === 0);

  if (!isCaptureDistance) {
    return { valid: false };
  }

  const capturedRow = fromRow + rowDifference / 2;
  const capturedColumn = fromCol + columnDifference / 2;
  const opponentSymbol = playerSymbol === "X" ? "O" : "X";

  if (state.board[capturedRow][capturedColumn] !== opponentSymbol) {
    return { valid: false };
  }

  return {
    valid: true,
    type: "capture",
    capturedRow,
    capturedColumn,
  };
}

function canCaptureFrom(row, col, playerSymbol) {
  return DIRECTIONS.some(([rowChange, columnChange]) => {
    const targetRow = row + rowChange * 2;
    const targetColumn = col + columnChange * 2;
    return getMoveDetails(row, col, targetRow, targetColumn, playerSymbol).type === "capture";
  });
}

function hasAnyMove(playerSymbol) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (state.board[row][column] !== playerSymbol) {
        continue;
      }

      for (const [rowChange, columnChange] of DIRECTIONS) {
        const simpleMove = getMoveDetails(
          row,
          column,
          row + rowChange,
          column + columnChange,
          playerSymbol,
        );

        if (simpleMove.valid) {
          return true;
        }

        const captureMove = getMoveDetails(
          row,
          column,
          row + rowChange * 2,
          column + columnChange * 2,
          playerSymbol,
        );

        if (captureMove.valid) {
          return true;
        }
      }
    }
  }

  return false;
}

function getValidTargets(row, column) {
  if (!state.gameStarted || state.gameOver) {
    return [];
  }

  const playerSymbol = getPlayerSymbol();
  const targets = [];

  for (let targetRow = 0; targetRow < BOARD_SIZE; targetRow += 1) {
    for (let targetColumn = 0; targetColumn < BOARD_SIZE; targetColumn += 1) {
      const details = getMoveDetails(
        row,
        column,
        targetRow,
        targetColumn,
        playerSymbol,
      );

      if (details.valid) {
        targets.push(`${targetRow}-${targetColumn}`);
      }
    }
  }

  return targets;
}

function endGame(winnerNumber, reason) {
  state.gameOver = true;
  state.selected = null;
  const winnerName = state.players[winnerNumber].name;
  state.message = `${winnerName} wins — ${reason}`;
  addLog(state.message);
  clearBotTimer();
}

function checkCurrentPlayerCanMove() {
  const playerSymbol = getPlayerSymbol();

  if (!hasAnyMove(playerSymbol)) {
    endGame(
      getOpponentNumber(),
      `${state.players[state.currentPlayer].name} has no valid moves`,
    );
    return false;
  }

  return true;
}

function applyMove(fromRow, fromColumn, toRow, toColumn, options = {}) {
  const playerNumber = state.currentPlayer;
  const player = state.players[playerNumber];
  const moveDetails = getMoveDetails(
    fromRow,
    fromColumn,
    toRow,
    toColumn,
    player.symbol,
  );

  if (!moveDetails.valid) {
    state.message = "Invalid move. Choose an empty adjacent square or a valid capture square.";
    render();
    return false;
  }

  state.board[toRow][toColumn] = player.symbol;
  state.board[fromRow][fromColumn] = ".";

  if (moveDetails.type === "capture") {
    state.board[moveDetails.capturedRow][moveDetails.capturedColumn] = ".";
    const opponentNumber = getOpponentNumber(playerNumber);
    state.beadCounts[opponentNumber] -= 1;
    addLog(
      `${player.name} captured a bead from (${moveDetails.capturedRow}, ${moveDetails.capturedColumn}).`,
    );

    if (state.beadCounts[opponentNumber] === 0) {
      endGame(playerNumber, "all opposing beads were captured");
      pushHistory();
      render();
      return true;
    }
  } else {
    addLog(`${player.name} moved from (${fromRow}, ${fromColumn}) to (${toRow}, ${toColumn}).`);
  }

  state.selected = null;

  const anotherCapture =
    moveDetails.type === "capture" &&
    canCaptureFrom(toRow, toColumn, player.symbol);

  if (anotherCapture && !options.computerMove) {
    // Mirrors the intended extra-capture behavior of the C++ coursework.
    state.message = `${player.name} can capture again. Select a bead and continue the turn.`;
    addLog(`${player.name} keeps the turn because another capture is available.`);
  } else {
    state.currentPlayer = getOpponentNumber(playerNumber);
    state.message = `${state.players[state.currentPlayer].name}'s turn.`;
  }

  pushHistory();
  render();

  if (!state.gameOver && !checkCurrentPlayerCanMove()) {
    pushHistory();
    render();
    return true;
  }

  maybeScheduleComputerTurn();
  return true;
}

function handleCellClick(row, column) {
  if (
    !state.gameStarted ||
    state.gameOver ||
    state.botThinking ||
    (state.gameMode === "computer" && state.currentPlayer === 2)
  ) {
    return;
  }

  const cellValue = state.board[row][column];
  const playerSymbol = getPlayerSymbol();

  if (!state.selected) {
    if (cellValue !== playerSymbol) {
      state.message = `Select one of ${state.players[state.currentPlayer].name}'s ${playerSymbol} beads.`;
      render();
      return;
    }

    state.selected = { row, column };
    state.message = `Selected (${row}, ${column}). Choose a destination.`;
    render();
    return;
  }

  if (cellValue === playerSymbol) {
    state.selected = { row, column };
    state.message = `Selected (${row}, ${column}). Choose a destination.`;
    render();
    return;
  }

  applyMove(
    state.selected.row,
    state.selected.column,
    row,
    column,
  );
}

function findComputerMove() {
  const symbol = "O";

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (state.board[row][column] !== symbol) {
        continue;
      }

      for (const [rowChange, columnChange] of DIRECTIONS) {
        const targetRow = row + rowChange * 2;
        const targetColumn = column + columnChange * 2;
        const details = getMoveDetails(
          row,
          column,
          targetRow,
          targetColumn,
          symbol,
        );

        if (details.type === "capture") {
          return { fromRow: row, fromColumn: column, toRow: targetRow, toColumn: targetColumn };
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (state.board[row][column] !== symbol) {
        continue;
      }

      for (const [rowChange, columnChange] of DIRECTIONS) {
        const targetRow = row + rowChange;
        const targetColumn = column + columnChange;
        const details = getMoveDetails(
          row,
          column,
          targetRow,
          targetColumn,
          symbol,
        );

        if (details.valid) {
          return { fromRow: row, fromColumn: column, toRow: targetRow, toColumn: targetColumn };
        }
      }
    }
  }

  return null;
}

function maybeScheduleComputerTurn() {
  clearBotTimer();

  if (
    !state.gameStarted ||
    state.gameOver ||
    state.gameMode !== "computer" ||
    state.currentPlayer !== 2
  ) {
    return;
  }

  state.botThinking = true;
  state.message = "Computer is thinking…";
  render();

  botTimeout = window.setTimeout(() => {
    state.botThinking = false;
    const move = findComputerMove();

    if (!move) {
      endGame(1, "Computer has no valid moves");
      pushHistory();
      render();
      return;
    }

    applyMove(
      move.fromRow,
      move.fromColumn,
      move.toRow,
      move.toColumn,
      { computerMove: true },
    );
  }, 650);
}

function startNewGame(formData) {
  clearBotTimer();

  const gameMode = formData.get("gameMode");
  const playerOneName = String(formData.get("playerOneName") || "").trim() || "Player 1";
  const playerTwoInput = String(formData.get("playerTwoName") || "").trim();
  const playerTwoName = gameMode === "computer"
    ? "Computer"
    : playerTwoInput || "Player 2";

  const choice = formData.get("coinChoice") === "tails" ? "tails" : "heads";
  const toss = Math.random() < 0.5 ? "heads" : "tails";
  const startingPlayer = toss === choice ? 1 : 2;

  state = createState();
  state.players[1].name = playerOneName;
  state.players[2].name = playerTwoName;
  state.gameMode = gameMode;
  state.currentPlayer = startingPlayer;
  state.gameStarted = true;
  state.coinResult = `${toss === "heads" ? "Heads" : "Tails"} — ${state.players[startingPlayer].name} starts`;
  state.message = `${state.players[startingPlayer].name}'s turn.`;
  addLog(`New game started. ${state.coinResult}.`);

  history = [];
  historyIndex = -1;
  pushHistory();
  render();
  maybeScheduleComputerTurn();
}

function resetBoard() {
  if (!state.gameStarted) {
    state = createState();
    history = [];
    historyIndex = -1;
    render();
    return;
  }

  const preservedPlayers = JSON.parse(JSON.stringify(state.players));
  const preservedMode = state.gameMode;
  const preservedCoin = state.coinResult;
  const preservedStartingPlayer = state.currentPlayer;

  state = createState();
  state.players = preservedPlayers;
  state.gameMode = preservedMode;
  state.coinResult = preservedCoin;
  state.currentPlayer = preservedStartingPlayer;
  state.gameStarted = true;
  state.message = "Board reset. Continue the game.";
  addLog("Board reset to its initial position.");

  history = [];
  historyIndex = -1;
  pushHistory();
  render();
  maybeScheduleComputerTurn();
}

function saveGame() {
  if (!state.gameStarted) {
    state.message = "Start a game before saving.";
    render();
    return;
  }

  const payload = {
    state: snapshotState(),
    history,
    historyIndex,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.message = "Game saved in this browser.";
  addLog("Game saved to browser storage.");
  render();
}

function loadGame() {
  const rawSave = localStorage.getItem(STORAGE_KEY);

  if (!rawSave) {
    state.message = "No saved game was found in this browser.";
    render();
    return;
  }

  try {
    const payload = JSON.parse(rawSave);

    if (!payload.state || !Array.isArray(payload.state.board)) {
      throw new Error("Invalid save");
    }

    state = payload.state;
    state.botThinking = false;
    history = Array.isArray(payload.history) ? payload.history : [snapshotState()];
    historyIndex = Number.isInteger(payload.historyIndex)
      ? payload.historyIndex
      : history.length - 1;

    addLog("Saved game loaded from browser storage.");
    render();
    maybeScheduleComputerTurn();
  } catch {
    state.message = "The saved game is invalid and could not be loaded.";
    render();
  }
}

function undoMove() {
  if (historyIndex <= 0 || state.botThinking) {
    state.message = "No earlier move is available to undo.";
    render();
    return;
  }

  historyIndex -= 1;
  restoreSnapshot(history[historyIndex]);
  state.message = "Move undone.";
  render();
}

function redoMove() {
  if (historyIndex >= history.length - 1 || state.botThinking) {
    state.message = "No later move is available to redo.";
    render();
    return;
  }

  historyIndex += 1;
  restoreSnapshot(history[historyIndex]);
  state.message = "Move redone.";
  render();
}

function renderBoard() {
  elements.board.replaceChildren();

  const validTargets = state.selected
    ? new Set(getValidTargets(state.selected.row, state.selected.column))
    : new Set();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const cellValue = state.board[row][column];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "board-cell";
      button.setAttribute("role", "gridcell");
      button.dataset.row = String(row);
      button.dataset.column = String(column);

      const isSelected =
        state.selected &&
        state.selected.row === row &&
        state.selected.column === column;

      if (isSelected) {
        button.classList.add("selected");
      }

      if (validTargets.has(`${row}-${column}`)) {
        button.classList.add("valid-target");
      }

      if (cellValue === "X" || cellValue === "O") {
        const piece = document.createElement("span");
        piece.className = `piece ${cellValue === "X" ? "piece-x" : "piece-o"}`;
        piece.textContent = cellValue;
        piece.setAttribute("aria-hidden", "true");
        button.append(piece);
      }

      const readableValue = cellValue === "." ? "empty" : `${cellValue} bead`;
      button.setAttribute(
        "aria-label",
        `Row ${row}, column ${column}, ${readableValue}${isSelected ? ", selected" : ""}`,
      );

      button.disabled =
        !state.gameStarted ||
        state.gameOver ||
        state.botThinking ||
        (state.gameMode === "computer" && state.currentPlayer === 2);

      button.addEventListener("click", () => handleCellClick(row, column));
      elements.board.append(button);
    }
  }
}

function renderLog() {
  elements.gameLog.replaceChildren();

  if (state.logs.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-log";
    emptyItem.textContent = "Game activity will appear here.";
    elements.gameLog.append(emptyItem);
    return;
  }

  [...state.logs].reverse().forEach((entry) => {
    const listItem = document.createElement("li");
    listItem.textContent = entry;
    elements.gameLog.append(listItem);
  });
}

function render() {
  renderBoard();
  renderLog();

  elements.playerOneLabel.textContent = state.players[1].name;
  elements.playerTwoLabel.textContent = state.players[2].name;
  elements.playerOneCount.textContent = String(state.beadCounts[1]);
  elements.playerTwoCount.textContent = String(state.beadCounts[2]);

  elements.scorePlayerOneName.textContent = state.players[1].name;
  elements.scorePlayerTwoName.textContent = state.players[2].name;
  elements.scorePlayerOne.textContent = String(state.beadCounts[1]);
  elements.scorePlayerTwo.textContent = String(state.beadCounts[2]);

  elements.coinResult.textContent = state.coinResult;
  elements.moveMessage.textContent = state.message;

  if (!state.gameStarted) {
    elements.turnPill.textContent = "Start a game";
  } else if (state.gameOver) {
    elements.turnPill.textContent = "Game over";
  } else if (state.botThinking) {
    elements.turnPill.textContent = "Computer thinking";
  } else {
    elements.turnPill.textContent = `${state.players[state.currentPlayer].name}'s turn`;
  }

  elements.saveButton.disabled = !state.gameStarted || state.botThinking;
  elements.undoButton.disabled = historyIndex <= 0 || state.botThinking;
  elements.redoButton.disabled = historyIndex >= history.length - 1 || state.botThinking;
  elements.resetButton.disabled = state.botThinking;

  if (REPOSITORY_URL.trim()) {
    elements.repositoryButton.href = REPOSITORY_URL;
    elements.repositoryButton.hidden = false;
  } else {
    elements.repositoryButton.hidden = true;
  }
}

elements.gameMode.addEventListener("change", () => {
  const isTwoPlayer = elements.gameMode.value === "two-player";
  elements.playerTwoField.hidden = !isTwoPlayer;
});

elements.setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startNewGame(new FormData(elements.setupForm));
});

elements.saveButton.addEventListener("click", saveGame);
elements.loadButton.addEventListener("click", loadGame);
elements.undoButton.addEventListener("click", undoMove);
elements.redoButton.addEventListener("click", redoMove);
elements.resetButton.addEventListener("click", resetBoard);

elements.clearLogButton.addEventListener("click", () => {
  state.logs = [];
  renderLog();
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".site-nav a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

render();
