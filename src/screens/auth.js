import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  AppleMark,
  Button,
  ChoiceButton,
  ChoiceGroup,
  Field,
  Glow,
  GoogleMark,
  LEADING,
  LegalSheet,
  Logo,
  PhotoScrim,
  Screen,
  Select,
  SuccessMark,
  TEXT,
  Text,
  TextInput,
} from '../atomComponents';
import { business } from '../constants/business';
import { LIGHT as c } from '../globalStyle/tokens';
import { MOTION, RADIUS } from '../globalStyle/Theme';
import { facilityTypes, onboardingSlides } from '../lib/content';
import { formatPhone } from '../lib/format';
import { useApp } from '../hooks/useStore';
import { pickPhoto } from '../helpers/photos';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

/* ───────────────────────────────────────────────────────────────── splash ── */

export function SplashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { hydrated } = useApp();

  /** `animate-[logo-in_900ms_ease-out_both]` and the 2.4s progress fill. */
  const fade = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: MOTION.logoMs,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(bar, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [fade, bar]);

  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    }, 2500);
    return () => clearTimeout(timer);
  }, [hydrated, navigation]);

  const rise = fade.interpolate({ inputRange: [0, 1], outputRange: [vSize(16), 0] });

  return (
    <Screen bar="light">
      <View style={styles.splash}>
        <Glow tone="primary" size={hSize(288)} style={styles.splashGlowTop} />
        <Glow tone="brand" size={hSize(288)} style={styles.splashGlowBottom} />

        <Animated.View style={[styles.splashCentre, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={styles.logoRing}>
            <Logo size={160} />
          </View>
          <Text style={styles.splashTitle}>{business.shortName}</Text>
          <Text style={styles.splashTagline}>{business.tagline}</Text>
          <View style={styles.splashRule} />
        </Animated.View>

        <View style={[styles.splashFooter, { paddingBottom: Math.max(vSize(28), insets.bottom) }]}>
          <View style={styles.splashTrack}>
            <Animated.View
              style={[
                styles.splashFill,
                { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

/* ───────────────────────────────────────────────────────────── onboarding ── */

export function OnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { markOnboarded } = useApp();
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index] ?? onboardingSlides[0];
  const last = index === onboardingSlides.length - 1;

  const finish = () => {
    markOnboarded();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <Screen bar="light">
      <ImageBackground source={slide.image} style={styles.onboarding} resizeMode="cover">
        <PhotoScrim />
        <View style={styles.onboardingContent}>
          <View style={[styles.skipRow, { paddingTop: Math.max(vSize(12), insets.top) }]}>
            <Pressable accessibilityRole="button" onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={[styles.onboardingCopy, { paddingBottom: Math.max(vSize(20), insets.bottom) }]}>
            <Text style={styles.onboardingTitle}>{slide.title}</Text>
            <Text style={styles.onboardingBody}>{slide.body}</Text>
            <View style={styles.dots}>
              {onboardingSlides.map((item, dot) => (
                <Pressable
                  key={item.title}
                  accessibilityRole="button"
                  accessibilityLabel={`Slide ${dot + 1}`}
                  accessibilityState={{ selected: dot === index }}
                  onPress={() => setIndex(dot)}
                  style={[styles.dot, dot === index ? styles.dotOn : styles.dotOff]}
                />
              ))}
            </View>
            <View style={styles.stack24}>
              <Button onPress={() => (last ? finish() : setIndex(value => value + 1))}>
                {last ? "Let's Get Started" : 'Next'}
              </Button>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Screen>
  );
}

/* ────────────────────────────────────────────────────────── shared shell ── */

/**
 * The web's local `AuthScreen` wrapper: a dark header with two glows and the
 * logo, over a white sheet that holds the form.
 *
 * The sheet scrolls and sets `automaticallyAdjustKeyboardInsets` so a focused
 * field near the bottom is not left under the keyboard — the browser scrolls
 * the focused input into view for free, and React Native does not.
 */
function AuthScreen({ title, subtitle, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Screen bar="light">
      <View style={styles.authWrap}>
        <View style={[styles.authHeader, { paddingTop: Math.max(vSize(20), insets.top) }]}>
          <Glow tone="primary" strong size={hSize(160)} style={styles.authGlowRight} />
          <Glow tone="brand" strong size={hSize(112)} style={styles.authGlowLeft} />
          <Logo size={56} style={styles.authLogo} />
          <Text style={styles.authTitle}>{title}</Text>
          {subtitle ? <Text style={styles.authSubtitle}>{subtitle}</Text> : null}
        </View>
        <ScrollView
          style={styles.authSheet}
          contentContainerStyle={[styles.authSheetBody, { paddingBottom: Math.max(vSize(20), insets.bottom) }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Screen>
  );
}

/** The web's local `SocialButtons`. */
function SocialButtons({ onGoogle, onApple }) {
  return (
    <View style={styles.socialStack}>
      <Pressable
        accessibilityRole="button"
        onPress={onGoogle}
        style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed98]}>
        <GoogleMark />
        <Text style={TEXT.button}>Continue with Google</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onApple}
        style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed98]}>
        <AppleMark />
        <Text style={TEXT.button}>Continue with Apple</Text>
      </Pressable>
    </View>
  );
}

/**
 * The show/hide eye the web overlays on its password inputs. React Native has
 * `secureTextEntry` rather than a `type`, so the toggle flips that.
 */
function PasswordInput({ show, onToggle, ...rest }) {
  return (
    <View style={styles.passwordWrap}>
      <TextInput secureTextEntry={!show} autoCorrect={false} {...rest} style={styles.passwordInput} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={show ? 'Hide password' : 'Show password'}
        onPress={onToggle}
        style={styles.eyeBtn}>
        <Lucide name={show ? 'eye-off' : 'eye'} size={fS(20)} color={c.ink} />
      </Pressable>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────── login ── */

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, sso } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const toHome = () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

  const submit = () => {
    const result = login(email, password, remember);
    if (!result.ok) sso('Google');
    toHome();
  };

  return (
    <AuthScreen title="Log in" subtitle="Use your Storey Enterprises account.">
      <View style={styles.formStack}>
        <Field label="Email">
          <TextInput
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            placeholder="name@clinic.com"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            show={show}
            onToggle={() => setShow(value => !value)}
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
          />
        </Field>
        <View style={styles.rememberRow}>
          <View style={styles.rememberLeft}>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.card}
              ios_backgroundColor={c.border}
            />
            <Text style={TEXT.body}>Remember me</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Forgot')} style={styles.inlineLink}>
            <Text style={styles.inlineLinkText}>Forgot password</Text>
          </Pressable>
        </View>
        <Button onPress={submit}>Log In</Button>
      </View>

      <View style={styles.stack20}>
        <SocialButtons
          onGoogle={() => {
            sso('Google');
            toHome();
          }}
          onApple={() => {
            sso('Apple');
            toHome();
          }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setEmail('jordan@riversideclinic.com');
          setPassword('Storey123!');
        }}
        style={styles.previewHint}>
        <Text style={styles.previewHintText}>Preview account: jordan@riversideclinic.com / Storey123!</Text>
      </Pressable>

      <View style={styles.footerLine}>
        <Text style={styles.footerText}>New here? </Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}>Create account</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

