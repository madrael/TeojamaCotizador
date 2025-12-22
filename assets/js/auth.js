/*************************************************
 * Archivo: auth.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.12
 * FIX: Ruta correcta de Users.json
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
      // 🔴 RUTA CORRECTA
      const response = await fetch("./Users.json");

      if (!response.ok) {
        throw new Error("No se pudo cargar Users.json");
      }

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

      iniciarSesion(user);

    } catch (err) {
      console.error(err);
      mostrarError("Error al validar usuario");
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
    document.getElementById("login-section").style.display = "none";
    document.getElementById("quote-section").style.display = "block";

    // Mostrar nombre de usuario en header
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
  }

  function mostrarError(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
  }

});
