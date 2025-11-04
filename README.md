Claro. Aqui está o conteúdo para o seu arquivo `README.md`:

````markdown
# MorfoLogic

MorfoLogic é uma plataforma web de minijogos educativos projetada para o ensino de classes gramaticais, com inspiração na metodologia Montessori.

## Visão Geral do Sistema

O sistema é uma aplicação web estática (frontend puro) que apresenta aos usuários uma tela de login antes de dar acesso a um painel de seleção de jogos. A partir desse painel, o usuário pode escolher entre diferentes minijogos, cada um com três níveis de dificuldade progressiva.

O progresso é monitorado por nível, e a aplicação inclui funcionalidades como temporizadores de sessão e de jogo, e um sistema de pausa.

## Funcionalidades Principais

* **Autenticação:** Uma tela de login (`auth.js`) controla o acesso à seleção de jogos.
* **Seleção de Jogos e Níveis:** A tela principal (`game-selection-screen`) permite ao usuário escolher um dos minijogos disponíveis. Cada jogo abre um modal (`phase-selection-modal`) para a escolha de um dos três níveis de dificuldade.
* **Configuração Centralizada:** O arquivo `gameConfig.js` armazena todos os parâmetros de dificuldade, como número de pares, classes gramaticais incluídas, tempos de visualização e duração do temporizador para cada fase de cada jogo.
* **Gestão de Sessão e Jogo:** A aplicação inclui um temporizador de sessão (`session-expired-modal`) e um modal de pausa em jogo (`game-paused-modal`) que permite ao usuário continuar, reiniciar a fase ou sair para o menu.
* **Feedback de Conclusão:** Ao final de uma fase, um modal (`phase-end-modal`) exibe o desempenho do usuário (pontuação e estrelas) e oferece a opção de avançar para a próxima fase ou retornar ao menu.

## Minijogos Implementados

A plataforma contém três minijogos, cada um com sua própria lógica e configuração de níveis:

1.  **Jogo da Memória (`memory.js`)**
    * **Objetivo:** Encontrar os pares de cartas (símbolo e classe gramatical).
    * **Níveis:** A dificuldade é progressiva, aumentando o número de pares (de 4 para 7, e depois 10) e introduzindo mais classes gramaticais em cada fase, conforme definido em `gameConfig.js`.

2.  **Genius (`genius.js`)**
    * **Objetivo:** Memorizar e repetir uma sequência de símbolos apresentada.
    * **Níveis:** Possui três fases com fatores de dificuldade e tempos de visualização distintos.

3.  **Ligar / Tempo (`ligar.js`)**
    * **Objetivo:** Conectar os pares corretos de classes gramaticais dentro do tempo limite.
    * **Níveis:** Possui três fases com temporizadores e fatores de dificuldade variados.

## Tecnologias Utilizadas

* **Frontend:** A aplicação é construída inteiramente com HTML5, CSS3 e JavaScript (ES6+), sem depender de frameworks (Vanilla JS).
* **Estilização:** Utiliza [Tailwind CSS](https://tailwindcss.com/) (via CDN) para a maior parte do layout e componentes, complementado por folhas de estilo CSS personalizadas (`style.css`).
* **Qualidade de Código:** O projeto é configurado com [ESLint](https://eslint.org/) e [Prettier](https://prettier.io/) para garantir a consistência e a qualidade do código JavaScript e CSS, como visto no `package.json`.

## Estrutura dos Scripts

A lógica da aplicação é modularizada em vários arquivos JavaScript, carregados pelo `index.html`:

* `main.js`: Ponto de entrada principal, gerencia a navegação entre as telas (login, seleção, jogo) e o estado geral da aplicação.
* `auth.js`: Gerencia a lógica de login e o "logout".
* `gameConfig.js`: Arquivo de configuração que define os parâmetros para todos os níveis e jogos.
* `memory.js`, `genius.js`, `ligar.js`: Contêm a lógica específica de inicialização e jogabilidade de cada minijogo.
* `components.js`: Funções utilitárias que geram e renderizam dinamicamente os componentes HTML dos jogos (como cartas, tabuleiros, etc.).
* `utils.js`: Funções auxiliares usadas em toda a aplicação (ex: temporizadores, embaralhamento de arrays).
* `audio.js`: Controla a reprodução de áudio e música de fundo.

## Como Executar

1.  Como este é um projeto frontend estático, não há necessidade de um build. Basta abrir o arquivo `index.html` em qualquer navegador web moderno.
2.  Para tarefas de desenvolvimento (como linting), instale as dependências:
    ```bash
    npm install
    ```
````
