/**
 * Módulo de Áudio
 * Gerencia a inicialização e reprodução de todos os efeitos sonoros do jogo.
 * Usa arquivos MP3 e falha silenciosamente se os arquivos não forem encontrados.
 */
const GameAudio = {
  isInitialized: false,
  audios: {}, // Objeto para armazenar os elementos de áudio

  // Inicializa e prepara os elementos de áudio
  init() {
    if (this.isInitialized) return;
    try {
      // **ADICIONE AQUI O CAMINHO PARA SEUS ARQUIVOS .MP3**
      this.audios = {
        flip: new Audio(""),
        match: new Audio(""),
        error: new Audio(""),
        success: new Audio(""),
        genius: new Audio(""), // Som único para o Genius
      };
      this.isInitialized = true;
      console.log("Módulo de áudio preparado.");
    } catch (error) {
      console.error("Erro ao preparar o áudio:", error);
    }
  },

  // Toca um som, ignorando se a fonte estiver vazia
  play(sound) {
    if (!this.isInitialized || !this.audios[sound]) {
      return; // Falha silenciosamente
    }

    const audio = this.audios[sound];
    // Verifica se a fonte (src) não está vazia
    if (audio.src && !audio.src.endsWith(window.location.pathname)) {
      try {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // Ignora erro de playback se o arquivo não for encontrado
      } catch (error) {
        // Falha silenciosamente
      }
    }
  },
};

// Inicializa o módulo de áudio assim que o script é lido
GameAudio.init();
