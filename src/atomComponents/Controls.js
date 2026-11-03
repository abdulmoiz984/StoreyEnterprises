import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput as RNTextInput, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS } from '../globalStyle/Theme';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';

const { hSize, vSize, fS } = Sizer;

/** The five variants from the web's `buttonStyles` map, same colours. */
const VARIANTS = {
  primary: { backgroundColor: c.primary, color: c.primaryForeground },
  secondary: { backgroundColor: c.card, color: c.primary, borderWidth: 1, borderColor: c.primary },
  ghost: { backgroundColor: 'transparent', color: c.ink },
  danger: { backgroundColor: c.brand, color: c.overlayText },
  /** `bg-[#003DF9]/10` — 10% primary over white, flattened for RN. */
  soft: { backgroundColor: c.primaryTint, color: c.primary },
};

/**
 * Ported from `Button`. The web is `h-[52px] w-full rounded-[14px]` with
 * `active:scale-[0.98]` and `disabled:opacity-45`.
 *
 * `full` is NOT a prop here: the web button is `w-full` unconditionally and the
 * screens size it by wrapping it, so a width prop would be a new behaviour.
 */
export function Button({ variant = 'primary', disabled, onPress, children, style, textStyle, ...rest }) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const { color, ...box } = v;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        box,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
      {...rest}>
      {typeof children === 'string' ? (
        <Text style={[TEXT.button, { color }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** Ported from `ChoiceGroup` — a single-column 8pt grid. */
export function ChoiceGroup({ children, style }) {
  return <View style={[styles.choiceGroup, style]}>{children}</View>;
}

/**
 * Ported from `ChoiceButton`. `align="start"` is the web's left-aligned row with
 * a trailing check when selected; `align="center"` is the centred pill.
 */
export function ChoiceButton({ selected = false, align = 'center', disabled, onPress, children, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        align === 'start' ? styles.choiceStart : styles.choiceCenter,
        selected ? styles.choiceOn : styles.choiceOff,
        disabled && styles.choiceDisabled,
        pressed && !disabled && styles.choicePressed,
        style,
      ]}>
      {align === 'start' ? (
        <View style={styles.choiceFill}>
          {typeof children === 'string' ? (
            <Text style={[styles.choiceText, selected && styles.choiceTextOn, disabled && styles.choiceTextOff]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      ) : typeof children === 'string' ? (
        <Text
          style={[
            styles.choiceText,
            styles.choiceTextCenter,
            selected && styles.choiceTextOn,
            disabled && styles.choiceTextOff,
          ]}>
          {children}
        </Text>
      ) : (
        children
      )}
      {align === 'start' && selected ? <Lucide name="check" size={fS(16)} color={c.primary} /> : null}
    </Pressable>
  );
}

/**
 * Ported from `Field`. The web shows the error OR the hint, never both — the
 * error wins — and prefixes the error with an alert glyph.
 */
export function Field({ label, required, error, hint, children, style }) {
  return (
    <View style={style}>
      <View style={styles.fieldLabelRow}>
        <Text style={TEXT.label}>{label}</Text>
        {required ? <Text style={[TEXT.label, { color: c.destructive }]}>*</Text> : null}
      </View>
      {children}
      {error ? (
        <View style={styles.fieldError} accessibilityRole="alert">
          <Lucide name="circle-alert" size={fS(14)} color={c.destructive} style={styles.fieldErrorIcon} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** The web's `inputClass`, as a style object. */
export const inputStyle = {
  height: vSize(48),
  width: '100%',
  borderRadius: RADIUS.sm,
  borderWidth: 1,
  borderColor: c.border,
  backgroundColor: c.card,
  paddingHorizontal: hSize(12),
  ...TEXT.input,
};

/**
 * Ported from `TextInput`. The web gets its focus ring from `focus:ring-2`,
 * which has no RN equivalent, so focus is shown by swapping the border to
 * `primary` — the same signal the ring gives, minus the glow.
 *
 * It forwards a ref because the profile screens focus a specific field
 * programmatically: the web does that with `document.getElementById(id).focus()`
 * off the store's `focusField`, and the native equivalent is a ref. Without
 * forwardRef the ref would silently be null and the focus would simply not
 * happen — no error, just a feature that quietly does nothing.
 */
export const TextInput = forwardRef(function TextInput({ invalid, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={c.faint}
      {...rest}
      onFocus={e => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={e => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        inputStyle,
        focused && { borderColor: c.primary },
        invalid && { borderColor: c.destructive },
        style,
      ]}
    />
  );
});

/** Ported from `TextArea` — `h-auto min-h-24 py-3`. */
export const TextArea = forwardRef(function TextArea({ invalid, style, ...rest }, ref) {
  return (
    <TextInput
      ref={ref}
      multiline
      textAlignVertical="top"
      invalid={invalid}
      {...rest}
      style={[styles.textArea, style]}
    />
  );
});

const styles = StyleSheet.create({
  button: {
    height: vSize(52),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hSize(8),
    borderRadius: RADIUS.md,
    paddingHorizontal: hSize(16),
  },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.45 },

  choiceGroup: { gap: vSize(8) },
  choice: {
    minHeight: vSize(48),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hSize(8),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(10),
  },
  choiceStart: { justifyContent: 'space-between' },
  choiceCenter: { justifyContent: 'center' },
  choiceOn: { borderColor: c.primary, backgroundColor: c.primaryTint },
  choiceOff: { borderColor: c.border, backgroundColor: c.card },
  choiceDisabled: { borderColor: c.border, backgroundColor: c.disabledBg },
  choicePressed: { transform: [{ scale: 0.99 }] },
  choiceFill: { flex: 1, minWidth: 0 },
  choiceText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, lineHeight: LEADING.snug(fS(14)) },
  choiceTextCenter: { textAlign: 'center' },
  choiceTextOn: { color: c.primary },
  choiceTextOff: { color: c.faint },

  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: hSize(4), marginBottom: vSize(6) },
  fieldError: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(4), marginTop: vSize(4) },
  fieldErrorIcon: { marginTop: vSize(2) },
  fieldErrorText: {
    ...TEXT.caption,
    flex: 1,
    color: c.destructive,
    lineHeight: LEADING.snug(fS(12)),
  },
  fieldHint: { ...TEXT.caption, marginTop: vSize(4), lineHeight: LEADING.snug(fS(12)) },

  textArea: { height: undefined, minHeight: vSize(96), paddingTop: vSize(12), paddingBottom: vSize(12) },
});

export default Button;
