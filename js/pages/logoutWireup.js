import { AuthService } from "../services/authService.js";

export function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    AuthService.logout();
    window.location.href = "login.html";
  });
}