/**
 * Módulo do Minijogo Genius (Versão Frases)
 * Utiliza o DraggableManager para a lógica de arrastar e soltar.
 */
let geniusState = {};

function initGeniusGame(phase) {
  DraggableManager.cleanup(); // Limpa listeners de arrasto anteriores

  const phraseData = GENIUS_PHRASES[phase];
  const board = document.getElementById("game-board");
  AppState.currentGame.score = 0;
  AppState.currentGame.errors = 0;
  updateGameUI();

  const requiredSymbols = [...new Set(phraseData.map((p) => p.classId))];
  const symbolsBank = GRAMMAR_CLASSES.filter((gc) =>
    requiredSymbols.includes(gc.id)
  );

  geniusState = {
    phrase: phraseData,
    turn: "computer",
    correctlyPlaced: 0,
  };

  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8 p-4">
      <div id="genius-phrase" class="min-h-[100px] flex flex-wrap items-center justify-center gap-x-2 gap-y-4"></div>
      <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4 bg-stone-50 p-4 rounded-xl shadow-inner min-h-[120px] w-full max-w-lg">
        ${symbolsBank
          .map(
            (s) => `
          <div class="genius-symbol draggable w-16 h-16 p-1 bg-white rounded-lg shadow cursor-grab active:cursor-grabbing" data-id="${
            s.id
          }">
            ${s.symbol("w-full h-full pointer-events-none")}
          </div>`
          )
          .join("")}
      </div>
    </div>`;

  document.getElementById("game-message").textContent =
    "Observe a formação da frase...";
  setTimeout(computerTurn, 1500);
}

function computerTurn() {
  geniusState.turn = "computer";
  const phraseContainer = document.getElementById("genius-phrase");
  let displayIndex = 0;
  const displayInterval = setInterval(() => {
    if (displayIndex >= geniusState.phrase.length) {
      clearInterval(displayInterval);
      setTimeout(() => {
        geniusState.turn = "player";
        document.getElementById("game-message").textContent =
          "Sua vez! Complete a frase.";
        renderPlayerTurn();
      }, 1000);
      return;
    }
    const currentWords = geniusState.phrase.slice(0, displayIndex + 1);
    phraseContainer.innerHTML = currentWords
      .map((wordData, idx) => {
        const symbol = GRAMMAR_CLASSES.find((gc) => gc.id === wordData.classId);
        return `<div class="flex flex-col items-center justify-end h-24 text-center">
                <span class="px-1 text-lg">${wordData.word}</span>
                <div class="w-12 h-12 p-1 ${
                  idx === displayIndex ? "animate-pulse-symbol" : ""
                }">${symbol.symbol("w-full h-full")}</div>
              </div>`;
      })
      .join("");
    GameAudio.play("flip");
    displayIndex++;
  }, 1000);
}

function renderPlayerTurn() {
  const phraseContainer = document.getElementById("genius-phrase");
  phraseContainer.innerHTML = geniusState.phrase
    .map(
      (wordData, index) => `
    <div class="flex flex-col items-center justify-end h-24 text-center">
      <span class="px-1 text-lg">${wordData.word}</span>
      <div class="target bg-stone-200 w-12 h-12 rounded-lg flex items-center justify-center" data-correct-id="${wordData.classId}"></div>
    </div>`
    )
    .join("");

  DraggableManager.makeDraggable(
    "#genius-symbols-bank .draggable",
    handleGeniusDrop
  );
}

function handleGeniusDrop(symbolEl, targetEl, placeholder, unlockCallback) {
  const droppedSymbolId = parseInt(symbolEl.dataset.id);
  const isCorrect =
    targetEl && parseInt(targetEl.dataset.correctId) === droppedSymbolId;

  if (isCorrect) {
    GameAudio.play("match");
    placeholder.remove();
    const targetRect = targetEl.getBoundingClientRect();
    Object.assign(symbolEl.style, {
      transition: "all 0.3s ease-out",
      left: `${
        targetRect.left + (targetRect.width - symbolEl.offsetWidth) / 2
      }px`,
      top: `${
        targetRect.top + (targetRect.height - symbolEl.offsetHeight) / 2
      }px`,
      transform: "scale(0.8)",
    });

    setTimeout(() => {
      targetEl.replaceWith(symbolEl);
      Object.assign(symbolEl.style, {
        position: "static",
        left: "",
        top: "",
        zIndex: "",
        transform: "",
        width: "",
        height: "",
      });
      symbolEl.classList.remove("draggable");
      unlockCallback();
    }, 300);

    geniusState.correctlyPlaced++;
    AppState.currentGame.score += 10;
    updateGameUI();
    if (geniusState.correctlyPlaced === geniusState.phrase.length) {
      setTimeout(() => showPhaseEndModal(true), 500);
    }
  } else {
    GameAudio.play("error");
    if (targetEl) {
      AppState.currentGame.errors++;
      updateGameUI();
    }
    const placeholderRect = placeholder.getBoundingClientRect();
    Object.assign(symbolEl.style, {
      transition: "all 0.3s ease-in-out",
      left: `${placeholderRect.left}px`,
      top: `${placeholderRect.top}px`,
      transform: "scale(1)",
    });
    setTimeout(() => {
      placeholder.replaceWith(symbolEl);
      Object.assign(symbolEl.style, {
        position: "static",
        left: "",
        top: "",
        zIndex: "",
        transform: "",
      });
      unlockCallback();
    }, 300);
  }
}