/* ─────────────────────────────────────────────────────────────── register ── */

export function RegisterScreen() {
  const navigation = useNavigation();
  const { register, sso } = useApp();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    accountType: 'business',
    companyName: '',
    facilityType: 'Clinic',
    billingEmail: '',
    agree: false,
  });
  const [show, setShow] = useState(false);
  const [legal, setLegal] = useState(null);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const submit = () => {
    const result = register({
      fullName: form.fullName,
      email: form.email,
      phone: formatPhone(form.phone),
      password: form.password,
      accountType: form.accountType,
      companyName: form.accountType === 'business' ? form.companyName : '',
      facilityType: form.accountType === 'business' ? form.facilityType : '',
      billingEmail: form.billingEmail,
      billingAddress: '',
    });
    if (!result.ok) sso('Google');
    navigation.navigate('Setup');
  };

  const social = provider => {
    sso(provider);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <AuthScreen title="Create account" subtitle="Set up access for your clinic, lab, or pharmacy.">
      <View style={styles.formStack}>
        <Field label="Full name">
          <TextInput
            value={form.fullName}
            onChangeText={value => set('fullName', value)}
            autoComplete="name"
            textContentType="name"
            placeholder="Jordan Hale"
          />
        </Field>
        <Field label="Email">
          <TextInput
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={value => set('email', value)}
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="name@clinic.com"
          />
        </Field>
        <Field label="Mobile phone">
          <TextInput
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={value => set('phone', formatPhone(value))}
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="(804) 555-0100"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            show={show}
            onToggle={() => setShow(value => !value)}
            value={form.password}
            onChangeText={value => set('password', value)}
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="Password"
          />
        </Field>
        <Field label="Confirm password">
          <TextInput
            secureTextEntry={!show}
            autoCorrect={false}
            value={form.confirm}
            onChangeText={value => set('confirm', value)}
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="Repeat password"
          />
        </Field>

        <View>
          <Text style={styles.legend}>Account type</Text>
          <ChoiceGroup style={styles.twoCol}>
            {['individual', 'business'].map(type => (
              <ChoiceButton
                key={type}
                selected={form.accountType === type}
                onPress={() => set('accountType', type)}
                style={styles.halfCol}>
                {type === 'individual' ? 'Individual' : 'Business'}
              </ChoiceButton>
            ))}
          </ChoiceGroup>
        </View>

        {form.accountType === 'business' ? (
          <View style={styles.formStack}>
            <Field label="Company/Facility name">
              <TextInput
                value={form.companyName}
                onChangeText={value => set('companyName', value)}
                placeholder="Riverside Family Clinic"
              />
            </Field>
            <Field label="Facility type">
              <Select
                title="Facility type"
                value={form.facilityType}
                options={facilityTypes}
                onChange={value => set('facilityType', value)}
              />
            </Field>
            <Field label="Billing email">
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.billingEmail}
                onChangeText={value => set('billingEmail', value)}
                placeholder="billing@clinic.com"
              />
            </Field>
          </View>
        ) : null}

        <View style={styles.agreeRow}>
          <Switch
            value={form.agree}
            onValueChange={value => set('agree', value)}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={c.card}
            ios_backgroundColor={c.border}
          />
          <Text style={styles.agreeText}>
            I agree to the{' '}
            <Text style={styles.agreeLink} onPress={() => setLegal('terms')}>
              Terms &amp; Conditions
            </Text>{' '}
            and{' '}
            <Text style={styles.agreeLink} onPress={() => setLegal('privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <Button onPress={submit}>Create Account</Button>
      </View>

      <View style={styles.stack20}>
        <SocialButtons onGoogle={() => social('Google')} onApple={() => social('Apple')} />
      </View>

      <View style={[styles.footerLine, styles.stack20]}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Log in</Text>
        </Pressable>
      </View>

      <LegalSheet kind={legal} onClose={() => setLegal(null)} />
    </AuthScreen>
  );
}

