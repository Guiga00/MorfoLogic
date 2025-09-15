/**
 * Lógica Principal (Core)
 */

const AppState = {
  currentScreen: "login-screen",
  currentUser: null,
  generalScore: 0,
  sessionTimer: null,
  gameActive: false,
  progress: { memory: 0, genius: 0, ligar: 0 },
  currentGame: {
    type: null,
    phase: 1,
    score: 0,
    stars: 0,
    errors: 0,
    startTime: 0,
    timer: null,
  },
};
const GRAMMAR_CLASSES = [
  {
    id: 1,
    name: "Substantivo",
    symbol: (c) =>
      `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="${c}" />`,
  },
  {
    id: 4,
    name: "Verbo",
    symbol: (c) =>
      `<img src="./assets/img/Verbo.svg" alt="Verbo" class="${c}" />`,
  },
  {
    id: 3,
    name: "Adjetivo",
    symbol: (c) =>
      `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="${c}" />`,
  },
  {
    id: 2,
    name: "Artigo",
    symbol: (c) =>
      `<img src="./assets/img/Artigo.svg" alt="Artigo" class="${c}" />`,
  },
  {
    id: 5,
    name: "Pronome",
    symbol: (c) =>
      `<img src="./assets/img/Pronome.svg" alt="Pronome" class="${c}" />`,
  },
  {
    id: 10,
    name: "Numeral",
    symbol: (c) =>
      `<img src="./assets/img/numeral.svg" alt="Numeral" class="${c}" />`,
  },
  {
    id: 6,
    name: "Advérbio",
    symbol: (c) =>
      `<img src="./assets/img/Adverbio.svg" alt="Advérbio" class="${c}" />`,
  },
  {
    id: 8,
    name: "Conjunção",
    symbol: (c) =>
      `<img src="./assets/img/Conjuncao.svg" alt="Conjunção" class="${c}" />`,
  },
  {
    id: 7,
    name: "Preposição",
    symbol: (c) =>
      `<img src="./assets/img/Preposicao.svg" alt="Preposição" class="${c}" />`,
  },
  {
    id: 9,
    name: "Interjeição",
    symbol: (c) =>
      `<img src="./assets/img/Interjeicao.svg" alt="Interjeição" class="${c}" />`,
  },
];
const USERS = {
  aluno: "student",
  adm: "admin",
  professor: "admin",
  diretora: "admin",
};
const SESSION_DURATION_MINUTES = 15;
let geniusSequenceInterval = null;
const GENIUS_PHRASES = {
  1: [
    { word: "Encontramos", classId: 4 },
    { word: "o", classId: 2 },
    { word: "tesouro", classId: 1 },
    { word: "perdido.", classId: 3 },
  ],
  2: [
    { word: "Meu", classId: 5 },
    { word: "lanche", classId: 1 },
    { word: "favorito", classId: 3 },
    { word: "é", classId: 4 },
    { word: "suco", classId: 1 },
    { word: "e", classId: 8 },
    { word: "bolo", classId: 1 },
    { word: "de", classId: 7 },
    { word: "chocolate.", classId: 1 },
  ],
  3: [
    { word: "Oba!", classId: 9 },
    { word: "As", classId: 2 },
    { word: "minhas", classId: 5 },
    { word: "duas", classId: 10 },
    { word: "bonecas", classId: 1 },
    { word: "novas", classId: 3 },
    { word: "e", classId: 8 },
    { word: "perfumadas", classId: 3 },
    { word: "chegaram", classId: 4 },
    { word: "hoje", classId: 6 },
    { word: "em", classId: 7 },
    { word: "casa!", classId: 1 },
  ],
};

