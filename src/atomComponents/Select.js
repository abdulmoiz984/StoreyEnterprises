import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LIGHT as c } from '../globalStyle/tokens';
import { ChoiceButton, ChoiceGroup, inputStyle } from './Controls';
import { Sheet } from './Sheet';
import { TEXT, Text } from './Typography';
import Sizer from '../helpers/Sizer';

const { hSize, fS } = Sizer;

/**
 * Stands in for the web's `<select>`, of which there are five across the app
 * (decline reason, cancel reason, and the delivery-deadline list twice).
 *
 * React Native has no portable select: `@react-native-picker/picker` renders a
 * spinning wheel on iOS and a dropdown on Android, so the same screen would look
 * like two different products. A button that opens the kit's own Sheet full of
 * `ChoiceButton` rows behaves identically on both, matches every other choice in
 * this app, and needs no native module.
 *
 * The control itself is styled from `inputStyle`, so it lines up with the text
 * inputs beside it exactly as the web's select does.
 */
export function Select({ value, options, onChange, placeholder = 'Select', title, style }) {
  const [open, setOpen] = useState(false);
  const current = options.find(option => (option.value ?? option) === value);
  const label = current ? (current.label ?? current) : '';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title ?? placeholder}
        accessibilityValue={{ text: label || placeholder }}
        onPress={() => setOpen(true)}
        style={[inputStyle, styles.control, style]}>
        <Text numberOfLines={1} style={[styles.value, !label && styles.placeholder]}>
          {label || placeholder}
        </Text>
        <Lucide name="chevron-down" size={fS(18)} color={c.mutedForeground} />
      </Pressable>

      <Sheet open={open} title={title ?? placeholder} onClose={() => setOpen(false)}>
        <ChoiceGroup>
          {options.map(option => {
            const optionValue = option.value ?? option;
            const optionLabel = option.label ?? option;
            return (
              <ChoiceButton
                key={String(optionValue)}
                align="start"
                selected={value === optionValue}
                onPress={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}>
                {optionLabel}
              </ChoiceButton>
            );
          })}
        </ChoiceGroup>
        <View style={styles.sheetPad} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  control: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  value: { ...TEXT.input, flex: 1 },
  placeholder: { color: c.faint },
  sheetPad: { height: hSize(8) },
});

export default Select;
