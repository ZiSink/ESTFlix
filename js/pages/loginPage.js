import { api } from '../services/apiService.js';
import { el, clear } from '../ui/dom.js';

const host = document.getElementById('loginHost');
let showRegister = false;

function renderLogin() {
  const message       = el('p', { className: 'msg' });
  const emailInput    = el('input', { type: 'email',    placeholder: 'Email' });
  const passwordInput = el('input', { type: 'password', placeholder: 'Password' });
  const rememberInput = el('input', { type: 'checkbox' });
  rememberInput.checked = true;

  const form = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: 'EstFlix' }),
    el('h1', { text: 'Sign in.' }),
    el('p', { className: 'muted', text: 'Access your profiles, favorites, and the full catalog.' }),
    el('label', { className: 'field-label' }, ['Email', emailInput]),
    el('label', { className: 'field-label' }, ['Password', passwordInput]),
    el('label', { className: 'check-row' }, [rememberInput, ' Remember me']),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, ['Sign in']),
      el('a',      { className: 'btn ghost',   href: 'home.html' }, ['Browse without signing in'])
    ]),
    message
  ]);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    try {
      await api.post('/auth/login', { email, password });
      window.location.href = 'profiles.html';
    } catch (err) {
      message.className = 'msg error';
      message.textContent = err.message || 'Invalid email or password.';
    }
  });

  const adminBtn  = el('button', { className: 'btn ghost compact', type: 'button' }, ['Admin demo']);
  const viewerBtn = el('button', { className: 'btn ghost compact', type: 'button' }, ['Viewer demo']);
  adminBtn.addEventListener('click',  () => { emailInput.value = 'admin@estflix.test';  passwordInput.value = 'admin';  form.requestSubmit(); });
  viewerBtn.addEventListener('click', () => { emailInput.value = 'viewer@estflix.test'; passwordInput.value = 'viewer'; form.requestSubmit(); });

  const registerBtn = el('button', { className: 'btn ghost compact', type: 'button' }, ['Create account']);
  registerBtn.addEventListener('click', () => { showRegister = true; render(); });

  host.appendChild(form);
  host.appendChild(el('div', { className: 'notice' }, [
    el('p', { className: 'muted', text: 'Demo accounts — click to sign in instantly:' }),
    el('div', { className: 'hero-actions' }, [adminBtn, viewerBtn]),
    el('p', { className: 'muted', text: 'admin@estflix.test / admin  ·  viewer@estflix.test / viewer' })
  ]));
  host.appendChild(el('div', { className: 'notice' }, [
    el('p', { className: 'muted', text: 'New to EstFlix?' }),
    el('div', { className: 'hero-actions' }, [registerBtn])
  ]));
}

function renderRegister() {
  const message       = el('p', { className: 'msg' });
  const nameInput     = el('input', { type: 'text',     placeholder: 'Your name' });
  const emailInput    = el('input', { type: 'email',    placeholder: 'Email' });
  const passwordInput = el('input', { type: 'password', placeholder: 'Password (min. 4 characters)' });
  const confirmInput  = el('input', { type: 'password', placeholder: 'Confirm password' });

  const backBtn = el('button', { className: 'btn ghost', type: 'button' }, ['Back to sign in']);
  backBtn.addEventListener('click', () => { showRegister = false; render(); });

  const form = el('form', { className: 'stack' }, [
    el('p', { className: 'eyebrow', text: 'EstFlix' }),
    el('h1', { text: 'Create account.' }),
    el('p', { className: 'muted', text: 'Join EstFlix and start exploring.' }),
    el('label', { className: 'field-label' }, ['Name', nameInput]),
    el('label', { className: 'field-label' }, ['Email', emailInput]),
    el('label', { className: 'field-label' }, ['Password', passwordInput]),
    el('label', { className: 'field-label' }, ['Confirm password', confirmInput]),
    el('div', { className: 'hero-actions' }, [
      el('button', { className: 'btn primary', type: 'submit' }, ['Create account']),
      backBtn
    ]),
    message
  ]);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name     = nameInput.value.trim();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirm  = confirmInput.value;

    if (!name)             { message.className = 'msg error'; message.textContent = 'Please enter your name.';                return; }
    if (password.length < 4) { message.className = 'msg error'; message.textContent = 'Password must be at least 4 characters.'; return; }
    if (password !== confirm)  { message.className = 'msg error'; message.textContent = 'Passwords do not match.';                return; }

    try {
      await api.post('/auth/register', { name, email, password });
      window.location.href = 'home.html';
    } catch (err) {
      message.className = 'msg error';
      message.textContent = err.message || 'Registration failed.';
    }
  });

  host.appendChild(form);
}

function render() {
  clear(host);
  if (showRegister) renderRegister();
  else renderLogin();
}

render();
