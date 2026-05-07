import { StorageService } from "./storageService.js";

const SESSION_KEY = "estflix_session_v1";

function emptySession() {
  return { userId: null, activeProfileId: null, rememberMe: false };
}

export class AuthService {
  static getSession() {
    const db = StorageService.load();
    const rememberMe = !!db.session?.rememberMe;

    const raw = rememberMe
      ? localStorage.getItem(SESSION_KEY)
      : sessionStorage.getItem(SESSION_KEY);

    if (!raw) return emptySession();
    try { return JSON.parse(raw); } catch { return emptySession(); }
  }

  static setSession(partial) {
    const db = StorageService.load();
    db.session = { ...db.session, ...partial };
    StorageService.save(db);

    const raw = JSON.stringify(db.session);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (db.session.rememberMe) localStorage.setItem(SESSION_KEY, raw);
    else sessionStorage.setItem(SESSION_KEY, raw);
  }

  static logout() {
    const db = StorageService.load();
    db.session = emptySession();
    StorageService.save(db);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }
}