/* ───────────────────────────────────────────────────────────────── forgot ── */

const FORGOT_TITLES = {
  email: 'Reset password',
  sent: 'Check your email',
  otp: 'Enter code',
  password: 'New password',
  done: 'Password updated',
};

const FORGOT_SUBTITLES = {
  email: "We'll send a reset code to your email.",
  sent: 'If an account exists, a reset code is on the way.',
  otp: 'Type the code from your email.',
  password: 'Choose a new password for this account.',
  done: 'You can log in with your new password.',
};

export function ForgotScreen() {
  const navigation = useNavigation();
  const { resetPassword } = useApp();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <AuthScreen title={FORGOT_TITLES[step]} subtitle={FORGOT_SUBTITLES[step]}>
      {step === 'email' ? (
        <View>
          <Field label="Email">
            <TextInput
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholder="name@clinic.com"
            />
          </Field>
          <View style={styles.stack24}>
            <Button onPress={() => setStep('sent')}>Send code</Button>
          </View>
        </View>
      ) : null}

      {step === 'sent' ? (
        <View>
          <SuccessMark />
          <Text style={styles.centredBody}>{email || 'your email'}</Text>
          <View style={styles.stack24}>
            <Button onPress={() => setStep('otp')}>Enter code</Button>
          </View>
        </View>
      ) : null}

      {step === 'otp' ? (
        <View>
          <Field label="Code">
            <TextInput
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              style={styles.codeInput}
            />
          </Field>
          <View style={styles.stack24}>
            <Button onPress={() => setStep('password')}>Continue</Button>
          </View>
        </View>
      ) : null}

      {step === 'password' ? (
        <View style={styles.formStack}>
          <Field label="New password">
            <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="New password" />
          </Field>
          <Field label="Confirm password">
            <TextInput secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Repeat password" />
          </Field>
          <Button
            onPress={() => {
              resetPassword(email, password);
              setStep('done');
            }}>
            Update password
          </Button>
        </View>
      ) : null}

      {step === 'done' ? (
        <View>
          <SuccessMark />
          <View style={styles.stack24}>
            <Button onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>Log In</Button>
          </View>
        </View>
      ) : null}

      {step !== 'done' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Login')}
          style={styles.backToLogin}>
          <Text style={styles.inlineLinkText}>Back to log in</Text>
        </Pressable>
      ) : null}
    </AuthScreen>
  );
}