function saveData() {
  if (!AppState.currentUser) return;
  try {
    const allData = JSON.parse(localStorage.getItem("morfoLogicData")) || {};
    allData[AppState.currentUser] = {
      generalScore: AppState.generalScore,
      progress: AppState.progress,
    };
    localStorage.setItem("morfoLogicData", JSON.stringify(allData));
  } catch (error) {
    console.error("Falha ao salvar os dados:", error);
  }
}
function loadData(username) {
  try {
    const allData = JSON.parse(localStorage.getItem("morfoLogicData")) || {};
    const userData = allData[username];
    if (userData) {
      AppState.generalScore = userData.generalScore || 0;
      AppState.progress = userData.progress || {
        memory: 0,
        genius: 0,
        ligar: 0,
      };
    } else {
      AppState.generalScore = 0;
      AppState.progress = { memory: 0, genius: 0, ligar: 0 };
    }
  } catch (error) {
    console.error("Falha ao carregar os dados:", error);
    AppState.generalScore = 0;
    AppState.progress = { memory: 0, genius: 0, ligar: 0 };
  }
}

// function navigate(screenId) {
//   if (
//     !AppState.gameActive &&
//     !screenId.startsWith("login") &&
//     !screenId.startsWith("static")
//   )
//     return;
//   const currentScreen = document.getElementById(AppState.currentScreen);
//   const nextScreen = document.getElementById(screenId);
//   if (currentScreen && currentScreen !== nextScreen) {
//     currentScreen.classList.add("fade-out");
//     setTimeout(() => {
//       currentScreen.classList.add("hidden");
//       currentScreen.classList.remove("fade-out");
//       nextScreen.classList.remove("hidden");
//       nextScreen.classList.add("fade-in");
//       setTimeout(() => nextScreen.classList.remove("fade-in"), 300);
//     }, 300);
//   } else if (nextScreen) {
//     nextScreen.classList.remove("hidden");
//   }
//   AppState.currentScreen = screenId;
// }

