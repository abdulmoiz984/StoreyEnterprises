import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT as c } from '../globalStyle/tokens';
import { RADIUS, elevation } from '../globalStyle/Theme';
import { privacyDoc, termsDoc } from '../lib/content';
import Sizer from '../helpers/Sizer';
import { LEADING, TEXT, Text } from './Typography';

const { hSize, vSize, fS } = Sizer;

/**
 * Ported from `Sheet`. The web positions it `absolute inset-0` inside its own
 * phone frame; on a device the equivalent is a `Modal`, which also gets the
 * hardware back button on Android for free — the web has no such affordance and
 * relies on the scrim tap, which still works here.
 *
 * `max-h-[86%]` and the drag handle are carried over. The sheet does not
 * actually drag: the web's doesn't either, the handle is decoration there too.
 */
export function Sheet({ open, title, onClose, children }) {
  const insets = useSafeAreaInsets();
  if (!open) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.wrap}>
        <Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(vSize(16), insets.bottom) }]}>
          <View style={styles.handle} />
          {title ? <Text style={[TEXT.title, styles.title]}>{title}</Text> : null}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Ported from `LegalSheet`, including the amber "Replace with client-approved text" note. */
export function LegalSheet({ kind, onClose }) {
  const doc = kind === 'privacy' ? privacyDoc : termsDoc;
  return (
    <Sheet open={!!kind} title={doc.title} onClose={onClose}>
      <Text style={TEXT.caption}>
        Version {doc.version} · Last updated {doc.updated}
      </Text>
      <Text style={styles.placeholderNote}>Replace with client-approved text.</Text>
      <View style={styles.sections}>
        {doc.sections.map(section => (
          <View key={section.heading}>
            <Text style={TEXT.button}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: c.scrim },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: RADIUS.xl2,
    borderTopRightRadius: RADIUS.xl2,
    backgroundColor: c.card,
    paddingHorizontal: hSize(16),
    paddingTop: vSize(12),
    ...elevation(3),
  },
  handle: {
    alignSelf: 'center',
    width: hSize(40),
    height: vSize(6),
    borderRadius: RADIUS.full,
    backgroundColor: c.border,
    marginBottom: vSize(12),
  },
  title: { marginBottom: vSize(12) },

  placeholderNote: {
    ...TEXT.caption,
    marginTop: vSize(12),
    borderRadius: RADIUS.sm,
    backgroundColor: c.warningTint,
    color: c.warningText,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
    lineHeight: LEADING.snug(fS(12)),
  },
  sections: { marginTop: vSize(16), gap: vSize(16) },
  sectionBody: { ...TEXT.body, marginTop: vSize(4), color: c.mutedForeground, lineHeight: LEADING.relaxed(fS(14)) },
});

export default Sheet;
