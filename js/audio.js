/**
 * Módulo de Áudio
 * Gerencia a inicialização e reprodução de todos os efeitos sonoros do jogo.
 */

// CONFIGURAÇÕES DE VOLUME - ALTERE AQUI CONFORME NECESSÁRIO
const AUDIO_CONFIG = {
  bgmVolume: 0.2, // Volume base da música de fundo (0 a 1)
  effectVolume: 0.7, // Volume base dos efeitos sonoros (0 a 1)
  bgmFadeMultiplier: 0.3, // Reduz BGM para 30% do volume definido acima
};

const GameAudio = {
  isInitialized: false,
  audios: {},
  bgm: {},
  currentBGM: null,

  // Inicializa e prepara os elementos de áudio
  init() {
    if (this.isInitialized) return;
    try {
      // Efeitos sonoros
      this.audios = {
        flip: new Audio(''),
        match: new Audio(''),
        error: new Audio(''),
        success: new Audio(''),
        genius: new Audio(''),
      };

      // Músicas de fundo (BGM)
      this.bgm = {
        menu: new Audio('./assets/audio/Go_to_the_Picnic.mp3'),
        game: new Audio('./assets/audio/Sakura-Girl-Daisy.mp3'),
      };

      // Configura volume e loop das músicas
      Object.values(this.bgm).forEach((audio) => {
        audio.loop = true;
        audio.volume = AUDIO_CONFIG.bgmVolume * AUDIO_CONFIG.bgmFadeMultiplier;
      });

      // Configura volume dos efeitos
      Object.values(this.audios).forEach((audio) => {
        audio.volume = AUDIO_CONFIG.effectVolume;
      });

      this.isInitialized = true;
      console.log('Módulo de áudio preparado.');
      console.log(
        'Volume BGM:',
        AUDIO_CONFIG.bgmVolume,
        '| Efeitos:',
        AUDIO_CONFIG.effectVolume
      );
    } catch (error) {
      console.error('Erro ao preparar o áudio:', error);
    }
  },

  // Toca um som
  play(sound) {
    // Verifica se AppState existe ANTES de usar
    if (!this.isInitialized || !this.audios[sound]) {
      return;
    }

    if (AppState && AppState.globalMuted) {
      return;
    }

    const audio = this.audios[sound];
    if (audio.src && !audio.src.endsWith(window.location.pathname)) {
      try {
        if (AppState && AppState.globalVolume) {
          audio.volume = AppState.globalVolume * AUDIO_CONFIG.effectVolume;
        } else {
          audio.volume = AUDIO_CONFIG.effectVolume;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (error) {
        // Falha silenciosamente
      }
    }
  },

  // Toca música de fundo (BGM)
  playBGM(bgmName) {
    if (!this.isInitialized) return;

    // Verifica se AppState existe ANTES de usar
    if (AppState && AppState.globalMuted) return;

    const newBGM = this.bgm[bgmName];
    if (!newBGM) return;

    // Se já estiver tocando a mesma música, não faz nada
    if (this.currentBGM === newBGM && !newBGM.paused) {
      return;
    }

    // Para a música atual COMPLETAMENTE
    if (this.currentBGM && this.currentBGM !== newBGM) {
      this.currentBGM.pause(); // Para imediatamente
      this.currentBGM.currentTime = 0; // Reseta posição
      this.fadeOut(this.currentBGM, 300); // Fade out suave
    }

    // Toca a nova música
    this.currentBGM = newBGM;
    this.currentBGM.volume = 0;
    this.currentBGM.play().catch(() => {
      console.log('Autoplay bloqueado. Aguardando interação do usuário.');
    });

    // Calcula o volume final corretamente
    const globalVol = (AppState && AppState.globalVolume) || 1;
    const targetVolume =
      AUDIO_CONFIG.bgmVolume * AUDIO_CONFIG.bgmFadeMultiplier * globalVol;

    this.fadeIn(this.currentBGM, targetVolume, 500);
  },

  // Para a música de fundo
  stopBGM() {
    if (this.currentBGM) {
      this.fadeOut(this.currentBGM, 500, () => {
        this.currentBGM.pause();
        this.currentBGM.currentTime = 0;
        this.currentBGM = null;
      });
    }
  },

  // Atualiza volume (chamado pelo slider do header)
  updateVolume(volume) {
    if (AppState) {
      AppState.globalVolume = volume;
    }

    // Atualiza efeitos sonoros
    Object.values(this.audios).forEach((audio) => {
      audio.volume = volume * AUDIO_CONFIG.effectVolume;
    });

    // Atualiza BGM
    Object.values(this.bgm).forEach((audio) => {
      audio.volume =
        volume * AUDIO_CONFIG.bgmVolume * AUDIO_CONFIG.bgmFadeMultiplier;
    });
  },

  // Atualiza mute (chamado pelo botão de mute do header)
  updateMute(isMuted) {
    if (AppState) {
      AppState.globalMuted = isMuted;
    }

    if (isMuted) {
      if (this.currentBGM) {
        this.currentBGM.pause();
      }
    } else {
      if (this.currentBGM) {
        this.currentBGM.play().catch(() => {});
      }
    }
  },

  // Fade in
  fadeIn(audio, targetVolume, duration) {
    audio.volume = 0;
    const step = targetVolume / (duration / 50);
    const interval = setInterval(() => {
      if (audio.volume + step < targetVolume) {
        audio.volume += step;
      } else {
        audio.volume = targetVolume;
        clearInterval(interval);
      }
    }, 50);
  },

  // Fade out
  fadeOut(audio, duration, callback) {
    const startVolume = audio.volume;
    const step = startVolume / (duration / 50);
    const interval = setInterval(() => {
      if (audio.volume - step > 0) {
        audio.volume -= step;
      } else {
        audio.volume = 0;
        audio.pause(); // ✅ ADICIONE ESTA LINHA
        clearInterval(interval);
        if (callback) callback();
      }
    }, 50);
  },
};

// Inicializa o módulo de áudio assim que o script é lido
GameAudio.init();
