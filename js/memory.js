/**
 * Módulo do Minijogo da Memória
 * Contém toda a lógica de funcionamento do Jogo da Memória.
 * VERSÃO COM SISTEMA DE ESTRELAS IMPLEMENTADO
 */
let memoryState = {};

// Função auxiliar para embaralhar arrays (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Função para criar o HTML de uma única carta
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
      </div>`;
  } else {
    cardBackContent = item.content;
  }

  return `
    <div class="card w-full aspect-square perspective-1000" data-index="${index}">
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

// Função para gerar o HTML completo do tabuleiro
function generateBoardHTML(items, phase) {
  let gridLayoutHTML = "";

  switch (phase) {
    case 1:
      const phase1Cards = items
        .map((item, index) => createCardHTML(item, index))
        .join("");
      gridLayoutHTML = `<div class="grid grid-cols-4 gap-2 sm:gap-4 w-full">${phase1Cards}</div>`;
      break;
    case 2:
      const first12 = items
        .slice(0, 12)
        .map((item, index) => createCardHTML(item, index))
        .join("");
      const last2 = items
        .slice(12)
        .map((item, index) => {
          return `<div class="w-full">${createCardHTML(
            item,
            index + 12
          )}</div>`;
        })
        .join("");

      gridLayoutHTML = `
        <div class="flex flex-col items-center w-full">
          <div class="grid grid-cols-4 gap-2 sm:gap-4 w-full">${first12}</div>
          <div class="flex justify-center gap-2 sm:gap-4 w-1/2 mt-2 sm:mt-4">
            ${last2}
          </div>
        </div>`;
      break;
    case 3:
    default:
      const phase3Cards = items
        .map((item, index) => createCardHTML(item, index))
        .join("");
      gridLayoutHTML = `<div class="grid grid-cols-4 gap-2 sm:gap-4 w-full">${phase3Cards}</div>`;
      break;
  }
  return `<div class="w-full max-w-lg mx-auto">${gridLayoutHTML}</div>`;
}

/**
 * ANIMAÇÃO DE EMBARALHAMENTO (TÉCNICA FLIP)
 */
function shuffleAnimation(cards, items, callback) {
  const initialPositions = new Map();
  cards.forEach((card) => {
    initialPositions.set(card, card.getBoundingClientRect());
  });

  shuffleArray(items);

  const parent = cards[0].parentElement;
  items.forEach((item) => {
    const cardElement = Array.from(cards).find(
      (c) => c.dataset.index == item.originalIndex
    );
    parent.appendChild(cardElement);
  });

  cards.forEach((card) => {
    const initialRect = initialPositions.get(card);
    const finalRect = card.getBoundingClientRect();
    const deltaX = initialRect.left - finalRect.left;
    const deltaY = initialRect.top - finalRect.top;
    card.style.transition = "none";
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  void parent.offsetWidth;

  cards.forEach((card) => {
    card.style.transition =
      "transform 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
    card.style.transform = "";
    card.style.zIndex = 100;
  });

  setTimeout(() => {
    cards.forEach((card) => {
      card.style.transition = "";
      card.style.zIndex = "";
    });
    if (typeof callback === "function") callback();
  }, 750);
}

// Função que gerencia a remoção de estrelas
function removeStar() {
  if (AppState.currentGame.stars > 0) {
    AppState.currentGame.stars--;
    updateGameUI();
  }
}

// Inicia o cronômetro para penalidade de tempo
function startTimePenaltyTimer() {
  if (AppState.currentGame.timer) {
    clearInterval(AppState.currentGame.timer);
  }

  let minutesPassed = 0;
  const ONE_MINUTE = 60000;

  AppState.currentGame.timer = setInterval(() => {
    const elapsedTime = Date.now() - AppState.currentGame.startTime;

    if (elapsedTime > (minutesPassed + 1) * ONE_MINUTE) {
      minutesPassed++;
      removeStar();
    }
  }, 1000);
}

/**
 * Função principal de inicialização do jogo
 */
function initMemoryGame(phase) {
  const classes = getClassesForPhase(phase);
  const board = document.getElementById("game-board");

  AppState.currentGame.stars = 3;
  AppState.currentGame.errors = 0;
  AppState.currentGame.startTime = Date.now();
  updateGameUI();

  const items = classes.flatMap((classItem, index) => {
    const originalNameIndex = index * 2;
    const originalSymbolIndex = index * 2 + 1;
    const nameCard = {
      id: classItem.id,
      name: classItem.name,
      content: classItem.name,
      type: "name",
      matched: false,
      originalIndex: originalNameIndex,
    };
    const symbolCard = {
      id: classItem.id,
      name: classItem.name,
      content: classItem.symbol("w-full h-full p-1 sm:p-2"),
      type: "symbol",
      matched: false,
      originalIndex: originalSymbolIndex,
    };
    return [nameCard, symbolCard];
  });

  memoryState = {
    items,
    firstPick: null,
    secondPick: null,
    lockBoard: true,
    matches: 0,
    totalPairs: classes.length,
  };

  board.innerHTML = generateBoardHTML(items, phase);
  const cards = board.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("click", () => handleMemoryClick(card));
  });

  cards.forEach((card) => card.classList.add("flipped"));
  document.getElementById("game-message").textContent = "Memorize os pares!";

  const previewTime = phase === 1 ? 10000 : 15000;

  setTimeout(() => {
    cards.forEach((card) => card.classList.remove("flipped"));
    document.getElementById("game-message").textContent = "Embaralhando...";

    setTimeout(() => {
      shuffleAnimation(cards, memoryState.items, () => {
        memoryState.lockBoard = false;
        document.getElementById("game-message").textContent =
          "Encontre os pares!";
        startTimePenaltyTimer();
      });
    }, 500);
  }, previewTime);
}

function handleMemoryClick(cardElement) {
  if (memoryState.lockBoard || AppState.currentGame.stars === 0) return;

  const originalIndex = parseInt(cardElement.dataset.index, 10);
  const item = memoryState.items.find(
    (it) => it.originalIndex === originalIndex
  );

  if (!item || cardElement.classList.contains("flipped") || item.matched)
    return;

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
      if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
      setTimeout(() => showPhaseEndModal(true), 500); // Sucesso
    }
  } else {
    GameAudio.play("error");
    AppState.currentGame.errors++;

    // Penalidade a cada 10 pares errados
    if (
      AppState.currentGame.errors > 0 &&
      AppState.currentGame.errors % 10 === 0
    ) {
      removeStar();
    }

    if (AppState.currentGame.stars === 0) {
      document.getElementById("game-message").textContent =
        "Você perdeu todas as estrelas!";
      if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
      setTimeout(() => showPhaseEndModal(false), 1500); // Falha
    }

    setTimeout(() => {
      if (AppState.currentGame.stars > 0) {
        // Não vira a carta se o jogo já acabou
        firstPick.el.classList.remove("flipped");
        secondPick.el.classList.remove("flipped");
        resetMemoryTurn();
      }
    }, 1500);
  }
}

function resetMemoryTurn() {
  memoryState.firstPick = null;
  memoryState.secondPick = null;
  if (AppState.currentGame.stars > 0) {
    memoryState.lockBoard = false;
  }
}
