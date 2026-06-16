import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const featuredTitle      = document.getElementById('featuredTitle');
const featuredDesc       = document.getElementById('featuredDesc');
const featuredActions    = document.getElementById('featuredActions');
const featuredLabel      = document.getElementById('featuredLabel');
const featuredPanelTitle = document.getElementById('featuredPanelTitle');
const featuredPanelMeta  = document.getElementById('featuredPanelMeta');
const featuredPoster     = document.getElementById('featuredPoster');
const grid               = document.getElementById('contentGrid');
const qInput             = document.getElementById('navSearch');
const filterRow          = document.getElementById('filterRow');
const browseTitle        = document.getElementById('browseTitle');
const browseMeta         = document.getElementById('browseMeta');

function readType()     { const t = new URL(location.href).searchParams.get('type'); return t === 'movie' || t === 'series' ? t : null; }
function readCategory() { const c = Number(new URL(location.href).searchParams.get('category')); return Number.isFinite(c) && c > 0 ? c : null; }
function readQuery()    { return (new URL(location.href).searchParams.get('q') ?? '').trim(); }

function buildHref({ type = null, category = null, q = null } = {}) {
  const p = new URLSearchParams();
  if (type)     p.set('type',     type);
  if (category) p.set('category', String(category));
  if (q)        p.set('q',        q);
  const s = p.toString();
  return s ? `home.html?${s}` : 'home.html';
}

function renderFeatured(all, categories) {
  const featured = [...all].sort((a, b) => b.rating - a.rating)[0];
  if (!featured) return;
  const category = categories.find(c => c.id === featured.categoryId);
  if (featuredPoster) { featuredPoster.src = featured.imageUrl; featuredPoster.alt = featured.title; }
  if (featuredTitle)      featuredTitle.textContent      = featured.title;
  if (featuredDesc)       featuredDesc.textContent       = featured.tagline || featured.description;
  if (featuredLabel)      featuredLabel.textContent      = featured.type === 'series' ? 'Series' : 'Movie';
  if (featuredPanelTitle) featuredPanelTitle.textContent = `★ ${featured.rating.toFixed(1)}  ·  ${category?.name ?? ''}`;
  if (featuredPanelMeta)  featuredPanelMeta.textContent  = `${featured.year} · ${featured.runtimeMinutes ? `${featured.runtimeMinutes} min` : ''}`;
  if (featuredActions) {
    clear(featuredActions);
    featuredActions.appendChild(el('a', { className: 'btn primary', href: `detail.html?id=${featured.id}` }, ['Watch now']));
  }
}

function renderChips(categories, activeType, activeCategory, query) {
  if (!filterRow) return;
  clear(filterRow);
  const chips = [
    { label: 'All',    type: null,      category: null, active: !activeType && !activeCategory },
    { label: 'Movies', type: 'movie',   category: null, active: activeType === 'movie' },
    { label: 'Series', type: 'series',  category: null, active: activeType === 'series' }
  ];
  for (const cat of categories) chips.push({ label: cat.name, type: activeType, category: cat.id, active: activeCategory === cat.id });
  for (const chip of chips) {
    filterRow.appendChild(el('a', {
      className: `chip${chip.active ? ' active' : ''}`,
      href: buildHref({ type: chip.type, category: chip.category, q: query })
    }, [chip.label]));
  }
}

