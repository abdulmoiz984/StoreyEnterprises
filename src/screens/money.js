import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  Button,
  ChoiceButton,
  ChoiceGroup,
  EmptyState,
  Field,
  LEADING,
  PriceTable,
  Screen,
  Sheet,
  StackHeader,
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
import { DECLINE_REASONS } from '../lib/labels';
import { formatDateTimeET, formatMoney } from '../lib/format';
import { useApp } from '../hooks/useStore';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

export function QuoteScreen({ route }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { shipments, acceptQuote, declineQuote } = useApp();
  const shipment = shipments.find(item => item.id === route?.params?.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const [note, setNote] = useState('');

  if (!shipment?.quote) {
    return (
      <Screen>
        <StackHeader title="Quote" backTo="Shipments" />
        <EmptyState title="No quote yet" body="When dispatch sends a quote, the itemized rate will show here." />
      </Screen>
    );
  }

  const quote = shipment.quote;

  return (
    <Screen tone="surface">
      <StackHeader title={quote.id} backTo="Shipments" />
      <ScrollView style={styles.flex} contentContainerStyle={styles.quoteBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Quote received</Text>
        <Text style={styles.bigTitle}>{shipment.id}</Text>
        <Text style={styles.validUntil}>Valid until {formatDateTimeET(quote.validUntil)}</Text>
        <Text style={styles.notesPanel}>{quote.notes}</Text>
        <View style={styles.stack12}>
          <PriceTable price={shipment.price} />
        </View>
        <Text style={styles.paymentNote}>{business.paymentNote}</Text>
        {quote.status === 'declined' ? (
          <Text style={styles.declined}>
            Declined{quote.declineReason ? `: ${quote.declineReason}` : ''}
          </Text>
        ) : null}
      </ScrollView>

      {quote.status === 'sent' ? (
        <View style={[styles.footer, { paddingBottom: Math.max(vSize(12), insets.bottom) }]}>
          <Button
            onPress={() => {
              acceptQuote(shipment.id);
              navigation.navigate('Payment', { id: shipment.id });
            }}>
            Accept Quote
          </Button>
          <Button variant="secondary" onPress={() => setOpen(true)}>
            Decline
          </Button>
          <Button variant="ghost" onPress={() => navigation.navigate('Chat', { id: 'support' })}>
            Message Us
          </Button>
        </View>
      ) : null}

      <Sheet open={open} title="Decline quote" onClose={() => setOpen(false)}>
        {/**
         * The web uses a native `<select>` here. React Native has no cross-
         * platform select — a Picker renders as a wheel on iOS and a dropdown on
         * Android — so the four reasons are listed as the kit's own
         * `ChoiceButton` rows instead. Same list, same single selection, and it
         * matches every other choice in the app.
         */}
        <Text style={TEXT.label}>Reason</Text>
        <ChoiceGroup style={styles.reasonGroup}>
          {DECLINE_REASONS.map(item => (
            <ChoiceButton key={item} align="start" selected={reason === item} onPress={() => setReason(item)}>
              {item}
            </ChoiceButton>
          ))}
        </ChoiceGroup>
        <View style={styles.stack12}>
          <TextArea value={note} placeholder="Optional note" onChangeText={setNote} />
        </View>
        <View style={styles.stack16}>
          <Button
            variant="danger"
            onPress={() => {
              declineQuote(shipment.id, note.trim() ? `${reason}. ${note.trim()}` : reason);
              setOpen(false);
            }}>
            Decline quote
          </Button>
        </View>
      </Sheet>
    </Screen>
  );
}

export function PaymentScreen({ route }) {
  const navigation = useNavigation();
  const { shipments, cards, payShipment, addCard } = useApp();
  const shipment = shipments.find(item => item.id === route?.params?.id);
  const [method, setMethod] = useState(cards[0] ? `${cards[0].brand} •••• ${cards[0].last4}` : '');
  const [adding, setAdding] = useState(false);
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvv: '', zip: '' });
  const [phase, setPhase] = useState('form');
  const [reference, setReference] = useState('');
  const [failure, setFailure] = useState('');

  if (!shipment) {
    return (
      <Screen>
        <StackHeader title="Payment" backTo="Shipments" />
        <EmptyState title="Shipment not found" body="Return to shipments and open the quote again." />
      </Screen>
    );
  }

  const pay = label => {
    setPhase('processing');
    setTimeout(() => {
      const result = payShipment(shipment.id, label);
      if (result.ok) {
        setReference(result.reference);
        setPhase('success');
      } else {
        setFailure(result.reason);
        setPhase('failure');
      }
    }, 1200);
  };

  const saveCard = () => {
    const digits = card.number.replace(/\D/g, '');
    const last4 = (digits.slice(-4) || '4242').padStart(4, '0');
    const brand = digits.startsWith('5') ? 'Mastercard' : 'Visa';
    addCard({ brand, last4, exp: card.exp || '12/28', fails: last4 === '0002' });
    setMethod(`${brand} •••• ${last4}`);
    setAdding(false);
  };

  /**
   * The web builds a Blob and clicks a synthetic `<a download>`. None of that
   * exists here, so the same receipt text goes to the OS share sheet, from
   * which the user can save it to Files, mail it or print it. The text itself is
   * byte-for-byte the web's, test-mode disclaimer included.
   */
  const download = async () => {
    const text = [
      business.name,
      'Receipt',
      `Shipment ${shipment.id}`,
      `Reference ${reference}`,
      `Amount ${formatMoney(shipment.price.total)}`,
      `Method ${method}`,
      business.paymentNote,
      'Square TEST MODE — no real charge was made.',
    ].join('\n');
    try {
      await Share.share({ message: text, title: `${shipment.id}-receipt.txt` });
    } catch {
      // The user dismissed the share sheet; nothing to report.
    }
  };

  return (
    <Screen tone="surface">
      <StackHeader title="Payment" backTo="Shipments" />
      <View style={styles.testBanner}>
        <Text style={styles.testBannerText}>Square · TEST MODE. No real charge will be made.</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.payBody} showsVerticalScrollIndicator={false}>
        {phase === 'processing' ? (
          <View style={styles.processing}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={styles.processingText}>Processing payment</Text>
          </View>
        ) : null}

        {phase === 'success' ? (
          <View style={styles.success}>
            <SuccessMark />
            <Text style={styles.successTitle}>Payment received</Text>
            <Text style={styles.successRef}>Reference {reference}</Text>
            <Text style={styles.successAmount}>{formatMoney(shipment.price.total)}</Text>
            <View style={styles.successActions}>
              <Button onPress={download}>Download Receipt</Button>
              <Button
                variant="secondary"
                onPress={() => navigation.navigate('ShipmentDetail', { id: shipment.id })}>
                View shipment
              </Button>
            </View>
          </View>
        ) : null}

        {phase === 'failure' ? (
          <View style={[cardStyle, styles.panel]}>
            <Text style={styles.bigTitle}>Payment failed</Text>
            <Text style={styles.failureText}>{failure}</Text>
            <View style={styles.failureActions}>
              <Button onPress={() => setPhase('form')}>Retry</Button>
              <Button variant="secondary" onPress={() => setPhase('form')}>
                Change method
              </Button>
            </View>
          </View>
        ) : null}

        {phase === 'form' ? (
          <View style={styles.formStack}>
            <View style={[cardStyle, styles.panel]}>
              <Text style={TEXT.caption}>{shipment.id}</Text>
              <Text style={styles.amount}>{formatMoney(shipment.price.total)}</Text>
              <Text style={TEXT.caption}>{business.paymentNote}</Text>
            </View>

            {shipment.payment.status === 'failed' ? (
              <Text style={styles.priorFailure}>{shipment.payment.failureReason}</Text>
            ) : null}

            <View style={styles.cardList}>
              {cards.map(item => {
                const label = `${item.brand} •••• ${item.last4}`;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: method === label }}
                    onPress={() => setMethod(label)}
                    style={[cardStyle, styles.cardRow, method === label && styles.cardRowOn]}>
                    <View>
                      <Text style={styles.cardLabel}>{label}</Text>
                      <Text style={TEXT.caption}>
                        Exp {item.exp}
                        {item.fails ? ' · Declines in test mode' : ''}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {adding ? (
              <View style={[cardStyle, styles.panel, styles.addCard]}>
                <Field label="Name on card">
                  <TextInput value={card.name} onChangeText={value => setCard({ ...card, name: value })} />
                </Field>
                <Field label="Card number">
                  <TextInput
                    keyboardType="number-pad"
                    value={card.number}
                    onChangeText={value => setCard({ ...card, number: value })}
                    placeholder="ACCT-000015"
                  />
                </Field>
                <View style={styles.cardTriple}>
                  <Field label="Exp" style={styles.flex}>
                    <TextInput
                      placeholder="MM/YY"
                      value={card.exp}
                      onChangeText={value => setCard({ ...card, exp: value })}
                    />
                  </Field>
                  <Field label="CVV" style={styles.flex}>
                    <TextInput
                      keyboardType="number-pad"
                      value={card.cvv}
                      onChangeText={value => setCard({ ...card, cvv: value })}
                    />
                  </Field>
                  <Field label="ZIP" style={styles.flex}>
                    <TextInput
                      keyboardType="number-pad"
                      value={card.zip}
                      onChangeText={value => setCard({ ...card, zip: value })}
                    />
                  </Field>
                </View>
                <Button onPress={saveCard}>Save card</Button>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.addCardLink}>
                <Text style={styles.addCardLinkText}>Add card</Text>
              </Pressable>
            )}

            <Button onPress={() => pay(method || 'Card')}>Pay {formatMoney(shipment.price.total)}</Button>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },
  stack12: { marginTop: vSize(12) },
  stack16: { marginTop: vSize(16) },
  panel: { padding: hSize(16) },

  quoteBody: { paddingHorizontal: hSize(16), paddingBottom: vSize(16) },
  eyebrow: { ...TEXT.chip, color: c.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  bigTitle: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.ink, marginTop: vSize(4) },
  validUntil: { ...TEXT.body, marginTop: vSize(8), color: c.mutedForeground },
  notesPanel: {
    ...TEXT.body,
    marginTop: vSize(12),
    borderRadius: RADIUS.lg,
    backgroundColor: c.card,
    padding: hSize(16),
    color: c.subtle,
    lineHeight: LEADING.relaxed(fS(14)),
  },
  paymentNote: { ...TEXT.caption, marginTop: vSize(12) },
  declined: { ...TEXT.body, marginTop: vSize(12), color: c.destructive },

  footer: {
    gap: vSize(8),
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(16),
    paddingTop: vSize(12),
  },
  reasonGroup: { marginTop: vSize(8) },

  testBanner: { backgroundColor: c.warning, paddingHorizontal: hSize(16), paddingVertical: vSize(8) },
  testBannerText: { ...TEXT.chip, color: c.ink },

  payBody: { paddingHorizontal: hSize(16), paddingVertical: vSize(16) },
  processing: { paddingVertical: vSize(64), alignItems: 'center' },
  processingText: { ...TEXT.button, marginTop: vSize(16) },

  success: { paddingVertical: vSize(24), alignItems: 'center' },
  successTitle: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.ink, marginTop: vSize(16) },
  successRef: { ...TEXT.body, marginTop: vSize(8), color: c.mutedForeground },
  successAmount: { ...TEXT.title, marginTop: vSize(4) },
  successActions: { marginTop: vSize(24), gap: vSize(12), width: '100%' },

  failureText: { ...TEXT.body, marginTop: vSize(8), color: c.destructive },
  failureActions: { marginTop: vSize(16), gap: vSize(8) },

  formStack: { gap: vSize(16) },
  amount: { fontFamily: TEXT.title.fontFamily, fontSize: fS(22), color: c.ink },
  priorFailure: {
    ...TEXT.body,
    fontSize: fS(13),
    borderRadius: RADIUS.sm,
    backgroundColor: c.dangerTint,
    color: c.destructive,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
  },
  cardList: { gap: vSize(8) },
  cardRow: { minHeight: vSize(56), justifyContent: 'center', paddingHorizontal: hSize(12) },
  cardRowOn: { borderColor: c.primary },
  cardLabel: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily },
  addCard: { gap: vSize(12) },
  cardTriple: { flexDirection: 'row', gap: hSize(8) },
  addCardLink: { minHeight: vSize(44), justifyContent: 'center' },
  addCardLinkText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },
});
