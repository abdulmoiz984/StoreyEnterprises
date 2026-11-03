import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LIGHT as c } from '../globalStyle/tokens';
import { OVERLAY, RADIUS } from '../globalStyle/Theme';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THERE IS NO SVG IN THIS FILE
 *
 * Every decorative layer here sits BEHIND screen content, and a
 * react-native-svg <Svg> will not stay behind a sibling: on react-native-svg
 * 15.16.0 with React Native 0.88 (Fabric) it paints above its siblings whatever
 * you do. Verified on device against all of:
 *
 *   - document order (SVG first, content second)
 *   - explicit zIndex on both layers, either direction
 *   - zIndex: -1 on the SVG (it vanishes instead of going behind)
 *   - making both layers position:absolute
 *   - collapsable={false}, to defeat view flattening
 *   - pointerEvents as a style rather than the deprecated prop
 *   - ImageBackground instead of an absolutely positioned <Image>
 *
 * With an SVG scrim the onboarding screen rendered as a bare photograph — the
 * Skip pill, the title, the dots and the Next button were laid out correctly
 * and completely buried, and did not even receive taps. Swapping that same
 * absolutely positioned wrapper to a plain View with a background colour fixed
 * it instantly, which is what isolated the cause.
 *
 * So these are built from plain Views, which layer normally. SVG is still the
 * right tool elsewhere in this port — Stars, RouteMap, the signature, the
 * Google and Apple marks — because there it IS the content and sits on top
 * anyway.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * NOTE ON SIZING — two separate traps, both hit on the way here:
 *
 *  1. `StyleSheet.absoluteFillObject` does not resolve a HEIGHT for these
 *     layers: `flex: 1` slices inside it collapse to zero, and `onLayout`
 *     reports a height of 0, so the layer renders as nothing at all. These use
 *     `OVERLAY` from globalStyle/Theme, which states width and height as 100%.
 *
 *  2. A percentage size resolves against the parent's CONTENT box while
 *     `top/left: 0` are relative to its PADDING box. So these layers must be
 *     given an UNPADDED parent — on the home hero, where the padding sat on the
 *     same View, the gradient came out 40pt short in each direction and left
 *     the card's right and bottom edges unpainted. Both call sites now wrap:
 *     an outer View holds the radius and the layer, an inner View holds the
 *     padding and the content.
 *
 * Each slice is then positioned absolutely at an explicit pixel offset from the
 * measured size, and overlaps its neighbour by 1pt so rounding cannot open a
 * visible seam.
 */

/** `#RRGGBB` + alpha -> `rgba(...)`, so the stops below can be interpolated. */
function withAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Blend two `#RRGGBB` colours, `t` from 0 to 1. */
function mix(from, to, t) {
  const a = from.replace('#', '');
  const b = to.replace('#', '');
  const channel = i => {
    const x = parseInt(a.slice(i, i + 2), 16);
    const y = parseInt(b.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * t);
  };
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}

/* ───────────────────────────────────────────────────────────────── glows ── */

/** The alphas the web writes as Tailwind `/NN` suffixes on the glow divs. */
const GLOW_ALPHA = { primary: 0.3, brand: 0.25 };
const GLOW_ALPHA_STRONG = { primary: 0.4, brand: 0.35 };

/** How many rings approximate the blur. 10 is past the point of visible steps. */
const RINGS = 10;

/**
 * The web's blurred accent glows: a round div filled with `bg-[#003DF9]/30` and
 * pushed through `blur-3xl`.
 *
 * Drawn as concentric circles whose alpha accumulates towards the middle.
 * Stacking translucent circles compounds their alpha where they overlap, so the
 * centre builds up to roughly the web's opacity and the rim fades out — the
 * same soft blob a Gaussian blur of a filled circle gives.
 */
