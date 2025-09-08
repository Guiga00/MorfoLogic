/**
 * Módulo do Minijogo da Memória
 * Contém toda a lógica de funcionamento do Jogo da Memória.
 */
let memoryState = {};

function initMemoryGame(phase) {
  const classes = getClassesForPhase(phase);
  const board = document.getElementById("game-board");
  AppState.currentGame.score = 100;
  updateGameUI();
  const items = [...classes, ...classes]
    .map((item, i) => ({
      id: item.id,
      content:
        i < classes.length
          ? item.name
          : item.symbol("w-full h-full p-1 sm:p-2"),
      type: i < classes.length ? "name" : "symbol",
      matched: false,
    }))
    .sort(() => Math.random() - 0.5);
  memoryState = {
    items,
    firstPick: null,
    secondPick: null,
    lockBoard: true,
    matches: 0,
    totalPairs: classes.length,
  };

  const previewTime = phase === 1 ? 10000 : 15000; // 10s para fase 1, 15s para as outras

  let gridCols = "grid-cols-4";
  if (phase === 2) gridCols = "grid-cols-3 sm:grid-cols-4";
  if (phase === 3) gridCols = "grid-cols-4 sm:grid-cols-5";

  // A linha que define o 'card-front' foi alterada para incluir a imagem da logo.
  board.innerHTML = `<div class="grid ${gridCols} gap-2 sm:gap-4 w-full">${items
    .map(
      (item, index) => `
    <div class="card w-full aspect-square perspective-1000" data-index="${index}" onclick="handleMemoryClick(this)">
        <div class="card-inner relative w-full h-full">
            <div class="card-front absolute w-full h-full bg-white border-2 border-teal-100 rounded-lg flex items-center justify-center p-2">
                <!-- 
                  IMPORTANTE: Altere o 'src' abaixo para o caminho da sua logo.
                  Exemplo: src="./assets/logo.png" 
                -->
                <img src="https://placehold.co/100x100/14b8a6/ffffff?text=Logo" alt="Verso da Carta" class="w-full h-full object-contain">
            </div>
            <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">${item.content}</div>
        </div>
    </div>`
    )
    .join("")}</div>`;

  const cards = board.querySelectorAll(".card");
  cards.forEach((card) => card.classList.add("flipped"));
  document.getElementById("game-message").textContent = "Memorize as cartas!";
  setTimeout(() => {
    cards.forEach((card) => card.classList.remove("flipped"));
    memoryState.lockBoard = false;
    document.getElementById("game-message").textContent = "Encontre os pares!";
  }, previewTime);
}

function handleMemoryClick(cardElement) {
  if (memoryState.lockBoard) return;
  const index = cardElement.dataset.index;
  const item = memoryState.items[index];
  if (cardElement.classList.contains("flipped") || item.matched) return;
  GameAudio.play("flip");
  cardElement.classList.add("flipped");
  if (!memoryState.firstPick) {
    memoryState.firstPick = { el: cardElement, item: item };
  } else {
    memoryState.secondPick = { el: cardElement, item: item };
    memoryState.lockBoard = true;
    checkForMemoryMatch();
  }
}

function checkForMemoryMatch() {
  const { firstPick, secondPick } = memoryState;
  const isMatch =
    firstPick.item.id === secondPick.item.id &&
    firstPick.item.type !== secondPick.item.type;
  if (isMatch) {
    GameAudio.play("match");
    memoryState.matches++;
    firstPick.item.matched = true;
    secondPick.item.matched = true;
    firstPick.el.classList.add("card-matched");
    secondPick.el.classList.add("card-matched");
    resetMemoryTurn();
    if (memoryState.matches === memoryState.totalPairs) {
      setTimeout(() => showPhaseEndModal(), 500);
    }
  } else {
    GameAudio.play("error");
    AppState.currentGame.score = Math.max(0, AppState.currentGame.score - 5);
    AppState.currentGame.errors++;
    updateGameUI();
    setTimeout(() => {
      firstPick.el.classList.remove("flipped");
      secondPick.el.classList.remove("flipped");
      resetMemoryTurn();
    }, 1500);
  }
}

function resetMemoryTurn() {
  memoryState.firstPick = null;
  memoryState.secondPick = null;
  memoryState.lockBoard = false;
}
