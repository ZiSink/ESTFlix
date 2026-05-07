import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { wireLogout } from "./logoutWireup.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();
wireLogout();

const host = document.getElementById("profilesHost");

function initials(name) {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function activateProfile(profileId) {
  const session = AuthService.getSession();
  AuthService.setSession({ ...session, activeProfileId: profileId });
  window.location.href = "home.html";
}

function render() {
  const db = StorageService.load();
  const session = AuthService.getSession();
  const user = db.users.find(item => item.id === session.userId);

  clear(host);

  if (!user) {
    host.appendChild(el("section", { className: "card notice" }, [
      el("p", { className: "eyebrow", text: "Profiles" }),
      el("h1", { text: "No user is signed in." }),
      el("p", { className: "hero-text", text: "Sign in first so the app can load the profiles tied to your account." }),
      el("div", { className: "hero-actions" }, [
        el("a", { className: "btn primary", href: "login.html" }, ["Sign in"]),
        el("a", { className: "btn ghost", href: "home.html" }, ["Browse without profile"])
      ])
    ]));
    return;
  }

  const profiles = db.profiles.filter(profile => profile.userId === user.id);
  const activeProfile = profiles.find(profile => profile.id === session.activeProfileId) ?? profiles[0] ?? null;

  host.appendChild(el("section", { className: "card admin-shell" }, [
    el("div", { className: "hero" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Who is watching?" }),
        el("h1", { text: "Choose a profile." }),
        el("p", { className: "hero-text", text: "Profiles now drive the active session, making the browsing experience feel like a real streaming platform." })
      ]),
      el("aside", { className: "hero-panel" }, [
        el("p", { className: "panel-label", text: "Signed in as" }),
        el("h2", { text: user.email }),
        el("p", { className: "muted", text: "Switching profiles updates the active context for the rest of the app." })
      ])
    ]),
    el("div", { className: "admin-summary" }, [
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Profiles" }), el("span", { className: "value", text: String(profiles.length) })]),
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Active" }), el("span", { className: "value", text: activeProfile?.name ?? "None" })]),
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Role" }), el("span", { className: "value", text: activeProfile?.role ?? "-" })])
    ]),
    el("div", { className: "profile-grid" }, profiles.map(profile => {
      const isActive = activeProfile?.id === profile.id;
      return el("article", { className: `profile-card${isActive ? " active" : ""}` }, [
        el("div", { className: "profile-avatar", text: initials(profile.name) }),
        el("div", {}, [
          el("h3", { text: profile.name }),
          el("div", { className: "profile-meta" }, [
            el("span", { className: "meta-chip", text: profile.role }),
            el("span", { className: "meta-chip", text: isActive ? "Active" : "Available" })
          ])
        ]),
        el("button", { className: isActive ? "btn primary" : "btn ghost", type: "button" }, [isActive ? "Continue" : "Use profile"])
      ]);
    }))
  ]));

  const profileButtons = host.querySelectorAll(".profile-card button");
  profileButtons.forEach((button, index) => {
    button.addEventListener("click", () => activateProfile(profiles[index].id));
  });
}

render();