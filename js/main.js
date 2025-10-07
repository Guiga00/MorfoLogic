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

  if (!playPauseBtn) return;

  muteBtn.addEventListener('click', () => {
    const isMuted = !AppState.globalMuted;
    AppState.globalMuted = isMuted;
    muteIcon.innerHTML = isMuted ? '&#128263;' : '&#128266;';
    document.querySelectorAll('audio').forEach((a) => (a.muted = isMuted));
  });

  volumeSlider.addEventListener('input', (e) => {
    const vol = Number(e.target.value) / 100;
    AppState.globalVolume = vol;
    document.querySelectorAll('audio').forEach((a) => (a.volume = vol));
  });

  closeBtn.addEventListener('click', () => {
    goToGameSelection();
  });

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
  Timer.pause();

  const gameScreen = document.getElementById('game-screen');
  const playPauseIcon = document.getElementById('game-playpause-icon');
  const playPauseLabel = document.getElementById('game-playpause-label');

  gameScreen.classList.add('paused');
  playPauseIcon.innerHTML = '&#9658;';
  playPauseLabel.innerText = 'Continuar';

  // Pausa timers específicos do jogo
  if (AppState.currentGame.type === 'memory' && window.pauseMemoryTimer) {
    window.pauseMemoryTimer();
  }

  // Mostra modal de pause
  showModal('game-paused-modal');
  setupPauseModalListeners();
}

function resumeGame() {
  Timer.resume();

  const gameScreen = document.getElementById('game-screen');
  const playPauseIcon = document.getElementById('game-playpause-icon');
  const playPauseLabel = document.getElementById('game-playpause-label');

  gameScreen.classList.remove('paused');
  playPauseIcon.innerHTML = '&#10074;&#10074;';
  playPauseLabel.innerText = 'Pausar';

  // Resume timers específicos do jogo
  if (AppState.currentGame.type === 'memory' && window.resumeMemoryTimer) {
    window.resumeMemoryTimer();
  }
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

function startGame(type, phase) {
  AppState.cleanupCurrentGame();
  closeModal(document.getElementById('phase-selection-modal'));
  // Pausa o timer de sessão durante o jogo
  pauseSessionTimer();

  AppState.currentGame = {
    type,
    phase,
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

    // This is the restored logic
    const animationDuration = getGeniusAnimationDuration(phase);
    let countdownSeconds = Math.ceil(animationDuration / 1000);

    initGeniusGame(phase);

    const formatPreviewTime = (s) => `00:${s.toString().padStart(2, '0')}`;
    if (timerEl) {
      timerEl.textContent = formatPreviewTime(countdownSeconds);
    }

    const previewInterval = setInterval(() => {
      countdownSeconds--;

      if (timerEl) {
        timerEl.textContent = formatPreviewTime(countdownSeconds);
      }

      if (countdownSeconds <= 0) {
        clearInterval(previewInterval);
      }
    }, 1000);
    AppState.currentGame.previewInterval = previewInterval;

    const previewTimeout = setTimeout(() => {
      clearInterval(previewInterval);
      startMainGameTimer();
    }, animationDuration);
    AppState.currentGame.previewTimeout = previewTimeout;
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

    const previewInterval = setInterval(() => {
      previewSeconds--;
      if (timerEl) timerEl.textContent = formatPreviewTime(previewSeconds);
    }, 1000);
    AppState.currentGame.previewInterval = previewInterval;

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
}

function restartPhase() {
  // Remove o estado de pausa antes de reiniciar
  const gameScreen = document.getElementById('game-screen');
  const playPauseIcon = document.getElementById('game-playpause-icon');
  const playPauseLabel = document.getElementById('game-playpause-label');

  if (gameScreen) {
    gameScreen.classList.remove('paused');
  }

  // Restaura os controles para estado não pausado
  if (playPauseIcon) {
    playPauseIcon.innerHTML = '&#10074;&#10074;';
  }
  if (playPauseLabel) {
    playPauseLabel.innerText = 'Pausar';
  }

  AppState.cleanupCurrentGame();
  startGame(AppState.currentGame.type, AppState.currentGame.phase);
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
