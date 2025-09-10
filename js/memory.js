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
      name: item.name,
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

  const previewTime = phase === 1 ? 10000 : 15000;

  let boardHTML = "";

  // Lógica para gerar o layout de grade responsivo por fase
  switch (phase) {
    case 1: // Fase 1: 8 cartas. Layout 2x4 no celular, 4x2 no desktop.
      boardHTML = `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full max-w-md">
        ${items.map((item, index) => createCardHTML(item, index)).join("")}
      </div>`;
      break;

    case 2: // Fase 2: 14 cartas. Layout 4x4 com última fileira centralizada no celular.
      const first12 = items.slice(0, 12);
      const last2 = items.slice(12);
      boardHTML = `
        <div class="w-full max-w-lg flex flex-col items-center">
          <div class="grid grid-cols-4 gap-2 sm:gap-4 w-full">
            ${first12
              .map((item, index) => createCardHTML(item, index))
              .join("")}
          </div>
          <div class="flex justify-center gap-2 sm:gap-4 w-full mt-2 sm:mt-4">
            ${last2
              .map((item, index) => {
                // Adiciona uma div wrapper para controlar o tamanho
                return `<div class="w-1/4 px-1 sm:px-2">${createCardHTML(
                  item,
                  index + 12
                )}</div>`;
              })
              .join("")}
          </div>
        </div>`;
      break;

    case 3: // Fase 3: 20 cartas. Layout 4x5 no celular, 5x4 no desktop.
    default:
      boardHTML = `<div class="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4 w-full max-w-xl">
        ${items.map((item, index) => createCardHTML(item, index)).join("")}
      </div>`;
      break;
  }

  board.innerHTML = boardHTML;

  const cards = board.querySelectorAll(".card");
  cards.forEach((card) => card.classList.add("flipped"));
  document.getElementById("game-message").textContent = "Memorize as cartas!";
  setTimeout(() => {
    cards.forEach((card) => card.classList.remove("flipped"));
    // Adiciona animação de embaralhamento
    shuffleAnimation(cards, () => {
      memoryState.lockBoard = false;
      document.getElementById("game-message").textContent =
        "Encontre os pares!";
    });
  }, previewTime);

  // Função de animação simples de embaralhamento
  function shuffleAnimation(cards, callback) {
    cards.forEach((card) => card.classList.add("shuffling"));
    setTimeout(() => {
      cards.forEach((card) => card.classList.remove("shuffling"));
      if (typeof callback === "function") callback();
    }, 1000); // duração da animação em ms
  }
}

// Função auxiliar para criar o HTML de uma carta (evita repetição)
function createCardHTML(item, index) {
  let cardBackContent;
  if (item.type === "name") {
    const grammarClass = GRAMMAR_CLASSES.find((gc) => gc.id === item.id);
    cardBackContent = `
            <div class="relative w-full h-full flex items-center justify-center">
                <div class="absolute inset-0 p-1 sm:p-2 card-name-symbol-bg">
                    ${grammarClass.symbol("w-full h-full")}
                </div>
                <span class="relative z-10">${item.name}</span>
            </div>
        `;
  } else {
    cardBackContent = item.content;
  }

  return `
    <div class="card w-full aspect-square perspective-1000" data-index="${index}" onclick="handleMemoryClick(this)">
        <div class="card-inner relative w-full h-full">
            <div class="card-front absolute w-full h-full bg-white border-2 border-teal-100 rounded-lg flex items-center justify-center p-2">
                <img src="https://placehold.co/100x100/14b8a6/ffffff?text=Logo" alt="Verso da Carta" class="w-full h-full object-contain">
            </div>
            <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">
                ${cardBackContent}
            </div>
        </div>
    </div>`;
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
