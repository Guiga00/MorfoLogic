/**
 * Módulo do Minijogo da Memória
 * Contém toda a lógica de funcionamento do Jogo da Memória.
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
    <div class="card perspective-1000" data-index="${index}">
      <div class="card-inner relative w-full h-full">
        <div class="card-front absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2">
          <img src="https://placehold.co/100x100/14b8a6/ffffff?text=Logo" alt="Verso da Carta" class="w-full h-full object-contain">
        </div>
        <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">
          ${cardBackContent}
        </div>
      </div>
    </div>`;
}

// Função para gerar o HTML do tabuleiro, agora muito mais simples
function generateBoardHTML(items, phase) {
  const allCardsHTML = items
    .map((item) => createCardHTML(item, item.originalIndex))
    .join("");
  // A classe de fase controla o layout via CSS
  const phaseClass = `memory-board-phase-${phase}`;
  return `<div class="memory-board-container ${phaseClass}">${allCardsHTML}</div>`;
}

/**
 * ANIMAÇÃO DE EMBARALHAMENTO (TÉCNICA FLIP COM "EMPATE FORÇADO")
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
    if (cardElement) {
      parent.appendChild(cardElement);
    }
  });

  cards.forEach((card) => {
    const initialRect = initialPositions.get(card);
    const finalRect = card.getBoundingClientRect();
    let deltaX = initialRect.left - finalRect.left;
    let deltaY = initialRect.top - finalRect.top;

    const randomX = (Math.random() - 0.5) * 50;
    const randomY = (Math.random() - 0.5) * 50;

    card.style.transition = "none";
    card.style.transform = `translate(${deltaX + randomX}px, ${
      deltaY + randomY
    }px)`;
  });

  void parent.offsetWidth;

  cards.forEach((card) => {
    // **** ALTERAÇÃO AQUI: Curva de animação mais suave e maior duração ****
    card.style.transition = "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1.0)";
    card.style.transform = "";
    card.style.zIndex = 100;
  });

  setTimeout(() => {
    cards.forEach((card) => {
      card.style.transition = "";
      card.style.zIndex = "";
    });
    if (typeof callback === "function") callback();
  }, 850); // Aumentado para corresponder à nova duração
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