async function render() {
  const type       = readType();
  const categoryId = readCategory();
  const query      = readQuery();

  const [allContents, categories, session] = await Promise.all([
    api.get('/contents'),
    api.get('/categories'),
    api.get('/auth/me').catch(() => ({ user: null, activeProfileId: null }))
  ]);

  const navProfileLink = document.getElementById('navProfileLink');
  if (navProfileLink) {
    if (session.user) {
      navProfileLink.textContent = 'Change profile';
      navProfileLink.href = 'profiles.html';
    } else {
      navProfileLink.textContent = 'Login';
      navProfileLink.href = 'login.html';
    }
  }

  let favoriteContentIds = new Set();
  if (session.activeProfileId) {
    const favs = await api.get(`/favorites?profileId=${session.activeProfileId}`).catch(() => []);
    favoriteContentIds = new Set(favs.map(f => f.contentId));
  }

  renderFeatured(allContents, categories);

  let items = [...allContents];
  if (type)       items = items.filter(c => c.type === type);
  if (categoryId) items = items.filter(c => c.categoryId === categoryId);
  if (query)      items = items.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  const categoriesById = new Map(categories.map(c => [c.id, c]));

  if (browseTitle) browseTitle.textContent = type === 'movie' ? 'Movie collection' : type === 'series' ? 'Series collection' : 'Popular titles';
  if (browseMeta)  browseMeta.textContent  = [categoryId ? categoriesById.get(categoryId)?.name : null, query].filter(Boolean).join(' • ');

  renderChips(categories, type, categoryId, query);
  if (qInput && qInput.value.trim() !== query) qInput.value = query;

  clear(grid);

  if (!items.length) {
    grid.appendChild(el('div', { className: 'empty-state card' }, [
      el('h3', { text: 'No titles match this filter.' }),
      el('p', { className: 'muted', text: 'Try another search or remove the current category filter.' })
    ]));
    return;
  }

  for (const c of items) {
    const catName = categoriesById.get(c.categoryId)?.name ?? 'Uncategorized';
    grid.appendChild(el('article', { className: 'poster-card' }, [
      el('a', { className: 'poster-link', href: `detail.html?id=${c.id}` }, [
        el('img', { src: c.imageUrl, alt: c.title }),
        el('span', { className: 'poster-badge', text: favoriteContentIds.has(c.id) ? 'In my list' : c.type })
      ]),
      el('div', { className: 'poster-body' }, [
        el('div', { className: 'poster-title', text: c.title }),
        el('div', { className: 'poster-meta',  text: `${c.year} • ${catName}` }),
        el('div', { className: 'rating-row' }, [
          el('span', { className: 'rating-pill', text: `★ ${c.rating.toFixed(1)}` }),
          el('a', { className: 'btn ghost compact', href: `detail.html?id=${c.id}` }, ['Details'])
        ])
      ])
    ]));
  }

  if (session.activeProfileId && !type && !categoryId && !query) {
    const main = document.querySelector('main.container');
    const oldRec = document.getElementById('recSection');
    if (oldRec) oldRec.remove();

    const recs = await api.get(`/history/recommendations?profileId=${session.activeProfileId}`).catch(() => []);
    if (!recs.length) return;

    const recGrid = el('div', { className: 'poster-grid' });
    for (const c of recs) {
      const catName = categoriesById.get(c.category_id ?? c.categoryId)?.name ?? 'Uncategorized';
      recGrid.appendChild(el('article', { className: 'poster-card' }, [
        el('a', { className: 'poster-link', href: `detail.html?id=${c.id}` }, [
          el('img', { src: c.image_url ?? c.imageUrl, alt: c.title }),
          el('span', { className: 'poster-badge', text: c.type })
        ]),
        el('div', { className: 'poster-body' }, [
          el('div', { className: 'poster-title', text: c.title }),
          el('div', { className: 'poster-meta',  text: `${c.year} • ${catName}` }),
          el('div', { className: 'rating-row' }, [
            el('span', { className: 'rating-pill', text: `★ ${Number(c.rating).toFixed(1)}` })
          ])
        ])
      ]));
    }

    const section = el('section', { className: 'section-block', id: 'recSection' }, [
      el('div', { className: 'section-head' }, [
        el('div', {}, [
          el('p', { className: 'eyebrow', text: 'Personalized' }),
          el('h2', { text: 'Recommended for you' })
        ])
      ]),
      recGrid
    ]);
    if (main) main.appendChild(section);
  }
}

qInput?.addEventListener('input', () => {
  window.history.replaceState({}, '', buildHref({ type: readType(), category: readCategory(), q: qInput.value.trim() || null }));
  render();
});

render();
