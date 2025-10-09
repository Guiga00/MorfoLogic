/**
 * js/genius.js
 * --- Sequential wave reveal with memory phase ---
 */

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

  const revealOrder = shuffleArray([
    ...Array(originalPhraseData.length).keys(),
  ]);

  const board = document.getElementById('game-board');
  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  geniusState = {
    phrase: originalPhraseData,
    revealOrder: revealOrder,
    revealedWords: [],
    currentRevealStep: 0,
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

  // Start the wave game immediately - no preview timer
  startWave();
}

function startWave() {
  if (geniusState.currentRevealStep >= geniusState.revealOrder.length) {
    // All words revealed! Game complete!
    endGeniusGame(true);
    return;
  }

  geniusState.turn = 'computer';

  // Get the next word to reveal
  const nextWordIndex = geniusState.revealOrder[geniusState.currentRevealStep];
  const wordData = geniusState.phrase[nextWordIndex];

  // Add this word to revealed words
  geniusState.revealedWords.push({
    ...wordData,
    originalIndex: nextWordIndex,
    revealIndex: geniusState.currentRevealStep,
  });

  // Show wave animation
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
      });
      unlockCallback();
    }, 300);
    return;
  }

  const droppedRevealIndex = parseInt(symbolEl.dataset.revealIndex);
  const targetRevealIndex = parseInt(targetEl.dataset.revealIndex);

  const expectedWord = geniusState.revealedWords.find(
    (w) => w.revealIndex === geniusState.currentInputIndex
  );

  const isCorrect =
    droppedRevealIndex === expectedWord.revealIndex &&
    targetRevealIndex === expectedWord.revealIndex;

  if (isCorrect) {
    AppState.currentGame.score += 10;
    if (typeof GameAudio !== 'undefined') GameAudio.play('correct');

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
      // Place symbol in dropzone
      targetEl.innerHTML =
        typeof expectedWord.symbol === 'function'
          ? expectedWord.symbol('w-16 h-16')
          : expectedWord.symbol;
      targetEl.classList.add('filled');
      targetEl.classList.remove('border-dashed');

      // REMOVE the dragged symbol element
      if (symbolEl && symbolEl.parentNode) {
        symbolEl.remove();
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
      unlockCallback();
    }, 300);
  } else {
    AppState.currentGame.errors++;
    if (typeof GameAudio !== 'undefined') GameAudio.play('wrong');

    const gameMessage = document.getElementById('game-message');
    if (gameMessage)
      gameMessage.textContent = 'Ordem incorreta! Tente novamente.';

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
      });
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
