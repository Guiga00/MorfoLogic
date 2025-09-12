// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
let geniusState = {};

function initGeniusGame(phase) {
  DraggableManager.cleanup();

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
  if (!phraseContainer) return; // Verificação de segurança

  let displayIndex = 0;
  const displayInterval = setInterval(() => {
    if (displayIndex >= geniusState.phrase.length) {
      clearInterval(displayInterval);
      setTimeout(() => {
        geniusState.turn = "player";
        const gameMessage = document.getElementById("game-message");
        if (gameMessage) gameMessage.textContent = "Sua vez! Complete a frase.";
        renderPlayerTurn();
      }, 1000);
      return;
    }
    const currentWords = geniusState.phrase.slice(0, displayIndex + 1);
    if (phraseContainer) {
      phraseContainer.innerHTML = currentWords
        .map((wordData, idx) => {
          const symbol = GRAMMAR_CLASSES.find(
            (gc) => gc.id === wordData.classId
          );
          return `<div class="flex flex-col items-center justify-end h-24 text-center">
                    <span class="px-1 text-lg">${wordData.word}</span>
                    <div class="w-12 h-12 p-1 ${
                      idx === displayIndex ? "animate-pulse-symbol" : ""
                    }">${symbol.symbol("w-full h-full")}</div>
                </div>`;
        })
        .join("");
    }
    GameAudio.play("flip");
    displayIndex++;
  }, 1000);
}

function renderPlayerTurn() {
  const phraseContainer = document.getElementById("genius-phrase");
  if (!phraseContainer) return; // Verificação de segurança

  phraseContainer.innerHTML = geniusState.phrase
    .map(
      (wordData, index) => `
    <div class="flex flex-col items-center justify-end h-24 text-center">
      <span class="px-1 text-lg">${wordData.word}</span>
      <div class="target bg-stone-200 w-12 h-12 rounded-lg flex items-center justify-center" data-correct-id="${wordData.classId}"></div>
    </div>`
    )
    .join("");

  // Habilita o modo 'clone' para o jogo Genius
  DraggableManager.makeDraggable(
    "#genius-symbols-bank .draggable",
    handleGeniusDrop,
    { mode: "clone" }
  );
}

function handleGeniusDrop(clonedEl, targetEl, placeholder, unlockCallback) {
  const droppedSymbolId = parseInt(clonedEl.dataset.id);
  const isCorrect =
    targetEl && parseInt(targetEl.dataset.correctId) === droppedSymbolId;

  if (isCorrect) {
    GameAudio.play("match");
    const targetRect = targetEl.getBoundingClientRect();
    Object.assign(clonedEl.style, {
      transition: "all 0.3s ease-out",
      left: `${
        targetRect.left + (targetRect.width - clonedEl.offsetWidth) / 2
      }px`,
      top: `${
        targetRect.top + (targetRect.height - clonedEl.offsetHeight) / 2
      }px`,
      transform: "scale(0.8)",
    });

    setTimeout(() => {
      // Verifica se o alvo ainda existe antes de o substituir
      if (document.body.contains(targetEl)) {
        targetEl.replaceWith(clonedEl);
        Object.assign(clonedEl.style, {
          position: "static",
          left: "",
          top: "",
          zIndex: "",
          transform: "",
          width: "",
          height: "",
        });
        clonedEl.classList.remove("draggable");
      } else if (document.body.contains(clonedEl)) {
        clonedEl.remove(); // Remove o clone se o alvo desapareceu
      }
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
    // Anima o desaparecimento do clone incorreto
    Object.assign(clonedEl.style, {
      transition: "all 0.3s ease-in-out",
      transform: "scale(0.5)",
      opacity: "0",
    });
    setTimeout(() => {
      if (document.body.contains(clonedEl)) clonedEl.remove();
      unlockCallback();
    }, 300);
  }
}