export function Glow({ tone = 'primary', size = 288, strong = false, style }) {
  const color = tone === 'brand' ? c.brand : c.primary;
  const peak = (strong ? GLOW_ALPHA_STRONG : GLOW_ALPHA)[tone === 'brand' ? 'brand' : 'primary'];
  /** Per-ring alpha, so RINGS overlapping layers reach `peak` at the core. */
  const step = peak / RINGS;

  return (
    <View style={[styles.noTouch, { width: size, height: size }, style]}>
      {Array.from({ length: RINGS }).map((_, index) => {
        const scale = 1 - index / RINGS;
        const ring = size * scale;
        return (
          <View
            key={index}
            style={[
              styles.ring,
              {
                width: ring,
                height: ring,
                marginLeft: -ring / 2,
                marginTop: -ring / 2,
                backgroundColor: withAlpha(color, step),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ───────────────────────────────────────────────────────────────── scrim ── */

/** The web's five `linear-gradient(180deg, …)` stops, as offset/alpha pairs. */
const SCRIM_STOPS = [
  [0, 0.62],
  [0.22, 0.08],
  [0.38, 0.08],
  [0.62, 0.78],
  [1, 0.96],
];

/**
 * Slices across the full height. The steepest run is 0.62 -> 0.08 over the
 * first 22%, so at 48 slices that leg stepped by ~0.054 per slice and banded
 * visibly across the sky in the first onboarding photo. 120 puts every step
 * under 0.02, which is below the threshold where an edge is visible.
 */
const SCRIM_SLICES = 120;

/** Piecewise-linear alpha at `t` along the gradient. */
function alphaAt(stops, t) {
  for (let i = 1; i < stops.length; i++) {
    const [prevOffset, prevAlpha] = stops[i - 1];
    const [offset, alpha] = stops[i];
    if (t <= offset) {
      const span = offset - prevOffset;
      const local = span === 0 ? 0 : (t - prevOffset) / span;
      return prevAlpha + (alpha - prevAlpha) * local;
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * The onboarding photo scrim, ported stop for stop from the web's
 * `linear-gradient(180deg, …)`. The two 8% stops in the middle are what keep
 * the centre of the photograph visible while both ends stay dark enough for
 * white text — averaging them into a simple top-to-bottom fade would wash the
 * image out, so they are kept.
 */
export function PhotoScrim({ style }) {
  const [height, setHeight] = useState(0);
  const slice = height / SCRIM_SLICES;

  return (
    <View
      style={[styles.noTouch, OVERLAY, style]}
      onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      {height > 0
        ? Array.from({ length: SCRIM_SLICES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.band,
                {
                  // Exact integer tiling: each band starts where the previous
                  // one ends. Overlapping them by a point instead (to hide
                  // rounding gaps) double-darkens the seam, because these
                  // bands are TRANSLUCENT — that drew a visible dark line
                  // every slice, right across the photograph.
                  top: Math.round(index * slice),
                  height: Math.round((index + 1) * slice) - Math.round(index * slice),
                  backgroundColor: withAlpha(c.night, alphaAt(SCRIM_STOPS, (index + 0.5) / SCRIM_SLICES)),
                },
              ]}
            />
          ))
        : null}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────── gradient ── */

const GRADIENT_SLICES = 32;

/**
 * A straight linear gradient fill, for the home hero's
 * `bg-[linear-gradient(135deg,#003DF9,#CF0300)]` and the payment card's
 * `…,#003DF9,#070B14)`.
 *
 * A stack of slices runs top to bottom, which is CSS `180deg`. Rotating that
 * stack by -45° turns the direction into `135deg` — down and to the right —
 * which is what the web asks for. The stack is sized `width + height` so that,
 * once rotated, it still covers the corners of the box, and this wrapper's
 * `overflow: 'hidden'` crops it back to the card's rounded rectangle.
 */
export function Gradient({ colors, style }) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  const side = box.width + box.height;
  const slice = side / GRADIENT_SLICES;
  const from = colors[0];
  const to = colors[colors.length - 1];

  return (
    <View
      style={[styles.noTouch, OVERLAY, styles.clip, style]}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setBox(current =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}>
      {side > 0 ? (
        <View
          style={[
            styles.diagonal,
            { width: side, height: side, left: (box.width - side) / 2, top: (box.height - side) / 2 },
          ]}>
          {Array.from({ length: GRADIENT_SLICES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.band,
                {
                  /** Exact integer tiling, as in the scrim above. */
                  top: Math.round(index * slice),
                  height: Math.round((index + 1) * slice) - Math.round(index * slice),
                  backgroundColor: mix(from, to, index / (GRADIENT_SLICES - 1)),
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** `pointerEvents` as a style, not the prop form RN 0.88 deprecates. */
  noTouch: { pointerEvents: 'none' },
  clip: { overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0 },
  ring: { position: 'absolute', left: '50%', top: '50%', borderRadius: RADIUS.full },
  diagonal: { position: 'absolute', transform: [{ rotate: '-45deg' }] },
});

export default Glow;
