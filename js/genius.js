/**
 * js/genius.js
 * --- Sequential wave reveal with memory phase ---
 */

/**
 * Define a ordem de revelação progressiva para cada fase
 * Cada subarray representa uma rodada mostrando os índices das palavras
 */
const GENIUS_REVEAL_SEQUENCE = {
  1: [
    [2], // Rodada 1: "tesouro"
    [1, 2], // Rodada 2: "o tesouro"
    [1, 2, 3], // Rodada 3: "o tesouro perdido"
    [0, 1, 2, 3], // Rodada 4: "Encontramos o tesouro perdido"
  ],
  2: [
    [1], // Rodada 1: "Lanche"
    [0, 1], // Rodada 2: "Meu lanche"
    [0, 1, 2], // Rodada 3: "Meu lanche favorito"
    [0, 1, 2, 3], // Rodada 4: "Meu lanche favorito é"
    [0, 1, 2, 3, 4], // Rodada 5: "Meu lanche favorito é suco"
    [0, 1, 2, 3, 4, 5, 6], // Rodada 6: "Meu lanche favorito é suco e bolo"
    [0, 1, 2, 3, 4, 5, 6, 7, 8], // Rodada 7: "Meu lanche favorito é suco e bolo de chocolate"
  ],
  3: [
    [4], // Rodada 1: "Bonecas"
    [1, 4], // Rodada 2: "As bonecas"
    [1, 4, 5], // Rodada 3: "As bonecas novas"
    [1, 2, 4, 5], // Rodada 4: "As minhas bonecas novas"
    [1, 2, 3, 4, 5], // Rodada 5: "As minhas duas bonecas novas"
    [1, 2, 3, 4, 5, 8], // Rodada 6: "As minhas duas bonecas novas chegaram"
    [1, 2, 3, 4, 5, 8, 9], // Rodada 7: "As minhas duas bonecas novas chegaram hoje"
    [1, 2, 3, 4, 5, 8, 9, 10], // Rodada 8: "As minhas duas bonecas novas chegaram hoje em"
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Rodada 9: "As minhas duas bonecas novas e perfumadas chegaram hoje em"
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Rodada 10: "Oba! As minhas duas bonecas novas e perfumadas chegaram hoje em casa!"
  ],
};

const stillTime = 1200;
const flyTime = 1200;
let geniusState = {};

