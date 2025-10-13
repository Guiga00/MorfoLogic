/**
 * js/main.js
 */

// Sistema de detecção e controle mobile
const MobileUtils = {
  isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ),
  isTablet: /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent),
  isLandscape: () => window.innerWidth > window.innerHeight,

  init() {
    if (this.isMobile) {
      document.body.classList.add('mobile-device');
      this.setupOrientationHandling();
      this.applyMobileStyles();
    }
  },

  setupOrientationHandling() {
    // Força orientação landscape em dispositivos móveis
    const handleOrientationChange = () => {
      if (this.isMobile) {
        if (!this.isLandscape()) {
          document.body.classList.add('portrait-warning');
          this.showOrientationModal();
        } else {
          document.body.classList.remove('portrait-warning');
          this.hideOrientationModal();
        }
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Verifica orientação inicial
    setTimeout(handleOrientationChange, 100);
  },

  showOrientationModal() {
    let modal = document.getElementById('orientation-modal');
    if (!modal) {
      modal = this.createOrientationModal();
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
  },

  hideOrientationModal() {
    const modal = document.getElementById('orientation-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  createOrientationModal() {
    const modal = document.createElement('div');
    modal.id = 'orientation-modal';
    modal.className =
      'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[9999]';
    modal.innerHTML = `
      <div class="bg-white p-8 rounded-2xl text-center max-w-sm">
        <div class="text-6xl mb-4">📱➡️</div>
        <h2 class="text-2xl font-bold mb-4 text-[#386ccc]">Gire seu dispositivo</h2>
        <p class="text-gray-600">Para uma melhor experiência, por favor gire seu dispositivo para o modo paisagem.</p>
      </div>
    `;
    return modal;
  },

  applyMobileStyles() {
    // Adiciona estilos específicos para mobile
    document.documentElement.style.setProperty('--mobile-padding', '8px');
    document.documentElement.style.setProperty('--mobile-font-size', '14px');

    // Previne zoom em inputs
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content =
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
  },
};

const AppState = {
  currentScreen: 'login-screen',
  currentUser: null,
  generalScore: 0,
  sessionTimer: null,
  sessionPausedAt: null, // Quando foi pausado
  sessionTimeRemaining: null, // Tempo restante quando pausado
  sessionStartedAt: null, // Quando iniciou
  gameActive: false,
  globalMuted: false,
  globalVolume: 1,
  progress: { memory: 0, genius: 0, ligar: 0 },
  currentGame: {
    type: null,
    phase: 1,
    score: 0,
    stars: 0,
    errors: 0,
    startTime: 0,
    clickCount: 0,
    timer: null,
  },
  // Função para limpar estados dos jogos
  cleanupCurrentGame() {
    Timer.reset();

    if (this.currentGame.previewInterval) {
      clearInterval(this.currentGame.previewInterval);
    }

    if (this.currentGame.previewTimeout) {
      clearTimeout(this.currentGame.previewTimeout);
    }

    // // Limpa timers do jogo atual
    // if (this.currentGame.timer) {
    //   clearInterval(this.currentGame.timer);
    //   this.currentGame.timer = null;
    // }

    // Limpeza específica do jogo da memória
    if (
      this.currentGame.type === 'memory' &&
      typeof window.cleanupMemoryGame === 'function'
    ) {
      window.cleanupMemoryGame();
    }

    // Limpa animações do Genius
    if (typeof geniusState !== 'undefined' && geniusState.animationTimeouts) {
      geniusState.isTerminated = true;
      geniusState.animationTimeouts.forEach(clearTimeout);
      geniusState.animationTimeouts = [];
    }

    // Limpa draggable manager
    if (typeof DraggableManager !== 'undefined') {
      DraggableManager.cleanup();
    }
  },
};
const GRAMMAR_CLASSES = [
  {
    id: 1,
    name: 'Substantivo',
    symbol: (c) =>
      `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="${c}" />`,
  },
  {
    id: 4,
    name: 'Verbo',
    symbol: (c) =>
      `<img src="./assets/img/Verbo.svg" alt="Verbo" class="${c}" />`,
  },
  {
    id: 3,
    name: 'Adjetivo',
    symbol: (c) =>
      `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="${c}" />`,
  },
  {
    id: 2,
    name: 'Artigo',
    symbol: (c) =>
      `<img src="./assets/img/Artigo.svg" alt="Artigo" class="${c}" />`,
  },
  {
    id: 5,
    name: 'Pronome',
    symbol: (c) =>
      `<img src="./assets/img/Pronome.svg" alt="Pronome" class="${c}" />`,
  },
  {
    id: 10,
    name: 'Numeral',
    symbol: (c) =>
      `<img src="./assets/img/numeral.svg" alt="Numeral" class="${c}" />`,
  },
  {
    id: 6,
    name: 'Advérbio',
    symbol: (c) =>
      `<img src="./assets/img/Adverbio.svg" alt="Advérbio" class="${c}" />`,
  },
  {
    id: 8,
    name: 'Conjunção',
    symbol: (c) =>
      `<img src="./assets/img/Conjuncao.svg" alt="Conjunção" class="${c}" />`,
  },
  {
    id: 7,
    name: 'Preposição',
    symbol: (c) =>
      `<img src="./assets/img/Preposicao.svg" alt="Preposição" class="${c}" />`,
  },
  {
    id: 9,
    name: 'Interjeição',
    symbol: (c) =>
      `<img src="./assets/img/Interjeicao.svg" alt="Interjeição" class="${c}" />`,
  },
];
const USERS = {
  aluno: 'student',
  adm: 'admin',
  professor: 'admin',
  diretora: 'admin',
};
const SESSION_DURATION_MINUTES = 15;
const GENIUS_PHRASES = {
  1: [
    {
      word: 'Encontramos',
      classId: 4,
      symbol: `<img src="./assets/img/Verbo.svg" alt="Verbo" class="">`,
    },
    {
      word: 'o',
      classId: 2,
      symbol: `<img src="./assets/img/Artigo.svg" alt="Artigo" class="">`,
    },
    {
      word: 'tesouro',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
    {
      word: 'perdido.',
      classId: 3,
      symbol: `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="">`,
    },
  ],
  2: [
    {
      word: 'Meu',
      classId: 5,
      symbol: `<img src="./assets/img/Pronome.svg" alt="Pronome" class="">`,
    },
    {
      word: 'lanche',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
    {
      word: 'favorito',
      classId: 3,
      symbol: `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="">`,
    },
    {
      word: 'é',
      classId: 4,
      symbol: `<img src="./assets/img/Verbo.svg" alt="Verbo" class="">`,
    },
    {
      word: 'suco',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
    {
      word: 'e',
      classId: 8,
      symbol: `<img src="./assets/img/Conjuncao.svg" alt="Conjunção" class="">`,
    },
    {
      word: 'bolo',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
    {
      word: 'de',
      classId: 7,
      symbol: `<img src="./assets/img/Preposicao.svg" alt="Preposição" class="">`,
    },
    {
      word: 'chocolate.',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
  ],
  3: [
    {
      word: 'Oba!',
      classId: 9,
      symbol: `<img src="./assets/img/Interjeicao.svg" alt="Interjeição" class="">`,
    },
    {
      word: 'As',
      classId: 2,
      symbol: `<img src="./assets/img/Artigo.svg" alt="Artigo" class="">`,
    },
    {
      word: 'minhas',
      classId: 5,
      symbol: `<img src="./assets/img/Pronome.svg" alt="Pronome" class="">`,
    },
    {
      word: 'duas',
      classId: 10,
      symbol: `<img src="./assets/img/numeral.svg" alt="Numeral" class="">`,
    },
    {
      word: 'bonecas',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
    {
      word: 'novas',
      classId: 3,
      symbol: `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="">`,
    },
    {
      word: 'e',
      classId: 8,
      symbol: `<img src="./assets/img/Conjuncao.svg" alt="Conjunção" class="">`,
    },
    {
      word: 'perfumadas',
      classId: 3,
      symbol: `<img src="./assets/img/adjetivo.svg" alt="Adjetivo" class="">`,
    },
    {
      word: 'chegaram',
      classId: 4,
      symbol: `<img src="./assets/img/Verbo.svg" alt="Verbo" class="">`,
    },
    {
      word: 'hoje',
      classId: 6,
      symbol: `<img src="./assets/img/Adverbio.svg" alt="Advérbio" class="">`,
    },
    {
      word: 'em',
      classId: 7,
      symbol: `<img src="./assets/img/Preposicao.svg" alt="Preposição" class="">`,
    },
    {
      word: 'casa!',
      classId: 1,
      symbol: `<img src="./assets/img/Substantivo.svg" alt="Substantivo" class="">`,
    },
  ],
};

function saveData() {
  if (!AppState.currentUser) return;
  try {
    const allData = JSON.parse(localStorage.getItem('morfoLogicData')) || {};
    allData[AppState.currentUser] = {
      generalScore: AppState.generalScore,
      progress: AppState.progress,
    };
    localStorage.setItem('morfoLogicData', JSON.stringify(allData));
  } catch (error) {
    console.error('Falha ao salvar os dados:', error);
  }
}

function loadData(username) {
  try {
    const allData = JSON.parse(localStorage.getItem('morfoLogicData')) || {};
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
    console.error('Falha ao carregar os dados:', error);
    AppState.generalScore = 0;
    AppState.progress = { memory: 0, genius: 0, ligar: 0 };
  }
}

// First-time help flag
function hasSeenHelp(user, gameType) {
  try {
    const key = 'ml_help_seen_v1';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return !!data?.[user || 'guest']?.[gameType];
  } catch {
    return false;
  }
}

function setSeenHelp(user, gameType) {
  try {
    const key = 'ml_help_seen_v1';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const u = user || 'guest';
    data[u] = data[u] || {};
    data[u][gameType] = true;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function navigate(screenId) {
  const currentScreen = document.getElementById(AppState.currentScreen);
  const nextScreen = document.getElementById(screenId);

  // Animação de saída
  if (currentScreen && currentScreen !== nextScreen) {
    const contentToAnimate =
      currentScreen.id === 'game-screen'
        ? currentScreen.querySelector('#game-content-wrapper')
        : currentScreen;
    if (contentToAnimate) contentToAnimate.classList.add('fade-out');

    setTimeout(() => {
      currentScreen.classList.add('hidden');
      if (contentToAnimate) contentToAnimate.classList.remove('fade-out');

      // Animação de entrada
      if (nextScreen) {
        const nextContentToAnimate =
          nextScreen.id === 'game-screen'
            ? nextScreen.querySelector('#game-content-wrapper')
            : nextScreen;

        nextScreen.classList.remove('hidden');
        if (nextContentToAnimate) {
          nextContentToAnimate.classList.add('fade-in');
          setTimeout(
            () => nextContentToAnimate.classList.remove('fade-in'),
            300
          );
        }
      }
    }, 300);
  } else if (nextScreen) {
    nextScreen.classList.remove('hidden');
    const nextContentToAnimate =
      nextScreen.id === 'game-screen'
        ? nextScreen.querySelector('#game-content-wrapper')
        : nextScreen;
    if (nextContentToAnimate) {
      nextContentToAnimate.classList.add('fade-in');
      setTimeout(() => nextContentToAnimate.classList.remove('fade-in'), 300);
    }
  }

  // Controlo do menu inferior
  const bottomMenu = document.getElementById('game-bottom-menu');
  if (bottomMenu) {
    if (screenId === 'game-screen') {
      bottomMenu.classList.add('menu-visible');
    } else {
      bottomMenu.classList.remove('menu-visible');
    }
  }

  AppState.currentScreen = screenId;
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  // Se for o modal de fim de fase, desabilita interação dos cards do minigame Ligar
  if (modalId === 'phase-end-modal') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.add('paused');
    }
  }
}
function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  // Se for o modal de fim de fase, reabilita interação dos cards do minigame Ligar
  if (modal.id === 'phase-end-modal') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.remove('paused');
    }
  }
}
function startSessionTimer() {
  clearTimeout(AppState.sessionTimer);
  AppState.sessionPausedAt = null;
  AppState.sessionTimeRemaining = SESSION_DURATION_MINUTES * 60 * 1000;
  AppState.sessionStartedAt = Date.now();

  AppState.sessionTimer = setTimeout(() => {
    // Verifica se há um minigame ativo antes de encerrar
    if (AppState.currentScreen === 'game-screen' && AppState.gameActive) {
      // Estende por mais 5 minutos se há jogo ativo
      extendSessionTimer(5);
    } else {
      AppState.gameActive = false;
      showModal('session-expired-modal');
    }
  }, AppState.sessionTimeRemaining);
}

function pauseSessionTimer() {
  if (AppState.sessionTimer) {
    clearTimeout(AppState.sessionTimer);
    AppState.sessionPausedAt = Date.now();
    // Calcula tempo restante
    const elapsed =
      AppState.sessionPausedAt - (AppState.sessionStartedAt || Date.now());
    AppState.sessionTimeRemaining = Math.max(
      0,
      AppState.sessionTimeRemaining - elapsed
    );
  }
}

function resumeSessionTimer() {
  if (AppState.sessionPausedAt && AppState.sessionTimeRemaining > 0) {
    AppState.sessionTimer = setTimeout(() => {
      if (AppState.currentScreen === 'game-screen' && AppState.gameActive) {
        extendSessionTimer(5);
      } else {
        AppState.gameActive = false;
        showModal('session-expired-modal');
      }
    }, AppState.sessionTimeRemaining);
    AppState.sessionPausedAt = null;
    AppState.sessionStartedAt = Date.now();
  }
}

function extendSessionTimer(minutesToAdd) {
  clearTimeout(AppState.sessionTimer);
  const extensionTime = minutesToAdd * 60 * 1000;

  AppState.sessionTimer = setTimeout(() => {
    AppState.gameActive = false;
    showModal('session-expired-modal');
  }, extensionTime);
}

function goBackToLogin(isExpired = false) {
  AppState.cleanupCurrentGame();

  // Garantir limpeza adicional do jogo da memória
  if (typeof window.cleanupMemoryGame === 'function') {
    window.cleanupMemoryGame();
  }

  if (isExpired) closeModal(document.getElementById('session-expired-modal'));
  AppState.currentUser = null;
  AppState.generalScore = 0;
  AppState.progress = { memory: 0, genius: 0, ligar: 0 };
  AppState.gameActive = false;
  clearTimeout(AppState.sessionTimer);
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').textContent = '';
  navigate('login-screen');
}

function goToGameSelection() {
  Timer.reset();

  // Reset pause state
  AppState.isPaused = false;

  AppState.cleanupCurrentGame();

  // Garantir limpeza adicional do jogo da memória
  if (typeof window.cleanupMemoryGame === 'function') {
    window.cleanupMemoryGame();
  }

  closeModal(document.getElementById('phase-end-modal'));

  // Retoma o timer de sessão ao voltar para seleção
  resumeSessionTimer();

  if (document.getElementById('general-score'))
    document.getElementById('general-score').textContent =
      AppState.generalScore;
  navigate('game-selection-screen');
}

function openPhaseSelectionModal(gameType) {
  const titles = { memory: 'Memória', genius: 'Genius', ligar: 'Tempo' };
  const titleEl = document.getElementById('phase-selection-title');
  if (titleEl) titleEl.textContent = titles[gameType];
  const maxPhaseUnlocked = (AppState.progress[gameType] || 0) + 1;
  const buttonsContainer = document.getElementById('phase-selection-buttons');
  if (buttonsContainer) {
    buttonsContainer.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const isUnlocked = i <= maxPhaseUnlocked;
      buttonsContainer.innerHTML += isUnlocked
        ? `<button onclick="startGame('${gameType}', ${i})" class="bg-[#386ccc] text-white font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl hover:bg-[#2a529f] transition">Nível ${i}</button>`
        : `<div class="bg-stone-300 text-stone-500 font-bold py-4 md:py-6 rounded-lg text-lg md:text-xl cursor-not-allowed flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>Nível ${i}</div>`;
    }
  }
  showModal('phase-selection-modal');
}
function closePhaseSelectionModal() {
  closeModal(document.getElementById('phase-selection-modal'));
}
function getClassesForPhase(phase) {
  const phaseClasses = {
    1: [1, 3, 2, 10],
    2: [1, 3, 2, 10, 5, 4, 6],
    3: [1, 3, 2, 10, 5, 4, 6, 7, 8, 9],
  };
  const idsToInclude = phaseClasses[phase] || phaseClasses[3];
  return GRAMMAR_CLASSES.filter((gc) => idsToInclude.includes(gc.id));
}

function setupGameUIListeners() {
  const muteBtn = document.getElementById('game-mute-btn');
  const muteIcon = document.getElementById('game-mute-icon');
  const closeBtn = document.getElementById('game-close-btn');
  const volumeSlider = document.getElementById('game-volume');
  const playPauseBtn = document.getElementById('game-playpause-btn');
  const gameScreen = document.getElementById('game-screen');
  const helpBtn =
    document.getElementById('game-help-btn') ||
    document.getElementById('mobile-help-btn');

  setupHelpModalListeners();

  if (helpBtn) helpBtn.addEventListener('click', openHelpModal);
  if (!playPauseBtn) return;

  // Add null check for mute button (only exists in desktop layout)
  if (muteBtn && muteIcon) {
    muteBtn.addEventListener('click', () => {
      const isMuted = !AppState.globalMuted;
      AppState.globalMuted = isMuted;
      muteIcon.innerHTML = isMuted ? '&#128263;' : '&#128266;';
      document.querySelectorAll('audio').forEach((a) => (a.muted = isMuted));
    });
  }

  // Volume slider exists in both layouts
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = Number(e.target.value) / 100;
      AppState.globalVolume = vol;
      document.querySelectorAll('audio').forEach((a) => (a.volume = vol));
    });
  }

  // Close button exists in both layouts
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      goToGameSelection();
    });
  }

  // Play/pause button exists in both layouts
  playPauseBtn.addEventListener('click', () => {
    const isPaused = gameScreen.classList.contains('paused');

    if (isPaused) {
      // Se já está pausado, apenas retoma
      resumeGame();
    } else {
      // Se não está pausado, pausa e mostra modal
      pauseGame();
    }
  });
}

