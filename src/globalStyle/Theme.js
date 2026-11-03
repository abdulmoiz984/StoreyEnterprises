import { Platform } from 'react-native';
import Sizer from '../helpers/Sizer';
import { LIGHT } from './tokens';

/**
 * Radius scale, taken straight from the web's `@theme inline` block. Unlike the
 * previous port there is NO global override flattening these, so the values
 * below are what the markup actually renders.
 */
export const RADIUS = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xl2: 24,
  /** Pills, avatars, progress tracks. */
  full: 999,
};

/** PostScript names of the Inter statics (400/500/600/700, as the web asks). */
export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SPACING = { screenPx: 16, gap: 12 };

export const elevation = (level = 1) =>
  Platform.select({
    ios: {
      shadowColor: LIGHT.ink,
      shadowOpacity: 0.06 + level * 0.03,
      shadowRadius: 2 + level * 3,
      shadowOffset: { width: 0, height: level },
    },
    android: { elevation: level * 2 },
  });

/**
 * `StyleSheet.absoluteFillObject` does not resolve a height against a parent
 * with a fixed height — the child grows to its content and ignores `bottom: 0`.
 * Use this for every overlay instead.
 */
export const OVERLAY = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };

/** Durations from the @keyframes blocks in styles.css. */
export const MOTION = {
  logoMs: 800,
  pulseMs: 1100,
  barMs: 1200,
  sheetMs: 280,
  popMs: 220,
  dotMs: 1000,
};

export const TABBAR_HEIGHT = 72;

export default { RADIUS, FONTS, SPACING, elevation, OVERLAY, MOTION, TABBAR_HEIGHT, Sizer };
