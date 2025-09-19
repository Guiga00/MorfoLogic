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
        timerMinutes: 15, // Tempo da fase 1
        difficultyFactor: 1, // Fator de dificuldade para lógica futura
      },
      {
        phase: 2,
        pairs: 7, // 7 pares = 14 cartas
        classIds: [1, 3, 2, 10, 5, 4, 6], // + pronome, verbo, advérbio
        previewTime: 15000, // 15 segundos
        pointsMultiplier: 1.5,
        timerMinutes: 15, // Tempo da fase 2
        difficultyFactor: 1.5, // Fator de dificuldade para lógica futura
      },
      {
        phase: 3,
        pairs: 10, // 10 pares = 20 cartas
        classIds: [1, 3, 2, 10, 5, 4, 6, 7, 8, 9], // + preposição, conjunção, interjeição
        previewTime: 15000, // 15 segundos
        pointsMultiplier: 2,
        timerMinutes: 15, // Tempo da fase 3
        difficultyFactor: 2, // Fator de dificuldade para lógica futura
      },
    ],
  },
  genius: {
    levels: [
      { phase: 1, difficultyFactor: 1 },
      { phase: 2, difficultyFactor: 1.5 },
      { phase: 3, difficultyFactor: 2 },
    ],
  },
  ligar: {
    levels: [
      { phase: 1, difficultyFactor: 1 },
      { phase: 2, difficultyFactor: 1.5 },
      { phase: 3, difficultyFactor: 2 },
    ],
  },
};
