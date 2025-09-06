/**
 * Módulo de Autenticação
 * Cuida exclusivamente da lógica de login.
 * O 'DOMContentLoaded' garante que o código só rode após o HTML estar pronto.
 */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.toLowerCase();
    const password = document.getElementById("password").value.toLowerCase();
    const userType = USERS[username];
    const errorEl = document.getElementById("login-error");

    if (userType && username === password) {
      if (userType === "student") {
        AppState.currentUser = username;
        loadData(username);
        AppState.gameActive = true;
        document.getElementById("general-score").textContent =
          AppState.generalScore;
        startSessionTimer();
        navigate("game-selection-screen");
        errorEl.textContent = "";
      } else if (userType === "admin") {
        AppState.currentUser = username;
        navigate("static-screen");
        errorEl.textContent = "";
      }
    } else {
      errorEl.textContent = "Usuário ou senha inválidos.";
      GameAudio.play("error");
    }
  });
});
