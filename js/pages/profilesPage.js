import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const host = document.getElementById('profilesHost');

function initials(name) {
  return name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

async function render() {
  clear(host);

  const session = await api.get('/auth/me').catch(() => ({ user: null, activeProfileId: null }));

  if (!session.user) {
    host.appendChild(el('section', { className: 'card notice' }, [
      el('p', { className: 'eyebrow', text: 'Profiles' }),
      el('h1', { text: 'No user is signed in.' }),
      el('p', { className: 'hero-text', text: 'Sign in first so the app can load the profiles tied to your account.' }),
      el('div', { className: 'hero-actions' }, [
        el('a', { className: 'btn primary', href: 'login.html' }, ['Sign in']),
        el('a', { className: 'btn ghost',   href: 'home.html'  }, ['Browse without profile'])
      ])
    ]));
    return;
  }

  const profiles     = await api.get('/profiles').catch(() => []);
  const activeId     = session.activeProfileId;
  const activeProfile = profiles.find(p => p.id === activeId) ?? profiles[0] ?? null;

  host.appendChild(el('section', { className: 'card admin-shell' }, [
    el('div', { className: 'hero' }, [
      el('div', {}, [
        el('p', { className: 'eyebrow', text: 'Who is watching?' }),
        el('h1', { text: 'Choose a profile.' }),
        el('p', { className: 'hero-text', text: 'Profiles drive the active session, making the browsing experience feel like a real streaming platform.' })
      ]),
      el('aside', { className: 'hero-panel' }, [
        el('p', { className: 'panel-label', text: 'Signed in as' }),
        el('h2', { text: session.user.email }),
        el('p', { className: 'muted', text: 'Switching profiles updates the active context for the rest of the app.' })
      ])
    ]),
    el('div', { className: 'admin-summary' }, [
      el('div', { className: 'kpi' }, [el('span', { className: 'eyebrow', text: 'Profiles' }), el('span', { className: 'value', text: String(profiles.length) })]),
      el('div', { className: 'kpi' }, [el('span', { className: 'eyebrow', text: 'Active'   }), el('span', { className: 'value', text: activeProfile?.name ?? 'None' })]),
      el('div', { className: 'kpi' }, [el('span', { className: 'eyebrow', text: 'Role'     }), el('span', { className: 'value', text: activeProfile?.role ?? '-' })])
    ]),
    el('div', { className: 'profile-grid' }, profiles.map(profile => {
      const isActive = activeProfile?.id === profile.id;
      return el('article', { className: `profile-card${isActive ? ' active' : ''}` }, [
        el('div', { className: 'profile-avatar', text: initials(profile.name) }),
        el('div', {}, [
          el('h3', { text: profile.name }),
          el('div', { className: 'profile-meta' }, [
            el('span', { className: 'meta-chip', text: profile.role }),
            el('span', { className: 'meta-chip', text: isActive ? 'Active' : 'Available' })
          ])
        ]),
        el('button', { className: isActive ? 'btn primary' : 'btn ghost', type: 'button' }, [isActive ? 'Continue' : 'Use profile'])
      ]);
    }))
  ]));

  host.querySelectorAll('.profile-card button').forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      await api.put('/auth/profile', { profileId: profiles[i].id });
      window.location.href = 'home.html';
    });
  });

  // Criar perfil
  const profileNameInput = el('input', { type: 'text', placeholder: 'Profile name' });
  const createMsg        = el('p', { className: 'msg' });

  const createForm = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: 'Add profile' }),
    el('label', { className: 'field-label' }, ['Name', profileNameInput]),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, ['Create profile'])
    ]),
    createMsg
  ]);

  createForm.addEventListener('submit', async event => {
    event.preventDefault();
    const name = profileNameInput.value.trim();
    if (!name) { createMsg.className = 'msg error'; createMsg.textContent = 'Profile name is required.'; return; }
    try {
      await api.post('/profiles', { name, role: 'USER' });
      render();
    } catch (err) {
      createMsg.className = 'msg error';
      createMsg.textContent = err.message || 'Failed to create profile.';
    }
  });

  host.appendChild(el('section', { className: 'card' }, [createForm]));
}

render();
