/**
 * Google Maps configuration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PUT YOUR KEY IN `src/constants/mapsKey.js`, NOT HERE, and do not commit it.
 * That file is gitignored. Create it as:
 *
 *     export default 'AIza…';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * The web kept this key SERVER-side (`.env.example` says "Server only. Do not
 * prefix with VITE_"). A React Native app has no server, so calling these APIs
 * from the device means the key ships inside the binary and can be extracted
 * from it. Before release, in Google Cloud:
 *
 *   1. Restrict the key to this app's iOS bundle ID and Android package name
 *      (Credentials → Application restrictions).
 *   2. Restrict it to only the APIs below (API restrictions).
 *   3. Set a billing budget and quota caps, so an extracted key cannot run up
 *      an unbounded bill.
 *
 * The alternative, which avoids shipping a key at all, is to proxy these three
 * calls through your own backend and point BASE_URL at it instead.
 */

let key = '';
try {
  key = require('./mapsKey').default ?? '';
} catch {
  // No key file yet. Every Maps call then returns the same "not configured"
  // shape the web returns when GOOGLE_MAPS_API_KEY is unset, so the booking
  // flow still works: address autocomplete is simply unavailable and distance
  // falls back to the local great-circle calculation in lib/pricing.
}

export const MAPS_API_KEY = key;
export const MAPS_CONFIGURED = Boolean(key);

/** Swap for your own proxy to keep the key off the device. */
export const MAPS_BASE_URL = 'https://maps.googleapis.com';

/** APIs this app calls — enable exactly these, and no more. */
export const MAPS_REQUIRED_APIS = ['Places API', 'Geocoding API', 'Distance Matrix API'];
