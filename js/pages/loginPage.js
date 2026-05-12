import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { verifyPassword, hashPassword } from "../services/credentialService.js";
import { IdService } from "../services/idService.js";
import { User } from "../models/user.js";
import { Profile } from "../models/profile.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();

const host = document.getElementById("loginHost");
let showRegister = false;

function renderLogin(db) {
  const session = AuthService.getSession();
  const currentUser = db.users.find(u => u.id === session.userId);

  const message     = el("p", { className: "msg" });
  const emailInput    = el("input", { type: "email",    placeholder: "Email address" });
  const passwordInput = el("input", { type: "password", placeholder: "Password" });
  const rememberInput = el("input", { type: "checkbox" });
  rememberInput.checked = true;

  if (currentUser) emailInput.value = currentUser.email;

  const form = el("form", { className: "stack" }, [
    el("p", { className: "eyebrow", text: "EstFlix" }),
    el("h1", { text: currentUser ? "Welcome back." : "Sign in." }),
    el("p", { className: "muted", text: "Access your profiles, favorites, and the full catalog." }),
    el("label", { className: "field-label" }, ["Email", emailInput]),
    el("label", { className: "field-label" }, ["Password", passwordInput]),
    el("label", { className: "check-row" }, [rememberInput, " Remember me"]),
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

  const adminBtn  = el("button", { className: "btn ghost compact", type: "button" }, ["Admin demo"]);
  const viewerBtn = el("button", { className: "btn ghost compact", type: "button" }, ["Viewer demo"]);

  adminBtn.addEventListener("click", () => {
    emailInput.value    = "admin@estflix.test";
    passwordInput.value = "admin";
    form.requestSubmit();
  });
  viewerBtn.addEventListener("click", () => {
    emailInput.value    = "viewer@estflix.test";
    passwordInput.value = "viewer";
    form.requestSubmit();
  });

  const registerBtn = el("button", { className: "btn ghost compact", type: "button" }, ["Create account"]);
  registerBtn.addEventListener("click", () => { showRegister = true; render(); });

  host.appendChild(form);
  host.appendChild(el("div", { className: "notice" }, [
    el("p", { className: "muted", text: "Demo accounts — click to sign in instantly:" }),
    el("div", { className: "hero-actions" }, [adminBtn, viewerBtn]),
    el("p", { className: "muted", text: "admin@estflix.test / admin · viewer@estflix.test / viewer" })
  ]));
  host.appendChild(el("div", { className: "notice" }, [
    el("p", { className: "muted", text: "New to EstFlix?" }),
    el("div", { className: "hero-actions" }, [registerBtn])
  ]));
}

function renderRegister() {
  const message       = el("p", { className: "msg" });
  const nameInput     = el("input", { type: "text",     placeholder: "Your name" });
  const emailInput    = el("input", { type: "email",    placeholder: "Email address" });
  const passwordInput = el("input", { type: "password", placeholder: "Password (min. 4 characters)" });
  const confirmInput  = el("input", { type: "password", placeholder: "Confirm password" });

  const backBtn = el("button", { className: "btn ghost", type: "button" }, ["Back to sign in"]);
  backBtn.addEventListener("click", () => { showRegister = false; render(); });

  const form = el("form", { className: "stack" }, [
    el("p", { className: "eyebrow", text: "EstFlix" }),
    el("h1", { text: "Create account." }),
    el("p", { className: "muted", text: "Join EstFlix and start exploring." }),
    el("label", { className: "field-label" }, ["Name", nameInput]),
    el("label", { className: "field-label" }, ["Email", emailInput]),
    el("label", { className: "field-label" }, ["Password", passwordInput]),
    el("label", { className: "field-label" }, ["Confirm password", confirmInput]),
    el("div", { className: "hero-actions" }, [
      el("button", { className: "btn primary", type: "submit" }, ["Create account"]),
      backBtn
    ]),
    message
  ]);

  form.addEventListener("submit", event => {
    event.preventDefault();
    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirm  = confirmInput.value;

    if (!name) {
      message.className = "msg error";
      message.textContent = "Please enter your name.";
      return;
    }
    if (!email) {
      message.className = "msg error";
      message.textContent = "Please enter an email address.";
      return;
    }
    if (password.length < 4) {
      message.className = "msg error";
      message.textContent = "Password must be at least 4 characters.";
      return;
    }
    if (password !== confirm) {
      message.className = "msg error";
      message.textContent = "Passwords do not match.";
      return;
    }

    const freshDb = StorageService.load();
    if (freshDb.users.some(u => u.email.toLowerCase() === email)) {
      message.className = "msg error";
      message.textContent = "An account with this email already exists.";
      return;
    }

    const user = new User({ id: IdService.next(freshDb, "user"), email, passwordHash: hashPassword(password) });
    freshDb.users.push(user);

    const profile = new Profile({ id: IdService.next(freshDb, "profile"), userId: user.id, name, role: "USER", avatarUrl: "" });
    freshDb.profiles.push(profile);

    StorageService.save(freshDb);
    AuthService.setSession({ userId: user.id, activeProfileId: profile.id, rememberMe: false });
    window.location.href = "home.html";
  });

  host.appendChild(form);
}

function render() {
  const db = StorageService.load();
  clear(host);
  if (showRegister) {
    renderRegister();
  } else {
    renderLogin(db);
  }
}

render();
