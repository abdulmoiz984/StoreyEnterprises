import { storage } from './mmkv';

/**
 * Ported from the web's `lib/storage.ts`.
 *
 * The web had two tiers and the store relies on the difference:
 *
 *   localStorage   — survives a reload          -> MMKV (survives a relaunch)
 *   sessionStorage — cleared when the tab closes -> an in-memory Map
 *
 * Backing the session tier with MMKV too would be wrong: values the web
 * deliberately drops on close (a part-filled booking draft, a transient intent)
 * would come back on the next launch.
 */

export function readStorage(key) {
  try {
    return storage.getString(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    storage.set(key, value);
  } catch {
    /* ignore quota */
  }
}

export function clearStorage(key) {
  try {
    storage.delete(key);
  } catch {
    /* ignore */
  }
}

/** Lives only as long as the JS context — the app launch IS the new session. */
const session = new Map();

export function readSession(key) {
  return session.has(key) ? session.get(key) : null;
}

export function writeSession(key, value) {
  session.set(key, value);
}

export function clearSession(key) {
  session.delete(key);
}
