/**
 * js/genius.js
 * --- Sequential wave reveal with memory challenge ---
 * 
 * Game Logic:
 * 1. Words are revealed in random order (reveal order)
 * 2. During wave: shows words one at a time, each animates to shuffled bank
 * 3. During input: phrase displayed in correct order, bank is shuffled
 * 4. User must drag symbols in the order they were revealed (memory test)
 */

// Timing constants
const stillTime = 1200; // Time word stays visible before animation (ms)
const flyTime = 1500;   // Duration of symbol flying to bank (ms)

// Global game state
let geniusState = {};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * Initializes the Genius game for a specific phase
 * @param {number} phase - The phase number (1, 2, or 3)
 */
function initGeniusGame(phase) {
  // Clear any previous game timeouts
  if (geniusState.animationTimeouts) {
    geniusState.animationTimeouts.forEach(clearTimeout);
  }

  // Prepare phrase data with original indices
  const originalPhraseData = GENIUS_PHRASES[phase].map((word, index) => ({
    ...word,
    originalIndex: index, // Track original position in phrase
  }));

  // Create random order for revealing words
  const revealOrder = shuffleArray([
    ...Array(originalPhraseData.length).keys(),
  ]);

  // Get game board element
  const board = document.getElementById('game-board');
  
  // Reset score and errors
  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  // Initialize game state
  geniusState = {
    phrase: originalPhraseData,        // Original phrase in order
    revealOrder: revealOrder,          // Random order to reveal words
    revealedWords: [],                 // Words revealed so far (with metadata)
    currentRevealStep: 0,              // Current step in reveal sequence
    currentInputIndex: 0,              // Which symbol user must drag next (in reveal order)
    turn: 'computer',                  // Whose turn: 'computer' or 'player'
    isTerminated: false,               // Game termination flag
    animationTimeouts: [],             // Track timeouts for cleanup
  };

  // Create game board HTML structure
  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8 p-4">
      <div id="genius-phrase" class="w-full min-h-[100px] flex flex-wrap items-center justify-center gap-x-4 gap-y-4"></div>
      <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg"></div>
    </div>
  `;

  // Clear game message
  const gameMessage = document.getElementById('game-message');
  if (gameMessage) gameMessage.textContent = '';

  // Start the first wave
  startWave();
}

/**
 * Starts a new wave (reveals next word)
 */
function startWave() {
  // Check if all words have been revealed
  if (geniusState.currentRevealStep >= geniusState.revealOrder.length) {
    // Game complete!
    endGeniusGame(true);
    return;
  }

  // Set turn to computer (animation phase)
  geniusState.turn = 'computer';

  // Get the next word to reveal (in random order)
  const nextWordIndex = geniusState.revealOrder[geniusState.currentRevealStep];
  const wordData = geniusState.phrase[nextWordIndex];

  // Add this word to revealed words with metadata
  geniusState.revealedWords.push({
    ...wordData,
    originalIndex: nextWordIndex,                    // Position in phrase
    revealIndex: geniusState.currentRevealStep,      // Order it was revealed
  });

  // Show wave animation (all previous words + new word)
  showWaveAnimation(() => {
    // Callback handled inside transitionToInputPhase
  });
}

/**
 * Shows the wave animation sequence
 * Displays all revealed words sequentially, each animating to bank
 * @param {Function} callback - Called when animation completes
 */
function showWaveAnimation(callback) {
  const phraseContainer = document.getElementById('genius-phrase');
  const bankContainer = document.getElementById('genius-symbols-bank');

  // Clear both containers
  phraseContainer.innerHTML = '';
  bankContainer.innerHTML = '';

  // Create shuffled bank symbols (invisible placeholders)
  createShuffledBankSymbols();

  // Start showing words one by one
  showNextWordInWave(0, callback);
}

/**
 * Recursively shows words one at a time in the wave
 * @param {number} wordIndex - Current word index to show
 * @param {Function} finalCallback - Called when all words are shown
 */
function showNextWordInWave(wordIndex, finalCallback) {
  const phraseContainer = document.getElementById('genius-phrase');

  // Sort by reveal order (oldest to newest)
  const wordsInRevealOrder = [...geniusState.revealedWords].sort(
    (a, b) => a.revealIndex - b.revealIndex
  );

  // Check if all words have been shown
  if (wordIndex >= wordsInRevealOrder.length) {
    // All words shown and animated, transition to input phase
    transitionToInputPhase(finalCallback);
    return;
  }

  const wordData = wordsInRevealOrder[wordIndex];

  // Create word display element
  const wordDiv = document.createElement('div');
  wordDiv.className = 'flex flex-col items-center gap-2 reveal-animation';

  // Word text (above symbol)
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

  // Assemble word display
  wordDiv.appendChild(wordText);
  wordDiv.appendChild(symbolDiv);

  // Add to the RIGHT (append to end - newest word on right)
  phraseContainer.appendChild(wordDiv);

  // Wait stillTime, then animate THIS symbol to bank
  const timeout1 = setTimeout(() => {
    animateToBankPosition(symbolDiv, wordData.originalIndex, () => {
      // Reveal the bank symbol (fade it in)
      revealBankSymbol(wordData.originalIndex);

      // Small delay before showing next word
      const timeout2 = setTimeout(() => {
        showNextWordInWave(wordIndex + 1, finalCallback);
      }, 200);

      geniusState.animationTimeouts.push(timeout2);
    });
  }, stillTime);

  geniusState.animationTimeouts.push(timeout1);
}

/**
 * Creates bank symbols in shuffled order (invisible initially)
 * These serve as animation targets
 */
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

    // Make image non-draggable
    const img = symbolDiv.querySelector('img');
    if (img) img.draggable = false;

    bank.appendChild(symbolDiv);
  });
}

/**
 * Fades in a bank symbol after flying symbol reaches it
 * @param {number} originalIndex - The word's original index in phrase
 */
function revealBankSymbol(originalIndex) {
  const bankSymbol = document.querySelector(
    `#genius-symbols-bank [data-original-index="${originalIndex}"]`
  );
  
  if (bankSymbol) {
    // Fade in the bank symbol smoothly
    setTimeout(() => {
      bankSymbol.style.transition =
        'opacity 300ms ease-out, transform 300ms ease-out';
      bankSymbol.style.opacity = '1';
      bankSymbol.style.transform = 'scale(1)';
    }, 50);
  }
}

