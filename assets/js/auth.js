/*************************************************
 * auth.js
 * Cotizador Vehículos Teojama
 * REvisión rollbac ene 2026
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");

  /* =========================
     LOGIN
  ========================== */
  loginBtn.addEventListener("click", async () => {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      mostrarError("Ingrese usuario y contraseña");
      return;
    }

    try {
      // 👉 RUTA CORRECTA (COMPROBADA)
      const response = await fetch("./data/Users.json", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No se pudo cargar Users.json");
      }

      const users = await response.json();

      const user = users.find(u =>
        u.username === username &&
        u.password === password &&
        u.activo === true
      );

      if (!user) {
        mostrarError("Credenciales inválidas");
        return;
      }

      iniciarSesion(user);

    } catch (err) {
      console.error(err);
      mostrarError("Error al validar usuario");
    }
  });

  /* =========================
     LOGOUT
  ========================== */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", cerrarSesion);
  }

  /* =========================
     FUNCIONES
  ========================== */

  function iniciarSesion(user) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("quote-section").style.display = "block";

    const lblUser = document.getElementById("loggedUserName");
    if (lblUser) {
      lblUser.textContent = user.nombre;
    }

    loginError.style.display = "none";
  }

  function cerrarSesion() {
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    document.getElementById("quote-section").style.display = "none";
    document.getElementById("login-section").style.display = "flex";

    const lblUser = document.getElementById("loggedUserName");
    if (lblUser) lblUser.textContent = "";
  }

  function mostrarError(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
  }

});
