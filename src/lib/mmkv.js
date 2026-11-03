import { MMKV } from 'react-native-mmkv';

/**
 * One MMKV instance for the app. Pinned to react-native-mmkv 3.x — the 4.x
 * line is Nitro-based and breaks `pod install` on this toolchain.
 */
export const storage = new MMKV({ id: 'storey.enterprises' });

export default storage;