/**
 * Animates a symbol from phrase area to its position in the bank
 * @param {HTMLElement} element - The flying symbol element
 * @param {number} originalIndex - Word's original index in phrase
 * @param {Function} onComplete - Callback when animation completes
 */
function animateToBankPosition(element, originalIndex, onComplete) {
  const bank = document.getElementById('genius-symbols-bank');
  const bankSymbol = bank.querySelector(
    `[data-original-index="${originalIndex}"]`
  );

  if (!bankSymbol) {
    if (onComplete) onComplete();
    return;
  }

  // Get positions
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

  // Complete animation callback
  const animationTimeout = setTimeout(() => {
    element.style.opacity = '0';
    if (onComplete) onComplete();
  }, flyTime);

  geniusState.animationTimeouts.push(animationTimeout);
}

/**
 * Transitions from animation phase to input phase
 * No fade - direct content swap
 * @param {Function} callback - Called after transition
 */
function transitionToInputPhase(callback) {
  // Render input phase content
  renderPhraseForInput();
  renderSymbolBankForInput();

  // Enable player input immediately (no fade)
  geniusState.turn = 'player';

  // Update message
  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Arraste os símbolos na ordem que apareceram!';

  if (callback) callback();
}

/**
 * Renders the phrase area for input phase
 * Shows words in PHRASE ORDER with empty dropzones
 */
