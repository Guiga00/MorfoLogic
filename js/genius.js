/**
 * Módulo do Minijogo Genius
 * Contém toda a lógica de funcionamento do jogo Genius (sequência).
 */
let geniusState = {};

function initGeniusGame(phase) {
  clearInterval(geniusSequenceInterval);
  const classes = getClassesForPhase(phase);
  const limits = [5, 8, 12];
  geniusState = {
    classes,
    sequence: [],
    playerSequence: [],
    turn: "computer",
    limit: limits[phase - 1],
  };
  AppState.currentGame.score = 0;
  updateGameUI();
  const board = document.getElementById("game-board");
  let gridCols = classes.length > 4 ? "grid-cols-3" : "grid-cols-2";
  board.innerHTML = `<div class="grid ${gridCols} gap-4">${classes
    .map(
      (c) =>
        `<div data-id="${
          c.id
        }" onclick="handleGeniusClick(this)" class="genius-symbol w-20 h-20 sm:w-24 sm:h-24 p-2 bg-white rounded-lg shadow cursor-pointer transition-transform duration-200">${c.symbol(
          "w-full h-full"
        )}</div>`
    )
    .join("")}</div>`;
  document.getElementById("game-message").textContent =
    "Prepare-se para começar...";
  setTimeout(computerTurn, 2000);
}

function computerTurn() {
  geniusState.turn = "computer";
  document.getElementById("game-message").textContent =
    "Observe a sequência...";
  const randomClass =
    geniusState.classes[Math.floor(Math.random() * geniusState.classes.length)];
  geniusState.sequence.push(randomClass.id);
  geniusState.playerSequence = [];
  playSequence();
}

function playSequence() {
  let i = 0;
  clearInterval(geniusSequenceInterval);
  geniusSequenceInterval = setInterval(() => {
    if (i < geniusState.sequence.length) {
      lightUpSymbol(geniusState.sequence[i]);
      i++;
    } else {
      clearInterval(geniusSequenceInterval);
      geniusState.turn = "player";
      document.getElementById("game-message").textContent =
        "Sua vez! Repita a sequência.";
    }
  }, 800);
}

function lightUpSymbol(id) {
  const el = document.querySelector(`.genius-symbol[data-id='${id}']`);
  if (el) {
    GameAudio.play("genius");
    el.classList.add("lit");
    setTimeout(() => el.classList.remove("lit"), 400);
  }
}

function handleGeniusClick(el) {
  if (geniusState.turn !== "player") return;
  const id = parseInt(el.dataset.id);
  lightUpSymbol(id);
  geniusState.playerSequence.push(id);
  const currentStep = geniusState.playerSequence.length - 1;
  if (
    geniusState.playerSequence[currentStep] !==
    geniusState.sequence[currentStep]
  ) {
    GameAudio.play("error");
    document.getElementById("game-message").textContent =
      "Sequência errada! Fim de jogo.";
    geniusState.turn = "computer";
    setTimeout(() => showPhaseEndModal(false), 500);
    return;
  }
  if (geniusState.playerSequence.length === geniusState.sequence.length) {
    AppState.currentGame.score += 10;
    updateGameUI();
    if (geniusState.sequence.length === geniusState.limit) {
      geniusState.turn = "computer";
      setTimeout(() => showPhaseEndModal(true), 500);
    } else {
      geniusState.turn = "computer";
      setTimeout(computerTurn, 1000);
    }
  }
}
