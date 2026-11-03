import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  Button,
  Calendar,
  CalendarNotes,
  ChoiceButton,
  ChoiceGroup,
  Field,
  LEADING,
  LegalSheet,
  PriceTable,
  RouteMap,
  Screen,
  Select,
  ServiceIcon,
  Sheet,
  SuccessMark,
  TEXT,
  Text,
  TextArea,
  TextInput,
  cardStyle,
} from '../atomComponents';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import { boxSizes, handlingOptions, shipmentTypes, temperatureOptions, weightRanges } from '../lib/content';
import { placeById, placeFromAddress, searchPlaces } from '../lib/places';
import { services } from '../lib/services';
import { formatDateET, formatMoney, formatPhone, isSaturday } from '../lib/format';
import { drivingDistance, geocodeAddress, placeDetails, suggestAddresses } from '../lib/maps';
import {
  DELIVERY_TYPES,
  draftMiles,
  draftPrice,
  intentLabel,
  milesFromOrigin,
  outOfArea,
  submitIntent,
  weightRangeFor,
} from '../lib/pricing';
import { DEADLINE_TIMES, slotState, slotsFor } from '../lib/schedule';
import { useApp } from '../hooks/useStore';
import { pickPhoto, pickPhotos } from '../helpers/photos';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

const TITLES = [
  '',
  'Service and delivery type',
  'Pickup details',
  'Drop-off details',
  'Shipment details',
  'Schedule',
  'Review and price',
  'Confirmation',
];

/** The web's `/5` tinted toggle, as a Switch. Same two states, same colours. */
function Toggle({ value, onValueChange, label }) {
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: c.border, true: c.primary }}
      thumbColor={c.card}
      ios_backgroundColor={c.border}
    />
  );
}

