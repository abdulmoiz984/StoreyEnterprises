import { useEffect, useRef } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT as c } from '../globalStyle/tokens';
import { MOTION, RADIUS, elevation } from '../globalStyle/Theme';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';
import { TEXT, Text } from './Typography';

const { hSize, vSize } = Sizer;

/** The web's `animate-[pop-in_180ms_ease-out]`. */
function PopIn({ children, style }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: MOTION.popMs,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [t]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Ported from `Toasts`. react-native-flash-message is deliberately NOT used
 * here: the toast queue lives in the store (`toasts`, `pushToast`,
 * `dismissToast`), every screen pushes through it, and routing that through a
 * second imperative library would mean two sources of truth for the same list.
 *
 * The web pins this `top-10` inside its phone frame, where there is no status
 * bar; on a device that offset has to clear the notch, hence `insets.top`.
 *
 * `pointerEvents="none"` matches the web — a toast never blocks the tap under it.
 */
export function Toasts() {
  const { toasts } = useApp();
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + vSize(8) }]}>
      {toasts.map(toast => (
        <PopIn key={toast.id} style={styles.toast}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.body ? <Text style={styles.toastBody}>{toast.body}</Text> : null}
        </PopIn>
      ))}
    </View>
  );
}

/**
 * Replaces the web's `PullToRefresh`, which hand-rolls pointer tracking on a
 * scroll container because the browser has no pull-to-refresh primitive.
 *
 * React Native does, so this uses `RefreshControl`: the gesture, the threshold
 * and the spinner all come from the platform, which is both the native-correct
 * behaviour and considerably less code than porting the pointer maths.
 */
export function Refreshable({ onRefresh, refreshing = false, children, contentContainerStyle, ...rest }) {
  return (
    <ScrollView
      style={styles.scroller}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        ) : undefined
      }
      {...rest}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 70,
    paddingHorizontal: hSize(16),
    gap: vSize(8),
  },
  toast: {
    borderRadius: RADIUS.lg,
    backgroundColor: c.ink,
    paddingHorizontal: hSize(16),
    paddingVertical: vSize(12),
    ...elevation(3),
  },
  toastTitle: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.overlayText },
  toastBody: { ...TEXT.caption, color: c.overlayTextMuted },

  scroller: { flex: 1, minHeight: 0 },
});

export default Toasts;
