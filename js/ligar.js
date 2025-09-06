/**
 * Módulo do Minijogo Ligar
 * Contém toda a lógica de arrastar e soltar (drag and drop)
 * para o jogo de ligar os símbolos às classes.
 */
let ligarState = {};

function initLigarGame(phase) {
  const classes = getClassesForPhase(phase);
  const symbols = [...classes].sort(() => Math.random() - 0.5);
  ligarState = {
    connections: 0,
    total: classes.length,
    errorsOnItem: {},
    draggedEl: null,
    ghostEl: null,
    offset: { x: 0, y: 0 },
  };
  classes.forEach((c) => (ligarState.errorsOnItem[c.id] = 0));
  AppState.currentGame.score = 0;
  updateGameUI();
  const board = document.getElementById("game-board");
  board.innerHTML = `<div class="flex flex-col md:flex-row justify-center items-center md:items-start w-full gap-8 md:gap-12"><div id="ligar-classes" class="flex flex-col gap-4 w-full max-w-xs">${classes
    .map(
      (c) =>
        `<div class="target bg-stone-200 w-full h-16 rounded-lg flex items-center justify-center font-bold text-center p-2" data-id="${c.id}">${c.name}</div>`
    )
    .join(
      ""
    )}</div><div id="ligar-symbols" class="flex flex-row flex-wrap items-center justify-center gap-4 w-full max-w-xs">${symbols
    .map(
      (s) =>
        `<div class="draggable w-16 h-16 p-1 bg-white rounded-lg shadow cursor-grab active:cursor-grabbing" data-id="${
          s.id
        }">${s.symbol("w-full h-full pointer-events-none")}</div>`
    )
    .join("")}</div></div>`;
  document.getElementById("game-message").textContent =
    "Arraste cada símbolo para sua classe.";
  document.querySelectorAll(".draggable").forEach((el) => {
    el.addEventListener("mousedown", dragStart);
    el.addEventListener("touchstart", dragStart, { passive: false });
  });
}

function dragStart(e) {
  e.preventDefault();
  const originalEl = e.currentTarget;
  if (originalEl.style.visibility === "hidden") return;
  const originalRect = originalEl.getBoundingClientRect();
  const ghostEl = originalEl.cloneNode(true);
  Object.assign(ghostEl.style, {
    position: "absolute",
    left: `${originalRect.left}px`,
    top: `${originalRect.top}px`,
    width: `${originalRect.width}px`,
    height: `${originalRect.height}px`,
    zIndex: "1000",
    pointerEvents: "none",
    margin: "0",
    cursor: "grabbing",
  });
  document.body.appendChild(ghostEl);
  originalEl.style.opacity = "0.3";
  ligarState.draggedEl = originalEl;
  ligarState.ghostEl = ghostEl;
  const startX = e.clientX || e.touches[0].clientX;
  const startY = e.clientY || e.touches[0].clientY;
  ligarState.offset = {
    x: startX - originalRect.left,
    y: startY - originalRect.top,
  };
  document.addEventListener("mousemove", dragMove);
  document.addEventListener("touchmove", dragMove, { passive: false });
  document.addEventListener("mouseup", dragEnd);
  document.addEventListener("touchend", dragEnd);
}

function dragMove(e) {
  if (!ligarState.ghostEl) return;
  e.preventDefault();
  const moveX = e.clientX || e.touches[0].clientX;
  const moveY = e.clientY || e.touches[0].clientY;
  ligarState.ghostEl.style.left = `${moveX - ligarState.offset.x}px`;
  ligarState.ghostEl.style.top = `${moveY - ligarState.offset.y}px`;
}

function dragEnd(e) {
  if (!ligarState.ghostEl) return;
  const { draggedEl, ghostEl } = ligarState;
  ligarState.draggedEl = null;
  ligarState.ghostEl = null;
  document.removeEventListener("mousemove", dragMove);
  document.removeEventListener("touchmove", dragMove);
  document.removeEventListener("mouseup", dragEnd);
  document.removeEventListener("touchend", dragEnd);
  ghostEl.style.display = "none";
  const endX = e.clientX || e.changedTouches[0].clientX;
  const endY = e.clientY || e.changedTouches[0].clientY;
  const dropTarget = document.elementFromPoint(endX, endY)?.closest(".target");
  ghostEl.style.display = "";
  const symbolId = draggedEl.dataset.id;
  if (
    dropTarget &&
    !dropTarget.dataset.completed &&
    dropTarget.dataset.id === symbolId
  ) {
    GameAudio.play("match");
    const targetRect = dropTarget.getBoundingClientRect();
    ghostEl.style.transition = "all 0.2s ease-out";
    ghostEl.style.left = `${
      targetRect.left + targetRect.width / 2 - ghostEl.offsetWidth / 2
    }px`;
    ghostEl.style.top = `${
      targetRect.top + targetRect.height / 2 - ghostEl.offsetHeight / 2
    }px`;
    setTimeout(() => {
      dropTarget.innerHTML = `<div class="flex items-center justify-center gap-4"><span>${dropTarget.textContent.trim()}</span><div class="w-12 h-12">${
        draggedEl.innerHTML
      }</div></div>`;
      dropTarget.classList.replace("bg-stone-200", "bg-green-200");
      dropTarget.classList.add("border-2", "border-green-400");
      dropTarget.dataset.completed = "true";
      if (document.body.contains(ghostEl)) document.body.removeChild(ghostEl);
      draggedEl.style.visibility = "hidden";
      AppState.currentGame.score +=
        ligarState.errorsOnItem[symbolId] === 0 ? 10 : 5;
      ligarState.connections++;
      updateGameUI();
      if (ligarState.connections === ligarState.total)
        setTimeout(() => showPhaseEndModal(), 500);
    }, 200);
  } else {
    GameAudio.play("error");
    if (dropTarget) {
      AppState.currentGame.errors++;
      ligarState.errorsOnItem[symbolId]++;
      updateGameUI();
      dropTarget.classList.add("bg-red-200");
      setTimeout(() => dropTarget.classList.remove("bg-red-200"), 500);
    }
    const originalRect = draggedEl.getBoundingClientRect();
    ghostEl.style.transition = "all 0.3s ease-in-out";
    ghostEl.style.left = `${originalRect.left}px`;
    ghostEl.style.top = `${originalRect.top}px`;
    setTimeout(() => {
      if (document.body.contains(ghostEl)) document.body.removeChild(ghostEl);
      if (draggedEl) draggedEl.style.opacity = "1";
    }, 300);
  }
}
