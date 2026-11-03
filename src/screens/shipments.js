import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { goTo } from '../navigation/routes';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Lucide from '@react-native-vector-icons/lucide';
import {
  AsyncBody,
  Button,
  Calendar,
  CalendarNotes,
  ChoiceButton,
  ChoiceGroup,
  EmptyState,
  LEADING,
  LargeTitle,
  PriceTable,
  Refreshable,
  RouteMap,
  Screen,
  Select,
  ServiceIcon,
  Sheet,
  StackHeader,
  StatusChip,
  TEXT,
  Text,
  TextArea,
  TextInput,
  Timeline,
  cardStyle,
} from '../atomComponents';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { services } from '../lib/services';
import { formatDateET, formatDateTimeET, formatMoney } from '../lib/format';
import {
  CANCEL_REASONS,
  EXCEPTION_TYPES,
  SHIPMENT_TABS,
  STATUS_LABEL,
  matchesTab,
} from '../lib/labels';
import { DEADLINE_TIMES, slotsFor } from '../lib/schedule';
import { isSaturday } from '../lib/format';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

export function ShipmentsScreen() {
  const navigation = useNavigation();
  const { shipments, pushToast } = useApp();
  const [tab, setTab] = useState('Upcoming');
  const [query, setQuery] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const items = useMemo(
    () =>
      shipments.filter(shipment => {
        if (!matchesTab(shipment, tab)) return false;
        if (serviceId && shipment.serviceId !== serviceId) return false;
        const hay =
          `${shipment.id} ${shipment.pickup.facility} ${shipment.dropoff.facility} ${shipment.pickup.address}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      }),
    [shipments, tab, query, serviceId],
  );

  return (
    <Screen tab tone="surface">
      <LargeTitle title="Shipments" />
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Lucide name="search" size={fS(16)} color={c.mutedForeground} style={styles.searchIcon} />
            <TextInput
              accessibilityLabel="Search shipments"
              value={query}
              onChangeText={setQuery}
              placeholder="Search ID or facility"
              style={styles.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            onPress={() => setFilterOpen(true)}
            style={styles.filterBtn}>
            <Lucide name="filter" size={fS(20)} color={c.ink} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={styles.tabScroll}>
          {SHIPMENT_TABS.map(item => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              onPress={() => setTab(item)}
              style={[styles.tabPill, tab === item ? styles.tabPillOn : styles.tabPillOff]}>
              <Text style={[styles.tabPillText, tab === item && styles.tabPillTextOn]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Refreshable onRefresh={() => pushToast('Shipments updated')}>
        <AsyncBody
          boot
          emptyTitle="No shipments yet"
          emptyBody="Book a delivery and it will show up in the matching tab.">
          {items.length === 0 ? (
            <EmptyState
              title="No matching shipments"
              body="Try another status, date, or service."
              action={
                <Button
                  onPress={() => {
                    setQuery('');
                    setServiceId('');
                  }}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <View style={styles.cardList}>
              {items.map(shipment => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onOpen={() => navigation.navigate('ShipmentDetail', { id: shipment.id })}
                />
              ))}
            </View>
          )}
        </AsyncBody>
      </Refreshable>

      <Sheet open={filterOpen} title="Filter" onClose={() => setFilterOpen(false)}>
        <Text style={TEXT.label}>Service</Text>
        <ChoiceGroup style={styles.filterGroup}>
          <ChoiceButton align="start" selected={!serviceId} onPress={() => setServiceId('')}>
            All
          </ChoiceButton>
          {services.map(service => (
            <ChoiceButton
              key={service.id}
              align="start"
              selected={serviceId === service.id}
              onPress={() => setServiceId(service.id)}>
              {service.displayName}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
        <View style={styles.stack16}>
          <Button onPress={() => setFilterOpen(false)}>Show results</Button>
        </View>
      </Sheet>
    </Screen>
  );
}

function ShipmentCard({ shipment, onOpen }) {
  const service = services.find(item => item.id === shipment.serviceId);
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={[cardStyle, styles.shipmentCard]}>
      <View style={styles.cardTop}>
        <View style={styles.cardId}>
          <ServiceIcon id={shipment.serviceId} size={16} color={c.primary} />
          <Text style={styles.cardIdText}>{shipment.id}</Text>
        </View>
        <StatusChip status={shipment.status} label={shipment.exception} />
      </View>
      <Text style={styles.cardService}>{service?.displayName}</Text>
      <Text style={styles.cardRoute}>
        {shipment.pickup.facility} to {shipment.dropoff.facility}
      </Text>
      <Text style={styles.cardWhen}>
        {formatDateET(shipment.schedule.date)} · {shipment.schedule.window || shipment.schedule.deadline} ET
      </Text>
      <Text style={styles.cardTotal}>{formatMoney(shipment.price.total)}</Text>
    </Pressable>
  );
}

/** The happy path, in order — ported verbatim. */
const LIVE_STEPS = [
  'booking_confirmed',
  'driver_assigned',
  'en_route_pickup',
  'picked_up',
  'in_transit',
  'delivered',
];

const MOVING = ['en_route_pickup', 'picked_up', 'in_transit', 'exception'];

function stopText(stop) {
  const line = [stop.facility, stop.address]
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ');
  return line || 'Not added';
}

function scheduleText(shipment) {
  const date = shipment.schedule.date;
  const when = shipment.schedule.window || shipment.schedule.deadline;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '2020-01-01') {
    return when ? `${when} ET` : 'Schedule not set';
  }
  return `${formatDateET(date, true)} · ${when || 'Window open'} ET`;
}

function liveJourney(shipment) {
  if (!LIVE_STEPS.includes(shipment.status)) return shipment.timeline;
  const stamps = new Map(shipment.timeline.map(event => [event.key, event]));
  const keys = ['request_received', ...LIVE_STEPS];
  const current = keys.indexOf(shipment.status);
  return keys.map((key, index) => {
    const saved = stamps.get(key);
    return {
      key,
      label: saved?.label || STATUS_LABEL[key] || key,
      at:
        index < current
          ? saved?.at || shipment.createdAt
          : index === current
            ? saved?.at || shipment.createdAt
            : undefined,
      state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
      note: index === current ? saved?.note : undefined,
    };
  });
}

/** The web's `animate-ping` on the live dot: scale out to 2x while fading. */
function LiveDot({ live }) {
  const ping = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live) return undefined;
    const loop = Animated.loop(
      Animated.timing(ping, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [live, ping]);

  return (
    <View style={styles.liveDotWrap}>
      {live ? (
        <Animated.View
          style={[
            styles.liveDotPing,
            {
              opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            },
          ]}
        />
      ) : null}
      <View style={[styles.liveDot, live ? styles.liveDotOn : styles.liveDotOff]} />
    </View>
  );
}

export function ShipmentDetailScreen({ route }) {
  const id = route?.params?.id;
  const navigation = useNavigation();
  const {
    shipments,
    cancelShipment,
    requestReschedule,
    reorder,
    refundEstimate,
    pushToast,
    advanceLiveShipment,
  } = useApp();
  const shipment = shipments.find(item => item.id === id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [date, setDate] = useState('');
  const [windowLabel, setWindowLabel] = useState('');
  const [doc, setDoc] = useState(null);
  const [guide, setGuide] = useState(false);
  const [notice, setNotice] = useState('');

  const seenStatus = useRef(shipment?.status);
  const advanceRef = useRef(advanceLiveShipment);
  advanceRef.current = advanceLiveShipment;

  const service = services.find(item => item.id === shipment?.serviceId);
  const live = shipment ? LIVE_STEPS.includes(shipment.status) && shipment.status !== 'delivered' : false;

  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => advanceRef.current(id), 8000);
    return () => clearInterval(timer);
  }, [id, live]);

  useEffect(() => {
    if (!shipment) return;
    if (seenStatus.current && seenStatus.current !== shipment.status) {
      setNotice(STATUS_LABEL[shipment.status]);
    }
    seenStatus.current = shipment.status;
  }, [shipment]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!shipment) {
    return (
      <Screen>
        <StackHeader title="Shipment" backTo="Shipments" />
        <EmptyState title="Shipment not found" body="It may have been removed from this preview." />
      </Screen>
    );
  }

  const estimate = refundEstimate(shipment);
  const canCancel = shipment.status !== 'delivered' && shipment.status !== 'cancelled';
  const stepIndex = LIVE_STEPS.indexOf(shipment.status);

  return (
    <Screen tone="surface">
      <StackHeader title={shipment.id} backTo="Shipments" />
      <ScrollView style={styles.flex} contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
        <AsyncBody boot emptyTitle="Shipment hidden" emptyBody="Turn preview states back to live data.">
          <View style={styles.stackList}>
            {notice ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('Notifications')}
                style={styles.noticeCard}>
                <View style={styles.noticeDot} />
                <View style={styles.flex}>
                  <Text style={styles.noticeEyebrow}>New notification</Text>
                  <Text style={styles.noticeTitle}>{notice}</Text>
                  <Text style={styles.noticeSub}>{shipment.id} just updated</Text>
                </View>
              </Pressable>
            ) : null}

            <View style={styles.liveCard}>
              <View style={styles.liveTop}>
                <View style={styles.liveLabelRow}>
                  <LiveDot live={live} />
                  <Text style={styles.liveLabel}>
                    {live ? 'Live' : shipment.status === 'delivered' ? 'Completed' : 'Updates paused'}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => setGuide(true)} style={styles.guideBtn}>
                  <Text style={styles.guideText}>Status guide</Text>
                </Pressable>
              </View>
              <View style={styles.liveHeadline}>
                <Text style={styles.liveStatus}>{shipment.exception || STATUS_LABEL[shipment.status]}</Text>
                <Text style={styles.liveSub}>
                  {shipment.eta
                    ? `ETA ${shipment.eta} · Eastern Time (ET)`
                    : live
                      ? 'Status moves forward on its own'
                      : scheduleText(shipment)}
                </Text>
              </View>
              <View style={styles.progressRow}>
                {LIVE_STEPS.map((step, index) => (
                  <View
                    key={step}
                    style={[styles.progressBar, stepIndex >= 0 && index <= stepIndex ? styles.progressOn : styles.progressOff]}
                  />
                ))}
              </View>
            </View>

            {shipment.reschedule ? (
              <Text style={styles.reschedNote}>
                Reschedule requested for {formatDateET(shipment.reschedule.date)} · {shipment.reschedule.window} ET.
                Pending confirmation.
              </Text>
            ) : null}

            <RouteMap
              pickup={shipment.pickup}
              dropoff={shipment.dropoff}
              driver={!!shipment.driver && MOVING.includes(shipment.status)}
              distance={shipment.price.distanceMiles}
            />

            {shipment.driver ? (
              <View style={[cardStyle, styles.driverCard]}>
                <Image source={shipment.driver.photo} style={styles.driverPhoto} resizeMode="cover" />
                <View style={styles.flex}>
                  <Text style={styles.panelEyebrow}>Your courier</Text>
                  <Text style={TEXT.button}>{shipment.driver.name}</Text>
                  <Text style={TEXT.caption}>
                    {shipment.driver.vehicle} · {shipment.driver.plate}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call courier"
                  onPress={() => Linking.openURL(`tel:${shipment.driver.phone}`)}
                  style={styles.callBtn}>
                  <Lucide name="phone" size={fS(20)} color={c.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Message courier"
                  onPress={() =>
                    navigation.navigate('Chat', {
                      id: shipment.id === 'SE-2026-000184' ? 't-184' : `t-${shipment.id}`,
                    })
                  }
                  style={styles.messageBtn}>
                  <Lucide name="message-circle" size={fS(20)} color={c.primaryForeground} />
                </Pressable>
              </View>
            ) : (
              <View style={[cardStyle, styles.panel]}>
                <Text style={styles.panelTitle}>Courier not assigned yet</Text>
                <Text style={styles.panelNote}>
                  You’ll get a notification when a courier is on this shipment.
                </Text>
              </View>
            )}

            <View style={[cardStyle, styles.panel]}>
              <View style={styles.panelHead}>
                <Text style={TEXT.button}>Status timeline</Text>
                {live ? <Text style={styles.updating}>Updating</Text> : null}
              </View>
              <View style={styles.stack12}>
                <Timeline
                  events={liveJourney(shipment).map(event => ({
                    ...event,
                    at: event.at ? formatDateTimeET(event.at) : undefined,
                  }))}
                />
              </View>
            </View>

            <View style={[cardStyle, styles.panel, styles.gap12]}>
              <Text style={TEXT.button}>Shipment</Text>
              <Text style={TEXT.label}>{service?.displayName || service?.title || 'Medical courier'}</Text>
              <Text style={styles.muted14}>
                {[
                  shipment.details.type,
                  shipment.details.boxSize ? `${shipment.details.quantity} × ${shipment.details.boxSize}` : '',
                  shipment.details.weightLbs ? `${shipment.details.weightLbs} lbs` : '',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Package details not added'}
              </Text>
              <Text style={styles.muted14}>
                {[shipment.details.temperature, shipment.details.handling.join(', ')]
                  .filter(Boolean)
                  .join(' · ') || 'Standard handling'}
              </Text>
              {shipment.details.description ? <Text style={TEXT.body}>{shipment.details.description}</Text> : null}
              <View style={styles.stopRow}>
                <Lucide name="map-pin" size={fS(16)} color={c.primary} style={styles.stopIcon} />
                <Text style={styles.stopText}>Pickup · {stopText(shipment.pickup)}</Text>
              </View>
              <View style={styles.stopRow}>
                <Lucide name="map-pin" size={fS(16)} color={c.brand} style={styles.stopIcon} />
                <Text style={styles.stopText}>Drop-off · {stopText(shipment.dropoff)}</Text>
              </View>
              <Text style={styles.muted14}>{scheduleText(shipment)}</Text>
            </View>

            {shipment.custody.length ? (
              <View style={[cardStyle, styles.panel]}>
                <Text style={TEXT.button}>Chain of custody</Text>
                <View style={styles.listGap8}>
                  {shipment.custody.map(event => (
                    <View key={event.id}>
                      <Text style={TEXT.label}>{event.label}</Text>
                      <Text style={TEXT.caption}>
                        {event.who} · {formatDateTimeET(event.at)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {shipment.pod ? (
              <View style={[cardStyle, styles.panel]}>
                <Text style={TEXT.button}>Proof of delivery</Text>
                <Text style={styles.stack8}>Recipient: {shipment.pod.recipient}</Text>
                <Text style={TEXT.caption}>{formatDateTimeET(shipment.pod.at)}</Text>
                {shipment.pod.hasSignature ? (
                  <View style={styles.signature}>
                    <Svg width="100%" height="100%" viewBox="0 0 240 70" accessibilityLabel="Signature">
                      <Path
                        d="M18 46c20-18 28-28 42-20 10 6 8 22-4 24-16 2-18-24 2-30 22-8 36 10 52 8 18-2 20-22 38-18 16 4 18 20 34 16"
                        fill="none"
                        stroke={c.ink}
                        strokeWidth="2"
                      />
                    </Svg>
                  </View>
                ) : null}
                <Image source={shipment.pod.photo} style={styles.podPhoto} resizeMode="cover" />
              </View>
            ) : null}

            {shipment.documents.length ? (
              <View style={[cardStyle, styles.panel]}>
                <Text style={TEXT.button}>Documents</Text>
                <View style={styles.listGap8}>
                  {shipment.documents.map(item => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => setDoc(item.name)}
                      style={styles.docRow}>
                      <Text style={styles.docName}>{item.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <PriceTable price={shipment.price} />

            {shipment.payment.refund ? (
              <View style={[cardStyle, styles.panel]}>
                <Text style={TEXT.button}>Refund status</Text>
                <Text style={styles.refundLine}>
                  Estimate {formatMoney(shipment.payment.refund.estimate)} · {shipment.payment.refund.reason}
                </Text>
                <View style={styles.listGap8}>
                  {shipment.payment.refund.timeline.map(item => (
                    <View key={item.label}>
                      <Text style={item.done ? styles.refundDone : styles.refundPending}>{item.label}</Text>
                      {item.at ? <Text style={TEXT.caption}>{formatDateTimeET(item.at)}</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.actionStack}>
              {shipment.quote && shipment.quote.status === 'sent' ? (
                <Button onPress={() => navigation.navigate('Quote', { id: shipment.id })}>Review quote</Button>
              ) : null}
              {shipment.payment.status === 'unpaid' || shipment.payment.status === 'failed' ? (
                <Button variant="secondary" onPress={() => navigation.navigate('Payment', { id: shipment.id })}>
                  {shipment.payment.status === 'failed'
                    ? 'Retry payment'
                    : `Pay ${formatMoney(shipment.price.total)}`}
                </Button>
              ) : null}
              <Button variant="secondary" onPress={() => setRescheduleOpen(true)}>
                Request reschedule
              </Button>
              <Button variant="secondary" onPress={() => goTo(navigation, 'Messages')}>
                Contact support
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  reorder(shipment.id);
                  navigation.navigate('Book');
                }}>
                Reorder
              </Button>
              {canCancel ? (
                <Button variant="danger" onPress={() => setCancelOpen(true)}>
                  Cancel shipment
                </Button>
              ) : null}
            </View>
          </View>
        </AsyncBody>
      </ScrollView>

      <Sheet open={cancelOpen} title="Cancel shipment" onClose={() => setCancelOpen(false)}>
        <Text style={styles.sheetBody}>
          You can cancel before the courier arrives at pickup. If a quote was already paid, the refund is reviewed
          against the delivery window and any completed handoff. Business, payment, and delivery records may be kept
          for audit. Closed Sunday.
        </Text>
        <Text style={styles.sheetLabel}>Reason</Text>
        <Select title="Reason" value={reason} options={CANCEL_REASONS} onChange={setReason} />
        <View style={styles.stack12}>
          <TextArea value={note} placeholder="Optional note" onChangeText={setNote} />
        </View>
        <Text style={styles.refundEstimate}>Refund estimate {formatMoney(estimate)}</Text>
        <View style={styles.stack16}>
          <Button
            variant="danger"
            onPress={() => {
              cancelShipment(shipment.id, note.trim() ? `${reason}. ${note.trim()}` : reason);
              setCancelOpen(false);
            }}>
            Confirm cancellation
          </Button>
        </View>
      </Sheet>

      <Sheet open={rescheduleOpen} title="Request reschedule" onClose={() => setRescheduleOpen(false)}>
        <Text style={TEXT.caption}>
          {business.timezoneLabel}. {business.hoursHelper}
        </Text>
        {/**
         * The web uses `<input type="date">` here. There is no date input in
         * React Native, so this reuses the same calendar the booking flow draws
         * — see atomComponents/Calendar.
         */}
        <Text style={styles.sheetLabel}>Date</Text>
        <Calendar
          value={date}
          onChange={next => {
            setDate(next);
            setWindowLabel('');
          }}
        />
        <CalendarNotes date={date} />
        {date && isSaturday(date) ? (
          <Text style={styles.saturdayNote}>Saturday windows end at 5:00 PM ET.</Text>
        ) : null}
        <ChoiceGroup style={styles.stack12}>
          {(date ? slotsFor(date) : []).map(slot => (
            <ChoiceButton key={slot} align="start" selected={windowLabel === slot} onPress={() => setWindowLabel(slot)}>
              {slot}
            </ChoiceButton>
          ))}
          {DEADLINE_TIMES.slice(0, 4).map(time => (
            <ChoiceButton
              key={time}
              align="start"
              selected={windowLabel === time}
              onPress={() => setWindowLabel(time)}>
              {`${time} ET`}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
        <View style={styles.stack16}>
          <Button
            onPress={() => {
              requestReschedule(shipment.id, date, windowLabel);
              setRescheduleOpen(false);
              pushToast('Reschedule requested');
            }}>
            Submit request
          </Button>
        </View>
      </Sheet>

      <Sheet open={!!doc} title={doc ?? 'Document'} onClose={() => setDoc(null)}>
        <Text style={styles.sheetBody}>
          Preview of {doc} for {shipment.id}. A downloadable file will connect here when the API is added.
        </Text>
        <Text style={styles.stack8Caption}>
          Eastern Time (ET) · {business.name}
        </Text>
        <View style={styles.stack16}>
          <Button onPress={() => setDoc(null)}>Close</Button>
        </View>
      </Sheet>

      <Sheet open={guide} title="Status guide" onClose={() => setGuide(false)}>
        <Text style={styles.sheetBodyPlain}>
          Happy-path updates run from request received through delivered.
        </Text>
        <Text style={styles.sheetLabel}>Exceptions</Text>
        <View style={styles.listGap4}>
          {EXCEPTION_TYPES.map(item => (
            <Text key={item} style={styles.sheetBodyPlain}>
              {item}
            </Text>
          ))}
        </View>
        <Text style={[styles.sheetBodyPlain, styles.stack12]}>
          Cancelled shipments keep their refund timeline.
        </Text>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  stack8: { ...TEXT.body, marginTop: vSize(8) },
  stack8Caption: { ...TEXT.caption, marginTop: vSize(8) },
  stack12: { marginTop: vSize(12) },
  stack16: { marginTop: vSize(16) },
  gap12: { gap: vSize(12) },
  listGap4: { marginTop: vSize(4), gap: vSize(4) },
  listGap8: { marginTop: vSize(8), gap: vSize(8) },
  panel: { padding: hSize(16) },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  panelNote: { ...TEXT.caption, fontSize: fS(13), marginTop: vSize(4) },
  panelEyebrow: { ...TEXT.chip, color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.6 },
  muted14: { ...TEXT.body, color: c.mutedForeground },

  searchWrap: { paddingHorizontal: hSize(20), paddingBottom: vSize(8) },
  searchRow: { flexDirection: 'row', gap: hSize(8) },
  searchField: { flex: 1, justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: hSize(12), zIndex: 1 },
  searchInput: { height: vSize(44), paddingLeft: hSize(36) },
  filterBtn: {
    width: hSize(44),
    height: vSize(44),
    borderRadius: RADIUS.sm,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabScroll: { marginTop: vSize(12), flexGrow: 0 },
  tabRow: { gap: hSize(8), paddingRight: hSize(20) },
  tabPill: { height: vSize(40), justifyContent: 'center', borderRadius: RADIUS.full, paddingHorizontal: hSize(12) },
  tabPillOn: { backgroundColor: c.primary },
  tabPillOff: { backgroundColor: c.card },
  tabPillText: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(13), color: c.subtle },
  tabPillTextOn: { color: c.primaryForeground },
  filterGroup: { marginTop: vSize(8) },

  cardList: { gap: vSize(12), paddingHorizontal: hSize(20), paddingBottom: vSize(24) },
  shipmentCard: { padding: hSize(16) },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  cardId: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  cardIdText: { ...TEXT.chip, color: c.mutedForeground },
  cardService: { ...TEXT.button, marginTop: vSize(8), lineHeight: LEADING.snug(fS(16)) },
  cardRoute: { ...TEXT.body, marginTop: vSize(4), color: c.subtle },
  cardWhen: { ...TEXT.caption, marginTop: vSize(4) },
  cardTotal: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, marginTop: vSize(8) },

  detailBody: { paddingHorizontal: hSize(16), paddingBottom: vSize(32) },
  stackList: { gap: vSize(12) },

  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hSize(12),
    borderRadius: 18,
    backgroundColor: c.primary,
    paddingHorizontal: hSize(16),
    paddingVertical: vSize(12),
    ...elevation(2),
  },
  noticeDot: {
    marginTop: vSize(4),
    width: hSize(10),
    height: hSize(10),
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayText,
  },
  noticeEyebrow: {
    ...TEXT.chip,
    color: c.overlayTextMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noticeTitle: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(15), color: c.overlayText },
  noticeSub: { ...TEXT.caption, color: c.overlayTextMuted },

  liveCard: { overflow: 'hidden', borderRadius: 22, backgroundColor: c.night },
  liveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hSize(16),
    paddingTop: vSize(16),
  },
  liveLabelRow: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  liveDotWrap: { width: hSize(10), height: hSize(10), alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: hSize(10), height: hSize(10), borderRadius: RADIUS.full },
  liveDotOn: { backgroundColor: c.live },
  liveDotOff: { backgroundColor: c.overlayTextMuted },
  liveDotPing: {
    position: 'absolute',
    width: hSize(10),
    height: hSize(10),
    borderRadius: RADIUS.full,
    backgroundColor: c.live,
  },
  liveLabel: { ...TEXT.chip, color: c.overlayText },
  guideBtn: { minHeight: vSize(44), justifyContent: 'center' },
  guideText: { ...TEXT.chip, color: c.overlayTextMuted },
  liveHeadline: { paddingHorizontal: hSize(16), paddingTop: vSize(4), paddingBottom: vSize(8) },
  liveStatus: { fontFamily: TEXT.title.fontFamily, fontSize: fS(26), color: c.overlayText, lineHeight: LEADING.snug(fS(26)) },
  liveSub: { ...TEXT.body, marginTop: vSize(4), color: c.overlayTextMuted },
  progressRow: { flexDirection: 'row', gap: hSize(4), paddingHorizontal: hSize(16), paddingBottom: vSize(16) },
  progressBar: { flex: 1, height: vSize(6), borderRadius: RADIUS.full },
  progressOn: { backgroundColor: c.primary },
  progressOff: { backgroundColor: c.overlayTrack },

  reschedNote: {
    ...TEXT.body,
    fontSize: fS(13),
    borderRadius: RADIUS.sm,
    backgroundColor: c.primaryTint,
    color: c.primary,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
  },

  driverCard: { flexDirection: 'row', alignItems: 'center', gap: hSize(12), padding: hSize(12) },
  driverPhoto: { width: hSize(56), height: hSize(56), borderRadius: RADIUS.full },
  callBtn: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtn: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  updating: { ...TEXT.chip, color: c.primary },

  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(8) },
  stopIcon: { marginTop: vSize(2) },
  stopText: { ...TEXT.body, flex: 1 },

  signature: {
    marginTop: vSize(12),
    height: vSize(64),
    borderRadius: RADIUS.sm,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  podPhoto: { marginTop: vSize(12), width: '100%', height: vSize(144), borderRadius: RADIUS.sm },

  docRow: { minHeight: vSize(44), justifyContent: 'center' },
  docName: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  refundLine: { ...TEXT.body, marginTop: vSize(4), color: c.mutedForeground },
  refundDone: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  refundPending: { ...TEXT.body, color: c.faint },

  actionStack: { gap: vSize(8) },

  sheetBody: { ...TEXT.body, color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },
  sheetBodyPlain: { ...TEXT.body, color: c.subtle },
  sheetLabel: { ...TEXT.label, marginTop: vSize(12), marginBottom: vSize(4) },
  refundEstimate: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, marginTop: vSize(12) },
  saturdayNote: { ...TEXT.caption, marginTop: vSize(4) },
});
