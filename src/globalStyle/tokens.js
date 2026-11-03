/**
 * Palette, ported verbatim from the web's `:root` block in `src/styles.css`.
 *
 * The web has ONE theme. There is no `[data-theme]` block, no
 * `prefers-color-scheme` rule and no appearance setting anywhere in the app or
 * the store — so this port is light-only by design, not by omission.
 *
 * Every colour still resolves through this module rather than being written
 * into screens, so a dark palette can be added later by exporting a second
 * object and switching on it in `useTheme` — no screen would need to change.
 */
export const LIGHT = {
  /** Storey Enterprises red — used for accents and the logo lockup. */
  brand: '#CF0300',

  primary: '#003DF9',
  primaryForeground: '#FFFFFF',

  background: '#FFFFFF',
  foreground: '#0F172A',
  ink: '#0F172A',
  surface: '#F6F7FB',

  card: '#FFFFFF',
  cardForeground: '#0F172A',
  popover: '#FFFFFF',
  popoverForeground: '#0F172A',

  secondary: '#F6F7FB',
  secondaryForeground: '#0F172A',
  muted: '#F6F7FB',
  mutedForeground: '#64748B',

  accent: '#CF0300',
  accentForeground: '#FFFFFF',

  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',

  border: '#E2E8F0',
  borderLight: '#E2E8F0',
  borderDark: '#E2E8F0',
  input: '#E2E8F0',
  ring: '#003DF9',

  sidebar: '#FFFFFF',
  sidebarForeground: '#0F172A',
  sidebarPrimary: '#003DF9',
  sidebarPrimaryForeground: '#FFFFFF',
  sidebarAccent: '#F6F7FB',
  sidebarAccentForeground: '#0F172A',
  sidebarBorder: '#E2E8F0',
  sidebarRing: '#003DF9',

  /** Text that sits on a photo scrim — white regardless of any future theme. */
  overlayText: '#FFFFFF',

  // ───────────────────────────────────────────────────────────────────────────
  // Colours the web writes as bare hex in `components/app/ui.tsx` and the
  // screens rather than as a CSS variable. They are collected here so that no
  // screen hardcodes a colour and `npm run verify` can check every literal
  // against the palette — but their VALUES are the web's, unchanged.
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * The near-black the web uses for every dark surface: the tab bar, the splash,
   * the onboarding plate and the auth header. One value, four places.
   */
  night: '#070B14',

  /** Secondary body copy, one step darker than `mutedForeground`. */
  subtle: '#475569',
  /** Placeholders and disabled label text. */
  faint: '#94A3B8',
  /** Disabled control fill. */
  disabledBg: '#F1F5F9',
  /** Page tint used by a couple of panels. */
  tintBg: '#F8FAFC',
  /** Booking summary panel. */
  summaryBg: '#F4F7FB',

  /** Status chip text, on the matching 10–15% tinted fill. */
  successText: '#166534',
  warningText: '#92400E',

  /** Live-tracking accent (the moving dot's halo). */
  live: '#22C55E',

  /** Map preview: water-blue plate and its grid lines. */
  mapBg: '#E8EEF9',
  mapGrid: '#D5DEF0',

  // Tailwind writes tinted fills as `bg-[#003DF9]/10`, which the browser
  // composites live. React Native has no colour-mix at style time, so each tint
  // below is that exact composite over WHITE, pre-flattened. They are only
  // correct on a white/`surface` plate — which is the only place the web uses
  // them. Opacity on the View would dim the child text too, which the web's
  // does not.
  /** `bg-[#003DF9]/10` — selected choice, soft button, icon badges. */
  primaryTint: '#E6ECFE',
  /** `bg-[#003DF9]/5` — the selected service row in booking step 1. */
  primaryTintSoft: '#F2F5FF',
  /** `text-[#003DF9]/70` — the box-size hint while that size is selected. */
  primaryTextSoft: '#4D77FB',
  /** `ring-[#003DF9]/20` — the halo on the current timeline dot. */
  primaryHalo: '#CCD8FE',
  /** `bg-[#16A34A]/10` — delivered chip, success mark. */
  successTint: '#E8F6ED',
  /** `bg-[#DC2626]/10` — exception chip, error mark. */
  dangerTint: '#FCE9E9',
  /** `bg-[#F59E0B]/15` — in-transit chip, the "replace this text" note. */
  warningTint: '#FEF0DA',
  /** `bg-[#F59E0B]/20` — the stronger TEST MODE banner on payment methods. */
  warningTintStrong: '#FDECCE',

  /** `bg-[#0F172A]/40` — the scrim behind a bottom sheet. */
  scrim: 'rgba(15, 23, 42, 0.4)',
  /** `text-white/80` — toast body, inactive tab label. */
  overlayTextMuted: 'rgba(255, 255, 255, 0.8)',
  /** `bg-white/10` — the active tab's pill. */
  overlayFill: 'rgba(255, 255, 255, 0.1)',

  // NOTE: the accent glows and the onboarding photo scrim are SVG gradients,
  // and react-native-svg ignores the alpha of an rgba `stopColor` — so their
  // opacities live in atomComponents/Glow as numeric `stopOpacity` values and
  // are deliberately NOT tokens here. Only colours that a View or Text consumes
  // directly belong below, where rgba works as expected.

  /** `[text-shadow:0_1px_2px_rgba(0,0,0,0.55)]` on the onboarding copy. */
  textShadow: 'rgba(7, 11, 20, 0.96)',
  /** The translucent "Skip" pill on the onboarding photo. */
  nightGlass: 'rgba(7, 11, 20, 0.55)',

  /** `shadow-[0_0_0_1px_rgba(255,255,255,0.16)]` — the hairline ring on the logo. */
  overlayRing: 'rgba(255, 255, 255, 0.16)',
  /** `bg-white/15` — the splash progress track. */
  overlayTrack: 'rgba(255, 255, 255, 0.15)',
  /** `bg-white/55` — an inactive onboarding dot. */
  overlayDot: 'rgba(255, 255, 255, 0.55)',
  /** `text-white/85` — the auth header subtitle. */
  overlayTextSoft: 'rgba(255, 255, 255, 0.85)',
  /** `text-white/90` — body copy on the home hero. */
  overlayTextStrong: 'rgba(255, 255, 255, 0.9)',
  /** `text-white/75` — profile header subtitle, card expiry. */
  overlayTextDim: 'rgba(255, 255, 255, 0.75)',
  /** `text-white/65` — the email line under the profile name. */
  overlayTextFaint: 'rgba(255, 255, 255, 0.65)',
  /** `text-white/60` — the "ACCOUNT" eyebrow. */
  overlayTextEyebrow: 'rgba(255, 255, 255, 0.6)',
  /** `bg-white/20` — the completeness track on the dark profile header. */
  overlayTrackLight: 'rgba(255, 255, 255, 0.2)',
  /** `bg-white/30` — the gallery video progress track. */
  overlayTrackMid: 'rgba(255, 255, 255, 0.3)',
  /** `bg-white/95` — the floating back button on a photo header. */
  overlayGlass: 'rgba(255, 255, 255, 0.95)',
  /** `bg-black/10` — the attachment chip inside a chat bubble, on either side. */
  bubbleChip: 'rgba(0, 0, 0, 0.1)',

  /** Google's brand marks — fixed by Google's guidelines, never themed. */
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
};

export default { LIGHT };
