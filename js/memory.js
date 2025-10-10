/**
 * js/memory.js
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

  const phaseClass = `memory-board-phase-${phase}`;

  // Inserir cartas invisíveis na penúltima posição para fases 2 e 3
  if (phase === 2 || phase === 3) {
    const invisiblePair = `
      <div class="card-pair invisible-cards" style="opacity: 0;">
        <div class="card invisible-card">
          <div class="card-inner relative w-full h-full">
            <div class="card-front absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2">
              <img src="./assets/img/card-logo.svg" alt="Verso da Carta" class="w-full h-full object-contain">
            </div>
            <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">
              DEBUG 1
            </div>
          </div>
        </div>
        <div class="card invisible-card">
          <div class="card-inner relative w-full h-full">
            <div class="card-front absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2">
              <img src="./assets/img/card-logo.svg" alt="Verso da Carta" class="w-full h-full object-contain">
            </div>
            <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base">
              DEBUG 2
            </div>
          </div>
        </div>
      </div>
    `;

    // Inserir na posição correta: penúltima para fase 2, antepenúltima para fase 3
    let insertPosition;
    if (phase === 2) {
      insertPosition = pairsHTML.length - 1; // Penúltima posição
    } else if (phase === 3) {
      insertPosition = pairsHTML.length - 2; // Antepenúltima posição
    }

    pairsHTML.splice(insertPosition, 0, invisiblePair);
  }

  return `
    <div class="memory-board-container preview-mode ${phaseClass}">
        ${pairsHTML.join('')}
    </div>`;
}

function shuffleAnimation(cards) {
  const boardContainer = document.querySelector('.memory-board-container');
  const initialPositions = new Map();

  // Remover cartas invisíveis antes da animação
  const invisibleCards = boardContainer.querySelectorAll('.invisible-cards');
  invisibleCards.forEach((invisiblePair) => invisiblePair.remove());

  // Filtrar apenas as cartas reais (excluir invisíveis)
  const realCards = Array.from(cards).filter(
    (card) => !card.classList.contains('invisible-card')
  );

  realCards.forEach((card) => {
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

  shuffleArray(Array.from(realCards)).forEach((card) =>
    boardContainer.appendChild(card)
  );

  realCards.forEach((card) => {
    const finalRect = card.getBoundingClientRect();
    const initialRect = initialPositions.get(card);
    const deltaX = initialRect.left - finalRect.left;
    const deltaY = initialRect.top - finalRect.top;
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  void boardContainer.offsetWidth;

  realCards.forEach((card) => {
    card.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    card.style.transform = '';
  });

  setTimeout(() => {
    realCards.forEach((card) => {
      card.style.transition = '';
    });
  }, 800);
}

function removeStar() {
  if (AppState.currentGame.stars > 0) {
    AppState.currentGame.stars--;
  }
}

window.cleanupMemoryGame = function (hideSkipButton = true) {
  console.log('Cleaning up memory game...'); // Debug

  // Parar timers
  if (memoryState.previewTimer) {
    console.log('Stopping preview timer'); // Debug
    memoryState.previewTimer.stop();
    memoryState.previewTimer = null;
  }
  if (memoryState.gameTimer) {
    console.log('Stopping game timer'); // Debug
    memoryState.gameTimer.stop();
    memoryState.gameTimer = null;
  }

  // Reset completo do estado
  memoryState = {
    items: [],
    firstPick: null,
    secondPick: null,
    lockBoard: true,
    matches: 0,
    totalPairs: 0,
    previewTimer: null,
    gameTimer: null,
  };

  // Limpar elementos visuais
  const timerEl = document.getElementById('game-timer');
  if (timerEl) {
    timerEl.textContent = '00:00';
  }

  const messageEl = document.getElementById('game-message');
  if (messageEl) {
    messageEl.textContent = '';
  }

  // Ocultar botão de pular apenas se solicitado
  if (hideSkipButton) {
    const skipButton = document.getElementById('skip-timer-btn');
    if (skipButton) {
      skipButton.style.display = 'none';
    }
  }

  console.log('Memory game cleanup completed'); // Debug
};

function initMemoryGame(phase) {
  // Limpar estado anterior PRIMEIRO, mas manter o botão visível
  window.cleanupMemoryGame(false);

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
    previewTimer: null,
    gameTimer: null,
  };

  boardElement.innerHTML = generateBoardHTML(items, phase);

  const cards = boardElement.querySelectorAll('.card:not(.invisible-card)');

  cards.forEach((card) => {
    card.addEventListener('click', () => handleMemoryClick(card));
  });

  // Flip all real cards to show them (not invisible ones)
  cards.forEach((card) => card.classList.add('flipped'));
  document.getElementById('game-message').textContent = 'Memorize os pares!';

  // Get preview time from config
  const config = GameConfig.memory.levels[phase - 1];
  const previewTime = config.previewTime; // in milliseconds
  const previewSeconds = previewTime / 1000; // convert to seconds

  // Start countdown timer for preview
  Timer.startCountdown(previewSeconds, () => {
    // Check if game is paused before starting main timer
    if (AppState.isPaused) {
      console.log('[Memory] Game is paused, not starting main timer yet');
      return;
    }

    // After countdown, flip cards back
    cards.forEach((card) => card.classList.remove('flipped'));

    // Start main game timer
    const timerMinutes = config.timerMinutes;
    Timer.start(timerMinutes);

    // Unlock board for gameplay
    memoryState.lockBoard = false;

    document.getElementById('game-message').textContent = 'Encontre os pares!';
  });

  // Garantir que o botão de pular esteja visível após setup da UI
  setTimeout(() => {
    const skipBtn = document.getElementById('skip-timer-btn');
    if (skipBtn) {
      skipBtn.style.display = 'inline-block';
      console.log('Skip button made visible');
    } else {
      console.log('Skip button not found!');
    }
  }, 100);
}

function startMemoryGamePlay() {
  memoryState.lockBoard = false;
  const board = document.getElementById('game-board');

  if (board) {
    // Filtrar apenas cartas reais (não invisíveis)
    const realCards = board.querySelectorAll('.card:not(.invisible-card)');
    realCards.forEach((card) => card.classList.remove('flipped'));
    GameAudio.play('shuffle');
    document.getElementById('game-message').textContent = 'Encontre os pares!';
    shuffleAnimation(realCards);
  }
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
      if (memoryState.gameTimer) memoryState.gameTimer.stop();
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
      if (memoryState.gameTimer) memoryState.gameTimer.stop();
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

// Pause/Resume functions for memory game
window.pauseMemoryGame = function () {
  memoryState.lockBoard = true;
};

window.resumeMemoryGame = function () {
  // Only unlock if preview time is over
  if (!Timer.isPreview) {
    memoryState.lockBoard = false;
  }
};
