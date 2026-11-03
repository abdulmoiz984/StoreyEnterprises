import { Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Lucide from '@react-native-vector-icons/lucide';
import { IMAGES } from '../assets/images';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import Sizer from '../helpers/Sizer';

const { hSize, fS } = Sizer;

/** Ported from `Logo` — a round-cropped logo, 64pt by default (`h-16 w-16`). */
export function Logo({ size = 64, style }) {
  const px = hSize(size);
  return (
    <Image
      source={IMAGES.logo}
      accessibilityLabel="Storey Enterprises"
      resizeMode="cover"
      style={[{ width: px, height: px, borderRadius: RADIUS.full }, style]}
    />
  );
}

/** The web's `SERVICE_ICONS` map, with Lucide's kebab-case glyph names. */
const SERVICE_ICONS = {
  '01': 'calendar',
  '02': 'flask-conical',
  '03': 'pill',
  '04': 'file-text',
  '05': 'alarm-clock',
  '06': 'truck',
};

/** Ported from `ServiceIcon` — falls back to the package glyph, as the web does. */
export function ServiceIcon({ id, size = 20, color = c.ink, style }) {
  return <Lucide name={SERVICE_ICONS[id] ?? 'package'} size={fS(size)} color={color} style={style} />;
}

/**
 * Ported from `GoogleMark`. Google's brand guidelines fix these four colours, so
 * they are not themed — they are the same in the web and here.
 */
export function GoogleMark({ size = 20 }) {
  const px = fS(size);
  return (
    <Svg width={px} height={px} viewBox="0 0 24 24">
      <Path
        fill={c.googleBlue}
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.7 18.7 23 15.8 23 12.3Z"
      />
      <Path
        fill={c.googleGreen}
        d="M12 24c3.2 0 5.9-1 7.9-2.8l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3c2 4 6 6.6 10.7 6.6Z"
      />
      <Path
        fill={c.googleYellow}
        d="M5.1 14.4A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.6.4-2.4V6.6H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.4l3.8-3Z"
      />
      <Path
        fill={c.googleRed}
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.6 1.3 6.6l3.8 3C6.1 7 8.8 4.8 12 4.8Z"
      />
    </Svg>
  );
}

/** Ported from `AppleMark` — `fill-[#0F172A]`, i.e. `ink`. */
export function AppleMark({ size = 20 }) {
  const px = fS(size);
  return (
    <Svg width={px} height={px} viewBox="0 0 24 24">
      <Path
        fill={c.ink}
        d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9ZM14.7 6.5c.6-.8 1.1-1.9.9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.3Z"
      />
    </Svg>
  );
}

export default Logo;
