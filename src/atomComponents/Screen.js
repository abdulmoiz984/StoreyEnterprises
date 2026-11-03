import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';

const { hSize, vSize, fS } = Sizer;

/**
 * Ported from `Screen` in the web's `components/app/ui.tsx`.
 *
 * The web's own wrapper is `h-full min-h-0 flex-col` inside a 390pt phone frame
 * that `AppShell` draws on a desktop page. On a device that frame IS the screen,
 * so `AppShell` has no equivalent here and `Screen` is the outermost element.
 *
 * `tone` matches the web exactly: "surface" for list/detail pages on the grey
 * plate, "plain" for white pages.
 *
 * `bar` sets the status-bar content for this screen. The web never needs this —
 * a browser has no status bar — but the app does: the splash, onboarding, auth
 * and profile screens paint `night` right up under the clock, where dark glyphs
 * would be invisible, while every other screen is white and needs the opposite.
 *
 * It is rendered only while this screen is FOCUSED. `StatusBar` is declarative
 * and last-mounted-wins, and a tab navigator keeps every tab mounted at once —
 * so without the focus check the clock on the dark Profile header stayed dark
 * because Home's `bar="dark"` was still mounted and won.
 */
export function Screen({ children, tab = false, tone = 'plain', bar = 'dark', style }) {
  const focused = useIsFocused();
  return (
    <View style={[styles.screen, { backgroundColor: tone === 'surface' ? c.surface : c.background }, style]}>
      {focused ? <StatusBar barStyle={bar === 'light' ? 'light-content' : 'dark-content'} /> : null}
      <OfflineBanner />
      <View style={styles.body}>{children}</View>
      {tab ? <TabBarSlot /> : null}
    </View>
  );
}

/**
 * The tab bar is rendered by React Navigation, not by `Screen`. The web draws it
 * inside each screen because it has no navigator; here the prop is kept so the
 * ported screens read the same, and it simply reserves nothing — the navigator
 * already insets the content.
 */
function TabBarSlot() {
  return null;
}

/** Ported verbatim, including the "Saved preview data" copy and the Retry link. */
export function OfflineBanner() {
  const { connectivity, setConnectivity, pushToast } = useApp();
  if (connectivity !== 'offline') return null;
  return (
    <View style={styles.offline}>
      <Lucide name="wifi-off" size={fS(16)} color={c.overlayText} />
      <Text style={styles.offlineText}>Offline. Saved preview data is still available.</Text>
      <Pressable
        hitSlop={12}
        onPress={() => {
          setConnectivity('online');
          pushToast('Back online');
        }}>
        <Text style={styles.offlineRetry}>Retry</Text>
      </Pressable>
    </View>
  );
}

/**
 * Ported from `StackHeader`. The web hardcodes a `backTo` destination because a
 * browser back button is unreliable inside its phone frame; a native stack has a
 * real history, so this pops when it can and falls back to `backTo` when this
 * screen was opened as the first in the stack (e.g. from a notification).
 */
export function StackHeader({ title, right, backTo = 'Home' }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.stackHeader, { paddingTop: Math.max(vSize(10), insets.top) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate(backTo))}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <Lucide name="chevron-left" size={fS(24)} color={c.ink} />
      </Pressable>
      <Text numberOfLines={1} style={[TEXT.title, styles.stackTitle]}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Ported from `LargeTitle` — the 28pt heading on the tab roots. */
export function LargeTitle({ title, action }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.largeTitle, { paddingTop: Math.max(vSize(14), insets.top) }]}>
      <Text style={[TEXT.largeTitle, styles.largeTitleText]}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
  body: { flex: 1, minHeight: 0 },

  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(8),
    backgroundColor: c.ink,
    paddingHorizontal: hSize(16),
    paddingVertical: vSize(8),
  },
  offlineText: {
    ...TEXT.caption,
    flex: 1,
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(12)),
  },
  offlineRetry: { ...TEXT.chip, color: c.overlayText, textDecorationLine: 'underline' },

  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(4),
    paddingHorizontal: hSize(8),
    paddingBottom: vSize(8),
  },
  backBtn: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.95 }] },
  stackTitle: { flex: 1, minWidth: 0 },

  largeTitle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: hSize(12),
    paddingHorizontal: hSize(20),
    paddingBottom: vSize(8),
  },
  largeTitleText: { flexShrink: 1 },
});

export default Screen;