/* ────────────────────────────────────────────────────────────────── setup ── */

export function SetupScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useApp();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(user?.photo ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [companyName, setCompanyName] = useState(user?.companyName ?? '');
  const [facilityType, setFacilityType] = useState(user?.facilityType || 'Clinic');
  const [billingAddress, setBillingAddress] = useState(user?.billingAddress ?? '');
  const [billingEmail, setBillingEmail] = useState(user?.billingEmail ?? '');
  const [taxId, setTaxId] = useState(user?.taxId ?? '');

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
    setCompanyName(user.companyName);
    setFacilityType(user.facilityType || 'Clinic');
    setBillingAddress(user.billingAddress);
    setBillingEmail(user.billingEmail);
    setTaxId(user.taxId);
    setPhoto(user.photo);
  }, [user]);

  const save = partial => {
    updateUser({
      fullName,
      email,
      phone: formatPhone(phone),
      photo,
      companyName,
      facilityType,
      billingAddress,
      billingEmail,
      taxId,
    });
    if (partial || step === 2) navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    else setStep(2);
  };

  return (
    <AuthScreen
      title={step === 1 ? 'Personal details' : 'Business and billing'}
      subtitle={step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}>
      <View style={styles.progressTrack}>
        {/* Width depends on the step, so it cannot live in StyleSheet.create. */}
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
      </View>

      {step === 1 ? (
        <View style={styles.formStack}>
          <Field label="Profile photo" hint="Optional">
            <View style={styles.photoRow}>
              <View style={styles.photoWell}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photoFill} resizeMode="cover" />
                ) : (
                  <Text style={TEXT.caption}>Photo</Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  const uri = await pickPhoto();
                  if (uri) setPhoto(uri);
                }}
                style={styles.addPhotoBtn}>
                <Text style={styles.addPhotoText}>Add photo</Text>
              </Pressable>
            </View>
          </Field>
          <Field label="Full name">
            <TextInput value={fullName} onChangeText={setFullName} />
          </Field>
          <Field label="Email">
            <TextInput keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </Field>
          <Field label="Mobile phone">
            <TextInput keyboardType="phone-pad" value={phone} onChangeText={value => setPhone(formatPhone(value))} />
          </Field>
        </View>
      ) : (
        <View style={styles.formStack}>
          <Field label="Company name">
            <TextInput value={companyName} onChangeText={setCompanyName} />
          </Field>
          <Field label="Facility type">
            <Select title="Facility type" value={facilityType} options={facilityTypes} onChange={setFacilityType} />
          </Field>
          <Field label="Billing address">
            <TextInput value={billingAddress} onChangeText={setBillingAddress} />
          </Field>
          <Field label="Billing email">
            <TextInput
              keyboardType="email-address"
              autoCapitalize="none"
              value={billingEmail}
              onChangeText={setBillingEmail}
            />
          </Field>
          <Field label="Tax ID" hint="Optional">
            <TextInput value={taxId} onChangeText={setTaxId} />
          </Field>
        </View>
      )}

      <View style={styles.setupActions}>
        <Button onPress={() => save(false)}>{step === 1 ? 'Continue' : 'Finish'}</Button>
        <Pressable accessibilityRole="button" onPress={() => save(true)} style={styles.laterBtn}>
          <Text style={styles.laterText}>Complete later</Text>
        </Pressable>
      </View>

      <View style={styles.setupNote}>
        <Lucide name="check" size={fS(16)} color={c.primary} style={styles.setupNoteIcon} />
        <Text style={styles.setupNoteText}>Profile details stay separate from shipment addresses.</Text>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  pressed98: { transform: [{ scale: 0.98 }] },
  formStack: { gap: vSize(16) },
  stack20: { marginTop: vSize(20) },
  stack24: { marginTop: vSize(24) },

  splash: { flex: 1, overflow: 'hidden', backgroundColor: c.night, paddingHorizontal: hSize(32) },
  splashGlowTop: { position: 'absolute', top: -vSize(64), alignSelf: 'center', left: '50%', marginLeft: -hSize(144) },
  splashGlowBottom: { position: 'absolute', bottom: -vSize(80), left: '50%', marginLeft: -hSize(144) },
  splashCentre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoRing: {
    padding: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: c.overlayRing,
  },
  splashTitle: {
    fontFamily: TEXT.title.fontFamily,
    fontSize: fS(26),
    marginTop: vSize(32),
    textAlign: 'center',
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(26)),
  },
  splashTagline: {
    ...TEXT.body,
    fontSize: fS(16),
    marginTop: vSize(12),
    maxWidth: hSize(256),
    textAlign: 'center',
    color: c.overlayText,
    lineHeight: LEADING.relaxed(fS(16)),
  },
  splashRule: {
    marginTop: vSize(20),
    height: vSize(4),
    width: hSize(40),
    borderRadius: RADIUS.full,
    backgroundColor: c.brand,
  },
  splashFooter: { alignItems: 'center' },
  splashTrack: {
    height: vSize(4),
    width: hSize(160),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.overlayTrack,
  },
  splashFill: { height: '100%', backgroundColor: c.primary },

  onboarding: { flex: 1, overflow: 'hidden', backgroundColor: c.night },
  /**
   * The photo is the screen's ImageBackground, not an absolutely positioned
   * <Image> behind the content.
   *
   * An absolutely positioned Image painted OVER every later sibling here: the
   * scrim, the Skip pill, the title, the dots and the Next button were all laid
   * out and simply buried, so the screen came up as a bare photograph and the
   * Skip button did not even take taps. Neither an explicit zIndex nor wrapping
   * the Image in an absolute View changed that. ImageBackground is the
   * primitive meant for this — its children are guaranteed to render above it.
   */
  onboardingContent: { flex: 1 },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: hSize(16) },
  skipBtn: {
    minHeight: vSize(44),
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: c.nightGlass,
    paddingHorizontal: hSize(16),
  },
  skipText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.overlayText },
  onboardingCopy: { marginTop: 'auto', paddingHorizontal: hSize(20), paddingTop: vSize(64) },
  onboardingTitle: {
    ...TEXT.largeTitle,
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(28)),
    textShadowColor: c.textShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  onboardingBody: {
    ...TEXT.body,
    fontSize: fS(16),
    marginTop: vSize(12),
    color: c.overlayText,
    lineHeight: LEADING.relaxed(fS(16)),
    textShadowColor: c.textShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dots: { marginTop: vSize(20), flexDirection: 'row', gap: hSize(8) },
  dot: { height: vSize(8), borderRadius: RADIUS.full },
  dotOn: { width: hSize(24), backgroundColor: c.brand },
  dotOff: { width: hSize(8), backgroundColor: c.overlayDot },

  authWrap: { flex: 1, backgroundColor: c.night },
  authHeader: { overflow: 'hidden', paddingHorizontal: hSize(20), paddingBottom: vSize(32) },
  authGlowRight: { position: 'absolute', right: -hSize(32), top: -vSize(64) },
  authGlowLeft: { position: 'absolute', left: -hSize(40), bottom: 0 },
  authLogo: { borderWidth: 1, borderColor: c.overlayRing },
  authTitle: {
    ...TEXT.largeTitle,
    marginTop: vSize(20),
    color: c.overlayText,
    lineHeight: LEADING.snug(fS(28)),
  },
  authSubtitle: {
    ...TEXT.body,
    fontSize: fS(15),
    marginTop: vSize(8),
    maxWidth: hSize(320),
    color: c.overlayTextSoft,
    lineHeight: LEADING.relaxed(fS(15)),
  },
  authSheet: {
    flex: 1,
    minHeight: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: c.background,
  },
  authSheetBody: { paddingHorizontal: hSize(20), paddingTop: vSize(24) },

  passwordWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: hSize(48) },
  eyeBtn: {
    position: 'absolute',
    right: hSize(4),
    width: hSize(40),
    height: vSize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },

  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: hSize(8) },
  inlineLink: { minHeight: vSize(44), justifyContent: 'center' },
  inlineLinkText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  socialStack: { gap: vSize(12) },
  socialBtn: {
    height: vSize(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hSize(8),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
  },

  previewHint: {
    marginTop: vSize(16),
    borderRadius: RADIUS.sm,
    backgroundColor: c.summaryBg,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(12),
  },
  previewHintText: {
    ...TEXT.caption,
    fontSize: fS(13),
    color: c.mutedForeground,
    lineHeight: LEADING.relaxed(fS(13)),
  },

  footerLine: {
    marginTop: vSize(24),
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: { ...TEXT.body, color: c.mutedForeground },
  footerLink: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  legend: { ...TEXT.label, marginBottom: vSize(8) },
  twoCol: { flexDirection: 'row', gap: hSize(8) },
  halfCol: { flex: 1, width: undefined },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(12), paddingVertical: vSize(4) },
  agreeText: { ...TEXT.body, flex: 1, lineHeight: LEADING.snug(fS(14)) },
  agreeLink: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  centredBody: {
    ...TEXT.body,
    marginTop: vSize(16),
    textAlign: 'center',
    color: c.mutedForeground,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  codeInput: { letterSpacing: 6 },
  backToLogin: { marginTop: vSize(16), minHeight: vSize(44), justifyContent: 'center' },

  progressTrack: {
    marginBottom: vSize(20),
    height: vSize(4),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.border,
  },
  progressFill: { height: '100%', backgroundColor: c.primary },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: hSize(12) },
  photoWell: {
    width: hSize(64),
    height: hSize(64),
    overflow: 'hidden',
    borderRadius: RADIUS.full,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFill: { width: '100%', height: '100%' },
  addPhotoBtn: {
    minHeight: vSize(44),
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: hSize(12),
  },
  addPhotoText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  setupActions: { marginTop: vSize(24), gap: vSize(12) },
  laterBtn: { minHeight: vSize(44), alignItems: 'center', justifyContent: 'center' },
  laterText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.mutedForeground },
  setupNote: { marginTop: vSize(16), flexDirection: 'row', alignItems: 'flex-start', gap: hSize(8) },
  setupNoteIcon: { marginTop: vSize(2) },
  setupNoteText: { ...TEXT.caption, flex: 1 },
});
