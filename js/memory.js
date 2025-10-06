/**
 * js/memory.js
 */

let memoryState = {};

// function formatTime(ms) {
//   const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
//   const min = Math.floor(totalSeconds / 60);
//   const sec = totalSeconds % 60;
//   return `${min.toString().padStart(2, '0')}:${sec
//     .toString()
//     .padStart(2, '0')}`;
// }

// // Objeto para criar e controlar temporizadores
// function createTimer(duration, onUpdate, onEnd) {
//   let timerId = null;
//   let remaining = duration;
//   let endTime = Date.now() + remaining;
//   let isPaused = false;
//   let isStopped = false; // Nova flag

//   function update() {
//     if (!isPaused && !isStopped) {
//       remaining = Math.max(0, endTime - Date.now());
//       onUpdate(remaining);
//       if (remaining <= 0) {
//         stop();
//         if (onEnd) onEnd();
//       }
//     }
//   }

//   function stop() {
//     if (timerId) {
//       clearInterval(timerId);
//       timerId = null;
//     }
//     isStopped = true; // Marca como parado
//   }

//   function pause() {
//     isPaused = true;
//   }

//   function resume() {
//     if (!isStopped) {
//       // Só resume se não foi parado
//       isPaused = false;
//       endTime = Date.now() + remaining;
//     }
//   }

//   timerId = setInterval(update, 1000);
//   update();

//   return { pause, resume, stop };
// }

// window.pauseMemoryTimer = function () {
//   if (memoryState.previewTimer) memoryState.previewTimer.pause();
//   if (memoryState.gameTimer) memoryState.gameTimer.pause();
// };

// window.resumeMemoryTimer = function () {
//   if (memoryState.previewTimer) memoryState.previewTimer.resume();
//   if (memoryState.gameTimer) memoryState.gameTimer.resume();

//   // CORREÇÃO: Só destranca o tabuleiro se o jogo principal já tiver começado
//   if (memoryState.gameTimer) {
//     memoryState.lockBoard = false;
//   }
// };

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
        

        ${items
          .map((item, index) => {
            // Since we process pairs, only create a pair for every other item.
            if (index % 2 !== 0) return '';

            const nameCard = items[index];
            const symbolCard = items[index + 1];

            return `
            <div class="card-pair">
              ${createCardHTML(nameCard, nameCard.originalIndex)}
              ${createCardHTML(symbolCard, symbolCard.originalIndex)}
            </div>
          `;
          })
          .join('')}
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

  const cards = boardElement.querySelectorAll('.card');

  cards.forEach((card) => {
    card.addEventListener('click', () => handleMemoryClick(card));
  });

  cards.forEach((card) => card.classList.add('flipped'));
  document.getElementById('game-message').textContent = 'Memorize os pares!';

  // Garantir que o botão de pular esteja visível após setup da UI
  setTimeout(() => {
    const skipBtn = document.getElementById('skip-timer-btn');
    if (skipBtn) {
      skipBtn.style.display = 'inline-block';
      console.log('Skip button made visible'); // Debug
    } else {
      console.log('Skip button not found!'); // Debug
    }
  }, 100);

  // const { timerMinutes, previewTime } =
  //   GameConfig.memory.levels.find((l) => l.phase === phase) || {};

  // function handlePreviewEnd() {
  //   cards.forEach((card) => card.classList.remove('flipped'));
  //   document.getElementById('game-message').textContent = 'Embaralhando...';

  //   // Ocultar botão de pular quando o preview termina
  //   const skipButton = document.getElementById('skip-timer-btn');
  //   if (skipButton) {
  //     skipButton.style.display = 'none';
  //   }

  //   // Criar o timer do jogo imediatamente, mas pausado
  //   const gameTimerDuration = (timerMinutes || 3) * 60000;
  //   memoryState.gameTimer = createTimer(
  //     gameTimerDuration,
  //     (remaining) => {
  //       const timerEl = document.getElementById('game-timer');
  //       if (timerEl) {
  //         timerEl.textContent = formatTime(remaining);
  //       }
  //     },
  //     () => {
  //       memoryState.lockBoard = true;
  //       showPhaseEndModal(false);
  //     }
  //   );

  //   // Pausar imediatamente após criação
  //   memoryState.gameTimer.pause();

  //   setTimeout(() => {
  //     shuffleAnimation(cards);
  //     setTimeout(() => {
  //       memoryState.lockBoard = false;
  //       document.getElementById('game-message').textContent =
  //         'Encontre os pares!';

  //       // Retomar o timer do jogo
  //       if (memoryState.gameTimer) {
  //         memoryState.gameTimer.resume();
  //       }
  //     }, 800);
  //   }, 600);
  // }

  // // Configurar botão de pular
  // const skipButton = document.getElementById('skip-timer-btn');
  // if (skipButton) {
  //   // Remover listeners anteriores para evitar duplicação
  //   skipButton.replaceWith(skipButton.cloneNode(true));
  //   const newSkipButton = document.getElementById('skip-timer-btn');

  //   newSkipButton.addEventListener('click', () => {
  //     console.log('Skip button clicked'); // Debug

  //     // Para o timer de preview
  //     if (memoryState.previewTimer) {
  //       memoryState.previewTimer.stop();
  //       memoryState.previewTimer = null;
  //     }

  //     // Executar imediatamente o fim do preview
  //     handlePreviewEnd();
  //   });
  // }

  // memoryState.previewTimer = createTimer(
  //   previewTime || 10000,
  //   (remaining) => {
  //     const timerEl = document.getElementById('game-timer');
  //     if (timerEl) timerEl.textContent = formatTime(remaining);
  //   },
  //   handlePreviewEnd
  // );
}

function startMemoryGamePlay() {
  memoryState.lockBoard = false;
  const board = document.getElementById('game-board');

  if (board) {
    board
      .querySelectorAll('.card')
      .forEach((card) => card.classList.remove('flipped'));
    GameAudio.play('shuffle');
    document.getElementById('game-message').textContent = 'Encontre os pares!';
    shuffleAnimation(board.querySelectorAll('.card'));
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