function renderPhraseForInput() {
  const phraseContainer = document.getElementById('genius-phrase');
  phraseContainer.innerHTML = '';

  // Sort revealed words by their ORIGINAL PHRASE position
  const sortedByPhrase = [...geniusState.revealedWords].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );

  sortedByPhrase.forEach((wordData) => {
    const wordDiv = document.createElement('div');
    wordDiv.className = 'flex flex-col items-center gap-2';
    wordDiv.dataset.originalIndex = wordData.originalIndex;
    wordDiv.dataset.revealIndex = wordData.revealIndex;

    // Word text (above dropzone)
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

/**
 * Renders the symbol bank for input phase
 * Makes symbols draggable while maintaining shuffled order
 */
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

    // Make image non-draggable
    const img = symbolDiv.querySelector('img');
    if (img) img.draggable = false;

    bank.appendChild(symbolDiv);

    // Add drag event listeners
    symbolDiv.addEventListener('dragstart', handleDragStart);
    symbolDiv.addEventListener('dragend', handleDragEnd);
  });
}

/**
 * Sets up drop zones for drag and drop functionality
 */
function setupDropzones() {
  const dropzones = document.querySelectorAll('.symbol-placeholder');
  dropzones.forEach((zone) => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('dragleave', handleDragLeave);
  });
}

// Track currently dragged element
let draggedElement = null;

/**
 * Handles drag start event
 */
function handleDragStart(e) {
  if (geniusState.turn !== 'player') return;

  draggedElement = e.target.closest('.genius-symbol');
  draggedElement.classList.add('dragging', 'opacity-50');
  e.dataTransfer.effectAllowed = 'move';
}

/**
 * Handles drag end event
 */
function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging', 'opacity-50');
    draggedElement = null;
  }
}

/**
 * Handles drag over event on dropzone
 */
function handleDragOver(e) {
  if (geniusState.turn !== 'player') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('bg-blue-100');
}

/**
 * Handles drag leave event on dropzone
 */
function handleDragLeave(e) {
  e.currentTarget.classList.remove('bg-blue-100');
}

/**
 * Handles drop event on dropzone
 * Validates if correct symbol was dropped in correct position
 */
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

/**
 * Handles correct input from user
 * @param {Object} wordData - The correctly placed word data
 */
function handleCorrectInput(wordData) {
  AppState.currentGame.score += 10;

  // Play success sound
  if (typeof GameAudio !== 'undefined') GameAudio.play('match');

  // Fill the dropzone with the symbol
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

    // Start next wave after short delay
    setTimeout(() => {
      startWave();
    }, 1000);
  }
  // No visual hints - user must remember the order!
}

/**
 * Handles wrong input from user
 */
function handleWrongInput() {
  AppState.currentGame.errors++;

  // Play error sound
  if (typeof GameAudio !== 'undefined') GameAudio.play('error');

  // Visual feedback
  const gameMessage = document.getElementById('game-message');
  if (gameMessage)
    gameMessage.textContent = 'Ordem incorreta! Tente novamente.';

  // No visual hints - user must remember the correct order!
}

/**
 * Ends the Genius game
 * @param {boolean} success - Whether game was completed successfully
 */
function endGeniusGame(success) {
  geniusState.isTerminated = true;

  if (success) {
    const gameMessage = document.getElementById('game-message');
    if (gameMessage) gameMessage.textContent = 'Frase completa!';

    // Show phase end modal after delay
    setTimeout(() => {
      showPhaseEndModal(true);
    }, 1200);
  }
}

/**
 * Terminates the Genius game and cleans up
 */
function terminateGeniusGame() {
  if (geniusState.animationTimeouts) {
    geniusState.animationTimeouts.forEach(clearTimeout);
  }
  geniusState.isTerminated = true;
}

/**
 * Returns the animation duration for main.js timing calculations
 * @param {number} phase - The phase number
 * @returns {number} - Animation duration in ms
 */
function getGeniusAnimationDuration(phase) {
  return stillTime + flyTime;
}
