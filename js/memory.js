/**
 * js/memory.js
 */

let memoryTimerInterval = null;
let memoryTimerEnd = null;
let memoryTimerPaused = false;
let memoryTimerRemaining = 0;

let previewTimerInterval = null;
let previewTimerEnd = null;
let previewTimerRemaining = 0;
let previewTimerPaused = false;

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec
    .toString()
    .padStart(2, '0')}`;
}

function updatePreviewTimer() {
  let remaining;
  if (previewTimerPaused) {
    remaining = previewTimerRemaining;
  } else {
    remaining = Math.max(0, previewTimerEnd - Date.now());
    previewTimerRemaining = remaining;
  }
  const timerEl = document.getElementById('game-timer'); // ID Genérico
  if (timerEl) {
    timerEl.textContent = formatTime(remaining);
  }
}

function startPreviewTimer(duration) {
  clearInterval(previewTimerInterval);
  previewTimerPaused = false;
  previewTimerEnd = Date.now() + duration;
  previewTimerRemaining = duration;
  updatePreviewTimer();
  previewTimerInterval = setInterval(updatePreviewTimer, 100);
}

function pausePreviewTimer() {
  if (!previewTimerPaused) {
    previewTimerPaused = true;
    clearInterval(previewTimerInterval);
  }
}

function resumePreviewTimer() {
  if (previewTimerPaused) {
    previewTimerPaused = false;
    previewTimerEnd = Date.now() + previewTimerRemaining;
    previewTimerInterval = setInterval(updatePreviewTimer, 100);
  }
}

function updateMemoryTimer() {
  let remaining;
  if (memoryTimerPaused) {
    remaining = memoryTimerRemaining;
  } else {
    remaining = Math.max(0, memoryTimerEnd - Date.now());
  }
  const timerEl = document.getElementById('game-timer'); // ID Genérico
  if (timerEl) {
    timerEl.textContent = formatTime(remaining);
  }
  if (!memoryTimerPaused && remaining <= 0) {
    clearInterval(memoryTimerInterval);
    if (typeof showPhaseEndModal === 'function') showPhaseEndModal(false);
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

// Funções globais para serem chamadas pelo main.js
window.pauseMemoryTimer = function () {
  if (!memoryTimerPaused) {
    memoryTimerPaused = true;
    memoryTimerRemaining = Math.max(0, memoryTimerEnd - Date.now());
    clearInterval(memoryTimerInterval);
    updateMemoryTimer();
    if (memoryState) memoryState.lockBoard = true;
  }
};

window.resumeMemoryTimer = function () {
  if (memoryTimerPaused) {
    memoryTimerPaused = false;
    memoryTimerEnd = Date.now() + memoryTimerRemaining;
    updateMemoryTimer();
    memoryTimerInterval = setInterval(updateMemoryTimer, 1000);
    if (memoryState) memoryState.lockBoard = false;
  }
};

let memoryState = {};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createCardHTML(item, index) {
  let cardBackContent;
  if (item.type === 'name') {
    const grammarClass = GRAMMAR_CLASSES.find((gc) => gc.id === item.id);
    cardBackContent = `
      <div class="relative w-full h-full flex items-center justify-center">
        <div class="absolute inset-0 p-1 sm:p-2 card-name-symbol-bg">
          ${grammarClass.symbol('w-full h-full')}
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
          <img src="./assets/img/card-logo.svg" alt="Verso da Carta" class="w-full h-full object-contain">
        </div>
        <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">
          ${cardBackContent}
        </div>
      </div>
    </div>`;
}

function generateBoardHTML(items, phase) {
  let pairsHTML = [];
  for (let i = 0; i < items.length; i += 2) {
    const nameCard = items[i];
    const symbolCard = items[i + 1];
    pairsHTML.push(`
      <div class="card-pair">
        ${createCardHTML(nameCard, nameCard.originalIndex)}
        ${createCardHTML(symbolCard, symbolCard.originalIndex)}
      </div>
    `);
  }

  const midPoint = Math.ceil(pairsHTML.length / 2);
  const column1 = pairsHTML.slice(0, midPoint).join('');
  const column2 = pairsHTML.slice(midPoint).join('');

  const phaseClass = `memory-board-phase-${phase}`;
  return `
    <div class="memory-board-container preview-mode ${phaseClass}">
        <div class="memory-column">${column1}</div>
        <div class="memory-column">${column2}</div>
    </div>`;
}

function shuffleAnimation(cards) {
  const boardContainer = document.querySelector('.memory-board-container');
  const initialPositions = new Map();

  cards.forEach((card) => {
    initialPositions.set(card, card.getBoundingClientRect());
  });

  boardContainer.classList.remove('preview-mode');

  const columnsAndPairs = boardContainer.querySelectorAll(
    '.memory-column, .card-pair'
  );
  columnsAndPairs.forEach((el) => {
    while (el.firstChild) {
      boardContainer.appendChild(el.firstChild);
    }
    el.remove();
  });

  shuffleArray(Array.from(cards)).forEach((card) =>
    boardContainer.appendChild(card)
  );

  cards.forEach((card) => {
    const finalRect = card.getBoundingClientRect();
    const initialRect = initialPositions.get(card);

    const deltaX = initialRect.left - finalRect.left;
    const deltaY = initialRect.top - finalRect.top;

    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  void boardContainer.offsetWidth;

  cards.forEach((card) => {
    card.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    card.style.transform = '';
  });

  setTimeout(() => {
    cards.forEach((card) => {
      card.style.transition = '';
    });
  }, 800);
}

function removeStar() {
  if (AppState.currentGame.stars > 0) {
    AppState.currentGame.stars--;
  }
}

function initMemoryGame(phase) {
  clearInterval(memoryTimerInterval);
  clearInterval(previewTimerInterval);
  memoryTimerEnd = null;
  previewTimerPaused = false;
  memoryTimerPaused = false;

  const classes = getClassesForPhase(phase);
  const boardElement = document.getElementById('game-board');

  AppState.currentGame.stars = 3;
  AppState.currentGame.errors = 0;
  AppState.currentGame.startTime = Date.now();

  const items = classes.flatMap((classItem, index) => {
    const originalNameIndex = index * 2;
    const originalSymbolIndex = index * 2 + 1;
    return [
      {
        id: classItem.id,
        name: classItem.name,
        content: classItem.name,
        type: 'name',
        matched: false,
        originalIndex: originalNameIndex,
      },
      {
        id: classItem.id,
        name: classItem.name,
        content: classItem.symbol('w-full h-full p-1 sm:p-2'),
        type: 'symbol',
        matched: false,
        originalIndex: originalSymbolIndex,
      },
    ];
  });

  memoryState = {
    items,
    firstPick: null,
    secondPick: null,
    lockBoard: true,
    matches: 0,
    totalPairs: classes.length,
  };

  boardElement.innerHTML = generateBoardHTML(items, phase);

  const cards = boardElement.querySelectorAll('.card');

  cards.forEach((card) => {
    card.addEventListener('click', () => handleMemoryClick(card));
  });

  cards.forEach((card) => card.classList.add('flipped'));
  document.getElementById('game-message').textContent = 'Memorize os pares!';

  const { timerMinutes, previewTime } =
    GameConfig.memory.levels.find((l) => l.phase === phase) || {};

  startPreviewTimer(previewTime || 10000);

  function handlePreviewEnd() {
    clearInterval(previewTimerInterval);
    cards.forEach((card) => card.classList.remove('flipped'));
    document.getElementById('game-message').textContent = 'Embaralhando...';

    setTimeout(() => {
      shuffleAnimation(cards);
      setTimeout(() => {
        memoryState.lockBoard = false;
        document.getElementById('game-message').textContent =
          'Encontre os pares!';
        startMemoryTimer(timerMinutes || 3);
      }, 800);
    }, 600);
  }

  const checkPreviewEndInterval = setInterval(() => {
    if (previewTimerRemaining <= 0 && !previewTimerPaused) {
      clearInterval(checkPreviewEndInterval);
      handlePreviewEnd();
    }
  }, 100);
}

function handleMemoryClick(cardElement) {
  if (memoryState.lockBoard || AppState.currentGame.stars === 0) return;

  const originalIndex = parseInt(cardElement.dataset.index, 10);
  const item = memoryState.items.find(
    (it) => it.originalIndex === originalIndex
  );

  if (!item || cardElement.classList.contains('flipped') || item.matched)
    return;

  GameAudio.play('flip');
  cardElement.classList.add('flipped');

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
    GameAudio.play('match');
    memoryState.matches++;
    firstPick.item.matched = true;
    secondPick.item.matched = true;
    firstPick.el.classList.add('card-matched');
    secondPick.el.classList.add('card-matched');
    resetMemoryTurn();
    if (memoryState.matches === memoryState.totalPairs) {
      if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
      clearInterval(memoryTimerInterval);
      setTimeout(() => showPhaseEndModal(true), 500);
    }
  } else {
    GameAudio.play('error');
    AppState.currentGame.errors++;
    if (
      AppState.currentGame.errors > 0 &&
      AppState.currentGame.errors % 10 === 0
    ) {
      removeStar();
    }
    if (AppState.currentGame.stars === 0) {
      document.getElementById('game-message').textContent =
        'Você perdeu todas as estrelas!';
      if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
      setTimeout(() => showPhaseEndModal(false), 1500);
    }
    setTimeout(() => {
      if (AppState.currentGame.stars > 0) {
        firstPick.el.classList.remove('flipped');
        secondPick.el.classList.remove('flipped');
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
