const BASE = '/api';

async function request(method, path, body = null) {
  const options = {
    method,
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  };
  if (body !== null) options.body = JSON.stringify(body);

  const res  = await fetch(BASE + path, options);
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status });
  return data;
}

export const api = {
  get:  (path)       => request('GET',    path),
  post: (path, body) => request('POST',   path, body),
  put:  (path, body) => request('PUT',    path, body),
  del:  (path)       => request('DELETE', path)
};
