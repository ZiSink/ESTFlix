import { api } from '../services/apiService.js';
import { wireLogout } from './logoutWireup.js';
import { el, clear } from '../ui/dom.js';

wireLogout();

const host = document.getElementById('adminHost');
let contentDraftId  = null;
let categoryDraftId = null;

async function render() {
  clear(host);

  const session = await api.get('/auth/me').catch(() => ({ user: null, activeProfileId: null, profile: null }));

  if (!session.user) {
    host.appendChild(el('section', { className: 'card notice' }, [
      el('p', { className: 'eyebrow', text: 'Admin' }),
      el('h1', { text: 'Sign in with an admin profile.' }),
      el('p', { className: 'hero-text', text: 'This section manages the catalog and requires an active admin profile.' }),
      el('div', { className: 'hero-actions' }, [
        el('a', { className: 'btn primary', href: 'login.html'    }, ['Sign in']),
        el('a', { className: 'btn ghost',   href: 'profiles.html' }, ['Choose profile'])
      ])
    ]));
    return;
  }

  if (session.profile?.role !== 'ADMIN') {
    host.appendChild(el('section', { className: 'card notice' }, [
      el('p', { className: 'eyebrow', text: 'Access denied' }),
      el('h1', { text: 'This profile cannot open admin.' }),
      el('p', { className: 'hero-text', text: 'Switch to the admin profile to manage categories and content.' }),
      el('div', { className: 'hero-actions' }, [
        el('a', { className: 'btn primary', href: 'profiles.html' }, ['Switch profile']),
        el('a', { className: 'btn ghost',   href: 'home.html'     }, ['Back to browse'])
      ])
    ]));
    return;
  }

  const [categories, contents] = await Promise.all([
    api.get('/categories'),
    api.get('/contents')
  ]);

  const [catForm, catMsg]  = buildCategoryForm(categories);
  const [contForm, contMsg] = buildContentForm(categories, contents);

  const shell = el('section', { className: 'card admin-shell' }, [
    el('div', { className: 'hero' }, [
      el('div', {}, [
        el('p', { className: 'eyebrow', text: 'Management' }),
        el('h1', { text: 'Admin console.' }),
        el('p', { className: 'hero-text', text: 'Manage the catalog directly. All changes are persisted to the MySQL database.' })
      ]),
      el('aside', { className: 'hero-panel' }, [
        el('p', { className: 'panel-label', text: 'Signed in as' }),
        el('h2', { text: session.profile.name }),
        el('p', { className: 'muted', text: session.user.email })
      ])
    ]),
    el('div', { className: 'admin-summary' }, [
      el('div', { className: 'kpi' }, [el('span', { className: 'eyebrow', text: 'Titles'      }), el('span', { className: 'value', text: String(contents.length) })]),
      el('div', { className: 'kpi' }, [el('span', { className: 'eyebrow', text: 'Categories'  }), el('span', { className: 'value', text: String(categories.length) })])
    ]),
    el('div', { className: 'split-panel' }, [
      el('section', { className: 'card' }, [el('h2', { text: 'Categories' }), catForm,  catMsg,  renderCategoryTable(categories)]),
      el('section', { className: 'card' }, [el('h2', { text: 'Content'    }), contForm, contMsg, renderContentTable(categories, contents)])
    ])
  ]);

  host.appendChild(shell);

  host.querySelectorAll('[data-category-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cid = Number(btn.getAttribute('data-category-delete'));
      try {
        await api.del(`/categories/${cid}`);
        categoryDraftId = null;
        render();
      } catch (err) {
        catMsg.className = 'msg error';
        catMsg.textContent = err.message;
      }
    });
  });

  host.querySelectorAll('[data-category-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      categoryDraftId = Number(btn.getAttribute('data-category-edit'));
      render();
    });
  });

  host.querySelectorAll('[data-content-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cid = Number(btn.getAttribute('data-content-delete'));
      await api.del(`/contents/${cid}`).catch(() => {});
      if (contentDraftId === cid) contentDraftId = null;
      render();
    });
  });

  host.querySelectorAll('[data-content-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      contentDraftId = Number(btn.getAttribute('data-content-edit'));
      render();
    });
  });
}

function buildCategoryForm(categories) {
  const editing = categories.find(c => c.id === categoryDraftId) ?? null;
  const nameInput = el('input', { type: 'text', placeholder: 'New category' });
  const formMsg   = el('p', { className: 'msg' });
  if (editing) nameInput.value = editing.name;

  const cancelBtn = editing ? el('button', { className: 'btn ghost', type: 'button' }, ['Cancel edit']) : null;
  cancelBtn?.addEventListener('click', () => { categoryDraftId = null; render(); });

  const form = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: editing ? 'Edit category' : 'Add category' }),
    el('label', { className: 'field-label' }, ['Name', nameInput]),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, [editing ? 'Save changes' : 'Create category']),
      cancelBtn
    ])
  ]);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) { formMsg.className = 'msg error'; formMsg.textContent = 'Category name is required.'; return; }
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, { name });
      } else {
        await api.post('/categories', { name });
      }
      categoryDraftId = null;
      render();
    } catch (err) {
      formMsg.className = 'msg error';
      formMsg.textContent = err.message;
    }
  });

  return [form, formMsg];
}

