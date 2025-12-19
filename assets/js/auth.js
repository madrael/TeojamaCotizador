// auth.js - Login conceptual (MVP, robusto para GitHub Pages)

document.addEventListener("DOMContentLoaded", () => {

  const loginSection = document.getElementById("login-section");
  const quoteSection = document.getElementById("quote-section");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const welcomeUser = document.getElementById("welcome-user");

  async function loadUsers() {
    const response = await fetch("data/Users.json");
    return await response.json();
  }

  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      loginError.textContent = "Ingrese usuario y contraseña";
      loginError.style.display = "block";
      return;
    }

    const users = await loadUsers();

    const user = users.find(u =>
      u.username === username &&
      u.password === password &&
      u.activo === true
    );

    if (!user) {
      loginError.textContent = "Usuario o contraseña incorrectos";
      loginError.style.display = "block";
      return;
    }

    // LOGIN OK
    sessionStorage.setItem("user", JSON.stringify(user));

    loginError.style.display = "none";
    loginSection.style.display = "none";
    quoteSection.style.display = "block";

    if (welcomeUser) {
      welcomeUser.textContent = `Bienvenido/a ${user.nombre} (${user.rol})`;
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("user");
    quoteSection.style.display = "none";
    loginSection.style.display = "block";
  });

});
