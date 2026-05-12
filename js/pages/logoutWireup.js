import { AuthService } from "../services/authService.js";

export function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  const session = AuthService.getSession();
  if (!session?.userId) {
    btn.style.display = "none";
    return;
  }

  btn.addEventListener("click", () => {
    AuthService.logout();
    window.location.href = "login.html";
  });
}