function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function initGeniusGame(phase) {
  // Clear any previous game instance
  if (geniusState.animationTimeouts) {
    geniusState.animationTimeouts.forEach(clearTimeout);
  }

  const originalPhraseData = GENIUS_PHRASES[phase].map((word, index) => ({
    ...word,
    originalIndex: index,
  }));

  const board = document.getElementById('game-board');
  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  geniusState = {
    phrase: originalPhraseData,
    revealSequence: GENIUS_REVEAL_SEQUENCE[phase], // Sequência de revelação
    currentRound: 0, // Rodada atual (0 = primeira rodada)
    revealedWords: [],
    currentInputIndex: 0,
    turn: 'computer',
    isTerminated: false,
    isPaused: false,
    animationTimeouts: [],
  };

  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8 p-4">
        <div id="genius-phrase" class="w-full min-h-[100px] flex flex-wrap items-center justify-center gap-x-4 gap-y-4"></div>
        <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg"></div>
    </div>
  `;

  const gameMessage = document.getElementById('game-message');
  if (gameMessage) gameMessage.textContent = 'Memorize a ordem!';

  // Start the wave game immediately
  startWave();
}

function startWave() {
  if (geniusState.currentRound >= geniusState.revealSequence.length) {
    // Todas as rodadas completas! Jogo terminado!
    endGeniusGame(true);
    return;
  }

  geniusState.turn = 'computer';

  // Pegar os índices das palavras para esta rodada
  const wordsToReveal = geniusState.revealSequence[geniusState.currentRound];

  // Resetar palavras reveladas para esta rodada
  geniusState.revealedWords = wordsToReveal.map(
    (originalIndex, revealIndex) => ({
      ...geniusState.phrase[originalIndex],
      originalIndex: originalIndex,
      revealIndex: revealIndex,
    })
  );

  // Mostrar animação
  showWaveAnimation(() => {
    geniusState.currentInputIndex = 0;
    renderPhraseForInput();
    geniusState.turn = 'player';

    const gameMessage = document.getElementById('game-message');
    if (gameMessage)
      gameMessage.textContent = 'Arraste os símbolos na ordem que apareceram!';
  });
}

function showWaveAnimation(callback) {
  const phraseContainer = document.getElementById('genius-phrase');
  const bankContainer = document.getElementById('genius-symbols-bank');

  phraseContainer.innerHTML = '';
  bankContainer.innerHTML = '';

  createShuffledBankSymbols();
  showNextWordInWave(0, callback);
}

function showNextWordInWave(wordIndex, finalCallback) {
  if (geniusState.isPaused) {
    setTimeout(() => showNextWordInWave(wordIndex, finalCallback), 100);
    return;
  }

  const phraseContainer = document.getElementById('genius-phrase');
  const wordsInRevealOrder = [...geniusState.revealedWords].sort(
    (a, b) => a.revealIndex - b.revealIndex
  );

  if (wordIndex >= wordsInRevealOrder.length) {
    transitionToInputPhase(finalCallback);
    return;
  }

  const wordData = wordsInRevealOrder[wordIndex];

  const wordDiv = document.createElement('div');
  wordDiv.className = 'flex flex-col items-center gap-2 reveal-animation';

  const wordText = document.createElement('span');
  wordText.className = 'text-sm font-medium text-gray-700';
  wordText.textContent = wordData.word;

  const symbolDiv = document.createElement('div');
  symbolDiv.className =
    'w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-md genius-flying-symbol';
  symbolDiv.innerHTML =
    typeof wordData.symbol === 'function'
      ? wordData.symbol('w-16 h-16')
      : wordData.symbol;
  symbolDiv.dataset.originalIndex = wordData.originalIndex;
  symbolDiv.dataset.revealIndex = wordData.revealIndex;

  wordDiv.appendChild(wordText);
  wordDiv.appendChild(symbolDiv);
  phraseContainer.appendChild(wordDiv);

  const timeout1 = setTimeout(() => {
    animateToBankPosition(symbolDiv, wordData.originalIndex, () => {
      revealBankSymbol(wordData.originalIndex);
      const timeout2 = setTimeout(() => {
        showNextWordInWave(wordIndex + 1, finalCallback);
      }, 200);
      geniusState.animationTimeouts.push(timeout2);
    });
  }, stillTime);

  geniusState.animationTimeouts.push(timeout1);
}

function createShuffledBankSymbols() {
  const bank = document.getElementById('genius-symbols-bank');
  bank.innerHTML = '';

  const shuffledWords = shuffleArray([...geniusState.revealedWords]);

  shuffledWords.forEach((wordData) => {
    const symbolDiv = document.createElement('div');
    symbolDiv.className =
      'genius-symbol-bank w-16 h-16 p-1 bg-white rounded-lg shadow opacity-0';
    symbolDiv.dataset.originalIndex = wordData.originalIndex;
    symbolDiv.dataset.revealIndex = wordData.revealIndex;
    symbolDiv.innerHTML =
      typeof wordData.symbol === 'function'
        ? wordData.symbol('w-16 h-16')
        : wordData.symbol;

    const img = symbolDiv.querySelector('img');
    if (img) img.draggable = false;

    bank.appendChild(symbolDiv);
  });
}

function revealBankSymbol(originalIndex) {
  const bankSymbol = document.querySelector(
    `#genius-symbols-bank [data-original-index="${originalIndex}"]`
  );
  if (bankSymbol) {
    setTimeout(() => {
      bankSymbol.style.transition =
        'opacity 300ms ease-out, transform 300ms ease-out';
      bankSymbol.style.opacity = '1';
      bankSymbol.style.transform = 'scale(1)';
    }, 50);
  }
}

