import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { wireLogout } from "./logoutWireup.js";
import { el, clear } from "../ui/dom.js";

SeedService.ensure();
wireLogout();

const grid = document.getElementById("contentGrid");
const qInput = document.getElementById("navSearch");
const filterRow = document.getElementById("filterRow");
const browseTitle = document.getElementById("browseTitle");
const browseMeta = document.getElementById("browseMeta");

function readType() {
  const url = new URL(window.location.href);
  const t = url.searchParams.get("type");
  if (t === "movie" || t === "series") return t;
  return null;
}

function readCategory() {
  const url = new URL(window.location.href);
  const categoryId = Number(url.searchParams.get("category"));
  return Number.isFinite(categoryId) && categoryId > 0 ? categoryId : null;
}

function readQuery() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("q") ?? "").trim();
}

function buildBrowseHref({ type = null, category = null, q = null } = {}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (category) params.set("category", String(category));
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `home.html?${query}` : "home.html";
}

function renderChips(categories, activeType, activeCategory, query) {
  if (!filterRow) return;

  clear(filterRow);
  const chips = [
    { label: "All", type: null, category: null, active: !activeType && !activeCategory },
    { label: "Movies", type: "movie", category: null, active: activeType === "movie" },
    { label: "Series", type: "series", category: null, active: activeType === "series" }
  ];

  for (const category of categories) {
    chips.push({
      label: category.name,
      type: activeType,
      category: category.id,
      active: activeCategory === category.id
    });
  }

  for (const chip of chips) {
    filterRow.appendChild(el("a", {
      className: `chip${chip.active ? " active" : ""}`,
      href: buildBrowseHref({ type: chip.type, category: chip.category, q: query })
    }, [chip.label]));
  }
}

function render() {
  const db = StorageService.load();
  const session = AuthService.getSession();
  const activeProfileId = session.activeProfileId;
  const type = readType();
  const categoryId = readCategory();
  const query = readQuery();
  const q = query.toLowerCase();
  const categoriesById = new Map(db.categories.map(category => [category.id, category]));
  const favoriteContentIds = new Set(db.favorites.filter(favorite => favorite.profileId === activeProfileId).map(favorite => favorite.contentId));

  let items = [...db.contents];
  if (type) items = items.filter(c => c.type === type);
  if (categoryId) items = items.filter(c => c.categoryId === categoryId);
  if (q) items = items.filter(c => c.title.toLowerCase().includes(q));

  items.sort((a,b) => b.rating - a.rating);

  if (browseTitle) {
    browseTitle.textContent = type === "movie" ? "Movie collection" : type === "series" ? "Series collection" : "Popular titles";
  }
  if (browseMeta) {
    const categoryLabel = categoryId ? categoriesById.get(categoryId)?.name : null;
    browseMeta.textContent = [categoryLabel, query].filter(Boolean).join(" • ");
  }

  renderChips(db.categories, type, categoryId, query);

  clear(grid);
  if (qInput && qInput.value !== query) qInput.value = query;

  if (items.length === 0) {
    grid.appendChild(el("div", { className: "empty-state card" }, [
      el("h3", { text: "No titles match this filter." }),
      el("p", { className: "muted", text: "Try another search or remove the current category filter." })
    ]));
    return;
  }

  for (const c of items) {
    const category = categoriesById.get(c.categoryId)?.name ?? "Uncategorized";
    grid.appendChild(el("article", { className: "poster-card" }, [
      el("a", { className: "poster-link", href: `detail.html?id=${c.id}` }, [
        el("img", { src: c.imageUrl, alt: c.title }),
        el("span", { className: "poster-badge", text: favoriteContentIds.has(c.id) ? "In my list" : c.type })
      ]),
      el("div", { className: "poster-body" }, [
        el("div", { className: "poster-title", text: c.title }),
        el("div", { className: "poster-meta", text: `${c.year} • ${category}` }),
        el("div", { className: "rating-row" }, [
          el("span", { className: "rating-pill", text: `★ ${c.rating.toFixed(1)}` }),
          el("a", { className: "btn ghost compact", href: `detail.html?id=${c.id}` }, ["Details"])
        ])
      ])
    ]));
  }
}

qInput?.addEventListener("input", () => {
  const value = qInput.value.trim();
  const currentType = readType();
  const currentCategory = readCategory();
  window.history.replaceState({}, "", buildBrowseHref({ type: currentType, category: currentCategory, q: value || null }));
  render();
});

render();