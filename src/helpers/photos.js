import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

/**
 * Replaces the web's `<input type="file">` + `FileReader.readAsDataURL`, which
 * four screens use (profile photo in Setup and Edit Profile, package photos in
 * Booking).
 *
 * The web ends up with a `data:` URL string; `react-native-image-picker` gives a
 * local file `uri`. Both are strings that `<Image source={{ uri }}>` can render
 * and that the store can persist, so the shape the screens see is unchanged —
 * which is why nothing downstream of here needed a change.
 *
 * `capture="environment"` maps to `fromCamera`, and `multiple` to `selectionLimit`.
 */

const COMMON = {
  mediaType: 'photo',
  // The web stored a full-resolution data URL. Capping at 1600px keeps a long
  // booking (up to 6 photos) from holding several megabytes of bitmap in the
  // store at once, which on a mid-range Android would be a real memory problem.
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85,
};

function urisFrom(result) {
  if (!result || result.didCancel || result.errorCode) return [];
  return (result.assets ?? []).map(asset => asset.uri).filter(Boolean);
}

/** One photo, from the camera or the library. Returns a uri, or '' if cancelled. */
export async function pickPhoto({ fromCamera = false } = {}) {
  const result = fromCamera
    ? await launchCamera({ ...COMMON, saveToPhotos: false })
    : await launchImageLibrary({ ...COMMON, selectionLimit: 1 });
  return urisFrom(result)[0] ?? '';
}

/** Up to `limit` photos from the library. Returns an array of uris. */
export async function pickPhotos(limit = 6) {
  const result = await launchImageLibrary({ ...COMMON, selectionLimit: limit });
  return urisFrom(result);
}

export default { pickPhoto, pickPhotos };