export function BookingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { draft, setDraft, user, createShipment, pushToast, addresses } = useApp();
  const [done, setDone] = useState(null);
  const [priorityInfo, setPriorityInfo] = useState(false);
  const [legal, setLegal] = useState(null);
  const [confirmProfile, setConfirmProfile] = useState(null);
  const [confirmSaved, setConfirmSaved] = useState(null);

  const step = done ? 7 : draft.step;
  const price = useMemo(() => draftPrice(draft), [draft]);
  const intent = submitIntent(draft);
  const urgent = draft.deliveryType === 'stat' || draft.deliveryType === 'after-hours';

  const patchStop = (target, patch) => {
    setDraft(current => ({
      ...current,
      drivingMiles:
        patch.address !== undefined || patch.lat !== undefined ? null : current.drivingMiles,
      [target]: { ...current[target], ...patch },
    }));
  };

  useEffect(() => {
    const pickup = draft.pickup;
    const dropoff = draft.dropoff;
    if (pickup.lat == null || pickup.lng == null || dropoff.lat == null || dropoff.lng == null) return undefined;
    let cancelled = false;
    // The web wraps these in TanStack `createServerFn`, so its call site passes
    // `{ data: { … } }`. The port in `lib/maps` is a plain axios function, so
    // the parameters go straight in — see that file for why the key handling
    // changed with it.
    drivingDistance({
      originLat: pickup.lat,
      originLng: pickup.lng,
      destLat: dropoff.lat,
      destLng: dropoff.lng,
    }).then(result => {
      if (cancelled || result.miles == null) return;
      setDraft(current => {
        if (current.pickup.lat !== pickup.lat || current.pickup.lng !== pickup.lng) return current;
        if (current.dropoff.lat !== dropoff.lat || current.dropoff.lng !== dropoff.lng) return current;
        return { ...current, drivingMiles: result.miles };
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.pickup.lat, draft.pickup.lng, draft.dropoff.lat, draft.dropoff.lng]);

  const go = next => setDraft({ step: next });
  const submit = () => setDone(createShipment(draft));

  const applyPlace = (target, placeId, extra) => {
    const place = placeById(placeId);
    if (!place) return;
    patchStop(target, {
      address: place.label,
      facility: extra?.facility || place.facility,
      milesFromOrigin: place.milesFromOrigin,
      lat: place.lat,
      lng: place.lng,
      ...extra,
    });
  };

  return (
    <Screen tone="surface">
      {step < 7 ? (
        <>
          <View style={[styles.header, { paddingTop: Math.max(vSize(8), insets.top) }]}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => (step === 1 ? navigation.navigate('Home') : go(step - 1))}
                style={styles.headerBtn}>
                <Lucide name="chevron-left" size={fS(24)} color={c.ink} />
              </Pressable>
              <Text style={styles.stepCount}>Step {step} of 7</Text>
              <View style={styles.headerBtn} />
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(step / 7) * 100}%` }]} />
            </View>
            <Text style={styles.stepTitle}>{TITLES[step]}</Text>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.stepBody}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}>
            {step === 1 ? (
              <StepService draft={draft} setDraft={setDraft} onInfo={() => setPriorityInfo(true)} />
            ) : null}
            {step === 2 ? (
              <StopForm
                target="pickup"
                title="Pickup"
                stop={draft.pickup}
                onChange={patch => patchStop('pickup', patch)}
                onProfile={() => setConfirmProfile('pickup')}
                onSaved={(placeId, label) => setConfirmSaved({ target: 'pickup', placeId, label })}
                addresses={addresses}
              />
            ) : null}
            {step === 3 ? (
              <>
                <StopForm
                  target="drop"
                  title="Drop-off"
                  stop={draft.dropoff}
                  onChange={patch => patchStop('dropoff', patch)}
                  onProfile={() => setConfirmProfile('dropoff')}
                  onSaved={(placeId, label) => setConfirmSaved({ target: 'dropoff', placeId, label })}
                  addresses={addresses}
                />
                <View style={styles.stack16}>
                  <RouteMap pickup={draft.pickup} dropoff={draft.dropoff} distance={draftMiles(draft) || undefined} />
                </View>
              </>
            ) : null}
            {step === 4 ? <StepShipment draft={draft} setDraft={setDraft} pushToast={pushToast} /> : null}
            {step === 5 ? <StepSchedule draft={draft} setDraft={setDraft} urgent={urgent} /> : null}
            {step === 6 ? (
              <StepReview
                draft={draft}
                onEdit={next => setDraft({ step: next })}
                onMode={priceMode => setDraft({ priceMode })}
                onTerms={() => setLegal('terms')}
              />
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(vSize(12), insets.bottom) }]}>
            <View style={styles.footerRow}>
              <View style={styles.flex}>
                <Text style={TEXT.caption}>Estimated total</Text>
                {price.distanceMiles > 0 ? (
                  <Text style={styles.footerMiles}>{price.distanceMiles} mi pickup to drop-off</Text>
                ) : null}
              </View>
              <Text style={TEXT.title}>{formatMoney(price.total)}</Text>
            </View>
            <Button onPress={() => (step === 6 ? submit() : go(step + 1))}>
              {step === 6 ? intentLabel(intent) : 'Continue'}
            </Button>
          </View>
        </>
      ) : done ? (
        <Confirmation shipment={done} quoted={done.status !== 'booking_confirmed'} />
      ) : null}

      <Sheet open={priorityInfo} title="Priority add-on" onClose={() => setPriorityInfo(false)}>
        <Text style={styles.sheetBody}>
          Priority add-on (+$10) asks dispatch to place this shipment ahead of routine work when capacity allows.
          Benefits and final rate pending client confirmation.
        </Text>
        <View style={styles.stack16}>
          <Button onPress={() => setPriorityInfo(false)}>Close</Button>
        </View>
      </Sheet>

      <Sheet open={!!confirmProfile} title="Use my profile address" onClose={() => setConfirmProfile(null)}>
        <Text style={styles.sheetBody}>
          Profile addresses are kept separate from shipments. Confirm to use this billing address for the{' '}
          {confirmProfile === 'dropoff' ? 'drop-off' : 'pickup'}.
        </Text>
        <Text style={styles.addressPreview}>
          {user?.billingAddress || 'No billing address on the profile yet.'}
        </Text>
        <View style={styles.sheetActions}>
          <Button
            onPress={() => {
              if (!confirmProfile) return;
              const place = placeFromAddress(user?.billingAddress ?? '');
              if (!place) {
                patchStop(confirmProfile, {
                  address: user?.billingAddress ?? '',
                  facility: user?.companyName ?? '',
                  lat: null,
                  lng: null,
                  milesFromOrigin: null,
                });
              } else {
                applyPlace(confirmProfile, place.id, {
                  facility: user?.companyName || place.facility,
                  contact: user?.fullName,
                  phone: user?.phone,
                });
              }
              setConfirmProfile(null);
            }}>
            Confirm address
          </Button>
          <Button variant="secondary" onPress={() => setConfirmProfile(null)}>
            Cancel
          </Button>
        </View>
      </Sheet>

      <Sheet open={!!confirmSaved} title="Use saved address" onClose={() => setConfirmSaved(null)}>
        <Text style={styles.sheetBodyPlain}>
          Saved addresses are not applied until you confirm them for this shipment.
        </Text>
        <Text style={styles.savedLabel}>{confirmSaved?.label}</Text>
        <View style={styles.sheetActions}>
          <Button
            onPress={() => {
              if (!confirmSaved) return;
              applyPlace(confirmSaved.target, confirmSaved.placeId);
              setConfirmSaved(null);
            }}>
            Confirm address
          </Button>
          <Button variant="secondary" onPress={() => setConfirmSaved(null)}>
            Cancel
          </Button>
        </View>
      </Sheet>

      <LegalSheet kind={legal} onClose={() => setLegal(null)} />
    </Screen>
  );
}

/* ───────────────────────────────────────────────────── step 1: service ── */

function StepService({ draft, setDraft, onInfo }) {
  return (
    <View style={styles.stepStack}>
      <Field label="Service">
        <View style={styles.rowStack}>
          {services.map(service => {
            const on = draft.serviceId === service.id;
            return (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() =>
                  setDraft({ serviceId: service.id, cargoVan: service.id === '06' ? draft.cargoVan : false })
                }
                style={[styles.optionRow, on ? styles.optionRowOn : styles.optionRowOff]}>
                <ServiceIcon id={service.id} color={c.primary} />
                <Text style={styles.optionRowLabel}>{service.displayName}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Delivery type">
        <View style={styles.rowStack}>
          {DELIVERY_TYPES.map(type => {
            const on = draft.deliveryType === type.id;
            return (
              <Pressable
                key={type.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setDraft({ deliveryType: type.id })}
                style={[styles.typeCard, on ? styles.typeCardOn : styles.typeCardOff]}>
                <View style={styles.typeTop}>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                  <View style={styles.typeMeta}>
                    {type.stat ? (
                      <View style={styles.statPill}>
                        <Text style={styles.statPillText}>STAT</Text>
                      </View>
                    ) : null}
                    <Text style={styles.typeFee}>{type.fee}</Text>
                  </View>
                </View>
                <Text style={styles.typeBody}>{type.body}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <View style={styles.togglePanel}>
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text style={styles.toggleLabel}>Priority add-on (+$10)</Text>
            <Pressable accessibilityRole="button" onPress={onInfo} style={styles.infoLink}>
              <Lucide name="info" size={fS(14)} color={c.primary} />
              <Text style={styles.infoLinkText}>Benefits and final rate</Text>
            </Pressable>
          </View>
          <Toggle
            label="Priority add-on"
            value={draft.priorityAddon}
            onValueChange={() => setDraft({ priorityAddon: !draft.priorityAddon })}
          />
        </View>
      </View>

      {draft.serviceId === '06' ? (
        <View style={styles.togglePanel}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, styles.flex]}>Cargo van rental request</Text>
            <Toggle
              label="Cargo van rental request"
              value={draft.cargoVan}
              onValueChange={() => setDraft({ cargoVan: !draft.cargoVan })}
            />
          </View>
          <Text style={styles.toggleNote}>Arranged in advance, subject to rental availability.</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ────────────────────────────────────────────── steps 2 and 3: the stops ── */

function StopForm({ target, title, stop, onChange, onProfile, onSaved, addresses }) {
  const [query, setQuery] = useState(stop.address);
  const [remote, setRemote] = useState([]);
  const [resolving, setResolving] = useState(false);
  const local = searchPlaces(query);
  const outside = outOfArea(stop);

  useEffect(() => {
    setQuery(stop.address);
  }, [stop.address]);

  /** Debounced Places autocomplete — the web's 300ms, unchanged. */
  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setRemote([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      suggestAddresses({ query: text }).then(result => {
        if (cancelled) return;
        setRemote(result.suggestions);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  /** Debounced geocode once the address looks complete — the web's 700ms. */
  useEffect(() => {
    const address = stop.address.trim();
    if (address.length < 8 || stop.lat != null) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setResolving(true);
      geocodeAddress({ address })
        .then(place => {
          if (cancelled || !place) return;
          onChange({
            address: place.label,
            lat: place.lat,
            lng: place.lng,
            milesFromOrigin: milesFromOrigin(place.lat, place.lng),
            facility: stop.facility || place.name,
          });
        })
        .finally(() => {
          if (!cancelled) setResolving(false);
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop.address, stop.lat]);

  const chooseSuggestion = item => {
    setResolving(true);
    setRemote([]);
    placeDetails({ placeId: item.id })
      .then(place => {
        if (!place) return;
        setQuery(place.label);
        onChange({
          address: place.label,
          lat: place.lat,
          lng: place.lng,
          milesFromOrigin: milesFromOrigin(place.lat, place.lng),
          facility: stop.facility || place.name,
        });
      })
      .finally(() => setResolving(false));
  };

  const showSuggestions = (remote.length > 0 || local.length > 0) && query.trim().length > 1;

  return (
    <View style={styles.stepStack}>
      <ChoiceGroup>
        <ChoiceButton align="start" onPress={onProfile}>
          Use my profile address
        </ChoiceButton>
        {addresses.map(address => (
          <ChoiceButton key={address.id} align="start" onPress={() => onSaved(address.placeId, address.line)}>
            {address.label}
          </ChoiceButton>
        ))}
      </ChoiceGroup>

      <Field label={`${title} address`}>
        <TextInput
          value={query}
          placeholder="Street, city, or ZIP"
          onChangeText={value => {
            setQuery(value);
            onChange({ address: value, lat: null, lng: null, milesFromOrigin: null });
          }}
        />
        {resolving ? <Text style={styles.resolving}>Checking this address…</Text> : null}
        {showSuggestions ? (
          <View style={styles.suggestions}>
            {remote.length > 0
              ? remote.map(place => (
                  <Pressable
                    key={place.id}
                    accessibilityRole="button"
                    onPress={() => chooseSuggestion(place)}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
                    <Text style={TEXT.label}>{place.main}</Text>
                    <Text style={TEXT.caption}>{place.label}</Text>
                  </Pressable>
                ))
              : local.map(place => (
                  <Pressable
                    key={place.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setQuery(place.label);
                      onChange({
                        address: place.label,
                        facility: stop.facility || place.facility,
                        milesFromOrigin: place.milesFromOrigin,
                        lat: place.lat,
                        lng: place.lng,
                      });
                    }}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
                    <Text style={TEXT.label}>{place.facility}</Text>
                    <Text style={TEXT.caption}>
                      {place.label} · {place.milesFromOrigin} mi from Chesterfield
                    </Text>
                  </Pressable>
                ))}
          </View>
        ) : null}
      </Field>

      {outside ? (
        <Text style={styles.outsideNote}>
          This location is outside our standard service area. You can still submit a request for review.
        </Text>
      ) : null}

      <Field label="Facility/Business name">
        <TextInput value={stop.facility} onChangeText={value => onChange({ facility: value })} />
      </Field>
      <Field label={target === 'pickup' ? 'Contact person' : 'Recipient/Contact name'}>
        <TextInput value={stop.contact} onChangeText={value => onChange({ contact: value })} />
      </Field>
      <Field label="Contact phone">
        <TextInput
          keyboardType="phone-pad"
          value={stop.phone}
          onChangeText={value => onChange({ phone: formatPhone(value) })}
        />
      </Field>
      <Field label={target === 'pickup' ? 'Floor/Suite/Access instructions' : 'Access/receiving instructions'}>
        <TextInput value={stop.access} onChangeText={value => onChange({ access: value })} />
      </Field>
      <Field label={target === 'pickup' ? 'Pickup notes' : 'Delivery notes'}>
        <TextArea value={stop.notes} onChangeText={value => onChange({ notes: value })} />
      </Field>
    </View>
  );
}

/* ──────────────────────────────────────────── step 4: shipment details ── */

/** The web caps photos at 5 and warns past that. */
const PHOTO_LIMIT = 5;

function StepShipment({ draft, setDraft, pushToast }) {
  const details = draft.details;
  const setDetails = patch =>
    setDraft(current => ({ ...current, details: { ...current.details, ...patch } }));

  const addPhotos = uris => {
    if (!uris.length) return;
    if (details.photos.length + uris.length > PHOTO_LIMIT) {
      pushToast('Photo limit', 'You can add up to 5 photos.');
    }
    setDraft(current => ({
      ...current,
      details: {
        ...current.details,
        photos: [...current.details.photos, ...uris].slice(0, PHOTO_LIMIT),
      },
    }));
  };

  return (
    <View style={styles.stepStackTight}>
      <Field label="Shipment type">
        <ChoiceGroup style={styles.gridWrap}>
          {shipmentTypes.map(type => (
            <ChoiceButton
              key={type}
              selected={details.type === type}
              onPress={() => setDetails({ type })}
              style={styles.halfCol}>
              {type}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
      </Field>

      <View style={styles.twoCol}>
        <Field label="Box quantity" style={styles.flex}>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              onPress={() => setDetails({ quantity: Math.max(1, details.quantity - 1) })}
              style={styles.stepperBtn}>
              <Lucide name="minus" size={fS(20)} color={c.ink} />
            </Pressable>
            <Text style={styles.stepperValue}>{details.quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              onPress={() => setDetails({ quantity: details.quantity + 1 })}
              style={styles.stepperBtn}>
              <Lucide name="plus" size={fS(20)} color={c.ink} />
            </Pressable>
          </View>
        </Field>
        <Field label="Declared value" style={styles.flex}>
          <TextInput
            keyboardType="decimal-pad"
            value={details.declaredValue}
            onChangeText={value => setDetails({ declaredValue: value })}
            placeholder="Optional"
          />
        </Field>
      </View>

      <Field label="Box size">
        <ChoiceGroup style={styles.gridWrap}>
          {boxSizes.map(size => {
            const on = details.boxSize === size.id;
            return (
              <ChoiceButton
                key={size.id}
                align="start"
                selected={on}
                onPress={() => setDetails({ boxSize: size.id })}
                style={styles.halfCol}>
                <View>
                  <Text style={[styles.boxSizeId, on && styles.boxSizeIdOn]}>{size.id}</Text>
                  <Text style={[styles.boxSizeHint, on && styles.boxSizeHintOn]}>{size.hint}</Text>
                </View>
              </ChoiceButton>
            );
          })}
        </ChoiceGroup>
      </Field>

      {details.boxSize === 'Custom' ? (
        <View style={styles.threeCol}>
          {['length', 'width', 'height'].map(key => (
            <Field
              key={key}
              label={key === 'length' ? 'L (in)' : key === 'width' ? 'W (in)' : 'H (in)'}
              style={styles.flex}>
              <TextInput
                keyboardType="decimal-pad"
                value={details[key]}
                onChangeText={value => setDetails({ [key]: value })}
              />
            </Field>
          ))}
        </View>
      ) : null}

      <Field label="Weight (lbs)">
        <TextInput
          keyboardType="decimal-pad"
          value={details.weight}
          onChangeText={weight => {
            const numeric = Number(weight);
            setDetails({ weight, weightRange: numeric > 0 ? weightRangeFor(numeric) : details.weightRange });
          }}
        />
      </Field>

      <Field label="Weight range (lbs)">
        <ChoiceGroup style={styles.gridWrap}>
          {weightRanges.map(range => (
            <ChoiceButton
              key={range}
              selected={details.weightRange === range}
              onPress={() => setDetails({ weightRange: range })}
              style={styles.quarterCol}>
              {range}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
      </Field>

      <Field label="Shipment description">
        <TextArea
          value={details.description}
          onChangeText={value => setDetails({ description: value })}
          style={styles.shortTextArea}
        />
      </Field>

      <Field label="Handling instructions">
        <ChoiceGroup style={styles.gridWrap}>
          {handlingOptions.map(option => {
            const on = details.handling.includes(option);
            return (
              <ChoiceButton
                key={option}
                selected={on}
                onPress={() =>
                  setDetails({
                    handling: on ? details.handling.filter(item => item !== option) : [...details.handling, option],
                  })
                }
                style={styles.halfCol}>
                {option}
              </ChoiceButton>
            );
          })}
        </ChoiceGroup>
      </Field>

      <Field label="Temperature requirement">
        <ChoiceGroup style={styles.gridWrap}>
          {temperatureOptions.map(option => (
            <ChoiceButton
              key={option}
              selected={details.temperature === option}
              onPress={() => setDetails({ temperature: option })}
              style={styles.halfCol}>
              {option}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
      </Field>

      {details.temperature === 'Other' ? (
        <Field label="Other temperature">
          <TextInput
            value={details.temperatureOther}
            onChangeText={value => setDetails({ temperatureOther: value })}
          />
        </Field>
      ) : null}

      <Field label="Item photos" hint="Optional, up to 5">
        <View style={styles.twoCol}>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const uri = await pickPhoto({ fromCamera: true });
              if (uri) addPhotos([uri]);
            }}
            style={[styles.photoBtn, styles.flex]}>
            <Lucide name="camera" size={fS(16)} color={c.primary} />
            <Text style={styles.photoBtnText}>Camera</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={async () => addPhotos(await pickPhotos(PHOTO_LIMIT))}
            style={[styles.photoBtn, styles.flex]}>
            <Lucide name="image-plus" size={fS(16)} color={c.primary} />
            <Text style={styles.photoBtnText}>Gallery</Text>
          </Pressable>
        </View>
        {details.photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
            {details.photos.map((photo, index) => (
              <View key={photo.slice(0, 24) + index} style={styles.thumbWrap}>
                <Image source={{ uri: photo }} style={styles.thumb} resizeMode="cover" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  onPress={() =>
                    setDetails({ photos: details.photos.filter((_, photoIndex) => photoIndex !== index) })
                  }
                  style={styles.thumbRemove}>
                  <Lucide name="x" size={fS(12)} color={c.overlayText} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </Field>
    </View>
  );
}

/* ──────────────────────────────────────────────────── step 5: schedule ── */

function StepSchedule({ draft, setDraft, urgent }) {
  const slots = slotsFor(draft.schedule.date);
  const deadlineOptions = DEADLINE_TIMES.map(time => ({ value: time, label: `${time} ET` }));

  return (
    <View style={styles.stepStack}>
      <Text style={styles.timezoneLabel}>{business.timezoneLabel}</Text>
      <Text style={TEXT.caption}>{business.hoursHelper}</Text>

      <Calendar
        value={draft.schedule.date}
        onChange={date =>
          setDraft(current => ({ ...current, schedule: { ...current.schedule, date, window: '' } }))
        }
      />
      <CalendarNotes date={draft.schedule.date} />
      {draft.schedule.date && isSaturday(draft.schedule.date) ? (
        <Text style={TEXT.caption}>Saturday windows end at 5:00 PM ET.</Text>
      ) : null}

      {urgent ? (
        <Field label="Requested delivery deadline" hint="Availability is confirmed by our team.">
          <Select
            title="Requested delivery deadline"
            placeholder="Select a time"
            value={draft.schedule.deadline}
            options={deadlineOptions}
            onChange={deadline =>
              setDraft(current => ({ ...current, schedule: { ...current.schedule, deadline, window: '' } }))
            }
          />
        </Field>
      ) : (
        <Field label="Delivery window">
          <ChoiceGroup>
            {slots.map(slot => {
              const state = slotState(draft.schedule.date, slot);
              return (
                <ChoiceButton
                  key={slot}
                  align="start"
                  selected={draft.schedule.window === slot}
                  onPress={() =>
                    setDraft(current => ({ ...current, schedule: { ...current.schedule, window: slot } }))
                  }>
                  <View style={styles.slotRow}>
                    {state === 'booked' ? <Lucide name="lock" size={fS(16)} color={c.ink} /> : null}
                    <Text style={styles.slotText}>{slot}</Text>
                  </View>
                </ChoiceButton>
              );
            })}
          </ChoiceGroup>
        </Field>
      )}

      {!urgent ? (
        <Field label="Requested delivery deadline" hint="Optional. Eastern Time (ET).">
          <Select
            title="Requested delivery deadline"
            placeholder="No deadline"
            value={draft.schedule.deadline}
            options={DEADLINE_TIMES}
            onChange={deadline =>
              setDraft(current => ({ ...current, schedule: { ...current.schedule, deadline } }))
            }
          />
        </Field>
      ) : null}
    </View>
  );
}

/* ────────────────────────────────────────────────────── step 6: review ── */

const PRICE_MODES = [
  { value: 'auto', label: 'Automatic' },
  { value: 'book', label: 'Instant rate' },
  { value: 'quote', label: 'Needs review' },
];

function StepReview({ draft, onEdit, onMode, onTerms }) {
  const service = services.find(item => item.id === draft.serviceId);
  const price = draftPrice(draft);

  const cards = [
    {
      step: 1,
      title: 'Service and type',
      body: `${service?.displayName ?? 'Service'} · ${draft.deliveryType || 'Not set'}${
        draft.priorityAddon ? ' · Priority add-on' : ''
      }${draft.cargoVan ? ' · Cargo van' : ''}`,
    },
    {
      step: 2,
      title: 'Pickup',
      body: `${draft.pickup.facility}\n${draft.pickup.address}\n${draft.pickup.contact} · ${draft.pickup.phone}`,
    },
    {
      step: 3,
      title: 'Drop-off',
      body: `${draft.dropoff.facility}\n${draft.dropoff.address}\n${draft.dropoff.contact} · ${draft.dropoff.phone}`,
    },
    {
      step: 4,
      title: 'Shipment details',
      body: `${draft.details.type} · ${draft.details.quantity} × ${draft.details.boxSize}\n${draft.details.weight} lbs (${draft.details.weightRange})\n${draft.details.temperature}\n${
        draft.details.handling.join(', ') || 'No special handling'
      }\n${draft.details.description}`,
    },
    {
      step: 5,
      title: 'Schedule',
      body: `${draft.schedule.date ? formatDateET(draft.schedule.date, true) : 'Date not set'}\n${
        draft.schedule.window || draft.schedule.deadline || 'Window not set'
      } · Eastern Time (ET)`,
    },
  ];

  return (
    <View style={styles.stepStackTight}>
      {cards.map(card => (
        <View key={card.title} style={[cardStyle, styles.reviewCard]}>
          <View style={styles.reviewTop}>
            <Text style={styles.reviewTitle}>{card.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${card.title}`}
              onPress={() => onEdit(card.step)}
              style={styles.editBtn}>
              <Lucide name="pencil" size={fS(16)} color={c.primary} />
            </Pressable>
          </View>
          <Text style={styles.reviewBody}>{card.body}</Text>
        </View>
      ))}

      <View style={[cardStyle, styles.reviewCard]}>
        <Text style={styles.reviewTitle}>Add-ons</Text>
        <Text style={styles.addonBody}>
          {draft.priorityAddon ? 'Priority add-on' : 'No priority add-on'}
          {draft.cargoVan ? ' · Cargo van rental' : ''}
        </Text>
      </View>

      <View style={[cardStyle, styles.reviewCard]}>
        <Text style={styles.priceModeLabel}>Preview price state</Text>
        <ChoiceGroup style={styles.stack8}>
          {PRICE_MODES.map(mode => (
            <ChoiceButton
              key={mode.value}
              align="start"
              selected={draft.priceMode === mode.value}
              onPress={() => onMode(mode.value)}>
              {mode.label}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
      </View>

      <PriceTable price={price} />

      <Text style={styles.termsLine}>
        By submitting you agree to the{' '}
        <Text style={styles.termsLink} onPress={onTerms}>
          Terms &amp; Conditions
        </Text>
        .
      </Text>
    </View>
  );
}

/* ────────────────────────────────────────────────── step 7: confirmation ── */

function Confirmation({ shipment, quoted }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.confirmation,
        { paddingTop: Math.max(vSize(28), insets.top), paddingBottom: Math.max(vSize(32), insets.bottom) },
      ]}
      showsVerticalScrollIndicator={false}>
      <SuccessMark />
      <Text style={styles.confirmTitle}>{quoted ? 'Request received' : 'Booking confirmed'}</Text>
      <Text style={styles.confirmId}>{shipment.id}</Text>

      <View style={styles.confirmPanel}>
        <Text style={styles.confirmPanelTitle}>{quoted ? 'Request received' : 'Booking confirmed'}</Text>
        <Text style={styles.confirmRoute}>
          {shipment.pickup.facility} to {shipment.dropoff.facility}
        </Text>
        <Text style={TEXT.caption}>
          {formatDateET(shipment.schedule.date, true)} ·{' '}
          {shipment.schedule.window || shipment.schedule.deadline} ET
        </Text>
        <Text style={styles.confirmTotal}>{formatMoney(shipment.price.total)}</Text>
        <Text style={TEXT.caption}>{business.priceCaption}</Text>
      </View>

      <View style={styles.confirmActions}>
        <Button onPress={() => navigation.navigate('ShipmentDetail', { id: shipment.id })}>Track Shipment</Button>
        <Button variant="secondary" onPress={() => navigation.navigate('Chat', { id: `t-${shipment.id}` })}>
          Message Support
        </Button>
        <Button variant="ghost" onPress={() => navigation.navigate('Home')}>
          Return Home
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },
  stack8: { marginTop: vSize(8) },
  stack16: { marginTop: vSize(16) },
  stepStack: { gap: vSize(16) },
  stepStackTight: { gap: vSize(12) },
  rowStack: { gap: vSize(8) },
  twoCol: { flexDirection: 'row', gap: hSize(12) },
  threeCol: { flexDirection: 'row', gap: hSize(8) },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: hSize(8) },
  halfCol: { width: '48%' },
  quarterCol: { width: '23%' },

  header: { backgroundColor: c.card, paddingHorizontal: hSize(12), paddingBottom: vSize(12) },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: hSize(44), height: hSize(44), alignItems: 'center', justifyContent: 'center' },
  stepCount: { ...TEXT.chip, flex: 1, textAlign: 'center', color: c.mutedForeground },
  progressTrack: {
    marginHorizontal: hSize(8),
    marginTop: vSize(4),
    height: vSize(4),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.border,
  },
  progressFill: { height: '100%', backgroundColor: c.primary },
  stepTitle: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: fS(22),
    paddingHorizontal: hSize(8),
    paddingTop: vSize(12),
    color: c.ink,
  },

  stepBody: { paddingHorizontal: hSize(16), paddingVertical: vSize(16) },

  footer: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(16),
    paddingTop: vSize(12),
  },
  footerRow: {
    marginBottom: vSize(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: hSize(12),
  },
  footerMiles: { ...TEXT.caption, marginTop: vSize(2) },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(12),
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: hSize(12),
  },
  optionRowOn: { borderColor: c.primary, backgroundColor: c.primaryTintSoft },
  optionRowOff: { borderColor: c.border, backgroundColor: c.card },
  optionRowLabel: { ...TEXT.label, flex: 1, fontFamily: TEXT.chip.fontFamily, lineHeight: LEADING.snug(fS(14)) },

  typeCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: hSize(12) },
  typeCardOn: { borderColor: c.primary, backgroundColor: c.card },
  typeCardOff: { borderColor: c.border, backgroundColor: c.card },
  typeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  typeTitle: { ...TEXT.button, flex: 1 },
  typeMeta: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  statPill: {
    borderRadius: RADIUS.full,
    backgroundColor: c.brand,
    paddingHorizontal: hSize(8),
    paddingVertical: vSize(2),
  },
  statPillText: { ...TEXT.chip, color: c.overlayText },
  typeFee: { ...TEXT.chip, color: c.primary },
  typeBody: { ...TEXT.body, marginTop: vSize(4), color: c.mutedForeground },

  togglePanel: { borderRadius: RADIUS.lg, backgroundColor: c.card, padding: hSize(12) },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(12) },
  toggleLabel: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  toggleNote: { ...TEXT.caption, marginTop: vSize(4) },
  infoLink: { marginTop: vSize(4), flexDirection: 'row', alignItems: 'center', gap: hSize(4) },
  infoLinkText: { ...TEXT.chip, color: c.primary },

  resolving: { ...TEXT.caption, marginTop: vSize(4) },
  suggestions: {
    marginTop: vSize(8),
    overflow: 'hidden',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },
  suggestion: { paddingHorizontal: hSize(12), paddingVertical: vSize(12) },
  suggestionPressed: { backgroundColor: c.surface },
  outsideNote: {
    ...TEXT.body,
    fontSize: fS(13),
    borderRadius: RADIUS.sm,
    backgroundColor: c.warningTint,
    color: c.warningText,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
    lineHeight: LEADING.snug(fS(13)),
    overflow: 'hidden',
  },

  stepper: {
    height: vSize(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(4),
  },
  stepperBtn: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { ...TEXT.title },

  boxSizeId: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  boxSizeIdOn: { color: c.primary },
  boxSizeHint: { ...TEXT.caption, fontFamily: TEXT.label.fontFamily },
  boxSizeHintOn: { color: c.primaryTextSoft },

  shortTextArea: { minHeight: vSize(64) },

  photoBtn: {
    minHeight: vSize(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hSize(8),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(12),
  },
  photoBtnText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },
  photoStrip: { marginTop: vSize(8), gap: hSize(8), paddingTop: vSize(4), paddingRight: hSize(8) },
  thumbWrap: { width: hSize(64), height: hSize(64) },
  thumb: { width: '100%', height: '100%', borderRadius: RADIUS.sm },
  thumbRemove: {
    position: 'absolute',
    right: -hSize(4),
    top: -vSize(4),
    width: hSize(24),
    height: hSize(24),
    borderRadius: RADIUS.full,
    backgroundColor: c.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timezoneLabel: { ...TEXT.chip, color: c.primary },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  slotText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },

  reviewCard: { padding: hSize(12) },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: hSize(8) },
  reviewTitle: { ...TEXT.label, flex: 1, fontFamily: TEXT.chip.fontFamily },
  editBtn: { width: hSize(44), height: hSize(44), alignItems: 'center', justifyContent: 'center' },
  reviewBody: { ...TEXT.body, color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },
  addonBody: { ...TEXT.body, marginTop: vSize(4), color: c.subtle },
  priceModeLabel: { ...TEXT.chip, color: c.mutedForeground },
  termsLine: { ...TEXT.caption, lineHeight: LEADING.snug(fS(12)) },
  termsLink: { fontFamily: TEXT.chip.fontFamily, color: c.primary },

  sheetBody: { ...TEXT.body, color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },
  sheetBodyPlain: { ...TEXT.body, color: c.subtle },
  sheetActions: { marginTop: vSize(16), gap: vSize(8) },
  addressPreview: {
    ...TEXT.body,
    marginTop: vSize(12),
    borderRadius: RADIUS.sm,
    backgroundColor: c.surface,
    padding: hSize(12),
    overflow: 'hidden',
  },
  savedLabel: { ...TEXT.label, marginTop: vSize(12) },

  confirmation: { paddingHorizontal: hSize(20) },
  confirmTitle: { ...TEXT.largeTitle, marginTop: vSize(20), textAlign: 'center' },
  confirmId: { ...TEXT.body, marginTop: vSize(8), textAlign: 'center', color: c.mutedForeground },
  confirmPanel: {
    marginTop: vSize(16),
    borderRadius: RADIUS.lg,
    backgroundColor: c.surface,
    padding: hSize(16),
  },
  confirmPanelTitle: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  confirmRoute: { ...TEXT.body, marginTop: vSize(8), lineHeight: LEADING.relaxed(fS(14)) },
  confirmTotal: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, marginTop: vSize(8) },
  confirmActions: { marginTop: vSize(24), gap: vSize(12) },
});
