// === CONTROLES DO NOVO LAYOUT ===
// Variáveis globais do timer
let memoryTimerInterval = null;
let memoryTimerEnd = null;
let memoryTimerPaused = false;
let memoryTimerRemaining = 0;

function updateMemoryTimer() {
  let remaining;
  if (memoryTimerPaused) {
    remaining = memoryTimerRemaining;
  } else {
    remaining = Math.max(0, memoryTimerEnd - Date.now());
  }
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  const timerEl = document.getElementById("memory-timer");
  if (timerEl) {
    timerEl.textContent = `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }
  if (!memoryTimerPaused && remaining <= 0) {
    clearInterval(memoryTimerInterval);
    if (typeof showPhaseEndModal === "function") showPhaseEndModal(false);
    memoryState.lockBoard = true;
  }
}
function startMemoryTimer(minutes) {
  clearInterval(memoryTimerInterval);
  memoryTimerPaused = false;
  memoryTimerEnd = Date.now() + minutes * 60000;
  updateMemoryTimer();
  memoryTimerInterval = setInterval(updateMemoryTimer, 1000);
}
function pauseMemoryTimer() {
  if (!memoryTimerPaused) {
    memoryTimerPaused = true;
    memoryTimerRemaining = Math.max(0, memoryTimerEnd - Date.now());
    clearInterval(memoryTimerInterval);
    updateMemoryTimer();
  }
}
function resumeMemoryTimer() {
  if (memoryTimerPaused) {
    memoryTimerPaused = false;
    memoryTimerEnd = Date.now() + memoryTimerRemaining;
    updateMemoryTimer();
    memoryTimerInterval = setInterval(updateMemoryTimer, 1000);
  }
}

// CONTROLES DO NOVO LAYOUT
document.addEventListener("DOMContentLoaded", () => {
  // Mute/Unmute
  const muteBtn = document.getElementById("memory-mute-btn");
  const muteIcon = document.getElementById("memory-mute-icon");
  let isMuted = false;
  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    muteIcon.innerHTML = isMuted ? "&#128263;" : "&#128266;";
    document.querySelectorAll("audio").forEach((a) => (a.muted = isMuted));
    if (window.AppState) AppState.globalMuted = isMuted;
  });

  const closeBtn = document.getElementById("memory-close-btn");
  const volumeSlider = document.getElementById("memory-volume"); // Volume control
  const playPauseBtn = document.getElementById("memory-playpause-btn");
  const playPauseIcon = document.getElementById("memory-playpause-icon");
  const playPauseLabel = document.getElementById("memory-playpause-label");

  // Timer de sessão global (AppState.sessionEndTime)
  let sessionTimerInterval;

  // Volume geral (conectado ao controle global)
  volumeSlider.addEventListener("input", (e) => {
    const vol = Number(e.target.value) / 100;
    if (window.setGlobalVolume) {
      setGlobalVolume(vol);
    } else {
      document.querySelectorAll("audio").forEach((a) => (a.volume = vol));
    }
    if (window.AppState) {
      AppState.globalVolume = vol;
    }
  });
  // Sincroniza slider com volume global
  if (window.AppState && typeof AppState.globalVolume === "number") {
    volumeSlider.value = Math.round(AppState.globalVolume * 100);
  }

  // Botão de fechar
  closeBtn.addEventListener("click", () => {
    if (typeof goToGameSelection === "function") {
      goToGameSelection();
    } else {
      document.getElementById("game-screen").classList.add("hidden");
      document
        .getElementById("game-selection-screen")
        .classList.remove("hidden");
    }
    clearInterval(sessionTimerInterval);
  });

  // Play/Pause do minigame
  let isPaused = false;
  playPauseBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    if (isPaused) {
      playPauseIcon.innerHTML = "&#9658;"; // Play
      memoryState.lockBoard = true;
      pauseMemoryTimer();
      clearInterval(sessionTimerInterval);
      // Pausa pontuação (timer de penalidade)
      if (AppState.currentGame && AppState.currentGame.timer) {
        clearInterval(AppState.currentGame.timer);
      }
    } else {
      playPauseIcon.innerHTML = "&#10073;&#10073;"; // Pause
      memoryState.lockBoard = false;
      resumeMemoryTimer();
      startSessionTimer();
      // Retoma pontuação (timer de penalidade)
      if (typeof startTimePenaltyTimer === "function") {
        startTimePenaltyTimer();
      }
    }
  });

  // Inicia timer ao entrar no minigame
  if (
    document.getElementById("game-screen") &&
    !document.getElementById("game-screen").classList.contains("hidden")
  ) {
    startSessionTimer();
  }
});
/**
 * Módulo do Minijogo da Memória
 */
let memoryState = {};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

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

function generateBoardHTML(items, phase) {
  const allCardsHTML = items
    .map((item) => createCardHTML(item, item.originalIndex))
    .join("");
  const phaseClass = `memory-board-phase-${phase}`;
  return `<div class="memory-board-container ${phaseClass}">${allCardsHTML}</div>`;
}

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

function removeStar() {
  if (AppState.currentGame.stars > 0) {
    AppState.currentGame.stars--;
    updateGameUI();
  }
}

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

  // Busca tempo da fase no GameConfig
  const config =
    window.GameConfig && GameConfig.memory && GameConfig.memory.levels
      ? GameConfig.memory.levels.find((l) => l.phase === phase)
      : null;
  const timerMinutes = config ? config.timerMinutes : 3;
  const previewTime = config ? config.previewTime : phase === 1 ? 10000 : 15000;

  // Timer começa assim que entra na fase
  startMemoryTimer(timerMinutes);
  // Força atualização visual do timer imediatamente
  setTimeout(updateMemoryTimer, 50);

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
