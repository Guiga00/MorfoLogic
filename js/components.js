/**
 * js/components.js
 */

function TopMenuComponent() {
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
        <div id="game-timer" class="text-base font-bold text-[#386ccc] mt-1">00:00</div>
        <button id="game-close-btn" title="Fechar" class="text-red-600 hover:text-red-800 text-2xl font-bold focus:outline-none ml-2">
          &times;
        </button>
      </div>
    </div>
  `;
}

function BottomMenuComponent() {
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
