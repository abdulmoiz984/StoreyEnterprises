import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  AsyncBody,
  Button,
  ChoiceButton,
  ChoiceGroup,
  Field,
  Glow,
  Gradient,
  LEADING,
  Logo,
  RouteMap,
  Screen,
  Select,
  Sheet,
  TEXT,
  Text,
  TextArea,
  TextInput,
  cardStyle,
} from '../atomComponents';
import { business, fullAddress } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { facilityTypes, faqs, galleryItems, privacyDoc, termsDoc } from '../lib/content';
import { places } from '../lib/places';
import { formatDateTimeET, formatPhone } from '../lib/format';
import { profileGaps, profileScore } from '../lib/labels';
import { useApp } from '../hooks/useStore';
import { pickPhoto } from '../helpers/photos';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

/** Ported verbatim. */
function initials(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const mark = parts.map(part => part[0]?.toUpperCase() ?? '').join('');
  return mark || 'SE';
}

/**
 * The web's local `ProfilePage`: a dark glowing header whose bottom corners are
 * covered by a grey sheet pulled up 16pt over it.
 */
function ProfilePage({ title, subtitle, backTo = 'Profile', children }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <View style={[styles.pageHeader, { paddingTop: Math.max(vSize(10), insets.top) }]}>
        <Glow tone="primary" strong size={hSize(144)} style={styles.pageGlowRight} />
        <Glow tone="brand" size={hSize(80)} style={styles.pageGlowLeft} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate(backTo))}
          style={({ pressed }) => [styles.pageBack, pressed && styles.pressed95]}>
          <Lucide name="chevron-left" size={fS(24)} color={c.overlayText} />
        </Pressable>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        style={styles.pageSheet}
        contentContainerStyle={styles.pageSheetBody}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