function animateToBankPosition(element, originalIndex, onComplete) {
  const bank = document.getElementById('genius-symbols-bank');
  const bankSymbol = bank.querySelector(
    `[data-original-index="${originalIndex}"]`
  );

  if (!bankSymbol) {
    if (onComplete) onComplete();
    return;
  }

  const bankSymbolRect = bankSymbol.getBoundingClientRect();
  const elemRect = element.getBoundingClientRect();

  const deltaX = bankSymbolRect.left - elemRect.left;
  const deltaY = bankSymbolRect.top - elemRect.top;

  element.style.transition = `transform ${flyTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${flyTime}ms ease-out`;
  element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;
  element.style.opacity = '0';

  const animationTimeout = setTimeout(() => {
    if (onComplete) onComplete();
  }, flyTime);

  geniusState.animationTimeouts.push(animationTimeout);
}

function transitionToInputPhase(callback) {
  // Simply clear the phrase display and render input dropzones
  renderPhraseForInput();

  // The symbols are already in the bank from the wave animation
  // Just need to make them draggable
  const bank = document.getElementById('genius-symbols-bank');
  const symbols = bank.querySelectorAll('.genius-symbol-bank');

  // Change class from 'genius-symbol-bank' to 'draggable'
  symbols.forEach((symbol) => {
    symbol.classList.remove('genius-symbol-bank');
    symbol.classList.add(
      'genius-symbol',
      'draggable',
      'cursor-grab',
      'active:cursor-grabbing'
    );
  });

  // Enable dragging
  setTimeout(() => {
    DraggableManager.makeDraggable(
      '#genius-symbols-bank .draggable',
      handleGeniusDrop
    );
  }, 100);

  geniusState.turn = 'player';

  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Arraste os símbolos na ordem que apareceram!';

  if (callback) callback();
}

function renderPhraseForInput() {
  const phraseContainer = document.getElementById('genius-phrase');
  phraseContainer.innerHTML = '';

  const sortedByPhrase = [...geniusState.revealedWords].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );

  sortedByPhrase.forEach((wordData) => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'flex flex-col items-center gap-2';
    wordDiv.dataset.originalIndex = wordData.originalIndex;
    wordDiv.dataset.revealIndex = wordData.revealIndex;

    const wordText = document.createElement('span');
    wordText.className = 'text-sm font-medium text-gray-700';
    wordText.textContent = wordData.word;

    const dropzone = document.createElement('div');
    dropzone.className =
      'symbol-placeholder target w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white transition-all';
    dropzone.dataset.originalIndex = wordData.originalIndex;
    dropzone.dataset.revealIndex = wordData.revealIndex;

    wordDiv.appendChild(wordText);
    wordDiv.appendChild(dropzone);
    phraseContainer.appendChild(wordDiv);
  });
}

function reattachDragListeners(element) {
  element.addEventListener('mousedown', (e) => {
    DraggableManager.dragStart.call(DraggableManager, e);
  });
  element.addEventListener(
    'touchstart',
    (e) => {
      DraggableManager.dragStart.call(DraggableManager, e);
    },
    { passive: false }
  );

  // Garantir que o elemento tenha as classes corretas
  if (!element.classList.contains('draggable')) {
    element.classList.add('draggable', 'cursor-grab');
  }
}

