/**
 * Módulo de Autenticação
 */

function initAuth() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = USERS[username];
    const errorEl = document.getElementById('login-error');

    if (userType && username === password) {
      if (GameAudio && GameAudio.bgm && GameAudio.bgm.menu) {
        GameAudio.bgm.menu
          .play()
          .then(() => {
            console.log('✅ Autoplay desbloqueado');
            GameAudio.bgm.menu.pause();
            GameAudio.bgm.menu.currentTime = 0;
          })
          .catch((err) => console.log('Autoplay ainda bloqueado:', err));
      }

      if (userType === 'student') {
        AppState.currentUser = username;
        loadData(username);
        AppState.gameActive = true;
        startSessionTimer();
        navigate('game-selection-screen');
      } else if (userType === 'admin') {
        AppState.currentUser = username;
        navigate('static-screen');
      }
      setTimeout(() => {
        GameAudio.playBGM('menu');
      }, 500);
    } else {
      errorEl.textContent = 'Usuário ou senha inválidos.';
      GameAudio.play('error');
    }
  });
}

// O DOMContentLoaded é removido, pois o main.js agora controla a inicialização.
document.addEventListener('DOMContentLoaded', initAuth);
