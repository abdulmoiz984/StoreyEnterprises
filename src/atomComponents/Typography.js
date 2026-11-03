import { StyleSheet, Text as RNText } from 'react-native';
import { FONTS } from '../globalStyle/Theme';
import { LIGHT } from '../globalStyle/tokens';
import Sizer from '../helpers/Sizer';

const { fS } = Sizer;

/**
 * The web sets type with Tailwind arbitrary values — `text-[18px] font-semibold`
 * — against an Inter family loaded at 400/500/600/700.
 *
 * React Native does NOT synthesise a weight from a family that lacks it, and on
 * Android `fontWeight` on a custom family is ignored outright: the renderer
 * picks the face by FAMILY NAME only. So every weight here names its own static
 * face instead of setting `fontWeight`, which is what makes 500 and 600 come out
 * distinct on both platforms rather than collapsing to regular and bold.
 */
export const TEXT = StyleSheet.create({
  /** 28px/600 — LargeTitle. */
  largeTitle: { fontFamily: FONTS.semiBold, fontSize: fS(28), letterSpacing: -0.5, color: LIGHT.ink },
  /** 18px/600 — StackHeader, section headings, sheet titles. */
  title: { fontFamily: FONTS.semiBold, fontSize: fS(18), color: LIGHT.ink },
  /** 16px/600 — button labels, totals. */
  button: { fontFamily: FONTS.semiBold, fontSize: fS(16), color: LIGHT.ink },
  /** 16px/400 — text inputs. The web uses 16px here to stop iOS zooming. */
  input: { fontFamily: FONTS.regular, fontSize: fS(16), color: LIGHT.ink },
  /** 14px/500 — field labels, list rows, price lines. */
  label: { fontFamily: FONTS.medium, fontSize: fS(14), color: LIGHT.ink },
  /** 14px/400 — body copy. */
  body: { fontFamily: FONTS.regular, fontSize: fS(14), color: LIGHT.ink },
  /** 12px/400 — captions, hints, timestamps. */
  caption: { fontFamily: FONTS.regular, fontSize: fS(12), color: LIGHT.mutedForeground },
  /** 12px/600 — chips, tab labels, inline actions. */
  chip: { fontFamily: FONTS.semiBold, fontSize: fS(12), color: LIGHT.ink },
});

/** Line heights the web gets from `leading-snug` / `leading-relaxed`. */
export const LEADING = {
  snug: size => Math.round(size * 1.35),
  relaxed: size => Math.round(size * 1.6),
};

/**
 * `Text` with `allowFontScaling` left ON — the web respects the browser's font
 * size, so honouring the OS setting is the faithful behaviour — but capped, so
 * a 200% accessibility setting cannot push a 52pt button off its own row.
 */
export function Text({ style, children, ...rest }) {
  return (
    <RNText maxFontSizeMultiplier={1.35} {...rest} style={style}>
      {children}
    </RNText>
  );
}

export default Text;