function buildContentForm(categories, contents) {
  const editing = contents.find(c => c.id === contentDraftId) ?? null;

  const titleInput    = el('input', { type: 'text',   placeholder: 'Title' });
  const descInput     = el('input', { type: 'text',   placeholder: 'Short description' });
  const catSelect     = el('select');
  const yearInput     = el('input', { type: 'number', placeholder: '2024' });
  const ratingInput   = el('input', { type: 'number', placeholder: '4.5' });
  ratingInput.step = '0.1'; ratingInput.min = '0'; ratingInput.max = '5';
  const imageInput    = el('input', { type: 'url',    placeholder: 'https://image.tmdb.org/...' });
  const trailerInput  = el('input', { type: 'url',    placeholder: 'https://www.youtube.com/embed/...' });
  const castInput     = el('input', { type: 'text',   placeholder: 'Actor A, Actor B' });
  const typeSelect    = el('select');

  categories.forEach(c => catSelect.appendChild(el('option', { value: String(c.id), text: c.name })));
  ['movie', 'series'].forEach(t => typeSelect.appendChild(el('option', { value: t, text: t })));

  if (editing) {
    titleInput.value   = editing.title;
    descInput.value    = editing.description;
    catSelect.value    = String(editing.categoryId);
    yearInput.value    = String(editing.year);
    ratingInput.value  = String(editing.rating);
    imageInput.value   = editing.imageUrl;
    trailerInput.value = editing.trailerUrl ?? '';
    castInput.value    = (editing.cast ?? []).join(', ');
    typeSelect.value   = editing.type;
  } else if (categories[0]) {
    catSelect.value  = String(categories[0].id);
    typeSelect.value = 'movie';
  }

  const formMsg   = el('p', { className: 'msg' });
  const cancelBtn = editing ? el('button', { className: 'btn ghost', type: 'button' }, ['Cancel edit']) : null;
  cancelBtn?.addEventListener('click', () => { contentDraftId = null; render(); });

  const form = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: editing ? 'Edit title' : 'Create title' }),
    el('div', { className: 'grid-2' }, [
      el('label', { className: 'field-label' }, ['Title',                    titleInput]),
      el('label', { className: 'field-label' }, ['Description',              descInput]),
      el('label', { className: 'field-label' }, ['Category',                 catSelect]),
      el('label', { className: 'field-label' }, ['Type',                     typeSelect]),
      el('label', { className: 'field-label' }, ['Year',                     yearInput]),
      el('label', { className: 'field-label' }, ['Rating (0–5)',             ratingInput]),
      el('label', { className: 'field-label' }, ['Image URL',                imageInput]),
      el('label', { className: 'field-label' }, ['Trailer URL (YouTube embed)', trailerInput])
    ]),
    el('label', { className: 'field-label' }, [
      'Cast (comma-separated)', castInput,
      el('span', { className: 'field-hint', text: 'e.g. Christian Bale, Heath Ledger' })
    ]),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, [editing ? 'Save changes' : 'Create title']),
      cancelBtn
    ])
  ]);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const title      = titleInput.value.trim();
    const description = descInput.value.trim();
    const imageUrl   = imageInput.value.trim();
    if (!title || !description || !imageUrl) {
      formMsg.className = 'msg error';
      formMsg.textContent = 'Fill in the required title fields.';
      return;
    }
    const payload = {
      title, description,
      categoryId:     Number(catSelect.value),
      year:           Number(yearInput.value),
      rating:         Number(ratingInput.value),
      imageUrl,
      trailerUrl:     trailerInput.value.trim() || null,
      cast:           castInput.value.split(',').map(s => s.trim()).filter(Boolean),
      type:           typeSelect.value
    };
    try {
      if (editing) {
        await api.put(`/contents/${editing.id}`, payload);
      } else {
        await api.post('/contents', payload);
      }
      contentDraftId = null;
      render();
    } catch (err) {
      formMsg.className = 'msg error';
      formMsg.textContent = err.message;
    }
  });

  return [form, formMsg];
}

function renderCategoryTable(categories) {
  return el('div', { className: 'table-wrap' }, [
    el('table', { className: 'table compact' }, [
      el('thead', {}, [el('tr', {}, [el('th', { text: 'Id' }), el('th', { text: 'Name' }), el('th', { text: 'Actions' })])]),
      el('tbody', {}, categories.map(c => el('tr', {}, [
        el('td', { text: String(c.id) }),
        el('td', { text: c.name }),
        el('td', {}, [el('div', { className: 'hero-actions' }, [
          el('button', { className: 'btn ghost compact',  type: 'button', 'data-category-edit':   String(c.id) }, ['Edit']),
          el('button', { className: 'btn danger compact', type: 'button', 'data-category-delete': String(c.id) }, ['Delete'])
        ])])
      ])))
    ])
  ]);
}

function renderContentTable(categories, contents) {
  const catMap = new Map(categories.map(c => [c.id, c]));
  return el('div', { className: 'table-wrap' }, [
    el('table', { className: 'table compact' }, [
      el('thead', {}, [el('tr', {}, [
        el('th', { text: 'Id' }), el('th', { text: 'Title' }), el('th', { text: 'Genre' }),
        el('th', { text: 'Year' }), el('th', { text: 'Rating' }), el('th', { text: 'Type' }), el('th', { text: 'Actions' })
      ])]),
      el('tbody', {}, contents.map(c => el('tr', {}, [
        el('td', { text: String(c.id) }),
        el('td', { text: c.title }),
        el('td', { text: catMap.get(c.categoryId)?.name ?? '—' }),
        el('td', { text: String(c.year) }),
        el('td', { text: c.rating.toFixed(1) }),
        el('td', { text: c.type }),
        el('td', {}, [el('div', { className: 'hero-actions' }, [
          el('button', { className: 'btn ghost compact',  type: 'button', 'data-content-edit':   String(c.id) }, ['Edit']),
          el('button', { className: 'btn danger compact', type: 'button', 'data-content-delete': String(c.id) }, ['Delete'])
        ])])
      ])))
    ])
  ]);
}

render();
