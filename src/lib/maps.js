import axios from 'axios';
import { MAPS_API_KEY, MAPS_BASE_URL, MAPS_CONFIGURED } from '../constants/mapsConfig';
import { business } from '../constants/business';

/**
 * Ported from the web's `lib/maps.ts`.
 *
 * The web wrapped each call in a TanStack `createServerFn`, so the key stayed
 * on the server. React Native has no server, so these call the same REST
 * endpoints directly — same paths, same parameters, same return shapes, so the
 * booking screen reads identically.
 *
 * Every function returns the web's "not configured" shape when no key is set,
 * which is a real supported path: the booking flow drops autocomplete and
 * `lib/pricing` falls back to its own great-circle distance.
 *
 * See `constants/mapsConfig` for where the key goes and how to restrict it.
 */

const client = axios.create({ baseURL: MAPS_BASE_URL, timeout: 8000 });

async function mapsGet(path, params) {
  if (!MAPS_CONFIGURED) return null;
  try {
    const { data, status } = await client.get(path, { params: { key: MAPS_API_KEY, ...params } });
    if (status !== 200) return null;
    return data;
  } catch {
    // A timeout or a network failure is not worth surfacing here; the caller
    // treats null exactly as the web treated a non-OK response.
    return null;
  }
}

/** Ported verbatim. */
function readResolved(value) {
  if (!value || typeof value !== 'object') return null;
  const lat = value.geometry?.location?.lat;
  const lng = value.geometry?.location?.lng;
  if (lat == null || lng == null || !value.formatted_address) return null;
  return { label: value.formatted_address, name: value.name || '', lat, lng };
}

export async function suggestAddresses({ query }) {
  const text = String(query ?? '').trim();
  if (text.length < 3) return { configured: MAPS_CONFIGURED, suggestions: [] };

  const json = await mapsGet('/maps/api/place/autocomplete/json', {
    input: text,
    components: 'country:us',
    location: `${business.origin.lat},${business.origin.lng}`,
    radius: '321869',
  });
  if (!json) return { configured: false, suggestions: [] };

  const predictions = Array.isArray(json.predictions) ? json.predictions : [];
  const suggestions = predictions.slice(0, 5).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    if (!item.place_id || !item.description) return [];
    return [
      {
        id: item.place_id,
        label: item.description,
        main: item.structured_formatting?.main_text || item.description,
      },
    ];
  });
  return { configured: true, suggestions };
}

export async function placeDetails({ placeId }) {
  const json = await mapsGet('/maps/api/place/details/json', {
    place_id: placeId,
    fields: 'geometry,formatted_address,name',
  });
  return readResolved(json?.result);
}

export async function geocodeAddress({ address }) {
  const text = String(address ?? '').trim();
  if (text.length < 8) return null;
  const json = await mapsGet('/maps/api/geocode/json', { address: text, region: 'us' });
  const results = Array.isArray(json?.results) ? json.results : [];
  return readResolved(results[0]);
}

export async function drivingDistance({ originLat, originLng, destLat, destLng }) {
  const json = await mapsGet('/maps/api/distancematrix/json', {
    origins: `${originLat},${originLng}`,
    destinations: `${destLat},${destLng}`,
    units: 'imperial',
    mode: 'driving',
  });
  const rows = Array.isArray(json?.rows) ? json.rows : [];
  const element = rows[0]?.elements?.[0];
  const meters = element?.status === 'OK' ? element.distance?.value : undefined;
  if (meters == null) return { miles: null };
  return { miles: Math.max(1, Math.round(meters / 1609.344)) };
}