/** The web's local `MenuRow`. */
function MenuRow({ glyph, label, hint, onPress, danger = false, last = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, !last && styles.menuDivider, pressed && styles.menuRowPressed]}>
      <View style={[styles.menuIcon, danger ? styles.menuIconDanger : styles.menuIconNormal]}>
        <Lucide name={glyph} size={fS(20)} color={danger ? c.brand : c.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {hint ? (
          <Text numberOfLines={1} style={TEXT.caption}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Lucide name="chevron-right" size={fS(16)} color={c.faint} />
    </Pressable>
  );
}

/** The web's local `Group`. */
function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={[cardStyle, styles.groupCard]}>{children}</View>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────── profile ── */

export function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, hydrated } = useApp();
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (hydrated && !user) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [hydrated, user, navigation]);

  if (!user) return <Screen tab />;

  const score = profileScore(user);
  const gaps = profileGaps(user);

  return (
    <Screen tab tone="surface" bar="light">
      <View style={styles.page}>
        <View style={[styles.profileHeader, { paddingTop: Math.max(vSize(18), insets.top) }]}>
          <Glow tone="primary" strong size={hSize(160)} style={styles.profileGlowRight} />
          <Glow tone="brand" size={hSize(96)} style={styles.profileGlowLeft} />
          <Text style={styles.accountEyebrow}>Account</Text>
          <View style={styles.identityRow}>
            <View style={styles.avatarLarge}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarFill} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initials(user.fullName)}</Text>
              )}
            </View>
            <View style={styles.identityText}>
              <Text numberOfLines={1} style={styles.identityName}>
                {user.fullName || 'Your profile'}
              </Text>
              <Text numberOfLines={1} style={styles.identityCompany}>
                {user.companyName || user.accountType}
              </Text>
              <Text numberOfLines={1} style={styles.identityEmail}>
                {user.email}
              </Text>
            </View>
          </View>
          <View style={styles.completeCard}>
            <View style={styles.completeTop}>
              <Text style={styles.completeLabel}>Profile completeness</Text>
              <Text style={styles.completeValue}>{score}%</Text>
            </View>
            <View style={styles.completeTrack}>
              <View style={[styles.completeFill, { width: `${score}%` }]} />
            </View>
            <Text style={styles.completeNote}>
              {gaps[0] ? `${gaps[0]} is still needed before booking.` : 'Ready to book shipments.'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.pageSheet}
          contentContainerStyle={styles.profileSheetBody}
          showsVerticalScrollIndicator={false}>
          <AsyncBody boot emptyTitle="Profile unavailable" emptyBody="Sign in to see your account.">
            <Group title="Account">
              <MenuRow
                glyph="user-round"
                label="Edit profile"
                hint={user.phone || 'Name, email, and phone'}
                onPress={() => navigation.navigate('EditProfile')}
              />
              <MenuRow
                glyph="building-2"
                label="Business and billing"
                hint={user.billingEmail || 'Facility and billing details'}
                onPress={() => navigation.navigate('Billing')}
                last
              />
            </Group>
            <Group title="Courier">
              <MenuRow
                glyph="map-pin"
                label="Saved addresses"
                hint="Facilities you use often"
                onPress={() => navigation.navigate('Addresses')}
              />
              <MenuRow
                glyph="credit-card"
                label="Payment methods"
                hint="Square test cards"
                onPress={() => navigation.navigate('PaymentMethods')}
              />
              <MenuRow glyph="package" label="My shipments" onPress={() => navigation.navigate('Shipments')} />
              <MenuRow glyph="truck" label="All services" onPress={() => navigation.navigate('Services')} />
              <MenuRow glyph="image" label="Gallery" onPress={() => navigation.navigate('Gallery')} />
              <MenuRow glyph="message-circle" label="Messages" onPress={() => navigation.navigate('Messages')} last />
            </Group>
            <Group title="Support">
              <MenuRow
                glyph="bell"
                label="Notification settings"
                onPress={() => navigation.navigate('NotificationSettings')}
              />
              <MenuRow glyph="circle-help" label="Help and FAQs" onPress={() => navigation.navigate('Help')} />
              <MenuRow glyph="phone" label="Contact us" onPress={() => navigation.navigate('Contact')} />
              <MenuRow glyph="info" label="About us" onPress={() => navigation.navigate('About')} />
              <MenuRow
                glyph="file-text"
                label="Terms &amp; Conditions"
                onPress={() => navigation.navigate('Legal', { kind: 'terms' })}
              />
              <MenuRow
                glyph="shield"
                label="Privacy Policy"
                onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}
                last
              />
            </Group>
            <Group title="App">
              <MenuRow
                glyph="settings"
                label="Settings"
                hint="Preview states and time zone"
                onPress={() => navigation.navigate('Settings')}
              />
              <MenuRow glyph="log-out" label="Log out" onPress={() => setConfirm(true)} />
              <MenuRow
                glyph="trash-2"
                label="Delete account"
                danger
                onPress={() => navigation.navigate('DeleteAccount')}
                last
              />
            </Group>
            {user.termsAcceptedAt ? (
              <Text style={styles.termsNote}>
                Terms accepted {formatDateTimeET(user.termsAcceptedAt)} · v{user.policyVersion}
              </Text>
            ) : null}
          </AsyncBody>
        </ScrollView>
      </View>

      <Sheet open={confirm} title="Log out" onClose={() => setConfirm(false)}>
        <Text style={styles.sheetBody}>You can log back in with the same email.</Text>
        <View style={styles.sheetActions}>
          <Button
            onPress={() => {
              logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}>
            Log out
          </Button>
          <Button variant="secondary" onPress={() => setConfirm(false)}>
            Stay signed in
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}

/* ─────────────────────────────────────────────────────────── edit profile ── */

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser, focusField, setFocusField } = useApp();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [photo, setPhoto] = useState(user?.photo ?? '');
  const [accountType, setAccountType] = useState(user?.accountType ?? 'individual');

  /**
   * The web focuses the gap field with `document.getElementById(id).focus()`.
   * There are no DOM ids here, so the same three fields carry refs and the
   * `focusField` value maps onto them.
   */
  const refs = { 'Full name': useRef(null), Email: useRef(null), 'Mobile phone': useRef(null) };

  useEffect(() => {
    refs[focusField]?.current?.focus();
    return () => setFocusField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusField]);

  return (
    <Screen bar="light">
      <ProfilePage title="Edit profile" subtitle="Name, contact, and account type.">
        <View style={styles.formStack}>
          <View style={[cardStyle, styles.photoCard]}>
            <View style={styles.avatarMedium}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatarFill} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitialsSmall}>{initials(fullName)}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const uri = await pickPhoto();
                if (uri) setPhoto(uri);
              }}
              style={styles.changePhoto}>
              <Text style={styles.changePhotoText}>Change photo</Text>
            </Pressable>
          </View>
          <Field label="Full name">
            <TextInput ref={refs['Full name']} value={fullName} onChangeText={setFullName} />
          </Field>
          <Field label="Email">
            <TextInput
              ref={refs.Email}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </Field>
          <Field label="Mobile phone">
            <TextInput
              ref={refs['Mobile phone']}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={value => setPhone(formatPhone(value))}
            />
          </Field>
          <Field label="Account type">
            <Select
              title="Account type"
              value={accountType}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' },
              ]}
              onChange={setAccountType}
            />
          </Field>
          <Button
            onPress={() => {
              updateUser({ fullName, email, phone: formatPhone(phone), photo, accountType });
              navigation.navigate('Profile');
            }}>
            Save
          </Button>
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ──────────────────────────────────────────────────────────────── billing ── */

