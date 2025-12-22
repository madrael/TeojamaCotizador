/*************************************************
 * Archivo: auth.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.11
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");

  /* =========================
     LOGIN
  ========================== */
  loginBtn?.addEventListener("click", async () => {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      mostrarError("Ingrese usuario y contraseña");
      return;
    }

    try {
      const response = await fetch("./assets/data/Users.json");
      const users = await response.json();

      const user = users.find(
        u =>
          u.username === username &&
          u.password === password &&
          u.activo === true
      );

      if (!user) {
        mostrarError("Credenciales inválidas");
        return;
      }

      // Login exitoso
      iniciarSesion(user);

    } catch (err) {
      mostrarError("Error al validar usuario");
      console.error(err);
    }
  });

  /* =========================
     LOGOUT
  ========================== */
  logoutBtn?.addEventListener("click", cerrarSesion);

  /* =========================
     FUNCIONES
  ========================== */

  function iniciarSesion(user) {
    // Ocultar login
    document.getElementById("login-section").style.display = "none";
    document.getElementById("quote-section").style.display = "block";

    // Mostrar nombre del usuario en header
    const lblUser = document.getElementById("loggedUserName");
    if (lblUser) {
      lblUser.textContent = user.nombre;
    }

    // Limpiar error
    loginError.style.display = "none";
  }

  function cerrarSesion() {
    // Limpiar campos
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    // Volver al login
    document.getElementById("quote-section").style.display = "none";
    document.getElementById("login-section").style.display = "flex";
  }

  function mostrarError(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
  }

});