// Funções de controle de pause
function pauseGame() {
  if (AppState.isPaused) return;

  AppState.isPaused = true;

  // Pause the timer (works for both countdown and main timer)
  Timer.pause();

  // PAUSE PREVIEW TIMEOUT - Clear it and track remaining time
  if (AppState.currentGame.previewTimeout) {
    clearTimeout(AppState.currentGame.previewTimeout);
    const elapsed = Date.now() - AppState.currentGame.previewTimeoutStart;
    const remaining = AppState.currentGame.previewTimeoutDuration - elapsed;
    AppState.currentGame.previewTimeoutDuration = Math.max(0, remaining);
  }

  // PAUSE PREVIEW INTERVAL
  if (AppState.currentGame.previewInterval) {
    clearInterval(AppState.currentGame.previewInterval);
  }

  // Pause game-specific logic
  const currentGame = AppState.currentGame.name;
  if (
    currentGame === 'memory' &&
    typeof window.pauseMemoryGame === 'function'
  ) {
    window.pauseMemoryGame();
  }
  if (
    currentGame === 'genius' &&
    typeof window.pauseGeniusGame === 'function'
  ) {
    window.pauseGeniusGame();
  }
  if (currentGame === 'ligar' && typeof window.pauseLigarGame === 'function') {
    window.pauseLigarGame();
  }

  showPauseModal();

  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
      </svg>
    `;
  }
}

function resumeGame() {
  if (!AppState.isPaused) return;

  AppState.isPaused = false;

  // RESUME PREVIEW INTERVAL - Only if preview is still active
  const timerEl = document.getElementById('game-timer');
  if (
    AppState.currentGame.previewTimeoutDuration > 0 &&
    AppState.currentGame.previewTimeoutCallback &&
    timerEl
  ) {
    const formatPreviewTime = (s) => `00:${s.toString().padStart(2, '0')}`;
    let remainingSeconds = Math.ceil(
      AppState.currentGame.previewTimeoutDuration / 1000
    );

    const previewInterval = setInterval(() => {
      if (!AppState.isPaused) {
        remainingSeconds--;
        if (timerEl) timerEl.textContent = formatPreviewTime(remainingSeconds);
        if (remainingSeconds <= 0) {
          clearInterval(previewInterval);
        }
      }
    }, 1000);
    AppState.currentGame.previewInterval = previewInterval;

    // RESUME PREVIEW TIMEOUT
    AppState.currentGame.previewTimeoutStart = Date.now();

    const previewTimeout = setTimeout(() => {
      if (AppState.currentGame.previewInterval) {
        clearInterval(AppState.currentGame.previewInterval);
      }
      if (AppState.currentGame.previewTimeoutCallback) {
        AppState.currentGame.previewTimeoutCallback();
      }
    }, AppState.currentGame.previewTimeoutDuration);

    AppState.currentGame.previewTimeout = previewTimeout;
  } else {
    // Preview already ended, just resume the main Timer
    Timer.resume();
  }

  // Resume game-specific logic
  const currentGame = AppState.currentGame.name;
  if (
    currentGame === 'memory' &&
    typeof window.resumeMemoryGame === 'function'
  ) {
    window.resumeMemoryGame();
  }
  if (
    currentGame === 'genius' &&
    typeof window.resumeGeniusGame === 'function'
  ) {
    window.resumeGeniusGame();
  }
  if (currentGame === 'ligar' && typeof window.resumeLigarGame === 'function') {
    window.resumeLigarGame();
  }

  // Hide pause overlay
  hidePauseModal();

  // Update button icon
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/>
      </svg>
    `;
  }
}

