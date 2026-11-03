import { Dimensions } from 'react-native';

/**
 * These ports are fixed-width phone columns, so the faithful mapping is ONE
 * uniform ratio on both axes — design width divided into device width.
 *
 * react-native-size-matters is deliberately NOT used: its `verticalScale`
 * divides by a 680pt guideline height (~1.29x on a modern handset) while
 * `scale` divides by 350pt (~1.15x), which stretches a phone layout unevenly
 * and inflates every font.
 */
const BASE_WIDTH = 390;

const { width, height } = Dimensions.get('window');
const shortSide = Math.min(width, height);
const RATIO = Math.min(1.2, Math.max(0.85, shortSide / BASE_WIDTH));

const round = n => Math.round(n * 100) / 100;

const hSize = size => round(size * RATIO);
const vSize = size => round(size * RATIO);
const fS = size => round(size * RATIO);

export default { fS, vSize, hSize, RATIO };
