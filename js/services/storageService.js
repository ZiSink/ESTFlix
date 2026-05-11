const KEY = "estflix_db_v2";

function defaultDb() {
  return {
    counters: { user: 1, profile: 1, category: 1, content: 1 },
    users: [],
    profiles: [],
    categories: [],
    contents: [],
    favorites: [], // { profileId, contentId }
    history: [],   // { profileId, contentId, watchedAt, times }
    session: { userId: null, activeProfileId: null, rememberMe: false }
  };
}

export class StorageService {
  static load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDb();
    try { return JSON.parse(raw); }
    catch { return defaultDb(); }
  }

  static save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  static reset() {
    localStorage.removeItem(KEY);
  }
}