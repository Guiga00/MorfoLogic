/**
 * js/genius.js
 */

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
  DraggableManager.cleanup();

  const originalPhraseData = GENIUS_PHRASES[phase].map((word, index) => ({
    ...word,
    originalIndex: index, // Guarda a posição correta de cada palavra
  }));

  const shuffledPhraseData = shuffleArray(originalPhraseData);
  const board = document.getElementById('game-board');

  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;

  geniusState = {
    phrase: originalPhraseData,
    shuffledPhrase: shuffledPhraseData,
    turn: 'computer',
    correctlyPlaced: 0,
    symbolsInBank: new Set(), // Garante que símbolos únicos sejam adicionados
  };

  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8 p-4">
      <div id="genius-phrase" class="w-full min-h-[100px] flex flex-wrap items-center justify-center gap-x-4 gap-y-4">
        </div>
      <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg">
        </div>
    </div>`;

  document.getElementById('game-message').textContent = 'Observe...';
  // Inicia a nova sequência de animação sincronizada
  animateNextWord(0);
}

/**
 * Nova função que anima um passo da sequência e depois chama o próximo,
 * garantindo a sincronização.
 */
function animateNextWord(index) {
  // Se a sequência de palavras terminou, passa para a próxima etapa.
  if (index >= geniusState.shuffledPhrase.length) {
    setTimeout(unscramblePhrase, 500); // Pequena pausa antes de desembaralhar
    return;
  }

  const phraseContainer = document.getElementById('genius-phrase');
  const wordData = geniusState.shuffledPhrase[index];
  const symbolData = GRAMMAR_CLASSES.find((gc) => gc.id === wordData.classId);
  if (!phraseContainer || !wordData || !symbolData) return;

  // 1. Cria e mostra a palavra e o símbolo.
  const wordContainer = document.createElement('div');
  wordContainer.className =
    'flex flex-col items-center justify-end h-24 text-center fade-in';
  wordContainer.dataset.index = wordData.originalIndex;
  wordContainer.innerHTML = `
    <span class="px-1 text-lg">${wordData.word}</span>
    <div class="symbol-placeholder w-12 h-12 p-1">${symbolData.symbol(
      'w-full h-full'
    )}</div>
  `;
  phraseContainer.appendChild(wordContainer);
  GameAudio.play('flip');

  // 2. Espera um pouco antes de o símbolo voar.
  setTimeout(() => {
    const symbolPlaceholder = wordContainer.querySelector(
      '.symbol-placeholder'
    );
    animateSymbolToBank(symbolPlaceholder, symbolData);

    // 3. Agenda a chamada para a PRÓXIMA palavra APÓS esta animação terminar.
    // O voo do símbolo dura 1000ms (1s).
    setTimeout(() => {
      animateNextWord(index + 1);
    }, 1200); // 1000ms do voo + 200ms de pausa
  }, 500); // 500ms de pausa antes do voo
}

function animateSymbolToBank(symbolPlaceholder, symbolData) {
  if (!symbolPlaceholder || !symbolData) return;

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

  setTimeout(() => {
    symbolPlaceholder.style.opacity = '0';
    flyingSymbol.remove();
  }, 1000); // Duração da animação do símbolo
}

function addSymbolToBank(symbolData) {
  if (geniusState.symbolsInBank.has(symbolData.id)) return;

  const bankContainer = document.getElementById('genius-symbols-bank');
  const symbolEl = document.createElement('div');
  symbolEl.className =
    'genius-symbol w-16 h-16 p-1 bg-white rounded-lg shadow opacity-0';
  symbolEl.dataset.id = symbolData.id;
  symbolEl.innerHTML = symbolData.symbol('w-full h-full pointer-events-none');
  bankContainer.appendChild(symbolEl);
  geniusState.symbolsInBank.add(symbolData.id);

  setTimeout(() => (symbolEl.style.opacity = '1'), 500);
}

function unscramblePhrase() {
  document.getElementById('game-message').textContent = 'Organizando...';
  const phraseContainer = document.getElementById('genius-phrase');
  const wordElements = Array.from(
    phraseContainer.querySelectorAll('div.fade-in')
  );
  const initialPositions = new Map();

  wordElements.forEach((el) =>
    initialPositions.set(el, el.getBoundingClientRect())
  );

  const sortedElements = wordElements.sort(
    (a, b) => a.dataset.index - b.dataset.index
  );
  sortedElements.forEach((el) => phraseContainer.appendChild(el));

  wordElements.forEach((el) => {
    const finalPos = el.getBoundingClientRect();
    const initialPos = initialPositions.get(el);
    const deltaX = initialPos.left - finalPos.left;
    const deltaY = initialPos.top - finalPos.top;
    el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  });

  void phraseContainer.offsetWidth;

  phraseContainer.classList.add('rearranging');
  wordElements.forEach((el) => (el.style.transform = ''));

  setTimeout(() => {
    phraseContainer.classList.remove('rearranging');
    document.getElementById('game-message').textContent =
      'Sua vez! Complete a frase.';
    renderPlayerTurn();
  }, 1600);
}

function renderPlayerTurn() {
  const phraseContainer = document.getElementById('genius-phrase');
  const bankContainer = document.getElementById('genius-symbols-bank');

  phraseContainer.innerHTML = geniusState.phrase
    .map(
      (wordData) => `
    <div class="flex flex-col items-center justify-end h-24 text-center">
      <span class="px-1 text-lg">${wordData.word}</span>
      <div class="target bg-stone-200 w-12 h-12 rounded-lg" data-correct-id="${wordData.classId}"></div>
    </div>`
    )
    .join('');

  bankContainer
    .querySelectorAll('.genius-symbol')
    .forEach((el) =>
      el.classList.add('draggable', 'cursor-grab', 'active:cursor-grabbing')
    );

  DraggableManager.makeDraggable(
    '#genius-symbols-bank .draggable',
    handleGeniusDrop,
    { mode: 'clone' }
  );
}

function handleGeniusDrop(clonedEl, targetEl, placeholder, unlockCallback) {
  const droppedSymbolId = parseInt(clonedEl.dataset.id);
  const isCorrect =
    targetEl && parseInt(targetEl.dataset.correctId) === droppedSymbolId;

  if (isCorrect) {
    GameAudio.play('match');
    const targetRect = targetEl.getBoundingClientRect();
    Object.assign(clonedEl.style, {
      transition: 'all 0.3s ease-out',
      left: `${
        targetRect.left + (targetRect.width - clonedEl.offsetWidth) / 2
      }px`,
      top: `${
        targetRect.top + (targetRect.height - clonedEl.offsetHeight) / 2
      }px`,
      transform: 'scale(0.8)',
    });

    setTimeout(() => {
      if (document.body.contains(targetEl)) {
        targetEl.replaceWith(clonedEl);
        Object.assign(clonedEl.style, {
          position: 'static',
          left: '',
          top: '',
          zIndex: '',
          transform: '',
          width: '',
          height: '',
        });
        clonedEl.classList.remove('draggable');
      } else if (document.body.contains(clonedEl)) {
        clonedEl.remove();
      }
      unlockCallback();
    }, 300);

    geniusState.correctlyPlaced++;
    AppState.currentGame.score += 10;
    if (geniusState.correctlyPlaced === geniusState.phrase.length) {
      setTimeout(() => showPhaseEndModal(true), 500);
    }
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
    }, 300);
  }
}