function handleGeniusDrop(symbolEl, targetEl, placeholder, unlockCallback) {
  if (geniusState.turn !== 'player') {
    unlockCallback();
    return;
  }

  // Check if dropped on a valid dropzone
  if (!targetEl) {
    // Invalid drop - return to placeholder
    const placeholderRect = placeholder.getBoundingClientRect();
    Object.assign(symbolEl.style, {
      transition: 'all 0.3s ease-in-out',
      left: `${placeholderRect.left}px`,
      top: `${placeholderRect.top}px`,
      transform: 'scale(1)',
    });

    setTimeout(() => {
      placeholder.replaceWith(symbolEl);

      Object.assign(symbolEl.style, {
        position: 'static',
        left: '',
        top: '',
        zIndex: '',
        transform: '',
        transition: '',
        pointerEvents: '',
        opacity: '1',
      });

      symbolEl.classList.remove('opacity-0', 'dragging');
      unlockCallback();
    }, 300);
    return;
  }

  // ✅ Pegar os índices originais
  const droppedOriginalIndex = parseInt(symbolEl.dataset.originalIndex);
  const targetOriginalIndex = parseInt(targetEl.dataset.originalIndex);

  // Logo após pegar droppedWord e targetWord
  const droppedWord = geniusState.phrase[droppedOriginalIndex];
  const targetWord = geniusState.phrase[targetOriginalIndex];

  // 🔍 DEBUG
  console.log('Dropped:', droppedWord.word, '| Class:', droppedWord.class);
  console.log('Target:', targetWord.word, '| Class:', targetWord.class);
  console.log('Match?', droppedWord.class === targetWord.class);

  // Verificar se o slot já está preenchido
  const isSlotFilled = targetEl.classList.contains('filled');

  // Validar: mesma classe gramatical + slot vazio
  const isCorrect = droppedWord.symbol === targetWord.symbol && !isSlotFilled;

  if (isCorrect) {
    AppState.currentGame.score += 10;
    if (typeof GameAudio !== 'undefined') GameAudio.play('correct');

    // Feedback visual de sucesso
    targetEl.classList.add('correct-drop');
    setTimeout(() => {
      targetEl.classList.remove('correct-drop');
    }, 500);

    // Remove placeholder
    placeholder.remove();

    // Get target position
    const targetRect = targetEl.getBoundingClientRect();

    // Smooth animation to target
    Object.assign(symbolEl.style, {
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      left: `${targetRect.left + targetRect.width / 2 - symbolEl.offsetWidth / 2}px`,
      top: `${targetRect.top + targetRect.height / 2 - symbolEl.offsetHeight / 2}px`,
      transform: 'scale(1)',
    });

    setTimeout(() => {
      // ✅ Usar o símbolo do card ARRASTADO
      const wordData = geniusState.phrase[droppedOriginalIndex];

      // Place symbol in dropzone
      targetEl.innerHTML =
        typeof wordData.symbol === 'function'
          ? wordData.symbol('w-16 h-16')
          : wordData.symbol;
      targetEl.classList.add('filled');
      targetEl.classList.remove('border-dashed');

      // Remove dragged element
      if (symbolEl && symbolEl.parentNode) {
        symbolEl.remove();
      }

      // ✅ Contar slots preenchidos ao invés de usar currentInputIndex
      const filledSlots = document.querySelectorAll(
        '#genius-phrase .symbol-placeholder.filled'
      );

      if (filledSlots.length >= geniusState.revealedWords.length) {
        geniusState.currentRound++;

        const gameMessage = document.getElementById('game-message');
        if (gameMessage) gameMessage.textContent = 'Muito bem!';

        setTimeout(() => {
          startWave();
        }, 1000);
      }

      updateGameUI();
      unlockCallback();
    }, 300);
  } else {
    AppState.currentGame.errors++;
    if (typeof GameAudio !== 'undefined') GameAudio.play('wrong');

    const gameMessage = document.getElementById('game-message');
    if (gameMessage)
      gameMessage.textContent = 'Classe gramatical incorreta! Tente novamente.';

    // Feedback visual de erro
    if (targetEl) {
      targetEl.classList.add('wrong-drop', 'shake-subtle');
      setTimeout(() => {
        targetEl.classList.remove('wrong-drop', 'shake-subtle');
      }, 500);
    }

    // Animate back to placeholder
    const placeholderRect = placeholder.getBoundingClientRect();
    Object.assign(symbolEl.style, {
      transition: 'all 0.3s ease-in-out',
      left: `${placeholderRect.left}px`,
      top: `${placeholderRect.top}px`,
      transform: 'scale(1)',
    });

    setTimeout(() => {
      placeholder.replaceWith(symbolEl);

      Object.assign(symbolEl.style, {
        position: 'static',
        left: '',
        top: '',
        zIndex: '',
        transform: '',
        transition: '',
        pointerEvents: '',
        opacity: '1',
      });

      symbolEl.classList.remove('opacity-0', 'dragging');
      unlockCallback();
    }, 300);

    updateGameUI();
  }
}

