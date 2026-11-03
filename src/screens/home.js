import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { goTo } from '../navigation/routes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  AsyncBody,
  Button,
  Gradient,
  LEADING,
  Logo,
  Refreshable,
  Screen,
  ServiceIcon,
  Stars,
  StatusChip,
  TEXT,
  Text,
  cardStyle,
} from '../atomComponents';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { averageRating, services } from '../lib/services';
import { formatDateET, greeting } from '../lib/format';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

/** The web's four quick actions, with the glyph and destination of each. */
const QUICK_ACTIONS = [
  { label: 'My Shipments', glyph: 'package', to: 'Shipments', tab: true },
  { label: 'Messages', glyph: 'message-circle', to: 'Messages', tab: true },
  { label: 'Request a Quote', glyph: 'file-text', to: 'Book', book: true },
  { label: 'Support', glyph: 'life-buoy', to: 'Help' },
];

/** Statuses the web treats as "live" when picking the tracked shipment. */
const LIVE = ['in_transit', 'en_route_pickup', 'picked_up', 'exception'];

export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, shipments, notifications, startBooking, pushToast, hydrated } = useApp();

  const unread = notifications.filter(item => !item.read).length;
  const active =
    shipments.find(item => LIVE.includes(item.status)) ??
    shipments.find(item => item.status === 'driver_assigned');

  useEffect(() => {
    if (hydrated && !user) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [hydrated, user, navigation]);

  const first = user?.fullName.split(' ')[0] || 'there';

  const openBooking = serviceId => {
    startBooking(serviceId);
    navigation.navigate('Book');
  };

  return (
    <Screen tab tone="surface">
      <Refreshable onRefresh={() => pushToast('Updated', 'Eastern Time (ET)')}>
        <View style={[styles.header, { paddingTop: Math.max(vSize(14), insets.top) }]}>
          <Logo size={44} />
          <View style={styles.headerText}>
            <Text style={TEXT.caption}>{greeting()}</Text>
            <Text numberOfLines={1} style={TEXT.title}>
              {first}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bell}>
            <Lucide name="bell" size={fS(20)} color={c.ink} />
            {unread > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <AsyncBody boot emptyTitle="No services to show" emptyBody="Service cards will appear here.">
          <View style={styles.body}>
            <View style={styles.hero}>
              <Gradient colors={[c.primary, c.brand]} />
              <View style={styles.heroInner}>
              <Text style={styles.heroEyebrow}>Central Virginia</Text>
              <Text style={styles.heroTitle}>Need a delivery?</Text>
              <Text style={styles.heroBody}>Specimens, prescriptions, supplies, and equipment.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => openBooking()}
                style={({ pressed }) => [styles.heroCta, pressed && styles.pressed98]}>
                <Text style={styles.heroCtaText}>Book a Delivery</Text>
              </Pressable>
              </View>
            </View>

            <View>
              <Text style={TEXT.title}>Services</Text>
              <View style={styles.serviceGrid}>
                {services.map(service => (
                  <Pressable
                    key={service.id}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('ServiceDetail', { id: service.id })}
                    style={({ pressed }) => [cardStyle, styles.serviceCard, pressed && styles.pressed98]}>
                    <Image source={service.image} style={styles.serviceImage} resizeMode="cover" />
                    <View style={styles.serviceMeta}>
                      <ServiceIcon id={service.id} color={c.primary} />
                      <Text style={styles.serviceName}>{service.displayName}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {active ? (
              <View style={[cardStyle, styles.activeCard]}>
                <View style={styles.activeTop}>
                  <Text style={styles.activeId}>{active.id}</Text>
                  <StatusChip status={active.status} label={active.exception ?? undefined} />
                </View>
                <Text style={styles.activeRoute}>
                  {active.pickup.facility} to {active.dropoff.facility}
                </Text>
                <Text style={styles.activeWhen}>
                  {formatDateET(active.schedule.date, true)} ·{' '}
                  {active.schedule.window || active.schedule.deadline} ET
                  {active.eta ? ` · ETA ${active.eta}` : ''}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('ShipmentDetail', { id: active.id })}
                  style={styles.trackBtn}>
                  <Text style={styles.trackText}>Track</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              {QUICK_ACTIONS.map(action => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={() => {
                    if (action.book) {
                      openBooking();
                      return;
                    }
                    goTo(navigation, action.to);
                  }}
                  style={styles.action}>
                  <Lucide name={action.glyph} size={fS(20)} color={c.primary} />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.hoursChip}>
              <Lucide name="clock" size={fS(16)} color={c.primary} style={styles.hoursIcon} />
              <Text style={styles.hoursText}>{business.hoursChip}</Text>
            </View>
          </View>
        </AsyncBody>
      </Refreshable>
    </Screen>
  );
}

export function ServicesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <Screen tone="surface">
      <View style={[styles.listHeader, { paddingTop: Math.max(vSize(14), insets.top) }]}>
        <Pressable accessibilityRole="button" onPress={() => goTo(navigation, 'Profile')} hitSlop={8}>
          <Text style={styles.backLink}>Back</Text>
        </Pressable>
        <Text style={[TEXT.largeTitle, styles.listTitle]}>All services</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.listBody} showsVerticalScrollIndicator={false}>
        <AsyncBody boot emptyTitle="No services" emptyBody="Services will appear here.">
          <View style={styles.listGap}>
            {services.map(service => (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('ServiceDetail', { id: service.id })}
                style={[cardStyle, styles.listRow]}>
                <Image source={service.image} style={styles.listThumb} resizeMode="cover" />
                <View style={styles.listRowText}>
                  <Text style={styles.listRowName}>{service.displayName}</Text>
                  <Text style={styles.listRowSub}>{service.title}</Text>
                  <View style={styles.listRowRating}>
                    <Stars value={averageRating(service)} />
                    <Text style={TEXT.caption}>{averageRating(service)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </AsyncBody>
      </ScrollView>
    </Screen>
  );
}

export function ServiceDetailScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { startBooking } = useApp();
  const id = route?.params?.id;
  const service = services.find(item => item.id === id);

  return (
    <Screen tone="surface">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <AsyncBody boot emptyTitle="Service unavailable" emptyBody="This service is not in the preview catalog.">
          {!service ? null : (
            <View style={styles.detailWrap}>
              <View style={styles.heroImageWrap}>
                <Image source={service.image} style={styles.heroImage} resizeMode="cover" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  onPress={() => goTo(navigation, 'Home')}
                  style={[styles.floatingBack, { top: Math.max(vSize(12), insets.top) }]}>
                  <Lucide name="chevron-left" size={fS(24)} color={c.ink} />
                </Pressable>
              </View>

              <View style={styles.detailBody}>
                <View>
                  <Text style={styles.eyebrow}>{service.displayName}</Text>
                  <Text style={[TEXT.largeTitle, styles.detailTitle]}>{service.title}</Text>
                  <Text style={styles.detailDesc}>{service.description}</Text>
                </View>

                <View style={[cardStyle, styles.panel]}>
                  <Text style={TEXT.button}>What you can send</Text>
                  <View style={styles.bulletList}>
                    {service.canSend.map(item => (
                      <Text key={item} style={styles.bullet}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={[cardStyle, styles.panel]}>
                  <Text style={TEXT.button}>Handling notes</Text>
                  <View style={styles.bulletList}>
                    {service.handlingNotes.map(item => (
                      <Text key={item} style={styles.bullet}>
                        {item}
                      </Text>
                    ))}
                  </View>
                </View>

                <View style={[cardStyle, styles.panel]}>
                  <Text style={styles.panelEyebrow}>Indicative pricing</Text>
                  <Text style={styles.priceFrom}>Starting from ${service.startingAt}</Text>
                  <Text style={TEXT.caption}>*estimate. Final quote confirmed by Storey Enterprises.</Text>
                </View>

                <View>
                  <View style={styles.reviewHead}>
                    <Text style={TEXT.title}>Reviews</Text>
                    <View style={styles.reviewScore}>
                      <Stars value={averageRating(service)} />
                      <Text style={TEXT.label}>{averageRating(service)}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewList}>
                    {service.reviews.map(review => (
                      <View key={review.id} style={[cardStyle, styles.panel]}>
                        <View style={styles.reviewTop}>
                          <Text style={TEXT.label}>{review.name}</Text>
                          <Stars value={review.rating} />
                        </View>
                        <Text style={TEXT.caption}>{review.date}</Text>
                        <Text style={styles.reviewText}>{review.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </AsyncBody>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(vSize(12), insets.bottom) }]}>
        <Button
          onPress={() => {
            startBooking(service?.id);
            navigation.navigate('Book');
          }}>
          Book This Service
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, minHeight: 0 },
  pressed98: { transform: [{ scale: 0.98 }] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(12),
    paddingHorizontal: hSize(20),
    paddingBottom: vSize(8),
  },
  headerText: { flex: 1, minWidth: 0 },
  bell: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    right: hSize(4),
    top: vSize(4),
    minWidth: hSize(16),
    height: vSize(16),
    borderRadius: RADIUS.full,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hSize(4),
  },
  bellBadgeText: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(10), color: c.overlayText },

  body: { gap: vSize(20), paddingHorizontal: hSize(20), paddingBottom: vSize(24) },

  /**
   * The radius and the gradient live on `hero`; the padding lives on
   * `heroInner`. A percentage-sized overlay resolves against the content box,
   * so a padded parent would leave the card's right and bottom edges unpainted
   * — see the sizing note in atomComponents/Glow.
   */
  hero: { overflow: 'hidden', borderRadius: RADIUS.lg, ...elevation(1) },
  heroInner: { padding: hSize(20) },
  heroEyebrow: { ...TEXT.caption, fontFamily: TEXT.label.fontFamily, color: c.overlayTextMuted },
  heroTitle: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.overlayText, marginTop: vSize(4) },
  heroBody: {
    ...TEXT.body,
    marginTop: vSize(4),
    color: c.overlayTextStrong,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  heroCta: {
    marginTop: vSize(16),
    height: vSize(52),
    borderRadius: RADIUS.md,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCtaText: { ...TEXT.button, color: c.primary },

  serviceGrid: { marginTop: vSize(12), flexDirection: 'row', flexWrap: 'wrap', gap: hSize(12) },
  serviceCard: { width: '47.5%', overflow: 'hidden' },
  serviceImage: { width: '100%', height: vSize(96) },
  serviceMeta: { padding: hSize(12) },
  serviceName: { ...TEXT.label, marginTop: vSize(8), lineHeight: LEADING.snug(fS(14)) },

  activeCard: { padding: hSize(16) },
  activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  activeId: { ...TEXT.chip, color: c.mutedForeground },
  activeRoute: { ...TEXT.button, marginTop: vSize(8), lineHeight: LEADING.snug(fS(16)) },
  activeWhen: { ...TEXT.body, marginTop: vSize(4), color: c.mutedForeground },
  trackBtn: {
    marginTop: vSize(12),
    alignSelf: 'flex-start',
    height: vSize(44),
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: c.primary,
    paddingHorizontal: hSize(16),
  },
  trackText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primaryForeground },

  actionRow: { flexDirection: 'row', gap: hSize(8) },
  action: {
    flex: 1,
    minHeight: vSize(76),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vSize(4),
    borderRadius: RADIUS.lg,
    backgroundColor: c.card,
    paddingHorizontal: hSize(4),
    ...elevation(1),
  },
  actionLabel: { ...TEXT.caption, fontFamily: TEXT.label.fontFamily, color: c.ink, textAlign: 'center' },

  hoursChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hSize(8),
    borderRadius: RADIUS.full,
    backgroundColor: c.card,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
    ...elevation(1),
  },
  hoursIcon: { marginTop: vSize(2) },
  hoursText: { ...TEXT.caption, flex: 1, color: c.subtle, lineHeight: LEADING.snug(fS(12)) },

  listHeader: { paddingHorizontal: hSize(20), paddingBottom: vSize(8) },
  backLink: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },
  listTitle: { marginTop: vSize(8) },
  listBody: { paddingHorizontal: hSize(20), paddingBottom: vSize(24) },
  listGap: { gap: vSize(12) },
  listRow: { flexDirection: 'row', gap: hSize(12), padding: hSize(12) },
  listThumb: { width: hSize(80), height: hSize(80), borderRadius: RADIUS.sm },
  listRowText: { flex: 1, minWidth: 0 },
  listRowName: { ...TEXT.button, lineHeight: LEADING.snug(fS(16)) },
  listRowSub: { ...TEXT.caption, marginTop: vSize(4) },
  listRowRating: { flexDirection: 'row', alignItems: 'center', gap: hSize(4), marginTop: vSize(4) },

  detailWrap: { paddingBottom: vSize(16) },
  heroImageWrap: { height: vSize(256) },
  heroImage: { width: '100%', height: '100%' },
  floatingBack: {
    position: 'absolute',
    left: hSize(12),
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { gap: vSize(16), paddingHorizontal: hSize(20), paddingTop: vSize(20) },
  eyebrow: { ...TEXT.chip, color: c.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  detailTitle: { marginTop: vSize(4) },
  /** `text-[16px] leading-relaxed text-[#475569]` — 16px REGULAR, not the
   * semibold `TEXT.button`, so it is built from `TEXT.body` with the size
   * raised rather than from a weighted style with the weight undone. */
  detailDesc: {
    ...TEXT.body,
    fontSize: fS(16),
    marginTop: vSize(12),
    color: c.subtle,
    lineHeight: LEADING.relaxed(fS(16)),
  },
  panel: { padding: hSize(16) },
  panelEyebrow: { ...TEXT.chip, color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.6 },
  priceFrom: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.ink, marginTop: vSize(4) },
  bulletList: { marginTop: vSize(8), gap: vSize(8) },
  bullet: { ...TEXT.body, color: c.subtle, lineHeight: LEADING.snug(fS(14)) },

  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewScore: { flexDirection: 'row', alignItems: 'center', gap: hSize(4) },
  reviewList: { marginTop: vSize(12), gap: vSize(12) },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewText: { ...TEXT.body, marginTop: vSize(8), color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },

  footer: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(16),
    paddingTop: vSize(12),
  },
});
