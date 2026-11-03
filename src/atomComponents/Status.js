import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { STATUS_LABEL } from '../lib/labels';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';

const { hSize, vSize, fS } = Sizer;

/**
 * Ported from `cardClass()` — the web returns a class string, so this returns a
 * style object and every card spreads it.
 */
export const cardStyle = {
  borderRadius: RADIUS.lg,
  borderWidth: 1,
  borderColor: c.border,
  backgroundColor: c.card,
  ...elevation(1),
};

/** The web's nested ternary, as a lookup. Statuses not listed fall through to primary. */
const CHIP_TONE = {
  delivered: { bg: c.successTint, fg: c.successText },
  cancelled: { bg: c.disabledBg, fg: c.subtle },
  quote_declined: { bg: c.disabledBg, fg: c.subtle },
  exception: { bg: c.dangerTint, fg: c.destructive },
  in_transit: { bg: c.warningTint, fg: c.warningText },
  picked_up: { bg: c.warningTint, fg: c.warningText },
  en_route_pickup: { bg: c.warningTint, fg: c.warningText },
  stat: { bg: c.brand, fg: c.overlayText },
};

/** Ported from `StatusChip`. */
export function StatusChip({ status, label, style }) {
  const text = label ?? STATUS_LABEL[status] ?? status;
  const tone = CHIP_TONE[status] ?? { bg: c.primaryTint, fg: c.primary };
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }, style]}>
      <Text style={[TEXT.chip, { color: tone.fg }]}>{text}</Text>
    </View>
  );
}

/**
 * Ported from `Timeline`. The web's `ring-4` on the current dot is drawn here as
 * a concentric halo View, since RN has no ring utility.
 *
 * The connector is `flex-1` in the web so it stretches to the row's height; the
 * same works here because the dot column is a flex child of the row.
 */
export function Timeline({ events }) {
  return (
    <View>
      {events.map((event, index) => (
        <View key={`${event.key}-${index}`} style={styles.tlRow}>
          <View style={styles.tlRail}>
            {event.state === 'current' ? (
              <View style={styles.tlHalo}>
                <View style={[styles.tlDot, styles.tlDotDone]} />
              </View>
            ) : (
              <View
                style={[
                  styles.tlDot,
                  styles.tlDotTop,
                  event.state === 'done' && styles.tlDotDone,
                  event.state === 'upcoming' && styles.tlDotUpcoming,
                  event.state === 'alert' && styles.tlDotAlert,
                ]}
              />
            )}
            {index < events.length - 1 ? <View style={styles.tlLine} /> : null}
          </View>
          <View style={styles.tlBody}>
            <Text style={[TEXT.label, event.state === 'upcoming' && { color: c.faint }]}>{event.label}</Text>
            {event.at ? <Text style={TEXT.caption}>{event.at}</Text> : null}
            {event.note ? <Text style={styles.tlNote}>{event.note}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Ported from `Stars`. The web draws its own star path rather than using a
 * Lucide glyph, and that matters: an icon FONT cannot be half-filled or
 * recoloured per-glyph the way `fill-current` does, so the path is carried over
 * verbatim into react-native-svg.
 */
export function Stars({ value, size = 14 }) {
  const px = fS(size);
  return (
    <View style={styles.stars} accessibilityLabel={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map(index => (
        <Svg key={index} width={px} height={px} viewBox="0 0 20 20">
          <Path
            d="M10 1.8 12.4 7l5.6.5-4.2 3.7 1.3 5.5L10 13.8 4.9 16.7 6.2 11.2 2 7.5 7.6 7 10 1.8Z"
            fill={index < Math.round(value) ? c.warning : c.border}
          />
        </Svg>
      ))}
    </View>
  );
}

/** Ported from `SuccessMark` — the 80pt ringed tick on confirmation screens. */
export function SuccessMark() {
  return (
    <View style={styles.successOuter}>
      <View style={styles.successInner}>
        <Lucide name="check" size={fS(32)} color={c.overlayText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: hSize(10),
    paddingVertical: vSize(4),
  },

  tlRow: { flexDirection: 'row', gap: hSize(12) },
  tlRail: { alignItems: 'center' },
  tlDot: { width: hSize(12), height: hSize(12), borderRadius: RADIUS.full, borderWidth: 2 },
  tlDotTop: { marginTop: vSize(4) },
  tlDotDone: { borderColor: c.primary, backgroundColor: c.primary },
  tlDotUpcoming: { borderColor: c.border, backgroundColor: c.card },
  tlDotAlert: { borderColor: c.destructive, backgroundColor: c.destructive },
  tlHalo: {
    marginTop: vSize(4),
    padding: 4,
    borderRadius: RADIUS.full,
    backgroundColor: c.primaryHalo,
  },
  tlLine: { width: 1, flex: 1, backgroundColor: c.border },
  tlBody: { flex: 1, paddingBottom: vSize(16) },
  tlNote: { ...TEXT.caption, marginTop: vSize(4), lineHeight: LEADING.snug(fS(12)) },

  stars: { flexDirection: 'row', alignItems: 'center', gap: hSize(2) },

  successOuter: {
    alignSelf: 'center',
    width: hSize(80),
    height: hSize(80),
    borderRadius: RADIUS.full,
    backgroundColor: c.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successInner: {
    width: hSize(56),
    height: hSize(56),
    borderRadius: RADIUS.full,
    backgroundColor: c.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatusChip;
