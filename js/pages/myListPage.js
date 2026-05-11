import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { wireLogout } from "./logoutWireup.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();
wireLogout();

const grid = document.getElementById("myListGrid");
const listTitle = document.getElementById("myListTitle");
const listMeta = document.getElementById("myListMeta");
const historyGrid = document.getElementById("historyGrid");
const historyTitle = document.getElementById("historyTitle");
const historyMeta = document.getElementById("historyMeta");

function getActiveProfile(db) {
  const session = AuthService.getSession();
  return db.profiles.find(profile => profile.id === session.activeProfileId) ?? null;
}

function render() {
  const db = StorageService.load();
  const profile = getActiveProfile(db);
  const categoriesById = new Map(db.categories.map(category => [category.id, category]));

  clear(grid);
  clear(historyGrid);

  if (!profile) {
    listTitle.textContent = "No profile selected";
    listMeta.textContent = "";
    historyTitle.textContent = "Watch history";
    historyMeta.textContent = "";
    const prompt = el("div", { className: "empty-state card" }, [
      el("h3", { text: "Sign in to see your list." }),
      el("p", { className: "muted", text: "Pick a profile first so EstFlix knows which favorites to load." }),
      el("div", { className: "hero-actions" }, [
        el("a", { className: "btn primary", href: "login.html" }, ["Sign in"]),
        el("a", { className: "btn ghost", href: "profiles.html" }, ["Choose profile"])
      ])
    ]);
    grid.appendChild(prompt);
    return;
  }

  // --- Favorites ---
  const favorites = db.favorites
    .filter(item => item.profileId === profile.id)
    .map(item => db.contents.find(content => content.id === item.contentId))
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating);

  listTitle.textContent = `My List — ${profile.name}`;
  listMeta.textContent = `${favorites.length} saved title${favorites.length === 1 ? "" : "s"}`;

  if (!favorites.length) {
    grid.appendChild(el("div", { className: "empty-state card" }, [
      el("h3", { text: "Nothing saved yet." }),
      el("p", { className: "muted", text: "Open any title and use Add to my list to build your queue." }),
      el("a", { className: "btn primary", href: "home.html" }, ["Browse titles"])
    ]));
  } else {
    for (const content of favorites) {
      const category = categoriesById.get(content.categoryId)?.name ?? "Uncategorized";
      const removeButton = el("button", { className: "btn danger compact", type: "button" }, ["Remove"]);

      removeButton.addEventListener("click", () => {
        const freshDb = StorageService.load();
        freshDb.favorites = freshDb.favorites.filter(item => !(item.profileId === profile.id && item.contentId === content.id));
        StorageService.save(freshDb);
        render();
      });

      grid.appendChild(el("article", { className: "poster-card" }, [
        el("a", { className: "poster-link", href: `detail.html?id=${content.id}` }, [
          el("img", { src: content.imageUrl, alt: content.title }),
          el("span", { className: "poster-badge", text: "Saved" })
        ]),
        el("div", { className: "poster-body" }, [
          el("div", { className: "poster-title", text: content.title }),
          el("div", { className: "poster-meta", text: `${content.year} • ${category}` }),
          el("div", { className: "rating-row" }, [
            el("span", { className: "rating-pill", text: `★ ${content.rating.toFixed(1)}` }),
            removeButton
          ])
        ])
      ]));
    }
  }

  // --- History ---
  const historyEntries = db.history
    .filter(entry => entry.profileId === profile.id)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

  historyTitle.textContent = `Watch history — ${profile.name}`;
  historyMeta.textContent = `${historyEntries.length} title${historyEntries.length === 1 ? "" : "s"} watched`;

  if (!historyEntries.length) {
    historyGrid.appendChild(el("div", { className: "empty-state card" }, [
      el("h3", { text: "No watch history yet." }),
      el("p", { className: "muted", text: "Press Play on any title to start tracking your history." })
    ]));
  } else {
    for (const entry of historyEntries) {
      const content = db.contents.find(c => c.id === entry.contentId);
      if (!content) continue;
      const category = categoriesById.get(content.categoryId)?.name ?? "Uncategorized";
      const watchedDate = new Date(entry.watchedAt).toLocaleDateString();

      historyGrid.appendChild(el("article", { className: "poster-card" }, [
        el("a", { className: "poster-link", href: `detail.html?id=${content.id}` }, [
          el("img", { src: content.imageUrl, alt: content.title }),
          el("span", { className: "poster-badge", text: `${entry.times}×` })
        ]),
        el("div", { className: "poster-body" }, [
          el("div", { className: "poster-title", text: content.title }),
          el("div", { className: "poster-meta", text: `${content.year} • ${category}` }),
          el("div", { className: "rating-row" }, [
            el("span", { className: "rating-pill", text: `★ ${content.rating.toFixed(1)}` }),
            el("span", { className: "muted", text: watchedDate })
          ])
        ])
      ]));
    }
  }
}

render();