let draggedElement = null;

function handleCorrectInput(wordData, dropzone) {
  AppState.currentGame.score += 10;

  if (typeof GameAudio !== 'undefined') GameAudio.play('correct');

  // Get target position
  const targetRect = dropzone.getBoundingClientRect();
  const symbolRect = draggedElement.getBoundingClientRect();

  // Smooth animation to target
  Object.assign(draggedElement.style, {
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    position: 'fixed',
    left: `${targetRect.left + targetRect.width / 2 - symbolRect.width / 2}px`,
    top: `${targetRect.top + targetRect.height / 2 - symbolRect.height / 2}px`,
    transform: 'scale(1)',
    zIndex: '1000',
  });

  setTimeout(() => {
    // Place symbol in dropzone
    dropzone.innerHTML =
      typeof wordData.symbol === 'function'
        ? wordData.symbol('w-16 h-16')
        : wordData.symbol;
    dropzone.classList.add('filled');
    dropzone.classList.remove('border-dashed');

    // Remove dragged element
    if (draggedElement && draggedElement.parentNode) {
      draggedElement.remove();
    }
    draggedElement = null;

    geniusState.currentInputIndex++;

    if (geniusState.currentInputIndex >= geniusState.revealedWords.length) {
      geniusState.currentRevealStep++;

      const gameMessage = document.getElementById('game-message');
      if (gameMessage) gameMessage.textContent = 'Muito bem!';

      setTimeout(() => {
        startWave();
      }, 1000);
    }

    updateGameUI();
  }, 300);
}

function handleWrongInput() {
  AppState.currentGame.errors++;

  if (typeof GameAudio !== 'undefined') GameAudio.play('wrong');

  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Ordem incorreta! Tente novamente.';

  // Shake animation
  if (draggedElement) {
    draggedElement.classList.add('shake');
    setTimeout(() => {
      if (draggedElement) {
        draggedElement.classList.remove('shake');
        // Reset position
        Object.assign(draggedElement.style, {
          position: 'static',
          left: '',
          top: '',
          transform: '',
          zIndex: '',
        });
      }
    }, 500);
  }

  updateGameUI();
}

function handleCorrectInput(wordData) {
  AppState.currentGame.score += 10;

  if (typeof GameAudio !== 'undefined') GameAudio.play('correct');

  const dropzone = document.querySelector(
    `.symbol-placeholder[data-reveal-index="${wordData.revealIndex}"]`
  );
  if (dropzone) {
    dropzone.innerHTML =
      typeof wordData.symbol === 'function'
        ? wordData.symbol('w-16 h-16')
        : wordData.symbol;
    dropzone.classList.add('filled');
    dropzone.classList.remove('border-dashed');
  }

  if (draggedElement) {
    draggedElement.remove();
  }

  geniusState.currentInputIndex++;

  if (geniusState.currentInputIndex >= geniusState.revealedWords.length) {
    geniusState.currentRevealStep++;

    const gameMessage = document.getElementById('game-message');
    if (gameMessage) gameMessage.textContent = 'Muito bem!';

    setTimeout(() => {
      startWave();
    }, 1000);
  }

  updateGameUI();
}

function handleWrongInput() {
  AppState.currentGame.errors++;

  if (typeof GameAudio !== 'undefined') GameAudio.play('wrong');

  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Ordem incorreta! Tente novamente.';

  updateGameUI();
}

function endGeniusGame(success) {
  geniusState.isTerminated = true;

  if (success) {
    const gameMessage = document.getElementById('game-message');
    if (gameMessage) gameMessage.textContent = 'Frase completa!';

    setTimeout(() => {
      showPhaseEndModal(true);
    }, 1200);
  }
}

function getGeniusAnimationDuration(phase) {
  return stillTime + flyTime;
}

// Pause/Resume functions
window.pauseGeniusGame = function () {
  geniusState.isPaused = true;
};

window.resumeGeniusGame = function () {
  geniusState.isPaused = false;
};
