/**
 * js/memory.js
 */

let memoryState = {};

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec
    .toString()
    .padStart(2, '0')}`;
}

// Objeto para criar e controlar temporizadores
function createTimer(duration, onUpdate, onEnd) {
  let timerId = null;
  let remaining = duration;
  let endTime = Date.now() + remaining;
  let isPaused = false;

  function update() {
    if (!isPaused) {
      remaining = Math.max(0, endTime - Date.now());
      onUpdate(remaining);
      if (remaining <= 0) {
        stop();
        if (onEnd) onEnd();
      }
    }
  }

  function stop() {
    clearInterval(timerId);
    timerId = null;
  }

  function pause() {
    isPaused = true;
  }

  function resume() {
    isPaused = false;
    endTime = Date.now() + remaining;
  }

  timerId = setInterval(update, 100);
  update();

  return { pause, resume, stop };
}

// Funções globais para serem chamadas pelo main.js
window.pauseMemoryTimer = function () {
  if (memoryState.previewTimer) memoryState.previewTimer.pause();
  if (memoryState.gameTimer) memoryState.gameTimer.pause();
  memoryState.lockBoard = true;
};

window.resumeMemoryTimer = function () {
  if (memoryState.previewTimer) memoryState.previewTimer.resume();
  if (memoryState.gameTimer) memoryState.gameTimer.resume();

  // CORREÇÃO: Só destranca o tabuleiro se o jogo principal já tiver começado
  if (memoryState.gameTimer) {
    memoryState.lockBoard = false;
  }
};

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
      <div class="card-inner relative w-full h-full transition-transform duration-400 ease-in-out transform-style-preserve-3d">
        <div class="card-front absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 backface-hidden">
          <img src="./assets/img/card-logo.svg" alt="Verso da Carta" class="w-full h-full object-contain">
        </div>
        <div class="card-back absolute w-full h-full bg-white rounded-lg flex items-center justify-center p-2 text-center font-bold text-xs sm:text-sm md:text-base backface-hidden rotate-y-180">
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

  // Captura as posições iniciais das cartas
  const initialPositions = new Map();
  cards.forEach((card) => {
    initialPositions.set(card, card.getBoundingClientRect());
  });

  // Remove modo preview e desabilita interação
  boardContainer.classList.remove('preview-mode');
  boardContainer.style.pointerEvents = 'none';

  // Remove estrutura de colunas e card-pairs para layout simples
  const columnsAndPairs = boardContainer.querySelectorAll(
    '.memory-column, .card-pair'
  );
  columnsAndPairs.forEach((el) => {
    while (el.firstChild) {
      boardContainer.appendChild(el.firstChild);
    }
    el.remove();
  });

  // Embaralha as cartas
  const shuffledCards = Array.from(cards);
  shuffleArray(shuffledCards);

  // Limpa e reorganiza as cartas
  while (boardContainer.firstChild) {
    boardContainer.removeChild(boardContainer.firstChild);
  }

  shuffledCards.forEach((card) => {
    // Garante que carta esteja no estado correto (virada para frente)
    const cardInner = card.querySelector('.card-inner');
    cardInner.style.transition = 'transform 0.4s ease-in-out';
    cardInner.style.transform = '';
    card.classList.remove('flipped');
    boardContainer.appendChild(card);
  });

  // Força layout para obter posições finais
  boardContainer.offsetHeight;

  // Animação FLIP: cada carta se move da posição inicial para final
  cards.forEach((card) => {
    const finalRect = card.getBoundingClientRect();
    const initialRect = initialPositions.get(card);

    if (initialRect && finalRect) {
      const deltaX = initialRect.left - finalRect.left;
      const deltaY = initialRect.top - finalRect.top;

      // Posiciona carta na posição inicial instantaneamente
      card.style.transition = 'none';
      card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Anima para posição final
      requestAnimationFrame(() => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transform = 'translate(0px, 0px)';
      });
    }
  });

  // Finaliza animação
  setTimeout(() => {
    cards.forEach((card) => {
      card.style.transition = '';
      card.style.transform = '';
    });
    boardContainer.style.pointerEvents = 'auto';
  }, 700);
}

function removeStar() {
  if (AppState.currentGame.stars > 0) {
    AppState.currentGame.stars--;
  }
}

function initMemoryGame(phase) {
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

  // Limpa timers antigos antes de resetar o estado
  if (memoryState.previewTimer) memoryState.previewTimer.stop();
  if (memoryState.gameTimer) memoryState.gameTimer.stop();

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

  // Remove event listeners antigos (se houver)
  const oldCards = boardElement.querySelectorAll('.card');
  oldCards.forEach((card) => {
    card.replaceWith(card.cloneNode(true));
  });

  const cards = boardElement.querySelectorAll('.card');
  const boardContainer = boardElement.querySelector('.memory-board-container');
  const cardsArray = Array.from(cards);

  cards.forEach((card) => {
    card.addEventListener('click', () => handleMemoryClick(card));
  });

  cards.forEach((card) => card.classList.add('flipped'));
  document.getElementById('game-message').textContent = 'Memorize os pares!';

  // Reinicia o texto do cronômetro ao entrar na fase
  const timerEl = document.getElementById('game-timer');
  if (timerEl)
    timerEl.textContent = formatTime(
      (GameConfig.memory.levels.find((l) => l.phase === phase)?.timerMinutes ||
        3) * 60000
    );

  const { timerMinutes, previewTime } =
    GameConfig.memory.levels.find((l) => l.phase === phase) || {};

  async function handlePreviewEnd() {
    // Adicione 'async' aqui
    // Fase 1: Virar as cartas para baixo de forma cascata (animação)
    document.getElementById('game-message').textContent = 'Virando cartas...';
    cardsArray.forEach((card, index) => {
      setTimeout(() => {
        const cardInner = card.querySelector('.card-inner');
        cardInner.style.transition = 'transform 0.4s ease-in-out';
        cardInner.style.transform = 'rotateY(0deg)';
        card.classList.remove('flipped');
      }, index * 50);
    });

    // Após todas as cartas virarem para baixo, inicia o embaralhamento
    setTimeout(
      () => {
        document.getElementById('game-message').textContent = 'Embaralhando...';

        // Chama a animação de embaralhamento
        shuffleAnimation(cardsArray);

        // Após o embaralhamento, libera o jogo
        setTimeout(() => {
          memoryState.lockBoard = false;
          document.getElementById('game-message').textContent =
            'Encontre os pares!';
          // Exibe o timer da fase (força display padrão)
          const timerEl = document.getElementById('game-timer');
          if (timerEl) {
            timerEl.style.display = '';
            // Atualiza o texto do timer para o tempo total da fase
            timerEl.textContent = formatTime((timerMinutes || 3) * 60000);
          }
          // Garante que não há múltiplos timers
          if (memoryState.gameTimer) memoryState.gameTimer.stop();
          memoryState.gameTimer = createTimer(
            (timerMinutes || 3) * 60000,
            (remaining) => {
              const timerEl = document.getElementById('game-timer');
              if (timerEl) timerEl.textContent = formatTime(remaining);
            },
            () => {
              memoryState.lockBoard = true;
              showPhaseEndModal(false);
            }
          );
        }, 800); // Tempo para animação de embaralhamento
      },
      cardsArray.length * 50 + 300
    ); // Delay após cascata de virada
  }

  // --- Integração com botão de pular ---
  const skipBtn = document.getElementById('skip-timer-btn');
  if (skipBtn) {
    skipBtn.onclick = () => {
      if (memoryState.previewTimer) memoryState.previewTimer.stop();
      // Esconde timer e botão imediatamente
      skipBtn.style.display = 'none';
      const timerEl = document.getElementById('game-timer');
      if (timerEl) timerEl.style.display = 'none';
      handlePreviewEnd();
    };
  }

  // Substitui o onEnd do previewTimer para usar handlePreviewEnd diretamente
  if (memoryState.previewTimer) memoryState.previewTimer.stop();
  if (memoryState.gameTimer) memoryState.gameTimer.stop();
  memoryState.previewTimer = createTimer(
    previewTime || 10000,
    (remaining) => {
      const timerEl = document.getElementById('game-timer');
      if (timerEl) timerEl.textContent = formatTime(remaining);
    },
    handlePreviewEnd
  );

  return function cleanupMemoryGame() {
    if (memoryState.previewTimer) memoryState.previewTimer.stop();
    if (memoryState.gameTimer) memoryState.gameTimer.stop();
    memoryState = {}; // Limpa o estado
  };
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
