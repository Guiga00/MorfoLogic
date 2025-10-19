/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Updates game UI elements (score, stars, errors)
 */
function updateGameUI() {
  // Consolidate all UI update logic here
  const scoreEl = document.getElementById('game-score');
  const starsEl = document.getElementById('game-stars');
  const errorsEl = document.getElementById('game-errors');

  if (scoreEl) scoreEl.textContent = AppState.currentGame.score;
  if (starsEl) starsEl.textContent = '⭐'.repeat(AppState.currentGame.stars);
  if (errorsEl) errorsEl.textContent = AppState.currentGame.errors;
}

/**
 * Shows a modal by ID
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');

  // Pause game interaction for phase-end modal
  if (modalId === 'phase-end-modal') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) gameScreen.classList.add('paused');
  }
}

/**
 * Closes a modal element
 */
function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');

  // Resume game interaction
  if (modal.id === 'phase-end-modal') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) gameScreen.classList.remove('paused');
  }
}
