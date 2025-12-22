/*************************************************
 * Archivo: auth.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.12
 * FIX: Ruta correcta para Users.json (/data/Users.json)
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");

  /* =========================
     LOGIN
  ========================== */
  loginBtn?.addEventListener("click", async () => {

    const username = (document.getElementById("username")?.value || "").trim();
    const password = (document.getElementById("password")?.value || "").trim();

    if (!username || !password) {
      mostrarError("Ingrese usuario y contraseña");
      return;
    }

    try {
      // ✅ RUTA REAL SEGÚN TU REPO: /data/Users.json
      const response = await fetch("./data/Users.json", { cache: "no-store" });

      if (!response.ok) {
        console.error("No se pudo cargar Users.json. Status:", response.status);
        mostrarError("Error al validar usuario");
        return;
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
      console.error("Error en login:", err);
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
    const loginSection = document.getElementById("login-section");
    const quoteSection = document.getElementById("quote-section");

    if (loginSection) loginSection.style.display = "none";
    if (quoteSection) quoteSection.style.display = "block";

    // ✅ Mostrar nombre del usuario en el header (si existe el span)
    const lblUser = document.getElementById("loggedUserName");
    if (lblUser) {
      // usa "nombre" si existe, si no, muestra username
      lblUser.textContent = user.nombre || user.username || "";
    }

    // limpiar error
    if (loginError) loginError.style.display = "none";
  }

  function cerrarSesion() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (usernameInput) usernameInput.value = "";
    if (passwordInput) passwordInput.value = "";

    const quoteSection = document.getElementById("quote-section");
    const loginSection = document.getElementById("login-section");

    if (quoteSection) quoteSection.style.display = "none";
    if (loginSection) loginSection.style.display = "flex";

    // limpiar nombre del usuario si existe
    const lblUser = document.getElementById("loggedUserName");
    if (lblUser) lblUser.textContent = "";
  }

  function mostrarError(msg) {
    if (!loginError) return;
    loginError.textContent = msg;
    loginError.style.display = "block";
  }

});
