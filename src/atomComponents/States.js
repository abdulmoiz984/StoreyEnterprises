import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';
import { Button } from './Controls';
import { cardStyle } from './Status';

const { hSize, vSize, fS } = Sizer;

/** The web's `animate-pulse`: opacity 1 → .5 → 1 on a 2s loop. */
function usePulse() {
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 0.5, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

/** Ported from `ListSkeleton` — four pulsing cards. */
export function ListSkeleton() {
  const opacity = usePulse();
  return (
    <View style={styles.skeletonWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2, 3].map(index => (
        <Animated.View key={index} style={[cardStyle, styles.skeletonCard, { opacity }]}>
          <View style={[styles.bar, { width: hSize(96) }]} />
          <View style={[styles.bar, styles.barMid]} />
          <View style={[styles.bar, styles.barLast]} />
        </Animated.View>
      ))}
    </View>
  );
}

/** Ported from `EmptyState`. */
export function EmptyState({ title, body, action }) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: c.primaryTint }]}>
        <Lucide name="package" size={fS(28)} color={c.primary} />
      </View>
      <Text style={[TEXT.title, styles.stateTitle]}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

/** Ported from `ErrorState`, default copy included. */
export function ErrorState({ onRetry, body = "We couldn't load this. Check the connection and try again." }) {
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: c.dangerTint }]}>
        <Lucide name="circle-alert" size={fS(28)} color={c.destructive} />
      </View>
      <Text style={[TEXT.title, styles.stateTitle]}>Something went wrong</Text>
      <Text style={styles.stateBody}>{body}</Text>
      <View style={styles.stateAction}>
        <Button onPress={onRetry}>
          <Lucide name="refresh-cw" size={fS(16)} color={c.primaryForeground} />
          <Text style={[TEXT.button, { color: c.primaryForeground }]}>Try again</Text>
        </Button>
      </View>
    </View>
  );
}

/**
 * Ported from `useAsyncPhase`. The web's 550ms boot delay used
 * `window.setTimeout`; this uses the global `setTimeout`, which React Native
 * provides — `window` does not exist here.
 */
export function useAsyncPhase(boot = false) {
  const { listPreview, setListPreview, setConnectivity } = useApp();
  const [booting, setBooting] = useState(boot);

  useEffect(() => {
    if (!boot) return undefined;
    const timer = setTimeout(() => setBooting(false), 550);
    return () => clearTimeout(timer);
  }, [boot]);

  const phase =
    listPreview === 'error'
      ? 'error'
      : listPreview === 'loading' || booting
        ? 'loading'
        : listPreview === 'empty'
          ? 'empty'
          : 'ready';

  const retry = () => {
    setConnectivity('online');
    setListPreview('live');
    if (boot) {
      setBooting(true);
      setTimeout(() => setBooting(false), 550);
    }
  };

  return { phase, retry };
}

/** Ported from `AsyncBody`, default copy included. */
export function AsyncBody({
  boot = false,
  emptyTitle = 'Nothing here yet',
  emptyBody = "Items will show up here when they're available.",
  children,
}) {
  const { phase, retry } = useAsyncPhase(boot);
  if (phase === 'loading') return <ListSkeleton />;
  if (phase === 'error') return <ErrorState onRetry={retry} />;
  if (phase === 'empty') {
    return <EmptyState title={emptyTitle} body={emptyBody} action={<Button onPress={retry}>Try again</Button>} />;
  }
  return children;
}

const styles = StyleSheet.create({
  skeletonWrap: { paddingHorizontal: hSize(16), paddingVertical: vSize(12), gap: vSize(12) },
  skeletonCard: { padding: hSize(16) },
  bar: { height: vSize(12), borderRadius: 4, backgroundColor: c.border },
  barMid: { height: vSize(16), marginTop: vSize(12), width: '75%' },
  barLast: { marginTop: vSize(8), width: '50%' },

  state: { alignItems: 'center', paddingHorizontal: hSize(32), paddingVertical: vSize(64) },
  stateIcon: {
    width: hSize(64),
    height: hSize(64),
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { marginTop: vSize(16), textAlign: 'center' },
  stateBody: {
    ...TEXT.body,
    marginTop: vSize(8),
    textAlign: 'center',
    color: c.mutedForeground,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  stateAction: { marginTop: vSize(20), width: '100%', maxWidth: hSize(320) },
});

export default AsyncBody;
