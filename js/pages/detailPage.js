import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const host = document.getElementById('detailHost');
const id   = Number(new URL(location.href).searchParams.get('id'));

function formatMinutes(m) {
  if (!m) return null;
  const h = Math.floor(m / 60), r = m % 60;
  return h > 0 ? `${h}h ${String(r).padStart(2, '0')}m` : `${m}m`;
}

async function render() {
  clear(host);

  const [item, categories, session] = await Promise.all([
    api.get(`/contents/${id}`).catch(() => null),
    api.get('/categories'),
    api.get('/auth/me').catch(() => ({ user: null, activeProfileId: null, profile: null }))
  ]);

  if (!item) {
    host.appendChild(el('div', { className: 'empty-state' }, [
      el('h1', { text: 'Content not found' }),
      el('p', { className: 'muted', text: 'The requested title is unavailable or the link is invalid.' }),
      el('a', { className: 'btn primary', href: 'home.html' }, ['Return home'])
    ]));
    return;
  }

  const category     = categories.find(c => c.id === item.categoryId);
  const profileId    = session.activeProfileId;

  let favoriteActive = false;
  let watchEntry     = null;

  if (profileId) {
    const [favs, hist] = await Promise.all([
      api.get(`/favorites?profileId=${profileId}`).catch(() => []),
      api.get(`/history?profileId=${profileId}`).catch(() => [])
    ]);
    favoriteActive = favs.some(f => f.contentId === item.id);
    watchEntry     = hist.find(h => h.contentId === item.id) ?? null;
  }

  const allContents  = await api.get('/contents').catch(() => []);
  const relatedTitles = allContents.filter(c => c.id !== item.id && c.categoryId === item.categoryId).slice(0, 3);

  const playButton = el('button', { className: 'btn primary', type: 'button' }, ['Play now']);
  const favButton  = el('button', { className: favoriteActive ? 'btn ghost active' : 'btn ghost', type: 'button' },
    [favoriteActive ? 'In my list' : 'Add to my list']);

  playButton.addEventListener('click', async () => {
    if (!profileId) { window.location.href = 'login.html'; return; }
    await api.post('/history', { profileId, contentId: item.id }).catch(() => {});
    render();
  });

  favButton.addEventListener('click', async () => {
    if (!profileId) { window.location.href = 'login.html'; return; }
    if (favoriteActive) {
      await api.del(`/favorites/${profileId}/${item.id}`).catch(() => {});
    } else {
      await api.post('/favorites', { profileId, contentId: item.id }).catch(() => {});
    }
    render();
  });

  const activityNote = watchEntry
    ? `Watched ${watchEntry.times} time${watchEntry.times === 1 ? '' : 's'} · last watched ${new Date(watchEntry.watchedAt).toLocaleString()}`
    : 'Not watched yet on this profile.';

  host.appendChild(el('div', { className: 'detail-layout' }, [
    el('img', { className: 'detail-poster', src: item.imageUrl, alt: item.title }),
    el('div', { className: 'detail-copy' }, [
      el('p', { className: 'eyebrow', text: item.type === 'series' ? 'Series' : 'Movie' }),
      el('h1', { text: item.title }),
      el('p', { className: 'muted', text: item.tagline || item.description }),
      el('div', { className: 'detail-meta' }, [
        el('span', { className: 'rating-pill', text: `★ ${item.rating.toFixed(1)}` }),
        el('span', { className: 'meta-chip',   text: String(item.year) }),
        el('span', { className: 'meta-chip',   text: category?.name ?? 'Uncategorized' }),
        el('span', { className: 'meta-chip',   text: item.runtimeMinutes ? formatMinutes(item.runtimeMinutes) : item.type === 'series' ? 'Series' : 'Feature film' })
      ]),
      el('p', { className: 'detail-description', text: item.description }),
      el('div', { className: 'hero-actions' }, [
        playButton, favButton,
        el('a', { className: 'btn ghost', href: 'home.html' }, ['More titles'])
      ]),
      el('div', { className: 'detail-notes' }, [
        el('p', { text: activityNote }),
        el('p', { className: 'muted', text: session.profile ? `Active profile: ${session.profile.name}` : 'Sign in to save favorites and watch history.' })
      ]),
      el('div', { className: 'split-panel' }, [
        el('section', { className: 'card' }, [
          el('p', { className: 'eyebrow', text: 'Trailer' }),
          el('h2', { text: `Preview: ${item.title}` }),
          item.trailerUrl
            ? el('div', { className: 'trailer-wrap' }, [
                el('iframe', { src: item.trailerUrl, allowfullscreen: 'true', allow: 'autoplay; encrypted-media; picture-in-picture' })
              ])
            : el('p', { className: 'muted', text: 'No trailer available.' })
        ]),
        el('section', { className: 'card' }, [
          el('p', { className: 'eyebrow', text: 'Cast' }),
          el('h2', { text: 'Featured cast' }),
          el('div', { className: 'profile-meta' },
            (item.cast?.length ? item.cast : ['Cast unavailable']).map(name => el('span', { className: 'meta-chip', text: name }))
          )
        ])
      ]),
      el('section', { className: 'card' }, [
        el('p', { className: 'eyebrow', text: 'Related' }),
        el('h2', { text: 'More from this category' }),
        relatedTitles.length
          ? el('div', { className: 'profile-grid' }, relatedTitles.map(r => el('a', { className: 'profile-card', href: `detail.html?id=${r.id}` }, [
              el('img', { src: r.imageUrl, alt: r.title, className: 'detail-poster' }),
              el('strong', { text: r.title }),
              el('span', { className: 'muted', text: String(r.year) })
            ])))
          : el('p', { className: 'muted', text: 'No related titles yet.' })
      ])
    ])
  ]));
}

render();
