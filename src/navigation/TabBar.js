import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { unreadCount, useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';
import { TEXT, Text } from '../atomComponents/Typography';

const { hSize, vSize, fS } = Sizer;

/** The web's four tab items, in order, with the glyph each one uses. */
const ITEMS = [
  { route: 'Home', label: 'Home', glyph: 'house' },
  { route: 'Shipments', label: 'Shipments', glyph: 'package' },
  { route: 'Messages', label: 'Messages', glyph: 'message-circle' },
  { route: 'Profile', label: 'Profile', glyph: 'user' },
];

/**
 * Ported from `TabBar` in the web's `components/app/ui.tsx`.
 *
 * The web renders this inside each screen because it has no navigator; here it
 * is React Navigation's `tabBar`, so it receives `state`/`navigation` and the
 * active tab comes from the navigator rather than from matching `pathname`.
 *
 * The centre control is not a tab — in the web it is a button that calls
 * `startBooking()` and then navigates to `/book`, which is a stack route, not a
 * fifth tab. That is preserved exactly: it sits between items 2 and 3 and
 * pushes `Book` onto the parent stack.
 */
export function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { threads, startBooking } = useApp();
  const messages = unreadCount(threads);
  const activeRoute = state.routes[state.index]?.name;

  const renderItem = item => {
    const on = activeRoute === item.route;
    const badge = item.route === 'Messages' ? messages : 0;
    return (
      <Pressable
        key={item.route}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={item.label}
        onPress={() => navigation.navigate(item.route)}
        style={[styles.item, on && styles.itemOn]}>
        <View style={styles.glyphWrap}>
          <Lucide name={item.glyph} size={fS(24)} color={on ? c.overlayText : c.overlayTextMuted} />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={[styles.label, on && styles.labelOn]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(vSize(14), insets.bottom) }]}>
      <View style={styles.row}>
        {renderItem(ITEMS[0])}
        {renderItem(ITEMS[1])}
        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Book"
            onPress={() => {
              startBooking();
              navigation.getParent()?.navigate('Book');
            }}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Lucide name="plus" size={fS(28)} color={c.overlayText} />
          </Pressable>
        </View>
        {renderItem(ITEMS[2])}
        {renderItem(ITEMS[3])}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: c.night,
    paddingHorizontal: hSize(12),
    paddingTop: vSize(12),
    ...elevation(3),
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: hSize(2) },
  item: {
    flex: 1,
    minHeight: vSize(56),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vSize(4),
    borderRadius: RADIUS.md,
    paddingHorizontal: hSize(2),
    paddingVertical: vSize(8),
  },
  itemOn: { backgroundColor: c.overlayFill },
  glyphWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    right: -hSize(8),
    top: -vSize(4),
    minWidth: hSize(16),
    height: vSize(16),
    borderRadius: RADIUS.full,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hSize(4),
  },
  badgeText: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(10), color: c.overlayText },
  label: { ...TEXT.chip, color: c.overlayTextMuted },
  labelOn: { color: c.overlayText },

  /**
   * The FAB column is sized to the button, NOT `flex: 1`.
   *
   * As an equal fifth of the bar it took ~80pt and left each label about 64pt
   * of text width. That fits "Shipments" in Inter on iOS and does NOT on
   * Android, where the same string measures wider — the label first wrapped to
   * "Shipment" / "s", then, once `numberOfLines={1}` stopped the wrap, clipped
   * to "Shipmen…".
   *
   * So the FAB column is the button's own width plus a hair, and the row gap
   * and item padding are 2pt rather than 4. That hands roughly 10pt back to
   * every label, which is enough for the longest one on both platforms.
   * `numberOfLines={1}` stays as the guarantee at large accessibility sizes.
   */
  fabSlot: { width: hSize(62), alignItems: 'center' },
  fab: {
    width: hSize(56),
    height: hSize(56),
    borderRadius: RADIUS.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation(3),
  },
  fabPressed: { transform: [{ scale: 0.98 }] },
});

export default TabBar;
