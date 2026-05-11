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
  const currentUser = db.users.find(u => u.id === session.userId);

  clear(host);

  const message     = el("p", { className: "msg" });
  const emailInput    = el("input", { type: "email",     placeholder: "Email address" });
  const passwordInput = el("input", { type: "password",  placeholder: "Password" });
  const rememberInput = el("input", { type: "checkbox" });
  rememberInput.checked = true;

  if (currentUser) emailInput.value = currentUser.email;

  const form = el("form", { className: "stack" }, [
    el("p", { className: "eyebrow", text: "EstFlix" }),
    el("h1", { text: currentUser ? `Welcome back.` : "Sign in." }),
    el("p", { className: "muted", text: "Access your profiles, favorites, and the full catalog." }),
    el("label", { className: "field-label" }, ["Email", emailInput]),
    el("label", { className: "field-label" }, ["Password", passwordInput]),
    el("label", { className: "check-row" }, [rememberInput, " Remember me"]),
    el("div", { className: "hero-actions" }, [
      el("button", { className: "btn primary", type: "submit" }, ["Sign in"]),
      el("a",      { className: "btn ghost",   href: "home.html" }, ["Browse without signing in"])
    ]),
    message
  ]);

  form.addEventListener("submit", event => {
    event.preventDefault();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const user     = db.users.find(u => u.email.toLowerCase() === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      message.className = "msg error";
      message.textContent = "Invalid email or password.";
      return;
    }

    const profiles = db.profiles.filter(p => p.userId === user.id);
    AuthService.setSession({ userId: user.id, activeProfileId: profiles[0]?.id ?? null, rememberMe: rememberInput.checked });
    window.location.href = profiles.length > 1 ? "profiles.html" : "home.html";
  });

  // Quick demo buttons
  const adminBtn  = el("button", { className: "btn ghost compact", type: "button" }, ["Admin demo"]);
  const viewerBtn = el("button", { className: "btn ghost compact", type: "button" }, ["Viewer demo"]);

  adminBtn.addEventListener("click", () => {
    emailInput.value  = "admin@estflix.test";
    passwordInput.value = "admin";
    form.requestSubmit();
  });
  viewerBtn.addEventListener("click", () => {
    emailInput.value  = "viewer@estflix.test";
    passwordInput.value = "viewer";
    form.requestSubmit();
  });

  const demoBox = el("div", { className: "notice" }, [
    el("p", { className: "muted", text: "Demo accounts — click to sign in instantly:" }),
    el("div", { className: "hero-actions" }, [adminBtn, viewerBtn]),
    el("p", { className: "muted", text: "admin@estflix.test / admin · viewer@estflix.test / viewer" })
  ]);

  host.appendChild(form);
  host.appendChild(demoBox);
}

render();
