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

  // Create random order for revealing words
  const revealOrder = shuffleArray([
    ...Array(originalPhraseData.length).keys(),
  ]);

  const board = document.getElementById('game-board');
  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  geniusState = {
    phrase: originalPhraseData, // Original phrase in order
    revealOrder: revealOrder, // Random order to reveal words
    revealedWords: [], // Words that have been revealed (with reveal order)
    currentRevealStep: 0, // Which step in reveal sequence
    currentInputIndex: 0, // Which symbol user must drag next (in REVEAL order)
    turn: 'computer',
    isTerminated: false,
    animationTimeouts: [],
  };

  board.innerHTML = `
        <div class="w-full flex flex-col items-center gap-8 p-4">
            <div id="genius-phrase" class="w-full min-h-[100px] flex flex-wrap items-center justify-center gap-x-4 gap-y-4"></div>
            <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg"></div>
        </div>
    `;

  // Clear game message
  const gameMessage = document.getElementById('game-message');
  if (gameMessage) gameMessage.textContent = 'Prepare-se...';

  // Start 5 second countdown before game
  Timer.startCountdown(5, () => {
    // Check if game is paused before starting main timer
    if (AppState.isPaused) {
      console.log('[Genius] Game is paused, not starting main timer yet');
      return;
    }

    // After countdown, start the main game timer
    const timerMinutes = GameConfig.genius?.timerMinutes || 5;
    Timer.start(timerMinutes);

    // Start the game
    startWave();
  });
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

  // Add this word to revealed words (with reveal order index)
  geniusState.revealedWords.push({
    ...wordData,
    originalIndex: nextWordIndex,
    revealIndex: geniusState.currentRevealStep,
  });

  // Show wave animation: all previous words + new word (in reveal order)
  showWaveAnimation(() => {
    // After wave animation, proceed to input phase
    geniusState.currentInputIndex = 0; // Reset to start of REVEAL order
    renderPhraseForInput();
    renderSymbolBank();
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

  // Create shuffled bank symbols once at the start
  createShuffledBankSymbols();

  // Start showing words one by one
  showNextWordInWave(0, callback);
}

function showNextWordInWave(wordIndex, finalCallback) {
  if (geniusState.isPaused) {
    setTimeout(() => showNextWordInWave(wordIndex, finalCallback), 100);
    return;
  }

  const phraseContainer = document.getElementById('genius-phrase');

  // Sort by reveal order (oldest to newest)
  const wordsInRevealOrder = [...geniusState.revealedWords].sort(
    (a, b) => a.revealIndex - b.revealIndex
  );

  if (wordIndex >= wordsInRevealOrder.length) {
    // All words shown and animated, transition to input
    transitionToInputPhase(finalCallback);
    return;
  }

  const wordData = wordsInRevealOrder[wordIndex];

  // Create and add the new word to the RIGHT of existing words
  const wordDiv = document.createElement('div');
  wordDiv.className = 'flex flex-col items-center gap-2 reveal-animation';

  // Word text ABOVE symbol
  const wordText = document.createElement('span');
  wordText.className = 'text-sm font-medium text-gray-700';
  wordText.textContent = wordData.word;

  // Symbol display (will animate to bank)
  const symbolDiv = document.createElement('div');
  symbolDiv.className =
    'w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-md genius-flying-symbol';
  symbolDiv.innerHTML = wordData.symbol;
  symbolDiv.dataset.originalIndex = wordData.originalIndex;
  symbolDiv.dataset.revealIndex = wordData.revealIndex;

  wordDiv.appendChild(wordText);
  wordDiv.appendChild(symbolDiv);

  // Add to the RIGHT (append to end)
  phraseContainer.appendChild(wordDiv);

  // Wait stillTime, then animate THIS symbol to bank
  const timeout1 = setTimeout(() => {
    animateToBankPosition(symbolDiv, wordData.originalIndex, () => {
      // Reveal the bank symbol
      revealBankSymbol(wordData.originalIndex);

      // Small delay before next word
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
  bank.innerHTML = ''; // Clear previous symbols

  // Shuffle the revealed words for bank display
  const shuffledWords = shuffleArray([...geniusState.revealedWords]);

  shuffledWords.forEach((wordData) => {
    const symbolDiv = document.createElement('div');
    symbolDiv.className =
      'genius-symbol-bank w-16 h-16 p-1 bg-white rounded-lg shadow opacity-0';
    symbolDiv.dataset.originalIndex = wordData.originalIndex;
    symbolDiv.dataset.revealIndex = wordData.revealIndex;
    symbolDiv.innerHTML = wordData.symbol;

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
    // Fade in the bank symbol
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

  // Calculate deltas to the target bank symbol position
  const deltaX = bankSymbolRect.left - elemRect.left;
  const deltaY = bankSymbolRect.top - elemRect.top;

  // Apply smooth animation
  element.style.transition = `transform ${flyTime}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${flyTime}ms ease-out`;
  element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.9)`;
  element.style.opacity = '0';
  element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';

  // Complete animation
  const animationTimeout = setTimeout(() => {
    element.style.opacity = '0';
    if (onComplete) onComplete();
  }, flyTime);

  geniusState.animationTimeouts.push(animationTimeout);
}

function transitionToInputPhase(callback) {
  const phraseContainer = document.getElementById('genius-phrase');
  const bankContainer = document.getElementById('genius-symbols-bank');

  // NO FADE - Direct content change
  renderPhraseForInput();
  renderSymbolBankForInput();

  // Enable player input immediately
  geniusState.turn = 'player';

  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Arraste os símbolos na ordem que apareceram!';

  if (callback) callback();
}

function renderSymbolBankForInput() {
  const bank = document.getElementById('genius-symbols-bank');

  // Get current symbols (already shuffled from animation phase)
  const currentSymbols = Array.from(
    bank.querySelectorAll('.genius-symbol-bank')
  );

  bank.innerHTML = '';

  // Maintain the same shuffled order, but make them draggable
  currentSymbols.forEach((oldSymbol) => {
    const originalIndex = parseInt(oldSymbol.dataset.originalIndex);
    const revealIndex = parseInt(oldSymbol.dataset.revealIndex);
    const wordData = geniusState.phrase[originalIndex];

    const symbolDiv = document.createElement('div');
    symbolDiv.className =
      'genius-symbol draggable cursor-grab active:cursor-grabbing w-16 h-16 p-1 bg-white rounded-lg shadow hover:shadow-lg transition-all';
    symbolDiv.draggable = true;
    symbolDiv.dataset.originalIndex = originalIndex;
    symbolDiv.dataset.revealIndex = revealIndex;
    symbolDiv.innerHTML = wordData.symbol;

    const img = symbolDiv.querySelector('img');
    if (img) img.draggable = false;

    bank.appendChild(symbolDiv);

    // Add drag event listeners
    symbolDiv.addEventListener('dragstart', handleDragStart);
    symbolDiv.addEventListener('dragend', handleDragEnd);
  });
}

function renderPhraseForInput() {
  const phraseContainer = document.getElementById('genius-phrase');
  phraseContainer.innerHTML = '';

  // Sort revealed words by their ORIGINAL PHRASE position for input display
  const sortedByPhrase = [...geniusState.revealedWords].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );

  sortedByPhrase.forEach((wordData) => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'flex flex-col items-center gap-2';
    wordDiv.dataset.originalIndex = wordData.originalIndex;
    wordDiv.dataset.revealIndex = wordData.revealIndex;

    // Word text ABOVE dropzone
    const wordText = document.createElement('span');
    wordText.className = 'text-sm font-medium text-gray-700';
    wordText.textContent = wordData.word;

    // Dropzone for the symbol
    const dropzone = document.createElement('div');
    dropzone.className =
      'symbol-placeholder w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white transition-all';
    dropzone.dataset.originalIndex = wordData.originalIndex;
    dropzone.dataset.revealIndex = wordData.revealIndex;

    wordDiv.appendChild(wordText);
    wordDiv.appendChild(dropzone);
    phraseContainer.appendChild(wordDiv);
  });

  setupDropzones();
}

function renderSymbolBank() {
  const bank = document.getElementById('genius-symbols-bank');
  bank.innerHTML = '';

  // FIX 2: Sort symbols by PHRASE ORDER in the bank
  const sortedByPhrase = [...geniusState.revealedWords].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );

  sortedByPhrase.forEach((wordData) => {
    const symbolDiv = document.createElement('div');
    symbolDiv.className =
      'genius-symbol draggable cursor-grab active:cursor-grabbing w-16 h-16 p-1 bg-white rounded-lg shadow hover:shadow-lg transition-shadow';
    symbolDiv.draggable = true;
    symbolDiv.dataset.originalIndex = wordData.originalIndex;
    symbolDiv.dataset.revealIndex = wordData.revealIndex;
    symbolDiv.innerHTML = wordData.symbol;

    // Make img inside not draggable
    const img = symbolDiv.querySelector('img');
    if (img) img.draggable = false;

    bank.appendChild(symbolDiv);

    // Add drag event listeners
    symbolDiv.addEventListener('dragstart', handleDragStart);
    symbolDiv.addEventListener('dragend', handleDragEnd);
  });
}

// FIX 3: Remove highlight function (no more visual hints during input)
// function highlightNextTarget() - REMOVED

function setupDropzones() {
  const dropzones = document.querySelectorAll('.symbol-placeholder');
  dropzones.forEach((zone) => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('dragleave', handleDragLeave);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  if (geniusState.turn !== 'player') return;

  draggedElement = e.target.closest('.genius-symbol');
  draggedElement.classList.add('dragging', 'opacity-50');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging', 'opacity-50');
    draggedElement = null;
  }
}

function handleDragOver(e) {
  if (geniusState.turn !== 'player') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('bg-blue-100');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('bg-blue-100');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('bg-blue-100');

  if (geniusState.turn !== 'player' || !draggedElement) return;

  const droppedRevealIndex = parseInt(draggedElement.dataset.revealIndex);
  const targetRevealIndex = parseInt(e.currentTarget.dataset.revealIndex);

  // Get the expected word (in REVEAL order)
  const expectedWord = geniusState.revealedWords.find(
    (w) => w.revealIndex === geniusState.currentInputIndex
  );

  // Check if user dropped the correct symbol (matching reveal order) in correct position
  if (
    droppedRevealIndex === expectedWord.revealIndex &&
    targetRevealIndex === expectedWord.revealIndex
  ) {
    // Correct!
    handleCorrectInput(expectedWord);
  } else {
    // Wrong!
    handleWrongInput();
  }
}

function handleCorrectInput(wordData) {
  AppState.currentGame.score += 10;

  // Play success sound
  if (typeof GameAudio !== 'undefined') GameAudio.play('match');

  // Fill the dropzone
  const dropzone = document.querySelector(
    `.symbol-placeholder[data-reveal-index="${wordData.revealIndex}"]`
  );
  if (dropzone) {
    dropzone.innerHTML = wordData.symbol;
    dropzone.classList.add('filled');
    dropzone.classList.remove('border-dashed');
  }

  // Remove symbol from bank
  if (draggedElement) {
    draggedElement.remove();
  }

  // Move to next input position (in reveal order)
  geniusState.currentInputIndex++;

  // Check if all revealed symbols are placed
  if (geniusState.currentInputIndex >= geniusState.revealedWords.length) {
    // All symbols placed! Move to next wave
    geniusState.currentRevealStep++;

    const gameMessage = document.getElementById('game-message');
    if (gameMessage) gameMessage.textContent = 'Muito bem!';

    setTimeout(() => {
      startWave();
    }, 1000);
  }
  // FIX 3: No highlight after correct input - user must remember!
}

function handleWrongInput() {
  AppState.currentGame.errors++;

  // Play error sound
  if (typeof GameAudio !== 'undefined') GameAudio.play('error');

  // Visual feedback
  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Ordem incorreta! Tente novamente.';

  // FIX 3: No highlight - user must remember the correct order
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

function terminateGeniusGame() {
  if (geniusState.animationTimeouts) {
    geniusState.animationTimeouts.forEach(clearTimeout);
  }
  geniusState.isTerminated = true;
}

// This function is needed by main.js to calculate the intro animation time
function getGeniusAnimationDuration(phase) {
  return stillTime + flyTime;
}

// Pause/Resume functions for genius game
window.pauseGeniusGame = function () {
  geniusState.isPaused = true;
};

window.resumeGeniusGame = function () {
  geniusState.isPaused = false;
};
