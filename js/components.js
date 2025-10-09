/**
 * js/components.js
 */

const Timer = {
  intervalId: null,
  seconds: 0,
  isPaused: false,
  isPreview: false,
  onCompleteCallback: null,

  start(durationInMinutes) {
    this.stop();
    this.isPaused = false;
    this.isPreview = false;
    this.onCompleteCallback = null;
    this.seconds = durationInMinutes * 60;
    this.startInterval();
    this.updateDisplay();
  },

  startCountdown(durationInSeconds, onComplete) {
    this.stop();
    this.isPaused = false;
    this.isPreview = true;
    this.onCompleteCallback = onComplete;
    this.seconds = durationInSeconds;
    this.startInterval();
    this.updateDisplay();
  },

  startInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.seconds--;
        this.updateDisplay();

        if (this.seconds <= 0) {
          // SAVE the state BEFORE calling stop()
          const wasPreview = this.isPreview;
          const callback = this.onCompleteCallback;

          // Now stop the timer
          this.stop();

          // Check the saved state to decide what to do
          if (wasPreview && callback) {
            // Preview ended, start main game
            callback();
          } else if (!wasPreview && typeof handleTimeUp === 'function') {
            // Main game timer ended, game over
            handleTimeUp();
          }
        }
      }
    }, 1000);
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    if (this.isPaused && this.seconds > 0) {
      this.isPaused = false;

      if (!this.intervalId) {
        this.startInterval();
      }
    }
  },

  stop() {
    this.isPaused = false;
    this.isPreview = false;
    this.onCompleteCallback = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  reset() {
    this.stop();
    this.seconds = 0;
    this.updateDisplay();
  },

  updateDisplay() {
    const display = document.getElementById('game-timer');
    if (display) {
      const minutes = Math.floor(this.seconds / 60);
      const remainingSeconds = this.seconds % 60;
      display.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  },
};

function TopMenuComponent() {
  // Menu superior com controle de volume, timer e botão de fechar
  return `
    <div id="game-top-menu" class="flex items-center justify-between bg-white rounded-t-2xl shadow-lg px-4 py-2 mb-2">
      <div class="flex items-center gap-2">
        <label for="game-volume" class="text-sm text-stone-500">Volume</label>
        <input id="game-volume" type="range" min="0" max="100" value="100" class="w-24 accent-[#386ccc]" />
        <button id="game-mute-btn" title="Mutar/Desmutar" class="text-[#386ccc] hover:text-[#2a529f] text-2xl focus:outline-none">
          <span id="game-mute-icon">&#128266;</span>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <div id="game-timer" class="text-base font-bold text-[#386ccc] mt-1">00:00</div>
          <button id="skip-timer-btn" class="ml-2 px-3 py-1 bg-[#386ccc] text-white rounded shadow hover:bg-[#2a529f] transition text-sm font-semibold focus:outline-none" style="display:none;" title="Pular espera">
            Pular
          </button>
        </div>
        <button id="game-help-btn" type="button" class="text-[#386ccc] hover:text-[#2a529f] text-2xl font-bold focus:outline-none ml-2" aria-label="Como jogar" title="Como jogar">
          ?
        </button>
        <button id="game-close-btn" title="Fechar" class="text-red-600 hover:text-red-800 text-2xl font-bold focus:outline-none ml-2">
          &times;
        </button>
      </div>
    </div>
  `;
}

function BottomMenuComponent() {
  // Menu inferior com botão de play/pause
  return `
    <div id="game-bottom-menu" class="fixed left-0 bottom-0 w-full flex items-center justify-center py-3 z-50"
         style="background-color: #00327d;">
      <button id="game-playpause-btn" class="bg-white font-bold rounded-full shadow-lg px-6 py-2 text-lg flex items-center gap-2 hover:bg-blue-100 transition focus:outline-none"
              style="color: #00327d">
        <span id="game-playpause-icon">&#10074;&#10074;</span>
        <span id="game-playpause-label">Pausar</span>
      </button>
    </div>
  `;
}

function GameScreenComponent(title, phase) {
  // Componente principal da tela do jogo
  // O #game-content-wrapper agora envolve o conteúdo que deve ter o "fade".
  // O BottomMenuComponent fica fora.
  return `
    <div id="game-content-wrapper" class="w-full">
      <div class="w-full flex flex-col items-start gap-2 mb-2">
        <h2 id="game-title" class="text-2xl md:text-3xl font-bold">${title}</h2>
        <span id="game-phase-label" class="text-base md:text-lg text-stone-600">
          Fase <span id="game-phase">${phase}</span>
        </span>
      </div>

      ${TopMenuComponent()}

      <div id="game-board" class="p-4 md:p-6 min-h-[500px] w-full flex flex-col items-center justify-center">
        </div>

      <div id="game-message" class="text-center text-lg md:text-xl font-semibold mt-4 h-8"></div>
    </div>

    ${BottomMenuComponent()}
  `;
}
