/**
 * js/genius.js
 * --- Final version with sequential animation and drag-and-drop ---
 */

const stillTime = 1200;
const flyTime = 1500;
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
  if (geniusState.isTerminated) {
    geniusState.isTerminated = true;
  }
  if (geniusState.animationTimeouts) {
    geniusState.animationTimeouts.forEach(clearTimeout);
  }

  const originalPhraseData = GENIUS_PHRASES[phase].map((word, index) => ({
    ...word,
    originalIndex: index,
  }));

  const shuffledPhraseData = shuffleArray(originalPhraseData);
  const board = document.getElementById('game-board');

  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  geniusState = {
    phrase: originalPhraseData,
    shuffledPhrase: shuffledPhraseData,
    turn: 'computer',
    currentWordIndex: 0,
    symbolsInBank: new Set(),
    isTerminated: false,
    animationTimeouts: [],
  };

  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8 p-4">
      <div id="genius-phrase" class="w-full min-h-[100px] flex flex-wrap items-center justify-center gap-x-4 gap-y-4"></div>
      <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg"></div>
    </div>`;

  document.getElementById('game-message').textContent = 'Observe...';
  
  // Render all word placeholders from the start
  renderAllPlaceholders();
  // Start the sequence with the first word
  setTimeout(() => showNextWord(), 500);

  return function cleanupGeniusGame() {
    geniusState.isTerminated = true;
    geniusState.animationTimeouts.forEach(clearTimeout);
    geniusState = {};
  };
}

// This function is needed again by main.js to calculate the intro animation time
function getGeniusAnimationDuration(phase) {
    const phrase = GENIUS_PHRASES[phase];
    if (!phrase) return 0;
  
    // This is a simplified calculation for the timer
    const wordAnimationTime = stillTime + flyTime + 1000; // adding a buffer for player interaction time
    return phrase.length * wordAnimationTime;
}

function renderAllPlaceholders() {
    const phraseContainer = document.getElementById('genius-phrase');
    phraseContainer.innerHTML = geniusState.phrase
        .map(
            (wordData) => `
        <div class="flex flex-col items-center justify-end h-24 text-center" data-word-index="${wordData.originalIndex}">
          <span class="px-1 text-lg">${wordData.word}</span>
          <div class="target bg-stone-200 w-12 h-12 rounded-lg" data-correct-id="${wordData.classId}"></div>
        </div>`
        )
        .join('');
}


function showNextWord() {
    if (geniusState.isTerminated || geniusState.currentWordIndex >= geniusState.shuffledPhrase.length) {
        return;
    }

    geniusState.turn = 'computer';
    const wordData = geniusState.shuffledPhrase[geniusState.currentWordIndex];
    const symbolData = GRAMMAR_CLASSES.find((gc) => gc.id === wordData.classId);
    const wordContainer = document.querySelector(`[data-word-index="${wordData.originalIndex}"]`);
    
    if (!wordContainer || !symbolData) return;

    const placeholder = wordContainer.querySelector('.target');
    placeholder.innerHTML = symbolData.symbol('w-full h-full');
    placeholder.classList.remove('bg-stone-200');
    GameAudio.play('flip');

    const timeout1 = setTimeout(() => {
        if (geniusState.isTerminated) return;
        animateSymbolToBank(placeholder, symbolData, wordData);
    }, stillTime);
    geniusState.animationTimeouts.push(timeout1);
}

function animateSymbolToBank(symbolPlaceholder, symbolData, wordData) {
  if (!symbolPlaceholder || !symbolData || geniusState.isTerminated) return;

  const bankContainer = document.getElementById('genius-symbols-bank');
  const symbolRect = symbolPlaceholder.getBoundingClientRect();
  const flyingSymbol = document.createElement('div');
  flyingSymbol.className = 'symbol-flying';
  flyingSymbol.innerHTML = symbolData.symbol('w-full h-full');
  document.body.appendChild(flyingSymbol);

  flyingSymbol.style.left = `${symbolRect.left}px`;
  flyingSymbol.style.top = `${symbolRect.top}px`;
  
  addSymbolToBank(symbolData);
  
  void flyingSymbol.offsetWidth;
  const bankRect = bankContainer.getBoundingClientRect();
  flyingSymbol.style.transform = `translate(${
    bankRect.left + bankRect.width / 2 - symbolRect.left - symbolRect.width / 2
  }px, ${
    bankRect.top + bankRect.height / 2 - symbolRect.top - symbolRect.height / 2
  }px) scale(0.5)`;
  flyingSymbol.style.opacity = '0';

  symbolPlaceholder.innerHTML = '';
  symbolPlaceholder.classList.add('bg-stone-200');
  symbolPlaceholder.classList.add('is-fading');
  setTimeout(() => symbolPlaceholder.classList.remove('is-fading'), 500);

  const timeoutId = setTimeout(() => {
      flyingSymbol.remove();
      document.getElementById('game-message').textContent = 'Sua vez! Arraste o símbolo correto.';
      geniusState.turn = 'player';
      setupDragAndDrop(wordData.classId);
    }, 1200);
  geniusState.animationTimeouts.push(timeoutId);
}

function addSymbolToBank(symbolData) {
  if (geniusState.symbolsInBank.has(symbolData.id) || geniusState.isTerminated)
    return;
    
  const bankContainer = document.getElementById('genius-symbols-bank');
  const symbolEl = document.createElement('div');
  symbolEl.className = 'genius-symbol w-16 h-16 p-1 bg-white rounded-lg shadow opacity-0';
  symbolEl.dataset.id = symbolData.id;
  symbolEl.innerHTML = symbolData.symbol('w-full h-full pointer-events-none');
  bankContainer.appendChild(symbolEl);
  geniusState.symbolsInBank.add(symbolData.id);
  
  const timeoutId = setTimeout(() => {
    symbolEl.style.opacity = '1';
    symbolEl.classList.add('draggable', 'cursor-grab', 'active:cursor-grabbing');
  }, 500);
  geniusState.animationTimeouts.push(timeoutId);
}

function setupDragAndDrop(correctId) {
    const targetSelector = `.target[data-correct-id="${correctId}"]`;
    DraggableManager.makeDraggable(
        '#genius-symbols-bank .draggable',
        (clonedEl, targetEl, placeholder, unlockCallback) => handleGeniusDrop(clonedEl, targetEl, placeholder, unlockCallback, correctId),
        { mode: 'clone', target: targetSelector }
    );
}


function handleGeniusDrop(clonedEl, targetEl, placeholder, unlockCallback, correctId) {
  const droppedSymbolId = parseInt(clonedEl.dataset.id);
  const isCorrect = targetEl && parseInt(targetEl.dataset.correctId) === droppedSymbolId;

  if (isCorrect) {
    GameAudio.play('match');
    AppState.currentGame.score += 10;
    
    // Animate the cloned element to the target position
    const targetRect = targetEl.getBoundingClientRect();
    Object.assign(clonedEl.style, {
        transition: 'all 0.3s ease-out',
        left: `${targetRect.left + (targetRect.width - clonedEl.offsetWidth) / 2}px`,
        top: `${targetRect.top + (targetRect.height - clonedEl.offsetHeight) / 2}px`,
        transform: 'scale(0.8)',
    });

    setTimeout(() => {
        targetEl.replaceWith(clonedEl);
        Object.assign(clonedEl.style, {
            position: 'static', left: '', top: '', zIndex: '', transform: '', width: '', height: ''
        });
        clonedEl.classList.remove('draggable', 'cursor-grab', 'active:cursor-grabbing');
        unlockCallback();

        // Move to the next word
        geniusState.currentWordIndex++;
        if (geniusState.currentWordIndex < geniusState.shuffledPhrase.length) {
            document.getElementById('game-message').textContent = 'Correto! Observe o próximo...';
            setTimeout(showNextWord, 1000);
        } else {
            // Game finished
            document.getElementById('game-message').textContent = 'Frase completa!';
            setTimeout(() => showPhaseEndModal(true), 1200);
        }

    }, 300);

  } else {
    GameAudio.play('error');
    if (targetEl) AppState.currentGame.errors++;
    
    Object.assign(clonedEl.style, {
      transition: 'all 0.3s ease-in-out',
      transform: 'scale(0.5)',
      opacity: '0',
    });
    setTimeout(() => {
      if (document.body.contains(clonedEl)) clonedEl.remove();
      unlockCallback();
      document.getElementById('game-message').textContent = 'Incorreto. Tente novamente.';
    }, 300);
  }
}