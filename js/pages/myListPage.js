import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const grid         = document.getElementById('myListGrid');
const listTitle    = document.getElementById('myListTitle');
const listMeta     = document.getElementById('myListMeta');
const historyGrid  = document.getElementById('historyGrid');
const historyTitle = document.getElementById('historyTitle');
const historyMeta  = document.getElementById('historyMeta');

async function render() {
  clear(grid);
  clear(historyGrid);

  const session = await api.get('/auth/me').catch(() => ({ user: null, activeProfileId: null, profile: null }));
  const profile  = session.profile;
  const profileId = session.activeProfileId;

  if (!profile || !profileId) {
    if (listTitle)    listTitle.textContent    = 'No profile selected';
    if (listMeta)     listMeta.textContent     = '';
    if (historyTitle) historyTitle.textContent = 'Watch history';
    if (historyMeta)  historyMeta.textContent  = '';
    grid.appendChild(el('div', { className: 'empty-state card' }, [
      el('h3', { text: 'Sign in to see your list.' }),
      el('p', { className: 'muted', text: 'Pick a profile first so EstFlix knows which favorites to load.' }),
      el('div', { className: 'hero-actions' }, [
        el('a', { className: 'btn primary', href: 'login.html'    }, ['Sign in']),
        el('a', { className: 'btn ghost',   href: 'profiles.html' }, ['Choose profile'])
      ])
    ]));
    return;
  }

  const [allContents, favData, histData] = await Promise.all([
    api.get('/contents'),
    api.get(`/favorites?profileId=${profileId}`).catch(() => []),
    api.get(`/history?profileId=${profileId}`).catch(() => [])
  ]);

  const categoriesById = new Map();
  const contentById    = new Map(allContents.map(c => [c.id, c]));

  const favorites = favData
    .map(f => contentById.get(f.contentId))
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating);

  if (listTitle) listTitle.textContent = `My List — ${profile.name}`;
  if (listMeta)  listMeta.textContent  = `${favorites.length} saved title${favorites.length === 1 ? '' : 's'}`;

  if (!favorites.length) {
    grid.appendChild(el('div', { className: 'empty-state card' }, [
      el('h3', { text: 'Nothing saved yet.' }),
      el('p', { className: 'muted', text: 'Open any title and use Add to my list to build your queue.' }),
      el('a', { className: 'btn primary', href: 'home.html' }, ['Browse titles'])
    ]));
  } else {
    for (const content of favorites) {
      const catName    = categoriesById.get(content.categoryId)?.name ?? '';
      const removeBtn  = el('button', { className: 'btn danger compact', type: 'button' }, ['Remove']);
      removeBtn.addEventListener('click', async () => {
        await api.del(`/favorites/${profileId}/${content.id}`).catch(() => {});
        render();
      });

      grid.appendChild(el('article', { className: 'poster-card' }, [
        el('a', { className: 'poster-link', href: `detail.html?id=${content.id}` }, [
          el('img', { src: content.imageUrl, alt: content.title }),
          el('span', { className: 'poster-badge', text: 'Saved' })
        ]),
        el('div', { className: 'poster-body' }, [
          el('div', { className: 'poster-title', text: content.title }),
          el('div', { className: 'poster-meta',  text: `${content.year}${catName ? ' • ' + catName : ''}` }),
          el('div', { className: 'rating-row' }, [
            el('span', { className: 'rating-pill', text: `★ ${content.rating.toFixed(1)}` }),
            removeBtn
          ])
        ])
      ]));
    }
  }

  if (historyTitle) historyTitle.textContent = `Watch history — ${profile.name}`;
  if (historyMeta)  historyMeta.textContent  = `${histData.length} title${histData.length === 1 ? '' : 's'} watched`;

  if (!histData.length) {
    historyGrid.appendChild(el('div', { className: 'empty-state card' }, [
      el('h3', { text: 'No watch history yet.' }),
      el('p', { className: 'muted', text: 'Press Play on any title to start tracking your history.' })
    ]));
  } else {
    for (const entry of histData) {
      const content = contentById.get(entry.contentId);
      if (!content) continue;
      const catName    = categoriesById.get(content.categoryId)?.name ?? '';
      const watchedDate = new Date(entry.watchedAt).toLocaleDateString();

      historyGrid.appendChild(el('article', { className: 'poster-card' }, [
        el('a', { className: 'poster-link', href: `detail.html?id=${content.id}` }, [
          el('img', { src: content.imageUrl, alt: content.title }),
          el('span', { className: 'poster-badge', text: `${entry.times}×` })
        ]),
        el('div', { className: 'poster-body' }, [
          el('div', { className: 'poster-title', text: content.title }),
          el('div', { className: 'poster-meta',  text: `${content.year}${catName ? ' • ' + catName : ''}` }),
          el('div', { className: 'rating-row' }, [
            el('span', { className: 'rating-pill', text: `★ ${content.rating.toFixed(1)}` }),
            el('span', { className: 'muted', text: watchedDate })
          ])
        ])
      ]));
    }
  }
}

render();