export function BillingScreen() {
  const navigation = useNavigation();
  const { user, updateUser, focusField, setFocusField } = useApp();
  const [companyName, setCompanyName] = useState(user?.companyName ?? '');
  const [facilityType, setFacilityType] = useState(user?.facilityType || 'Clinic');
  const [billingAddress, setBillingAddress] = useState(user?.billingAddress ?? '');
  const [billingEmail, setBillingEmail] = useState(user?.billingEmail ?? '');
  const [taxId, setTaxId] = useState(user?.taxId ?? '');

  const refs = {
    'Company name': useRef(null),
    'Billing address': useRef(null),
    'Billing email': useRef(null),
  };

  useEffect(() => {
    refs[focusField]?.current?.focus();
    return () => setFocusField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusField]);

  return (
    <Screen bar="light">
      <ProfilePage title="Business and billing" subtitle="Used for quotes and receipts, not shipment stops.">
        <View style={styles.formStack}>
          <Field label="Company name">
            <TextInput ref={refs['Company name']} value={companyName} onChangeText={setCompanyName} />
          </Field>
          <Field label="Facility type">
            <Select title="Facility type" value={facilityType} options={facilityTypes} onChange={setFacilityType} />
          </Field>
          <Field label="Billing address">
            <TextArea ref={refs['Billing address']} value={billingAddress} onChangeText={setBillingAddress} />
          </Field>
          <Field label="Billing email">
            <TextInput
              ref={refs['Billing email']}
              keyboardType="email-address"
              autoCapitalize="none"
              value={billingEmail}
              onChangeText={setBillingEmail}
            />
          </Field>
          <Field label="Tax ID" hint="Optional">
            <TextInput value={taxId} onChangeText={setTaxId} />
          </Field>
          <Button
            onPress={() => {
              updateUser({ companyName, facilityType, billingAddress, billingEmail, taxId });
              navigation.navigate('Profile');
            }}>
            Save
          </Button>
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ────────────────────────────────────────────────────────────── addresses ── */

export function AddressesScreen() {
  const { addresses, addAddress, removeAddress } = useApp();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [placeId, setPlaceId] = useState(places[0]?.id ?? '');
  const place = places.find(item => item.id === placeId);

  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Saved addresses" subtitle="These stay separate until you confirm one during booking.">
        <AsyncBody boot emptyTitle="No saved addresses" emptyBody="Add a facility you use often.">
          <View style={styles.listGap12}>
            {addresses.map(address => (
              <View key={address.id} style={[cardStyle, styles.panel]}>
                <View style={styles.addressTop}>
                  <View style={styles.menuIconNormal}>
                    <Lucide name="map-pin" size={fS(20)} color={c.primary} />
                  </View>
                  <View style={styles.addressText}>
                    <Text style={TEXT.button}>{address.label}</Text>
                    <Text style={styles.body14Subtle}>{address.facility}</Text>
                    <Text style={styles.addressLine}>{address.line}</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => removeAddress(address.id)}
                  style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </AsyncBody>
        <View style={styles.stack16}>
          <Button onPress={() => setOpen(true)}>Add address</Button>
        </View>
      </ProfilePage>

      <Sheet open={open} title="Add address" onClose={() => setOpen(false)}>
        <Field label="Label">
          <TextInput value={label} onChangeText={setLabel} placeholder="Main clinic" />
        </Field>
        <Text style={styles.sheetLabel}>Facility</Text>
        <Select
          title="Facility"
          value={placeId}
          options={places.map(item => ({ value: item.id, label: item.facility }))}
          onChange={setPlaceId}
        />
        <View style={styles.stack16}>
          <Button
            onPress={() => {
              if (!place) return;
              addAddress({
                label: label.trim() || place.facility,
                line: place.label,
                facility: place.facility,
                placeId: place.id,
              });
              setLabel('');
              setOpen(false);
            }}>
            Save address
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}

/* ──────────────────────────────────────────────────────── payment methods ── */

export function PaymentMethodsScreen() {
  const { cards, removeCard, addCard } = useApp();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');

  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Payment methods" subtitle="Square test mode. Cards ending in 0002 decline.">
        <Text style={styles.testModeChip}>Square · TEST MODE</Text>
        <AsyncBody
          boot
          emptyTitle="No cards saved"
          emptyBody="Add a test card. Numbers ending in 0002 will decline.">
          <View style={styles.listGap12}>
            {cards.map(card => (
              <View key={card.id} style={styles.cardTile}>
                <Gradient colors={[c.primary, c.night]} />
                <View style={styles.cardTileInner}>
                <Text style={styles.cardBrand}>{card.brand}</Text>
                <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                <Text style={styles.cardExp}>
                  Exp {card.exp}
                  {card.fails ? ' · Declines in test mode' : ''}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => removeCard(card.id)} style={styles.removeBtn}>
                  <Text style={styles.removeTextLight}>Remove</Text>
                </Pressable>
                </View>
              </View>
            ))}
          </View>
        </AsyncBody>
        <View style={styles.stack16}>
          <Button onPress={() => setOpen(true)}>Add card</Button>
        </View>
      </ProfilePage>

      <Sheet open={open} title="Add card" onClose={() => setOpen(false)}>
        <Field label="Card number">
          <TextInput
            keyboardType="number-pad"
            value={number}
            onChangeText={setNumber}
            placeholder="4242 4242 4242 4242"
          />
        </Field>
        <View style={styles.stack12}>
          <Field label="Exp">
            <TextInput placeholder="MM/YY" value={exp} onChangeText={setExp} />
          </Field>
        </View>
        <View style={styles.stack16}>
          <Button
            onPress={() => {
              const last4 = (number.replace(/\D/g, '').slice(-4) || '4242').padStart(4, '0');
              addCard({ brand: 'Visa', last4, exp: exp || '12/28', fails: last4 === '0002' });
              setNumber('');
              setExp('');
              setOpen(false);
            }}>
            Save card
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}

/* ──────────────────────────────────────────────────────────────── gallery ── */

export function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(false);
  const item = active != null ? galleryItems[active] : null;

  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Gallery" subtitle="Handoffs, coolers, and proof from completed work.">
        <AsyncBody boot emptyTitle="No gallery items" emptyBody="Completed-work photos will appear here.">
          <View style={styles.galleryGrid}>
            {galleryItems.map((entry, index) => (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                onPress={() => {
                  setActive(index);
                  setPlaying(false);
                }}
                style={styles.galleryTile}>
                <View>
                  <Image source={entry.src} style={styles.galleryThumb} resizeMode="cover" />
                  {entry.kind === 'video' ? (
                    <View style={styles.videoChip}>
                      <Lucide name="play" size={fS(12)} color={c.ink} />
                      <Text style={styles.videoChipText}>Video</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.galleryCaption}>{entry.title}</Text>
              </Pressable>
            ))}
          </View>
        </AsyncBody>
      </ProfilePage>

      {/**
       * The web renders the lightbox as an absolutely positioned layer inside
       * its own phone frame. A Modal is the device equivalent and also traps the
       * Android back button, which closes the viewer rather than the screen.
       *
       * The "video" is a still with a Play glyph and a fake progress bar in the
       * web too — there is no player — so no video dependency is pulled in here.
       */}
      <Modal visible={!!item} animationType="fade" onRequestClose={() => setActive(null)} statusBarTranslucent>
        {item ? (
          <View style={styles.lightbox}>
            <View style={[styles.lightboxTop, { paddingTop: Math.max(vSize(8), insets.top) }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setActive(null)}
                style={styles.lightboxBtn}>
                <Lucide name="x" size={fS(24)} color={c.overlayText} />
              </Pressable>
              <Text style={styles.lightboxTitle}>{item.title}</Text>
              <View style={styles.lightboxBtn} />
            </View>

            <Pressable
              accessibilityRole="button"
              style={styles.lightboxStage}
              onPress={() => item.kind === 'video' && setPlaying(true)}>
              <Image source={item.src} style={styles.lightboxImage} resizeMode="contain" />
              {item.kind === 'video' && !playing ? (
                <View style={styles.playOverlay}>
                  <Lucide name="play" size={fS(48)} color={c.overlayText} />
                </View>
              ) : null}
              {playing ? (
                <View style={styles.videoTrack}>
                  <View style={styles.videoFill} />
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.lightboxBody}>{item.caption}</Text>
            <View style={[styles.lightboxNav, { paddingBottom: Math.max(vSize(24), insets.bottom) }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setActive(index => (index == null ? 0 : (index + galleryItems.length - 1) % galleryItems.length))
                }
                style={styles.lightboxNavBtn}>
                <Text style={styles.lightboxNavText}>Previous</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActive(index => (index == null ? 0 : (index + 1) % galleryItems.length))}
                style={styles.lightboxNavBtn}>
                <Text style={styles.lightboxNavText}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}

/* ─────────────────────────────────────────────────────────────── settings ── */

export function SettingsScreen() {
  const { listPreview, setListPreview, connectivity, setConnectivity } = useApp();
  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Settings" subtitle="Preview tools for this design build.">
        <View style={[cardStyle, styles.panel]}>
          <Text style={TEXT.button}>Preview states</Text>
          <Text style={styles.panelNote}>Show loading, empty, and error layouts on list screens.</Text>
          <ChoiceGroup style={styles.twoColWrap}>
            {['live', 'loading', 'empty', 'error'].map(mode => (
              <ChoiceButton
                key={mode}
                selected={listPreview === mode}
                onPress={() => setListPreview(mode)}
                style={styles.halfCol}>
                {mode[0].toUpperCase() + mode.slice(1)}
              </ChoiceButton>
            ))}
          </ChoiceGroup>
        </View>

        <View style={[cardStyle, styles.panel, styles.stack12]}>
          <View style={styles.offlineRow}>
            <View style={styles.flex}>
              <Text style={TEXT.button}>Offline</Text>
              <Text style={TEXT.caption}>Show the offline banner.</Text>
            </View>
            <Switch
              value={connectivity === 'offline'}
              onValueChange={value => setConnectivity(value ? 'offline' : 'online')}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.card}
              ios_backgroundColor={c.border}
            />
          </View>
        </View>

        <View style={[cardStyle, styles.panel, styles.stack12, styles.gap8]}>
          <Text style={styles.body14Subtle}>Time zone: {business.timezoneLabel}</Text>
          <Text style={styles.body14Subtle}>{business.hoursChip}</Text>
          <Text style={styles.body14Subtle}>App preview 1.0 · Design phase</Text>
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ───────────────────────────────────────────────────────── delete account ── */

export function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { deleteAccount } = useApp();
  const [password, setPassword] = useState('');
  return (
    <Screen bar="light">
      <ProfilePage title="Delete account" subtitle="This removes the sign-in profile on this device.">
        <View style={styles.formStack}>
          <View style={[cardStyle, styles.panel]}>
            <Text style={styles.sheetBody}>
              Business, payment, audit, and delivery records may be retained as required.
            </Text>
          </View>
          <Field label="Password">
            <TextInput secureTextEntry value={password} onChangeText={setPassword} />
          </Field>
          <Button
            variant="danger"
            onPress={() => {
              deleteAccount(password);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}>
            Delete account
          </Button>
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ────────────────────────────────────────────────────────────────── about ── */

export function AboutScreen() {
  return (
    <Screen bar="light">
      <ProfilePage title="About us" subtitle={business.tagline}>
        <View style={[cardStyle, styles.photoCard]}>
          <Logo size={64} />
          <View>
            <Text style={TEXT.title}>{business.name}</Text>
            <Text style={styles.caption13}>Chesterfield · Central Virginia</Text>
          </View>
        </View>
        <Text style={styles.aboutLead}>
          Storey Enterprises is a medical courier company serving Chesterfield, Richmond, and Central Virginia. We
          move specimens, prescriptions, supplies, documents, and equipment between healthcare facilities.
        </Text>
        <View style={[cardStyle, styles.panel, styles.stack12]}>
          <Text style={TEXT.button}>Mission</Text>
          <Text style={styles.panelBody}>
            Give clinics, labs, pharmacies, and hospitals a courier they can track, with proof of delivery they can
            keep.
          </Text>
        </View>
        <View style={[cardStyle, styles.panel, styles.stack12]}>
          <Text style={TEXT.button}>Licensed and insured</Text>
          <Text style={styles.panelBody}>{business.licensedNote}</Text>
        </View>
        <View style={[cardStyle, styles.panel, styles.stack12]}>
          <Text style={TEXT.button}>Service area</Text>
          <Text style={styles.panelBody}>{business.serviceAreaNote}</Text>
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ──────────────────────────────────────────────────────────────── contact ── */

export function ContactScreen() {
  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Contact us" subtitle="Dispatch for Central Virginia.">
        <Text style={styles.placeholderNote}>{business.contactPlaceholder}</Text>
        <View style={[cardStyle, styles.panel, styles.stack12, styles.gap12]}>
          <Text style={TEXT.button}>{business.name}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(`mailto:${business.email}`)}
            style={styles.contactLink}>
            <Lucide name="mail" size={fS(16)} color={c.primary} />
            <Text style={styles.contactLinkText}>{business.email}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(`tel:${business.phoneTel}`)}
            style={styles.contactLink}>
            <Lucide name="phone" size={fS(16)} color={c.primary} />
            <Text style={styles.contactLinkText}>{business.phoneDisplay}</Text>
          </Pressable>
          <View style={styles.contactAddress}>
            <Lucide name="map-pin" size={fS(16)} color={c.primary} style={styles.addressIcon} />
            <Text style={styles.body14Subtle}>{fullAddress()}</Text>
          </View>
          <Text style={TEXT.caption}>{business.hoursChip}</Text>
        </View>
        <View style={styles.stack12}>
          <RouteMap
            pickup={{ lat: business.origin.lat, lng: business.origin.lng, label: business.origin.label }}
          />
        </View>
        <Text style={styles.aboutLead}>{business.serviceAreaNote}</Text>
      </ProfilePage>
    </Screen>
  );
}

/* ─────────────────────────────────────────────────────────────────── help ── */

export function HelpScreen() {
  const [open, setOpen] = useState(0);
  return (
    <Screen tone="surface" bar="light">
      <ProfilePage title="Help and FAQs" subtitle="Booking, tracking, and proof of delivery.">
        <View style={[cardStyle, styles.faqCard]}>
          {faqs.map((item, index) => (
            <View key={item.q} style={[index < faqs.length - 1 && styles.menuDivider]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open === index }}
                onPress={() => setOpen(open === index ? null : index)}
                style={styles.faqRow}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Lucide
                  name={open === index ? 'chevron-down' : 'chevron-right'}
                  size={fS(16)}
                  color={c.faint}
                />
              </Pressable>
              {open === index ? <Text style={styles.faqAnswer}>{item.a}</Text> : null}
            </View>
          ))}
        </View>
      </ProfilePage>
    </Screen>
  );
}

/* ────────────────────────────────────────────────────────────────── legal ── */

export function LegalScreen({ route }) {
  const kind = route?.params?.kind ?? 'terms';
  const doc = kind === 'terms' ? termsDoc : privacyDoc;
  return (
    <Screen bar="light">
      <ProfilePage title={doc.title} subtitle={`Version ${doc.version} · Updated ${doc.updated}`}>
        <Text style={styles.placeholderNote}>Replace with client-approved text.</Text>
        {doc.sections.map(section => (
          <View key={section.heading} style={[cardStyle, styles.panel, styles.stack12]}>
            <Text style={TEXT.button}>{section.heading}</Text>
            <Text style={styles.panelBody}>{section.body}</Text>
          </View>
        ))}
      </ProfilePage>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed95: { transform: [{ scale: 0.95 }] },
  formStack: { gap: vSize(16) },
  listGap12: { gap: vSize(12) },
  gap8: { gap: vSize(8) },
  gap12: { gap: vSize(12) },
  stack12: { marginTop: vSize(12) },
  stack16: { marginTop: vSize(16) },
  panel: { padding: hSize(16) },
  panelNote: { ...TEXT.caption, marginTop: vSize(4) },
  panelBody: { ...TEXT.body, marginTop: vSize(4), color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },
  body14Subtle: { ...TEXT.body, color: c.subtle },
  caption13: { ...TEXT.caption, fontSize: fS(13) },

  page: { flex: 1, minHeight: 0, backgroundColor: c.surface },
  pageHeader: {
    overflow: 'hidden',
    backgroundColor: c.night,
    paddingHorizontal: hSize(12),
    paddingBottom: vSize(28),
  },
  pageGlowRight: { position: 'absolute', right: -hSize(32), top: -vSize(48) },
  pageGlowLeft: { position: 'absolute', left: -hSize(32), bottom: 0 },
  pageBack: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: fS(26),
    marginTop: vSize(4),
    paddingHorizontal: hSize(8),
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(26)),
  },
  pageSubtitle: {
    ...TEXT.body,
    marginTop: vSize(4),
    paddingHorizontal: hSize(8),
    color: c.overlayTextDim,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  /** `-mt-4 rounded-t-[24px]` — the sheet rides 16pt over the dark header. */
  pageSheet: {
    flex: 1,
    minHeight: 0,
    marginTop: -vSize(16),
    borderTopLeftRadius: RADIUS.xl2,
    borderTopRightRadius: RADIUS.xl2,
    backgroundColor: c.surface,
  },
  pageSheetBody: { paddingHorizontal: hSize(16), paddingTop: vSize(20), paddingBottom: vSize(32) },
  profileSheetBody: { paddingHorizontal: hSize(16), paddingTop: vSize(8), paddingBottom: vSize(32) },

  profileHeader: {
    overflow: 'hidden',
    backgroundColor: c.night,
    paddingHorizontal: hSize(20),
    paddingBottom: vSize(32),
  },
  profileGlowRight: { position: 'absolute', right: -hSize(40), top: -vSize(64) },
  profileGlowLeft: { position: 'absolute', left: -hSize(32), bottom: 0 },
  accountEyebrow: {
    ...TEXT.chip,
    color: c.overlayTextEyebrow,
    textTransform: 'uppercase',
    letterSpacing: 1.9,
  },
  identityRow: { marginTop: vSize(16), flexDirection: 'row', alignItems: 'center', gap: hSize(16) },
  avatarLarge: {
    width: hSize(72),
    height: hSize(72),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.overlayRing,
  },
  avatarFill: { width: '100%', height: '100%' },
  avatarInitials: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.primary },
  identityText: { flex: 1, minWidth: 0 },
  identityName: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: fS(22),
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(22)),
  },
  identityCompany: { ...TEXT.body, marginTop: vSize(4), color: c.overlayTextMuted },
  identityEmail: { ...TEXT.caption, fontSize: fS(13), color: c.overlayTextFaint },
  completeCard: {
    marginTop: vSize(20),
    borderRadius: RADIUS.lg,
    backgroundColor: c.overlayFill,
    padding: hSize(12),
  },
  completeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completeLabel: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(13), color: c.overlayText },
  completeValue: { fontFamily: TEXT.caption.fontFamily, fontSize: fS(13), color: c.overlayText },
  completeTrack: {
    marginTop: vSize(8),
    height: vSize(6),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayTrackLight,
  },
  completeFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: c.primary },
  completeNote: { ...TEXT.caption, marginTop: vSize(8), color: c.overlayTextDim },

  group: { marginTop: vSize(16) },
  groupTitle: {
    ...TEXT.chip,
    paddingHorizontal: hSize(4),
    color: c.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  groupCard: { marginTop: vSize(8), overflow: 'hidden' },
  menuRow: {
    minHeight: vSize(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(12),
    paddingHorizontal: hSize(12),
  },
  menuRowPressed: { backgroundColor: c.tintBg },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: c.border },
  menuIcon: {
    width: hSize(40),
    height: hSize(40),
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconNormal: {
    width: hSize(40),
    height: hSize(40),
    borderRadius: RADIUS.full,
    backgroundColor: c.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: c.dangerTint },
  menuText: { flex: 1, minWidth: 0 },
  menuLabel: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(15), color: c.ink },
  menuLabelDanger: { color: c.brand },
  termsNote: { ...TEXT.caption, marginTop: vSize(16), paddingHorizontal: hSize(4) },

  sheetBody: { ...TEXT.body, color: c.subtle, lineHeight: LEADING.relaxed(fS(14)) },
  sheetActions: { marginTop: vSize(16), gap: vSize(8) },
  sheetLabel: { ...TEXT.label, marginTop: vSize(12), marginBottom: vSize(4) },

  photoCard: { flexDirection: 'row', alignItems: 'center', gap: hSize(16), padding: hSize(16) },
  avatarMedium: {
    width: hSize(64),
    height: hSize(64),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsSmall: { fontFamily: TEXT.title.fontFamily, fontSize: fS(18), color: c.primary },
  changePhoto: { minHeight: vSize(44), justifyContent: 'center' },
  changePhotoText: { fontFamily: TEXT.chip.fontFamily, fontSize: fS(15), color: c.primary },

  addressTop: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(12) },
  addressText: { flex: 1, minWidth: 0 },
  addressLine: { ...TEXT.caption, lineHeight: LEADING.relaxed(fS(12)) },
  removeBtn: { marginTop: vSize(12), minHeight: vSize(44), justifyContent: 'center', alignSelf: 'flex-start' },
  removeText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.brand },
  removeTextLight: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.overlayText },

  testModeChip: {
    ...TEXT.chip,
    marginBottom: vSize(12),
    borderRadius: RADIUS.sm,
    backgroundColor: c.warningTintStrong,
    color: c.warningText,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
    overflow: 'hidden',
  },
  /** Radius here, padding on the inner View — see the note on `hero` in home.js. */
  cardTile: { overflow: 'hidden', borderRadius: 18 },
  cardTileInner: { padding: hSize(16) },
  cardBrand: {
    ...TEXT.chip,
    color: c.overlayTextDim,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  cardNumber: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: fS(22),
    marginTop: vSize(12),
    letterSpacing: 2.6,
    color: c.overlayText,
  },
  cardExp: { ...TEXT.caption, fontSize: fS(13), marginTop: vSize(8), color: c.overlayTextDim },

  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: hSize(12) },
  galleryTile: {
    width: '47.5%',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    backgroundColor: c.card,
    ...elevation(1),
  },
  galleryThumb: { width: '100%', height: vSize(128) },
  videoChip: {
    position: 'absolute',
    bottom: vSize(8),
    left: hSize(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(4),
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayGlass,
    paddingHorizontal: hSize(8),
    paddingVertical: vSize(4),
  },
  videoChipText: { ...TEXT.chip, color: c.ink },
  galleryCaption: {
    fontFamily: TEXT.chip.fontFamily,
    fontSize: fS(13),
    paddingHorizontal: hSize(8),
    paddingVertical: vSize(8),
    color: c.ink,
  },

  lightbox: { flex: 1, backgroundColor: c.night },
  lightboxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hSize(8),
  },
  lightboxBtn: { width: hSize(44), height: hSize(44), alignItems: 'center', justifyContent: 'center' },
  lightboxTitle: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.overlayText },
  lightboxStage: { flex: 1, minHeight: 0, justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  videoTrack: {
    position: 'absolute',
    left: hSize(16),
    right: hSize(16),
    bottom: vSize(16),
    height: vSize(4),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayTrackMid,
  },
  videoFill: { height: '100%', width: '66%', backgroundColor: c.overlayText },
  lightboxBody: {
    ...TEXT.body,
    paddingHorizontal: hSize(16),
    paddingBottom: vSize(16),
    color: c.overlayTextSoft,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  lightboxNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: hSize(16) },
  lightboxNavBtn: { minHeight: vSize(44), justifyContent: 'center' },
  lightboxNavText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.overlayText },

  twoColWrap: { marginTop: vSize(12), flexDirection: 'row', flexWrap: 'wrap', gap: hSize(8) },
  halfCol: { width: '48%' },
  offlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(12) },

  aboutLead: {
    ...TEXT.body,
    fontSize: fS(15),
    marginTop: vSize(16),
    color: c.subtle,
    lineHeight: LEADING.relaxed(fS(15)),
  },

  placeholderNote: {
    ...TEXT.caption,
    borderRadius: RADIUS.sm,
    backgroundColor: c.warningTint,
    color: c.warningText,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
    overflow: 'hidden',
  },
  contactLink: { minHeight: vSize(44), flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  contactLinkText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },
  contactAddress: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(8) },
  addressIcon: { marginTop: vSize(2) },

  faqCard: { overflow: 'hidden' },
  faqRow: {
    minHeight: vSize(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: hSize(12),
    paddingHorizontal: hSize(16),
    paddingVertical: vSize(12),
  },
  faqQuestion: { flex: 1, fontFamily: TEXT.chip.fontFamily, fontSize: fS(15), color: c.ink },
  faqAnswer: {
    ...TEXT.body,
    paddingHorizontal: hSize(16),
    paddingBottom: vSize(16),
    color: c.subtle,
    lineHeight: LEADING.relaxed(fS(14)),
  },
});
