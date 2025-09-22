import globals from "globals";
import pluginJs from "@eslint/js";
import standard from "eslint-config-standard";
import prettierConfig from "eslint-config-prettier"; // 1. Adicione esta importação

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        // Adicione aqui as variáveis globais do seu projeto para evitar erros
        "AppState": "readonly",
        "GameConfig": "readonly",
        "DraggableManager": "readonly",
        "GameAudio": "readonly",
        "GENIUS_PHRASES": "readonly",
        "GRAMMAR_CLASSES": "readonly",
        "USERS": "readonly",
        "initMemoryGame": "readonly",
        "initGeniusGame": "readonly",
        "initLigarGame": "readonly",
        "showPhaseEndModal": "readonly",
        "getClassesForPhase": "readonly",
        "updateGameUI": "readonly",
        "goToGameSelection": "readonly",
      }
    }
  },
  pluginJs.configs.recommended,
  standard,
  prettierConfig, // 2. Adicione esta linha no FINAL do array
];