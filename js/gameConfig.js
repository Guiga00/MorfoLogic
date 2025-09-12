// ...existing code...
const GameConfig = {
  /**
   * Arquivo Central de Configuração do Jogo
   * Contém todos os parâmetros para os minijogos, fases, pontuação, etc.
   */
  // Configurações globais ou de áudio podem vir aqui no futuro
  // ...existing code...

  memory: {
    // Parâmetros específicos do Jogo da Memória
    levels: [
      {
        phase: 1,
        pairs: 4, // 4 pares = 8 cartas
        classIds: [1, 3, 2, 10], // substantivo, adjetivo, artigo, numeral
        previewTime: 10000, // 10 segundos
        pointsMultiplier: 1, // Exemplo para pontuação futura
        timerMinutes: 3, // Tempo da fase 1
      },
      {
        phase: 2,
        pairs: 7, // 7 pares = 14 cartas
        classIds: [1, 3, 2, 10, 5, 4, 6], // + pronome, verbo, advérbio
        previewTime: 15000, // 15 segundos
        pointsMultiplier: 1.5,
        timerMinutes: 5, // Tempo da fase 2
      },
      {
        phase: 3,
        pairs: 10, // 10 pares = 20 cartas
        classIds: [1, 3, 2, 10, 5, 4, 6, 7, 8, 9], // + preposição, conjunção, interjeição
        previewTime: 15000, // 15 segundos
        pointsMultiplier: 2,
        timerMinutes: 7, // Tempo da fase 3
      },
    ],
  },
  genius: {
    // Configurações do Genius virão aqui no futuro
  },
  ligar: {
    // Configurações do "Ligar" virão aqui no futuro
  },
};