function navigate(screenId) {
    const currentScreen = document.getElementById(AppState.currentScreen);
    const nextScreen = document.getElementById(screenId);
    const bottomMenu = document.getElementById('memory-bottom-menu');

    // --- Outgoing Animations ---
    if (currentScreen && currentScreen !== nextScreen) {
        currentScreen.classList.add("fade-out");
        // If we are leaving the game screen, start the menu's fade-out animation
        if (currentScreen.id === 'game-screen') {
            bottomMenu.classList.remove('menu-fade-in'); // Clean up old class
            bottomMenu.classList.add('menu-fade-out');
        }

        // --- Wait for animations to finish ---
        setTimeout(() => {
            currentScreen.classList.add("hidden");
            currentScreen.classList.remove("fade-out");
            // Hide the menu completely after its animation is done
            if (currentScreen.id === 'game-screen') {
                bottomMenu.classList.add('hidden');
            }

            // --- Incoming Animations ---
            if (nextScreen) {
                nextScreen.classList.remove("hidden");
                nextScreen.classList.add("fade-in");
                // If we are entering the game screen, start the menu's fade-in animation
                if (nextScreen.id === 'game-screen') {
                    bottomMenu.classList.remove('hidden', 'menu-fade-out'); // Clean up and show
                    bottomMenu.classList.add('menu-fade-in');
                }
                setTimeout(() => nextScreen.classList.remove("fade-in"), 300);
            }
        }, 300); // This duration must match your CSS animation time

    } else if (nextScreen) {
        // This handles the very first navigation (e.g., from login)
        nextScreen.classList.remove("hidden");
        nextScreen.classList.add("fade-in");
        if (nextScreen.id === 'game-screen') {
            bottomMenu.classList.remove('hidden', 'menu-fade-out');
            bottomMenu.classList.add('menu-fade-in');
        }
        setTimeout(() => nextScreen.classList.remove("fade-in"), 300);
    }

    AppState.currentScreen = screenId;
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.firstElementChild.classList.add("fade-in");
  setTimeout(() => modal.firstElementChild.classList.remove("fade-in"), 300);
}
function closeModal(modal) {
  if (!modal) return;
  modal.firstElementChild.classList.add("fade-out");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.firstElementChild.classList.remove("fade-out");
  }, 300);
}
function startSessionTimer() {
  clearTimeout(AppState.sessionTimer);
  AppState.sessionTimer = setTimeout(() => {
    AppState.gameActive = false;
    showModal("session-expired-modal");
  }, SESSION_DURATION_MINUTES * 60 * 1000);
}
function goBackToLogin(isExpired = false) {
  DraggableManager.cleanup();
  if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
  if (isExpired) closeModal(document.getElementById("session-expired-modal"));
  AppState.currentUser = null;
  AppState.generalScore = 0;
  AppState.progress = { memory: 0, genius: 0, ligar: 0 };
  AppState.gameActive = false;
  clearTimeout(AppState.sessionTimer);
  clearInterval(geniusSequenceInterval);
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").textContent = "";
  navigate("login-screen");
}
function goToGameSelection() {
  DraggableManager.cleanup();
  if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
  closeModal(document.getElementById("phase-end-modal"));
  if (document.getElementById("general-score"))
    document.getElementById("general-score").textContent =
      AppState.generalScore;
  clearInterval(geniusSequenceInterval);
  navigate("game-selection-screen");
}
function openPhaseSelectionModal(gameType) {
  const titles = { memory: "Memória", genius: "Genius", ligar: "Tempo" };
  const titleEl = document.getElementById("phase-selection-title");
  if (titleEl) titleEl.textContent = titles[gameType];
  const maxPhaseUnlocked = (AppState.progress[gameType] || 0) + 1;
  const buttonsContainer = document.getElementById("phase-selection-buttons");
  if (buttonsContainer) {
    buttonsContainer.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
      const isUnlocked = i <= maxPhaseUnlocked;
      buttonsContainer.innerHTML += isUnlocked
        ? `<button onclick="startGame('${gameType}', ${i})" class="bg-[#386ccc] text-white font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl hover:bg-[#2a529f] transition">Nível ${i}</button>`
        : `<div class="bg-stone-300 text-stone-500 font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl cursor-not-allowed flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>Nível ${i}</div>`;
    }
  }
  showModal("phase-selection-modal");
}
function closePhaseSelectionModal() {
  closeModal(document.getElementById("phase-selection-modal"));
}
function getClassesForPhase(phase) {
  const counts = { memory: [4, 7, 10], ligar: [4, 7, 10] };
  const classCount = counts.memory[phase - 1] || 10;
  const phaseClasses = {
    1: [1, 3, 2, 10],
    2: [1, 3, 2, 10, 5, 4, 6],
    3: [1, 3, 2, 10, 5, 4, 6, 7, 8, 9],
  };
  const idsToInclude = phaseClasses[phase] || phaseClasses[3];
  return GRAMMAR_CLASSES.filter((gc) => idsToInclude.includes(gc.id));
}
function startGame(type, phase) {
  DraggableManager.cleanup();
  if (AppState.currentGame.timer) clearInterval(AppState.currentGame.timer);
  closeModal(document.getElementById("phase-selection-modal"));
  AppState.currentGame = {
    type,
    phase,
    score: 0,
    stars: 0,
    errors: 0,
    startTime: 0,
    timer: null,
  };
  updateGameUI();
  navigate("game-screen");
  switch (type) {
    case "memory":
      initMemoryGame(phase);
      break;
    case "genius":
      initGeniusGame(phase);
      break;
    case "ligar":
      initLigarGame(phase);
      break;
  }
}
function restartPhase() {
  DraggableManager.cleanup();
  startGame(AppState.currentGame.type, AppState.currentGame.phase);
}
function renderStars(count) {
  const starFull = `<svg class="star-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.868 2.884c.321-.662 1.134-.662 1.456 0l1.96 4.022a1 1 0 00.95.69h4.438c.732 0 1.042.986.534 1.455l-3.59 2.604a1 1 0 00-.364 1.118l1.37 4.162c.287.87-.695 1.636-1.476 1.157l-3.95-2.871a1 1 0 00-1.176 0l-3.95 2.87c-.78.58-1.763.27-1.475-1.157l1.37-4.162a1 1 0 00-.364-1.118L2.05 9.055c-.508-.47-.198-1.455.534-1.455h4.438a1 1 0 00.95-.69l1.96-4.022z" clip-rule="evenodd" /></svg>`;
  const starEmpty = `<svg class="star-empty" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.868 2.884c.321-.662 1.134-.662 1.456 0l1.96 4.022a1 1 0 00.95.69h4.438c.732 0 1.042.986.534 1.455l-3.59 2.604a1 1 0 00-.364 1.118l1.37 4.162c.287.87-.695 1.636-1.476 1.157l-3.95-2.871a1 1 0 00-1.176 0l-3.95 2.87c-.78.58-1.763.27-1.475-1.157l1.37-4.162a1 1 0 00-.364-1.118L2.05 9.055c-.508-.47-.198-1.455.534-1.455h4.438a1 1 0 00.95-.69l1.96-4.022z" clip-rule="evenodd" /></svg>`;
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += i < count ? starFull : starEmpty;
  }
  return html;
}
function updateGameUI() {
  const { type, phase, score, stars } = AppState.currentGame;
  const titles = { memory: "Memória", genius: "Genius", ligar: "Tempo" };
  // Atualiza título e fase no novo header
  const gameTitleEl = document.getElementById("game-title");
  if (gameTitleEl) gameTitleEl.textContent = titles[type] || "Jogo";
  const gamePhaseLabelEl = document.getElementById("memory-phase-label");
  if (gamePhaseLabelEl)
    gamePhaseLabelEl.innerHTML = `Fase <span id="game-phase">${phase}</span>`;
  const gameMessageEl = document.getElementById("game-message");
  if (gameMessageEl) gameMessageEl.textContent = "";
  const scoreDisplay = document.getElementById("game-score-display");
  if (scoreDisplay) {
    if (type === "memory") {
      scoreDisplay.innerHTML = `Estrelas: ${renderStars(stars)}`;
    } else {
      scoreDisplay.innerHTML = `Pontos: <span class="font-bold">${score}</span>`;
    }
  }
}
function showPhaseEndModal(isSuccess = true) {
  const { stars, errors, phase, type, score } = AppState.currentGame;
  const isLastPhase = phase === 3;
  const modalTitle = document.getElementById("modal-title");
  const modalScore = document.getElementById("modal-score");
  const modalBonus = document.getElementById("modal-bonus");
  const modalNext = document.getElementById("modal-next-phase");
  let pointsEarned = 0;
  if (isSuccess) {
    GameAudio.play("success");
    modalTitle.textContent = `Fase ${phase} Concluída!`;
    if (type === "memory") {
      pointsEarned = stars * 10;
      modalScore.textContent = `Você conseguiu ${stars} estrela(s), ganhando ${pointsEarned} pontos.`;
      if (stars === 3) {
        pointsEarned += 20;
        modalBonus.textContent =
          "Bônus de +20 pontos pela performance perfeita!";
      } else {
        modalBonus.textContent = "";
      }
    } else {
      pointsEarned = score;
      modalScore.textContent = `Sua pontuação foi: ${pointsEarned} pontos.`;
      if (errors === 0 && (type === "ligar" || type === "genius")) {
        pointsEarned += 20;
        modalBonus.textContent = "Bônus de +20 pontos por nenhum erro!";
      } else {
        modalBonus.textContent = "";
      }
    }
    if (phase >= (AppState.progress[type] || 0)) {
      AppState.progress[type] = phase;
    }
  } else {
    modalTitle.textContent = `Fim de Jogo`;
    if (type === "memory") {
      modalScore.textContent = `Você não conseguiu estrelas suficientes.`;
    } else {
      modalScore.textContent = `Sua pontuação final foi: ${score} pontos.`;
    }
    modalBonus.textContent = "";
  }
  AppState.generalScore += pointsEarned;
  saveData();
  if (isLastPhase && isSuccess) {
    modalNext.textContent = "Voltar ao Menu";
    modalNext.onclick = goToGameSelection;
  } else if (!isSuccess) {
    modalNext.textContent = "Tentar Novamente";
    modalNext.onclick = () => {
      closeModal(document.getElementById("phase-end-modal"));
      restartPhase();
    };
  } else {
    modalNext.textContent = "Próxima Fase";
    modalNext.onclick = () => {
      closeModal(document.getElementById("phase-end-modal"));
      startGame(type, phase + 1);
    };
  }
  showModal("phase-end-modal");
}
