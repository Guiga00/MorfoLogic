/**
 * Lógica Principal (Core)
 * Gerencia o estado global (AppState), navegação, constantes,
 * e funções compartilhadas por toda a aplicação.
 */

// --- ESTADO GLOBAL E CONSTANTES ---
const AppState = {
  currentScreen: "login-screen",
  currentUser: null,
  generalScore: 0,
  sessionTimer: null,
  gameActive: false,
  progress: { memory: 0, genius: 0, ligar: 0 },
  currentGame: { type: null, phase: 1, score: 0, errors: 0 },
};

const GRAMMAR_CLASSES = [
  {
    id: 1,
    name: "Substantivo",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="#262626"/></svg>`,
  },
  {
    id: 2,
    name: "Artigo",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><polygon points="50,40 70,80 30,80" fill="#67e8f9"/></svg>`,
  },
  {
    id: 3,
    name: "Adjetivo",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><polygon points="50,25 80,85 20,85" fill="#0891b2"/></svg>`,
  },
  {
    id: 4,
    name: "Verbo",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#ef4444"/></svg>`,
  },
  {
    id: 5,
    name: "Pronome",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><polygon points="50,10 75,90 25,90" fill="#a855f7"/></svg>`,
  },
  {
    id: 6,
    name: "Advérbio",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#f97316"/></svg>`,
  },
  {
    id: 7,
    name: "Preposição",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><path d="M10 60 A 40 40 0 0 1 90 60" stroke="#22c55e" stroke-width="15" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 8,
    name: "Conjunção",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><rect x="20" y="45" width="60" height="10" rx="5" fill="#ec4899"/></svg>`,
  },
  {
    id: 9,
    name: "Interjeição",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><g fill="#f59e0b"><rect x="45" y="10" width="10" height="50" rx="5"/><circle cx="50" cy="75" r="8"/></g></svg>`,
  },
  {
    id: 10,
    name: "Numeral",
    symbol: (c) =>
      `<svg class="${c}" viewBox="0 0 100 100"><rect x="10" y="45" width="80" height="15" rx="7" fill="#38bdf8"/></svg>`,
  },
];

const USERS = {
  aluno: "student",
  adm: "admin",
  professor: "admin",
  diretora: "admin",
};
const SESSION_DURATION_MINUTES = 15;
let geniusSequenceInterval = null; // Para ser acessível globalmente

// --- PERSISTÊNCIA DE DADOS ---
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

// --- CONTROLE DE NAVEGAÇÃO E ANIMAÇÃO ---
function navigate(screenId) {
  if (
    !AppState.gameActive &&
    !screenId.startsWith("login") &&
    !screenId.startsWith("static")
  )
    return;
  const currentScreen = document.getElementById(AppState.currentScreen);
  const nextScreen = document.getElementById(screenId);
  if (currentScreen && currentScreen !== nextScreen) {
    currentScreen.classList.add("fade-out");
    setTimeout(() => {
      currentScreen.classList.add("hidden");
      currentScreen.classList.remove("fade-out");
      nextScreen.classList.remove("hidden");
      nextScreen.classList.add("fade-in");
      setTimeout(() => nextScreen.classList.remove("fade-in"), 300);
    }, 300);
  } else if (nextScreen) {
    nextScreen.classList.remove("hidden");
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

// --- LÓGICA DE SESSÃO E NAVEGAÇÃO GERAL ---
function startSessionTimer() {
  clearTimeout(AppState.sessionTimer);
  AppState.sessionTimer = setTimeout(() => {
    AppState.gameActive = false;
    showModal("session-expired-modal");
  }, SESSION_DURATION_MINUTES * 60 * 1000);
}

function goBackToLogin(isExpired = false) {
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
  closeModal(document.getElementById("phase-end-modal"));
  document.getElementById("general-score").textContent = AppState.generalScore;
  clearInterval(geniusSequenceInterval);
  navigate("game-selection-screen");
}

// --- LÓGICA DE JOGO (GERAL) ---
function openPhaseSelectionModal(gameType) {
  const titles = { memory: "Memória", genius: "Genius", ligar: "Ligar" };
  document.getElementById("phase-selection-title").textContent =
    titles[gameType];
  const maxPhaseUnlocked = (AppState.progress[gameType] || 0) + 1;
  const buttonsContainer = document.getElementById("phase-selection-buttons");
  buttonsContainer.innerHTML = "";
  for (let i = 1; i <= 3; i++) {
    const isUnlocked = i <= maxPhaseUnlocked;
    buttonsContainer.innerHTML += isUnlocked
      ? `<button onclick="startGame('${gameType}', ${i})" class="bg-teal-500 text-white font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl hover:bg-teal-600 transition">Nível ${i}</button>`
      : `<div class="bg-stone-300 text-stone-500 font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl cursor-not-allowed flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>Nível ${i}</div>`;
  }
  showModal("phase-selection-modal");
}

function closePhaseSelectionModal() {
  closeModal(document.getElementById("phase-selection-modal"));
}

function getClassesForPhase(phase) {
  const counts = [4, 6, 10];
  const numClasses = counts[phase - 1] || 4;
  return GRAMMAR_CLASSES.slice(0, numClasses);
}

function startGame(type, phase) {
  closeModal(document.getElementById("phase-selection-modal"));
  AppState.currentGame = { type, phase, score: 0, errors: 0 };
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
  startGame(AppState.currentGame.type, AppState.currentGame.phase);
}

function updateGameUI() {
  const titles = { memory: "Memória", genius: "Genius", ligar: "Ligar" };
  document.getElementById("game-title").textContent =
    titles[AppState.currentGame.type];
  document.getElementById("game-phase").textContent =
    AppState.currentGame.phase;
  document.getElementById("game-score").textContent =
    AppState.currentGame.score;
  document.getElementById("game-message").textContent = "";
}

function showPhaseEndModal(completed = true) {
  const { score, errors, phase, type } = AppState.currentGame;
  const isLastPhase = phase === 3;
  const modalTitle = document.getElementById("modal-title");
  const modalScore = document.getElementById("modal-score");
  const modalBonus = document.getElementById("modal-bonus");
  const modalNext = document.getElementById("modal-next-phase");
  let currentScore = score;
  if (completed) {
    GameAudio.play("success");
    modalTitle.textContent = `Fase ${phase} Concluída!`;
    if (errors === 0) {
      currentScore += 20;
      modalBonus.textContent = "Bônus de +20 pontos por nenhum erro!";
    } else {
      modalBonus.textContent = "";
    }
    modalScore.textContent = `Sua pontuação foi: ${currentScore} pontos.`;
    if (phase > (AppState.progress[type] || 0)) {
      AppState.progress[type] = phase;
    }
  } else {
    modalTitle.textContent = `Fim de Jogo`;
    modalScore.textContent = `Sua pontuação final foi: ${currentScore} pontos.`;
    modalBonus.textContent = `Você chegou na sequência de ${
      geniusState.sequence.length - 1
    } itens.`;
  }
  AppState.generalScore += currentScore;
  saveData();
  if (isLastPhase && completed) {
    modalNext.textContent = "Voltar ao Menu";
    modalNext.onclick = goToGameSelection;
  } else if (!completed) {
    modalNext.textContent = "Tentar Novamente";
    modalNext.onclick = () => {
      closeModal(document.getElementById("phase-end-modal"));
      startGame(type, phase);
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
