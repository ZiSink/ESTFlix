import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { wireLogout } from "./logoutWireup.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();
wireLogout();

const host = document.getElementById("detailHost");
const url = new URL(window.location.href);
const id = Number(url.searchParams.get("id"));

function getActiveProfile(db) {
  const session = AuthService.getSession();
  return db.profiles.find(profile => profile.id === session.activeProfileId) ?? null;
}

function isFavorite(db, profileId, contentId) {
  return db.favorites.some(item => item.profileId === profileId && item.contentId === contentId);
}

function setFavorite(db, profileId, contentId, active) {
  const exists = isFavorite(db, profileId, contentId);
  if (active && !exists) db.favorites.push({ profileId, contentId });
  if (!active && exists) {
    db.favorites = db.favorites.filter(item => !(item.profileId === profileId && item.contentId === contentId));
  }
}

function recordWatch(db, profileId, contentId) {
  const now = new Date().toISOString();
  const entry = db.history.find(item => item.profileId === profileId && item.contentId === contentId);
  if (entry) {
    entry.times = (entry.times ?? 1) + 1;
    entry.watchedAt = now;
    return;
  }
  db.history.push({ profileId, contentId, watchedAt: now, times: 1 });
}

function formatMinutes(minutes) {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours}h ${remaining.toString().padStart(2, "0")}m` : `${minutes}m`;
}

function render() {
  const db = StorageService.load();
  const item = db.contents.find(content => content.id === id);
  const category = db.categories.find(categoryItem => categoryItem.id === item?.categoryId);
  const profile = getActiveProfile(db);
  const profileId = profile?.id ?? null;
  const favoriteActive = profileId ? isFavorite(db, profileId, item?.id) : false;
  const watchEntry = profileId ? db.history.find(entry => entry.profileId === profileId && entry.contentId === item?.id) : null;
  const relatedTitles = item ? db.contents.filter(content => content.id !== item.id && content.categoryId === item.categoryId).slice(0, 3) : [];

  clear(host);

  if (!item) {
    host.appendChild(el("div", { className: "empty-state" }, [
      el("h1", { text: "Content not found" }),
      el("p", { className: "muted", text: "The requested title is unavailable or the link is invalid." }),
      el("a", { className: "btn primary", href: "home.html" }, ["Return home"])
    ]));
    return;
  }

  const playButton = el("button", { className: "btn primary", type: "button" }, ["Play now"]);
  const favoriteButton = el("button", { className: favoriteActive ? "btn ghost active" : "btn ghost", type: "button" }, [favoriteActive ? "In my list" : "Add to my list"]);

  playButton.addEventListener("click", () => {
    const freshDb = StorageService.load();
    const freshProfile = getActiveProfile(freshDb);
    if (!freshProfile) {
      window.location.href = "login.html";
      return;
    }
    recordWatch(freshDb, freshProfile.id, item.id);
    StorageService.save(freshDb);
    render();
  });

  favoriteButton.addEventListener("click", () => {
    const freshDb = StorageService.load();
    const freshProfile = getActiveProfile(freshDb);
    if (!freshProfile) {
      window.location.href = "login.html";
      return;
    }
    const currentlyFavorite = isFavorite(freshDb, freshProfile.id, item.id);
    setFavorite(freshDb, freshProfile.id, item.id, !currentlyFavorite);
    StorageService.save(freshDb);
    render();
  });

  const details = [
    el("span", { className: "rating-pill", text: `★ ${item.rating.toFixed(1)}` }),
    el("span", { className: "meta-chip", text: String(item.year) }),
    el("span", { className: "meta-chip", text: category?.name ?? "Uncategorized" }),
    el("span", { className: "meta-chip", text: item.runtimeMinutes ? formatMinutes(item.runtimeMinutes) : item.type === "series" ? "Series" : "Feature film" })
  ];

  const activityNote = watchEntry
    ? `Watched ${watchEntry.times} time${watchEntry.times === 1 ? "" : "s"} · last watched ${new Date(watchEntry.watchedAt).toLocaleString()}`
    : "Not watched yet on this profile.";

  host.appendChild(el("div", { className: "detail-layout" }, [
    el("img", { className: "detail-poster", src: item.imageUrl, alt: item.title }),
    el("div", { className: "detail-copy" }, [
      el("p", { className: "eyebrow", text: item.type === "series" ? "Series" : "Movie" }),
      el("h1", { text: item.title }),
      el("p", { className: "muted", text: item.tagline || item.description }),
      el("div", { className: "detail-meta" }, details),
      el("p", { className: "detail-description", text: item.description }),
      el("div", { className: "hero-actions" }, [playButton, favoriteButton, el("a", { className: "btn ghost", href: "home.html" }, ["More titles"])]),
      el("div", { className: "detail-notes" }, [
        el("p", { text: activityNote }),
        el("p", { className: "muted", text: profile ? `Active profile: ${profile.name}` : "Sign in to save favorites and watch history." })
      ]),
      el("div", { className: "split-panel" }, [
        el("section", { className: "card" }, [
          el("p", { className: "eyebrow", text: "Trailer" }),
          el("h2", { text: `Preview: ${item.title}` }),
          item.trailerUrl
            ? el("div", { className: "trailer-wrap" }, [
                el("iframe", { src: item.trailerUrl, allowfullscreen: "true", allow: "autoplay; encrypted-media; picture-in-picture" })
              ])
            : el("p", { className: "muted", text: "No trailer available." })
        ]),
        el("section", { className: "card" }, [
          el("p", { className: "eyebrow", text: "Cast" }),
          el("h2", { text: "Featured cast" }),
          el("div", { className: "profile-meta" }, (item.cast.length ? item.cast : ["Cast unavailable"]).map(name => el("span", { className: "meta-chip", text: name })))
        ])
      ]),
      el("section", { className: "card" }, [
        el("p", { className: "eyebrow", text: "Related" }),
        el("h2", { text: "More from this category" }),
        relatedTitles.length
          ? el("div", { className: "profile-grid" }, relatedTitles.map(related => el("a", { className: "profile-card", href: `detail.html?id=${related.id}` }, [
            el("img", { src: related.imageUrl, alt: related.title, className: "detail-poster" }),
            el("strong", { text: related.title }),
            el("span", { className: "muted", text: String(related.year) })
          ])))
          : el("p", { className: "muted", text: "No related titles yet." })
      ])
    ])
  ]));
}

render();