import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import { formatMoney } from '../lib/format';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';
import { cardStyle } from './Status';

const { hSize, vSize, fS } = Sizer;

/**
 * Ported from `PriceTable`. A negative line is green in the web (`line.amount <
 * 0` → the discount colour), which is kept.
 */
export function PriceTable({ price, caption = business.priceCaption, style }) {
  return (
    <View style={[cardStyle, styles.table, style]}>
      {price.lines.map(line => (
        <View key={line.label} style={styles.line}>
          <Text style={styles.lineLabel}>{line.label}</Text>
          <Text style={[TEXT.label, line.amount < 0 && { color: c.success }]}>{formatMoney(line.amount)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={TEXT.button}>Total</Text>
        <Text style={TEXT.title}>{formatMoney(price.total)}</Text>
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

/**
 * Ported from `RouteMap`.
 *
 * This is NOT a map view, in the web or here: it is a hand-drawn SVG schematic
 * of the two stops on a grid plate, and swapping it for a real native map would
 * change what the screen shows. The web's own projection maths is carried over
 * unchanged — including the 0.04-degree floor that stops two nearby stops from
 * projecting on top of each other.
 *
 * The three Google REST calls the app does make live in `lib/maps`; they return
 * coordinates and a distance, which is what feeds this.
 */
export function RouteMap({ pickup, dropoff, driver, distance, style }) {
  const points = [pickup, dropoff].filter(point => !!point && point.lat != null && point.lng != null);
  const lats = points.map(point => point.lat);
  const lngs = points.map(point => point.lng);
  const minLat = Math.min(...(lats.length ? lats : [37.3]));
  const maxLat = Math.max(...(lats.length ? lats : [37.7]));
  const minLng = Math.min(...(lngs.length ? lngs : [-77.7]));
  const maxLng = Math.max(...(lngs.length ? lngs : [-77.3]));

  const project = (lat, lng) => ({
    x: ((lng - minLng) / Math.max(0.04, maxLng - minLng)) * 280 + 20,
    y: (1 - (lat - minLat) / Math.max(0.04, maxLat - minLat)) * 140 + 16,
  });

  const a = pickup?.lat != null && pickup.lng != null ? project(pickup.lat, pickup.lng) : null;
  const b = dropoff?.lat != null && dropoff.lng != null ? project(dropoff.lat, dropoff.lng) : null;
  const mid = a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 18 } : null;

  return (
    <View style={[styles.map, style]}>
      <Svg width="100%" height={vSize(176)} viewBox="0 0 320 180" accessibilityLabel="Map preview">
        <Rect width="320" height="180" fill={c.mapBg} />
        {[0, 1, 2, 3, 4, 5].map(index => (
          <Path key={`h${index}`} d={`M0 ${20 + index * 28} H320`} stroke={c.mapGrid} strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
          <Path key={`v${index}`} d={`M${index * 46} 0 V180`} stroke={c.mapGrid} strokeWidth="1" />
        ))}
        {a && b ? (
          <Path
            d={`M${a.x} ${a.y} Q ${mid.x} ${mid.y}, ${b.x} ${b.y}`}
            fill="none"
            stroke={c.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : null}
        {a ? <Circle cx={a.x} cy={a.y} r="7" fill={c.primary} /> : null}
        {b ? <Circle cx={b.x} cy={b.y} r="7" fill={c.brand} /> : null}
        {driver && a && b ? (
          <>
            <Circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="11" fill={c.primary} opacity={0.2} />
            <Circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="6" fill={c.ink} />
          </>
        ) : null}
      </Svg>
      <View style={styles.legend}>
        <View style={styles.legendLeft}>
          <View style={[styles.legendDot, { backgroundColor: c.primary }]} />
          <Text style={TEXT.caption}>Pickup</Text>
          <View style={[styles.legendDot, { backgroundColor: c.brand }]} />
          <Text style={TEXT.caption}>Delivery</Text>
        </View>
        {distance ? (
          <Text style={[TEXT.label, TEXT.caption, styles.distance]}>{distance} mi</Text>
        ) : (
          <Text style={TEXT.caption}>Eastern Time (ET)</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { padding: hSize(16) },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: hSize(12),
    paddingVertical: vSize(6),
  },
  lineLabel: { ...TEXT.body, flex: 1, color: c.mutedForeground },
  totalRow: {
    marginTop: vSize(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: vSize(12),
  },
  caption: { ...TEXT.caption, marginTop: vSize(8), lineHeight: LEADING.snug(fS(12)) },

  map: {
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.mapBg,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  legendDot: { width: hSize(8), height: hSize(8), borderRadius: RADIUS.full },
  distance: { color: c.ink },
});

export default PriceTable;