function showPauseModal() {
  let modal = document.getElementById('pause-modal');

  if (!modal) {
    modal = createPauseModal();
    document.body.appendChild(modal);
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function hidePauseModal() {
  const modal = document.getElementById('pause-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function createPauseModal() {
  const modal = document.createElement('div');
  modal.id = 'pause-modal';
  modal.className =
    'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden';

  modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div class="mb-6">
                <svg class="w-20 h-20 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/>
                </svg>
            </div>
            
            <h2 class="text-3xl font-bold text-gray-800 mb-3">Jogo Pausado</h2>
            <p class="text-gray-600 mb-6">O tempo está parado. Escolha uma opção:</p>
            
            <div class="flex flex-col gap-3">
                <button onclick="resumeGame()" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Retomar Jogo
                </button>
                <button onclick="restartPhase()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Reiniciar Fase
                </button>
                <button onclick="quitGame()" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Sair do Jogo
                </button>
            </div>
        </div>
    `;

  return modal;
}

function setupPauseModalListeners() {
  const resumeBtn = document.getElementById('resume-game-btn');
  const exitToMenuBtn = document.getElementById('exit-to-menu-btn');
  const restartPhaseBtn = document.getElementById('restart-phase-btn');

  // Remove listeners anteriores para evitar duplicação
  resumeBtn.replaceWith(resumeBtn.cloneNode(true));
  exitToMenuBtn.replaceWith(exitToMenuBtn.cloneNode(true));
  restartPhaseBtn.replaceWith(restartPhaseBtn.cloneNode(true));

  // Reobtem referências após clonagem
  const newResumeBtn = document.getElementById('resume-game-btn');
  const newExitToMenuBtn = document.getElementById('exit-to-menu-btn');
  const newRestartPhaseBtn = document.getElementById('restart-phase-btn');

  // Funções wrapper que fecham o modal antes de executar a ação
  newResumeBtn.addEventListener('click', () => {
    closeModal(document.getElementById('game-paused-modal'));
    resumeGame();
  });

  newExitToMenuBtn.addEventListener('click', () => {
    closeModal(document.getElementById('game-paused-modal'));
    goToGameSelection();
  });

  newRestartPhaseBtn.addEventListener('click', () => {
    closeModal(document.getElementById('game-paused-modal'));
    restartPhase();
  });
}

// Help modal: create once and reuse
function createHelpModal() {
  const existing = document.getElementById('help-modal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className =
    'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden';

  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 md:p-8 max-w-xl w-full mx-4 text-left shadow-2xl relative">
      <button id="help-close-btn" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center" aria-label="Fechar ajuda">
        ✕
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">?</div>
        <h2 class="text-2xl font-bold text-gray-800">Como jogar</h2>
      </div>

      <div id="help-modal-content" class="text-gray-700 leading-relaxed"></div>

      <div class="mt-6 flex justify-end">
        <button id="help-ok-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Entendi
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function openHelpModal() {
  const modal = createHelpModal();
  const content = document.getElementById('help-modal-content');
  content.innerHTML = getHowToPlayContent();

  modal.classList.remove('hidden');
  modal.style.display = 'flex';

  // Focus for accessibility
  const ok = document.getElementById('help-ok-btn');
  if (ok) ok.focus();
}

function closeHelpModal() {
  const modal = document.getElementById('help-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
}

// Wire close buttons and ESC key once
function setupHelpModalListeners() {
  createHelpModal(); // ensure it exists

  const modal = document.getElementById('help-modal');
  const closeBtn = document.getElementById('help-close-btn');
  const okBtn = document.getElementById('help-ok-btn');

  const safeBind = (el, evt, fn) => el && el.addEventListener(evt, fn);

  safeBind(closeBtn, 'click', closeHelpModal);
  safeBind(okBtn, 'click', closeHelpModal);

  // Click outside dialog closes
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeHelpModal();
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeHelpModal();
    }
  });
}

function openHelpModalGate(onContinue) {
  openHelpModal(); // uses your existing modal + dynamic content
  const closeBtn = document.getElementById('help-close-btn');
  const okBtn = document.getElementById('help-ok-btn');

  const handler = () => {
    closeHelpModal();
    if (typeof onContinue === 'function') onContinue();
    closeBtn && closeBtn.removeEventListener('click', handler);
    okBtn && okBtn.removeEventListener('click', handler);
  };

  closeBtn && closeBtn.addEventListener('click', handler);
  okBtn && okBtn.addEventListener('click', handler);
}

// Dynamic content by game
function getHowToPlayContent() {
  const type =
    (AppState.currentGame && AppState.currentGame.name) ||
    AppState.currentGame?.type ||
    '';

  if (type === 'memory') {
    return `
      <p class="mb-3">Vire duas cartas por vez e encontre pares com o mesmo símbolo.</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Observe os símbolos e memorize suas posições.</li>
        <li>Faça pares corretos para marcar pontos; erros somam ao contador.</li>
        <li>Complete todos os pares antes do tempo acabar.</li>
      </ul>
    `;
  }

  if (type === 'genius') {
    return `
      <p class="mb-3">Memorize a ordem em que os símbolos aparecem e então reproduza arrastando-os para as posições corretas.</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Observe a sequência apresentada na fase de memória.</li>
        <li>Arraste os símbolos do banco para os espaços na mesma ordem.</li>
        <li>Termine a sequência antes do tempo acabar para avançar.</li>
      </ul>
    `;
  }

  if (type === 'ligar') {
    return `
      <p class="mb-3">Arraste cada símbolo para sua classe gramatical correspondente.</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Leia o nome da classe em cada alvo.</li>
        <li>Combine o símbolo correto com a classe correta.</li>
        <li>Complete todas as ligações para finalizar a fase.</li>
      </ul>
    `;
  }

  // Fallback
  return `
    <p class="mb-3">Complete o objetivo do minijogo antes do tempo acabar.</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>Leia a instrução no topo da tela.</li>
      <li>Use arrastar e soltar quando aplicável.</li>
      <li>Boa sorte!</li>
    </ul>
  `;
}

function startGame(type, phase) {
  AppState.cleanupCurrentGame();
  closeModal(document.getElementById('phase-selection-modal'));
  // Pausa o timer de sessão durante o jogo
  pauseSessionTimer();

  AppState.currentGame = {
    type,
    phase,
    name: type, // ADD THIS LINE
    score: 0,
    stars: 3,
    errors: 0,
    startTime: Date.now(),
    clickCount: 0,
    timer: null,
  };

  const gameScreenContainer = document.getElementById('game-screen');
  const gameTitles = { memory: 'Memória', genius: 'Genius', ligar: 'Tempo' };

  gameScreenContainer.innerHTML = GameScreenComponent(gameTitles[type], phase);
  setupGameUIListeners();
  navigate('game-screen');

  const begin = () => {
    // --- Timer inicial e botão de pular ---
    const timerEl = document.getElementById('game-timer');
    const skipBtn = document.getElementById('skip-timer-btn');
    const gameConfigForType = GameConfig[type];
    const gameLevelConfig = gameConfigForType.levels.find(
      (level) => level.phase === phase
    );

    if (!gameLevelConfig) return;

    const startMainGameTimer = () => {
      Timer.start(gameLevelConfig.timerMinutes);
    };

    if (type === 'genius') {
      if (timerEl) timerEl.style.display = 'block';
      if (skipBtn) skipBtn.style.display = 'none';

      // Initialize genius game
      initGeniusGame(phase);

      // Start main timer immediately (no preview)
      startMainGameTimer();
    } else if (gameLevelConfig.previewTime && gameLevelConfig.previewTime > 0) {
      if (timerEl) timerEl.style.display = 'block';

      if (skipBtn && gameConfigForType.allowSkipPreview) {
        skipBtn.style.display = 'inline-block';

        const skipHandler = () => {
          clearInterval(previewInterval);
          clearTimeout(previewTimeout);
          startMainGame();
          skipBtn.removeEventListener('click', skipHandler);
        };

        skipBtn.addEventListener('click', skipHandler);
      } else if (skipBtn) {
        skipBtn.style.display = 'none';
      }

      const startMainGame = () => {
        if (AppState.isPaused) {
          console.log(
            '[StartGame] Paused during preview, not starting main timer'
          );
          return;
        }

        if (skipBtn) skipBtn.style.display = 'none';
        Timer.start(gameLevelConfig.timerMinutes);

        switch (type) {
          case 'memory':
            startMemoryGamePlay();
            break;
          case 'genius':
            break;
          case 'ligar':
            initLigarGame(phase);
        }
      };

      initMemoryGame(phase);

      let previewSeconds = gameLevelConfig.previewTime / 1000;
      const formatPreviewTime = (s) => `00:${s.toString().padStart(2, '0')}`;
      timerEl.textContent = formatPreviewTime(previewSeconds);

      // Pause-aware preview countdown
      const previewInterval = setInterval(() => {
        if (!AppState.isPaused) {
          previewSeconds--;
          if (timerEl) timerEl.textContent = formatPreviewTime(previewSeconds);
          if (previewSeconds <= 0) {
            clearInterval(previewInterval);
          }
        }
      }, 1000);
      AppState.currentGame.previewInterval = previewInterval;

      // Store timeout info for pause/resume
      AppState.currentGame.previewTimeoutStart = Date.now();
      AppState.currentGame.previewTimeoutDuration = gameLevelConfig.previewTime;
      AppState.currentGame.previewTimeoutCallback = startMainGame;

      const previewTimeout = setTimeout(() => {
        clearInterval(previewInterval);
        startMainGame();
      }, gameLevelConfig.previewTime);
      AppState.currentGame.previewTimeout = previewTimeout;
    } else {
      if (timerEl) timerEl.style.display = 'block';
      if (skipBtn) skipBtn.style.display = 'none';

      if (type === 'ligar') initLigarGame(phase);

      startMainGameTimer();
    }
  };

  const user = AppState.currentUser || 'guest';

  if (!hasSeenHelp(user, type)) {
    // Ensure no gameplay runs yet
    AppState.isPaused = true;
    Timer.pause();

    openHelpModalGate(() => {
      setSeenHelp(user, type);
      AppState.isPaused = false;
      begin();
    });

    return; // Stop here for first-time; begin() runs after modal close
  }

  // Not first time: start immediately
  begin();
}

function restartPhase() {
  // Close modal first
  hidePauseModal();

  // Reset pause state
  AppState.isPaused = false;

  // Cleanup and restart
  AppState.cleanupCurrentGame();
  startGame(AppState.currentGame.type, AppState.currentGame.phase);
}

function quitGame() {
  // Reset pause state
  AppState.isPaused = false;

  hidePauseModal();
  goToGameSelection();
}

function updateGameUI() {
  // Função de placeholder, pode ser expandida
}

function showPhaseEndModal(isSuccess = true) {
  Timer.stop();

  const { phase, type } = AppState.currentGame;
  const isLastPhase = phase === 3;
  const modalTitle = document.getElementById('modal-title');
  const modalScore = document.getElementById('modal-score');
  const modalBonus = document.getElementById('modal-bonus');
  const modalNext = document.getElementById('modal-next-phase');
  let pointsEarned = 0;

  if (isSuccess) {
    GameAudio.play('success');
    modalTitle.textContent = `Fase ${phase} Concluída!`;

    const { clickCount, startTime } = AppState.currentGame;
    const endTime = Date.now();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    const gameLevelConfig = GameConfig[type].levels.find(
      (level) => level.phase === phase
    );
    const difficultyFactor = gameLevelConfig
      ? gameLevelConfig.difficultyFactor
      : 1;
    const basePoints = 100;
    const initialScore = basePoints * difficultyFactor;
    const timePenalty = elapsedTimeInSeconds * difficultyFactor;
    const clickPenalty = clickCount * difficultyFactor;
    let finalScore = initialScore - timePenalty - clickPenalty;
    pointsEarned = Math.max(0, Math.round(finalScore));

    modalScore.textContent = `Sua pontuação final foi de ${pointsEarned} pontos!`;
    modalBonus.innerHTML = `
        <div style="text-align: left; display: inline-block;">
          Pontuação Base: ${Math.round(initialScore)}<br>
          Perda por Tempo: -${Math.round(timePenalty)}<br>
          Perda por Cliques: -${Math.round(clickPenalty)}
        </div>`;

    if (phase >= (AppState.progress[type] || 0)) {
      AppState.progress[type] = phase;
    }
  } else {
    modalTitle.textContent = `Fim de Jogo`;
    modalScore.textContent = `Você não conseguiu concluir a fase.`;
    modalBonus.textContent = '';
  }

  AppState.generalScore += pointsEarned;
  saveData();

  if (isLastPhase && isSuccess) {
    modalNext.textContent = 'Voltar ao Menu';
    modalNext.onclick = goToGameSelection;
  } else if (!isSuccess) {
    modalNext.textContent = 'Tentar Novamente';
    modalNext.onclick = () => {
      closeModal(document.getElementById('phase-end-modal'));
      restartPhase();
    };
  } else {
    modalNext.textContent = 'Próxima Fase';
    modalNext.onclick = () => {
      closeModal(document.getElementById('phase-end-modal'));
      startGame(type, phase + 1);
    };
  }
  showModal('phase-end-modal');
}

function handleTimeUp() {
  console.log("Time's up!");
  showPhaseEndModal(false);
}

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
  MobileUtils.init();

  // Inicialização adicional se necessário
  console.log('MorfoLogic carregado - Mobile:', MobileUtils.isMobile);
});
