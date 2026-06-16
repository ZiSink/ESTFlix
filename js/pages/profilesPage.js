import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const host = document.getElementById('profilesHost');
let editDraftId = null;

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

  const profiles      = await api.get('/profiles').catch(() => []);
  const activeId      = session.activeProfileId;
  const activeProfile = profiles.find(p => p.id === activeId) ?? profiles[0] ?? null;
  const editing       = profiles.find(p => p.id === editDraftId) ?? null;

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
        el('button', { className: isActive ? 'btn primary' : 'btn ghost', type: 'button', 'data-select': String(profile.id) }, [isActive ? 'Continue' : 'Use profile']),
        el('div', { className: 'hero-actions' }, [
          el('button', { className: 'btn ghost compact', type: 'button', 'data-edit': String(profile.id) }, ['Edit']),
          el('button', { className: 'btn danger compact', type: 'button', 'data-delete': String(profile.id) }, ['Delete'])
        ])
      ]);
    }))
  ]));

  host.querySelectorAll('[data-select]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api.put('/auth/profile', { profileId: Number(btn.getAttribute('data-select')) });
      window.location.href = 'home.html';
    });
  });

  host.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      editDraftId = Number(btn.getAttribute('data-edit'));
      render();
    });
  });

  const deleteMsg = el('p', { className: 'msg' });
  host.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-delete'));
      if (profiles.length <= 1) {
        host.appendChild(deleteMsg);
        deleteMsg.className = 'msg error';
        deleteMsg.textContent = 'Cannot delete the only profile.';
        return;
      }
      try {
        await api.del(`/profiles/${id}`);
        if (editDraftId === id) editDraftId = null;
        if (id === activeId) {
          const remaining = profiles.find(p => p.id !== id);
          if (remaining) await api.put('/auth/profile', { profileId: remaining.id });
        }
        render();
      } catch (err) {
        host.appendChild(deleteMsg);
        deleteMsg.className = 'msg error';
        deleteMsg.textContent = err.message || 'Failed to delete profile.';
      }
    });
  });

  const formSection = el('section', { className: 'card' });
  const formMsg     = el('p', { className: 'msg' });
  const nameInput   = el('input', { type: 'text', placeholder: 'Profile name' });
  if (editing) nameInput.value = editing.name;

  const cancelBtn = editing
    ? el('button', { className: 'btn ghost', type: 'button' }, ['Cancel'])
    : null;
  cancelBtn?.addEventListener('click', () => { editDraftId = null; render(); });

  const form = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: editing ? `Editing: ${editing.name}` : 'Add profile' }),
    el('label', { className: 'field-label' }, ['Name', nameInput]),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, [editing ? 'Save changes' : 'Create profile']),
      cancelBtn
    ]),
    formMsg
  ]);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { formMsg.className = 'msg error'; formMsg.textContent = 'Profile name is required.'; return; }
    try {
      if (editing) {
        await api.put(`/profiles/${editing.id}`, { name });
      } else {
        await api.post('/profiles', { name, role: 'USER' });
      }
      editDraftId = null;
      render();
    } catch (err) {
      formMsg.className = 'msg error';
      formMsg.textContent = err.message || 'Failed to save profile.';
    }
  });

  formSection.appendChild(form);
  host.appendChild(formSection);
}

render();
