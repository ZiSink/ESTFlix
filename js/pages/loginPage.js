import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { verifyPassword } from "../services/credentialService.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();

const host = document.getElementById("loginHost");

function render() {
  const db = StorageService.load();
  const session = AuthService.getSession();
  const currentUser = db.users.find(user => user.id === session.userId);

  clear(host);

  const message = el("p", { className: "msg" });
  const emailInput = el("input", { type: "email", placeholder: "admin@estflix.test" });
  const passwordInput = el("input", { type: "password", placeholder: "admin" });
  const rememberInput = el("input", { type: "checkbox" });
  rememberInput.checked = true;

  const form = el("form", { className: "stack" }, [
    el("div", { className: "notice" }, [
      el("p", { className: "eyebrow", text: "Account access" }),
      el("h1", { text: currentUser ? `Welcome back, ${currentUser.email}` : "Sign in to continue watching." }),
      el("p", { className: "hero-text", text: "Use one of the seeded accounts below to unlock the catalog, profiles, and admin console." })
    ]),
    el("label", { className: "field-label" }, ["Email", emailInput]),
    el("label", { className: "field-label" }, ["Password", passwordInput]),
    el("label", { className: "check-row" }, [rememberInput, "Remember me"]),
    el("div", { className: "hero-actions" }, [
      el("button", { className: "btn primary", type: "submit" }, ["Sign in"]),
      el("a", { className: "btn ghost", href: "home.html" }, ["Browse catalog"])
    ]),
    message
  ]);

  form.addEventListener("submit", event => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    const user = db.users.find(item => item.email.toLowerCase() === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      message.className = "msg error";
      message.textContent = "Invalid email or password.";
      return;
    }

    const profiles = db.profiles.filter(profile => profile.userId === user.id);
    AuthService.setSession({
      userId: user.id,
      activeProfileId: profiles[0]?.id ?? null,
      rememberMe: rememberInput.checked
    });

    window.location.href = profiles.length > 1 ? "profiles.html" : "home.html";
  });

  const adminQuickButton = el("button", { className: "btn ghost", type: "button" }, ["Admin demo"]);
  const viewerQuickButton = el("button", { className: "btn ghost", type: "button" }, ["Viewer demo"]);

  const quickLogin = el("div", { className: "detail-notes" }, [
    el("p", { text: "Seed accounts" }),
    el("div", { className: "hero-actions" }, [
      adminQuickButton,
      viewerQuickButton
    ]),
    el("p", { className: "muted", text: "Admin: admin@estflix.test / admin. Viewer: viewer@estflix.test / viewer." })
  ]);

  const content = el("div", { className: "split-panel" }, [
    form,
    el("div", { className: "hero-panel" }, [
      el("p", { className: "panel-label", text: "Platform access" }),
      el("h2", { text: "Local streaming prototype" }),
      el("p", { className: "muted", text: "This login page now drives the session used by profiles, admin, and the browsing flow." }),
      quickLogin
    ])
  ]);

  host.appendChild(content);

  adminQuickButton.addEventListener("click", () => {
    emailInput.value = "admin@estflix.test";
    passwordInput.value = "admin";
    form.requestSubmit();
  });
  viewerQuickButton.addEventListener("click", () => {
    emailInput.value = "viewer@estflix.test";
    passwordInput.value = "viewer";
    form.requestSubmit();
  });
}

render();