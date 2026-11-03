import { useMemo } from 'react';
import { LIGHT } from '../globalStyle/tokens';
import { FONTS, RADIUS, SPACING, elevation } from '../globalStyle/Theme';

/**
 * The web has a single palette — no `[data-theme]` block, no
 * `prefers-color-scheme` rule, no appearance setting in the store. So this
 * returns LIGHT unconditionally and deliberately does NOT read
 * `useColorScheme()`: following the device would make the app diverge from the
 * site it is a port of.
 *
 * It is a hook rather than a plain import so that adding a second palette later
 * is a change in this one file, not in all 31 screens.
 */
export function useTheme() {
  return useMemo(() => ({ c: LIGHT, RADIUS, FONTS, SPACING, elevation }), []);
}

export default useTheme;
