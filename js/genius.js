/**
 * Módulo do Minijogo Genius (Versão Frases)
 * Contém a nova lógica de funcionamento do Genius, baseada em montar frases.
 */
let geniusState = {};

function initGeniusGame(phase) {
  const phraseData = GENIUS_PHRASES[phase];
  const board = document.getElementById("game-board");
  AppState.currentGame.score = 0;
  updateGameUI();

  // Mapeia os símbolos necessários para a fase
  const requiredSymbols = [...new Set(phraseData.map((p) => p.classId))];
  const symbolsBank = GRAMMAR_CLASSES.filter((gc) =>
    requiredSymbols.includes(gc.id)
  );

  geniusState = {
    phrase: phraseData,
    sequence: [],
    playerSequence: [],
    step: 0,
    turn: "computer",
  };

  // Monta o HTML do tabuleiro
  board.innerHTML = `
    <div class="w-full flex flex-col items-center gap-8">
      <div id="genius-phrase" class="text-2xl md:text-3xl font-bold h-24 flex flex-wrap items-center justify-center gap-x-2">
        </div>
      <div id="genius-symbols-bank" class="flex flex-wrap items-center justify-center gap-4">
        ${symbolsBank
          .map(
            (s) => `
          <div class="draggable w-16 h-16 p-1 bg-white rounded-lg shadow cursor-grab active:cursor-grabbing" data-id="${
            s.id
          }">
            ${s.symbol("w-full h-full pointer-events-none")}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("game-message").textContent =
    "Observe a formação da frase...";
  setTimeout(computerTurn, 2000);
}

function computerTurn() {
  geniusState.turn = "computer";
  geniusState.step++;
  if (geniusState.step > geniusState.phrase.length) {
    geniusState.turn = "player";
    document.getElementById("game-message").textContent =
      "Sua vez! Complete a frase.";
    renderPlayerTurn();
    return;
  }

  renderComputerTurn();

  setTimeout(() => {
    if (geniusState.turn === "computer") {
      // Previne loop se o jogador sair
      computerTurn();
    }
  }, 3000); // Intervalo entre as palavras
}

function renderComputerTurn() {
  const phraseContainer = document.getElementById("genius-phrase");
  const currentWords = geniusState.phrase.slice(0, geniusState.step);
  const newWord = currentWords[currentWords.length - 1];
  const symbol = GRAMMAR_CLASSES.find((gc) => gc.id === newWord.classId);

  // Mostra a frase com a palavra nova e o símbolo
  phraseContainer.innerHTML = currentWords
    .map((wordData, index) => {
      const isNewWord = index === currentWords.length - 1;
      return `
      <div class="flex flex-col items-center">
        <span class="px-1">${wordData.word}</span>
        <div class="h-16 w-16 p-1 ${isNewWord ? "opacity-100" : "opacity-0"}">
          ${isNewWord ? symbol.symbol("w-full h-full") : ""}
        </div>
      </div>
    `;
    })
    .join("");
}

function renderPlayerTurn() {
  const phraseContainer = document.getElementById("genius-phrase");
  // Mostra a frase completa com slots vazios para os símbolos
  phraseContainer.innerHTML = geniusState.phrase
    .map(
      (wordData, index) => `
        <div class="flex flex-col items-center">
            <span class="px-1">${wordData.word}</span>
            <div class="target bg-stone-200 w-16 h-16 rounded-lg" data-index="${index}"></div>
        </div>
    `
    )
    .join("");

  // Habilita o drag-and-drop nos símbolos e slots
  document.querySelectorAll("#genius-symbols-bank .draggable").forEach((el) => {
    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: false });
  });
}
