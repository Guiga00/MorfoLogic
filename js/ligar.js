/**
 * Módulo do Minijogo Ligar (Tempo)
 * Utiliza o DraggableManager para a lógica de arrastar e soltar.
 */
let ligarState = {};

function initLigarGame(phase) {
  DraggableManager.cleanup();

  const classes = getClassesForPhase(phase);
  const symbols = [...classes].sort(() => Math.random() - 0.5);
  ligarState = { connections: 0, total: classes.length, errorsOnItem: {} };
  classes.forEach((c) => (ligarState.errorsOnItem[c.id] = 0));
  AppState.currentGame.score = 0;
  updateGameUI();

  const board = document.getElementById('game-board');
  // Define a classe de colunas de acordo com a fase
  let colClass = '';
  let symbolColClass = '';
  let classCols = 2;
  let symbolCols = 2;
  switch (phase) {
    case 1:
      colClass = 'ligar-col-classes-fase1';
      symbolColClass = 'ligar-col-symbols-fase1';
      classCols = 2;
      symbolCols = 2;
      break;
    case 2:
      colClass = 'ligar-col-classes-fase2';
      symbolColClass = 'ligar-col-symbols-fase2';
      classCols = 3;
      symbolCols = 3;
      break;
    case 3:
      colClass = 'ligar-col-classes-fase3';
      symbolColClass = 'ligar-col-symbols-fase3';
      classCols = 4;
      symbolCols = 4;
      break;
    default:
      colClass = 'ligar-col-classes-fase1';
      symbolColClass = 'ligar-col-symbols-fase1';
      classCols = 2;
      symbolCols = 2;
  }

  // Função para centralizar apenas a última linha do grid
  function addPlaceholders(arr, cols, itemHtml) {
    let html = '';
    const total = arr.length;
    const fullRows = Math.floor(total / cols);
    const remainder = total % cols;
    // Adiciona linhas completas normalmente
    for (let row = 0; row < fullRows; row++) {
      for (let col = 0; col < cols; col++) {
        html += itemHtml(arr[row * cols + col]);
      }
    }
    // Última linha (incompleta)
    if (remainder !== 0) {
      const missing = cols - remainder;
      const left = Math.floor(missing / 2);
      const right = missing - left;
      for (let i = 0; i < left; i++) {
        html +=
          '<div class="ligar-class-item ligar-placeholder" style="visibility:hidden"></div>';
      }
      for (let i = 0; i < remainder; i++) {
        html += itemHtml(arr[fullRows * cols + i]);
      }
      for (let i = 0; i < right; i++) {
        html +=
          '<div class="ligar-class-item ligar-placeholder" style="visibility:hidden"></div>';
      }
    }
    return html;
  }

  function addSymbolPlaceholders(arr, cols, itemHtml) {
    let html = '';
    const total = arr.length;
    const fullRows = Math.floor(total / cols);
    const remainder = total % cols;
    // Adiciona linhas completas normalmente
    for (let row = 0; row < fullRows; row++) {
      for (let col = 0; col < cols; col++) {
        html += itemHtml(arr[row * cols + col]);
      }
    }
    // Última linha (incompleta)
    if (remainder !== 0) {
      const missing = cols - remainder;
      const left = Math.floor(missing / 2);
      const right = missing - left;
      for (let i = 0; i < left; i++) {
        html +=
          '<div class="ligar-symbol-item ligar-placeholder" style="visibility:hidden"></div>';
      }
      for (let i = 0; i < remainder; i++) {
        html += itemHtml(arr[fullRows * cols + i]);
      }
      for (let i = 0; i < right; i++) {
        html +=
          '<div class="ligar-symbol-item ligar-placeholder" style="visibility:hidden"></div>';
      }
    }
    return html;
  }

  // Define a classe de fase para o espaçamento customizado
  let faseClass = '';
  switch (phase) {
    case 1:
      faseClass = 'fase1';
      break;
    case 2:
      faseClass = 'fase2';
      break;
    case 3:
      faseClass = 'fase3';
      break;
    default:
      faseClass = '';
  }

  board.innerHTML = `
      <div class="ligar-board-grid ${faseClass}">
        <div id="ligar-classes" class="ligar-col-grid ligar-col-classes ${colClass}">
          ${addPlaceholders(
            classes,
            classCols,
            (c) =>
              `<div class="ligar-class-item">
                <div class="ligar-class-label">${c.name}</div>
                <div class="target ligar-dropzone" data-id="${c.id}"></div>
            </div>`
          )}
        </div>
        <div id="ligar-symbols-bank" class="ligar-col-grid ligar-col-symbols ${symbolColClass}">
          ${addSymbolPlaceholders(
            symbols,
            symbolCols,
            (s) =>
              `<div class="ligar-symbol-item">
              <div class="genius-symbol draggable" data-id="${s.id}">
                  ${s.symbol('')}
              </div>
            </div>`
          )}
        </div>
      </div>`;
  document.getElementById('game-message').textContent =
    'Arraste cada símbolo para sua classe.';

  DraggableManager.makeDraggable(
    '#ligar-symbols-bank .draggable',
    handleLigarDrop
  );
}

function handleLigarDrop(symbolEl, targetEl, placeholder, unlockCallback) {
  AppState.currentGame.clickCount++;
  const droppedSymbolId = parseInt(symbolEl.dataset.id);
  const isCorrect =
    targetEl &&
    !targetEl.dataset.completed &&
    parseInt(targetEl.dataset.id) === droppedSymbolId;

  if (isCorrect) {
    GameAudio.play('match');
    placeholder.remove();
    const targetRect = targetEl.getBoundingClientRect();

    Object.assign(symbolEl.style, {
      transition: 'all 0.2s ease-out',
      left: `${
        targetRect.left + targetRect.width / 2 - symbolEl.offsetWidth / 2
      }px`,
      top: `${
        targetRect.top + targetRect.height / 2 - symbolEl.offsetHeight / 2
      }px`,
      transform: 'scale(0.8)',
    });

    setTimeout(() => {
      // Insere o símbolo dentro da dropzone quadrada, mantendo o label acima
      targetEl.innerHTML = '';
      targetEl.appendChild(symbolEl);
      targetEl.classList.remove('border-green-400');
      targetEl.classList.add('ligar-dropzone-correct');
      targetEl.dataset.completed = 'true';
      // AppState.currentGame.score += ligarState.errorsOnItem[droppedSymbolId] === 0 ? 10 : 5;
      ligarState.connections++;
      updateGameUI();
      if (ligarState.connections === ligarState.total)
        setTimeout(() => showPhaseEndModal(), 500);
      unlockCallback();
    }, 200);
  } else {
    GameAudio.play('error');
    if (targetEl) {
      AppState.currentGame.errors++;
      ligarState.errorsOnItem[droppedSymbolId] =
        (ligarState.errorsOnItem[droppedSymbolId] || 0) + 1;
      updateGameUI();
      targetEl.classList.add('bg-red-200');
      setTimeout(() => targetEl.classList.remove('bg-red-200'), 500);
    }

    const placeholderRect = placeholder.getBoundingClientRect();
    Object.assign(symbolEl.style, {
      transition: 'all 0.3s ease-in-out',
      left: `${placeholderRect.left}px`,
      top: `${placeholderRect.top}px`,
      transform: 'scale(1)',
    });
    setTimeout(() => {
      placeholder.replaceWith(symbolEl);
      Object.assign(symbolEl.style, {
        position: 'static',
        left: '',
        top: '',
        zIndex: '',
        transform: '',
      });
      unlockCallback();
    }, 300);
  }
}
