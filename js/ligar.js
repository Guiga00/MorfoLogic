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
  board.innerHTML = `
      <div class="flex flex-col md:flex-row justify-center items-center md:items-start w-full gap-8 md:gap-12">
          <div id="ligar-classes" class="flex flex-col gap-4 w-full max-w-xs">${classes
            .map(
              (c) =>
                `<div class="target bg-stone-200 w-full h-16 rounded-lg flex items-center justify-center font-bold text-center p-2" data-id="${c.id}">${c.name}</div>`
            )
            .join('')}</div>
          <div id="ligar-symbols-bank" class="flex flex-row flex-wrap items-center justify-center gap-4 w-full max-w-xs">${symbols
            .map(
              (s) => `
            <div class="genius-symbol draggable w-16 h-16 p-1 bg-white rounded-lg shadow cursor-grab active:cursor-grabbing" data-id="${
              s.id
            }">
                ${s.symbol('w-full h-full pointer-events-none')}
            </div>`
            )
            .join('')}
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
      targetEl.innerHTML = `<div class="flex items-center justify-center gap-4"><span>${targetEl.textContent.trim()}</span><div class="w-12 h-12">${
        symbolEl.innerHTML
      }</div></div>`;
      targetEl.classList.replace('bg-stone-200', 'bg-green-200');
      targetEl.classList.add('border-2', 'border-green-400');
      targetEl.dataset.completed = 'true';
      symbolEl.remove();

      // AppState.currentGame.score +=
      //   ligarState.errorsOnItem[droppedSymbolId] === 0 ? 10 : 5;
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
