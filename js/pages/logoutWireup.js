import { api } from '../services/apiService.js';

export function wireLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    await api.post('/auth/logout').catch(() => {});
    window.location.href = 'login.html';
  });

  api.get('/auth/me').then(data => {
    btn.style.display = data?.user ? '' : 'none';
  }).catch(() => { btn.style.display = 'none'; });
}
