import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { goTo } from '../navigation/routes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  AsyncBody,
  Button,
  EmptyState,
  LEADING,
  LargeTitle,
  Refreshable,
  Screen,
  Sheet,
  StackHeader,
  TEXT,
  Text,
  TextArea,
  cardStyle,
} from '../atomComponents';
import { LIGHT as c } from '../globalStyle/tokens';
import { MOTION, RADIUS } from '../globalStyle/Theme';
import { formatDateTimeET, isTodayET } from '../lib/format';
import { useApp } from '../hooks/useStore';
import useKeyboardVisible from '../hooks/useKeyboardVisible';
import Sizer from '../helpers/Sizer';

const { hSize, vSize, fS } = Sizer;

export function MessagesScreen() {
  const navigation = useNavigation();
  const { threads, pushToast } = useApp();
  return (
    <Screen tab tone="surface">
      <LargeTitle title="Messages" />
      <Refreshable onRefresh={() => pushToast('Messages updated')}>
        <AsyncBody boot emptyTitle="No messages" emptyBody="Dispatch and shipment threads will appear here.">
          <View style={styles.threadList}>
            {threads.map(thread => (
              <Pressable
                key={thread.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('Chat', { id: thread.id })}
                style={[cardStyle, styles.threadRow]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{thread.title.slice(0, 2)}</Text>
                </View>
                <View style={styles.threadText}>
                  <View style={styles.threadTop}>
                    <Text numberOfLines={1} style={styles.threadTitle}>
                      {thread.title}
                    </Text>
                    {thread.unread > 0 ? (
                      <View style={styles.unreadPill}>
                        <Text style={styles.unreadText}>{thread.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={TEXT.caption}>
                    {thread.subtitle}
                    {thread.shipmentId ? ` · ${thread.shipmentId}` : ''}
                  </Text>
                  <Text numberOfLines={1} style={styles.threadPreview}>
                    {thread.messages[thread.messages.length - 1]?.text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </AsyncBody>
      </Refreshable>
    </Screen>
  );
}

/** The web's `animate-[dot-blink_1s_infinite]`, staggered 150ms per dot. */
function TypingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    const loops = dots.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(value, { toValue: 1, duration: MOTION.dotMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.3, duration: MOTION.dotMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.typing}>
      {dots.map((value, index) => (
        <Animated.View key={index} style={[styles.typingDot, { opacity: value }]} />
      ))}
    </View>
  );
}

export function ChatScreen({ route }) {
  const id = route?.params?.id;
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const { threads, sendMessage, receiveMessage, markThreadRead, typingThread, setTypingThread } = useApp();
  const thread = threads.find(item => item.id === id);
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    markThreadRead(id);
  }, [id, thread?.unread, markThreadRead]);

  useEffect(() => {
    // The web calls `scrollIntoView` on a trailing sentinel div; the native
    // equivalent is scrolling the list itself, after a frame so the new bubble
    // has been laid out.
    const timer = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [thread?.messages.length, typingThread]);

  if (!thread) {
    return (
      <Screen>
        <StackHeader title="Message" backTo="Messages" />
        <EmptyState title="Conversation not found" body="Open Messages and choose a thread." />
      </Screen>
    );
  }

  const send = attachment => {
    const value = text.trim();
    if (!value && !attachment) return;
    sendMessage(thread.id, value || attachment?.name || 'Attachment', attachment);
    setText('');
    setAttach(false);
    if (thread.id === 'support' || thread.shipmentId) {
      setTypingThread(thread.id);
      setTimeout(() => {
        receiveMessage(thread.id, 'Thanks. Dispatch has your note and will follow the shipment record.');
      }, 1100);
    }
  };

  return (
    /**
     * The KeyboardAvoidingView wraps the WHOLE screen, header included, with no
     * `keyboardVerticalOffset`. It measures its own frame against its parent, so
     * nesting it under the header made it under-report the distance to the
     * keyboard and float the composer well above the keys.
     */
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <StackHeader
          title={thread.title}
          backTo="Messages"
          right={<Text style={styles.headerRight}>{thread.shipmentId ?? 'Support'}</Text>}
        />
        <ScrollView
          ref={scroller}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatBody}
          showsVerticalScrollIndicator={false}>
          {thread.messages.map(message => {
            const mine = message.from === 'user';
            return (
              <View key={message.id} style={[styles.bubbleRow, mine ? styles.rowEnd : styles.rowStart]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {message.attachment ? (
                    <Text style={[styles.attachChip, mine ? styles.onDark : styles.onLight]}>
                      {message.attachment.kind === 'pdf' ? 'PDF' : 'Photo'} · {message.attachment.name}
                    </Text>
                  ) : null}
                  <Text style={[styles.bubbleText, mine ? styles.onDark : styles.onLight]}>{message.text}</Text>
                  <View style={styles.bubbleMeta}>
                    <Text style={[styles.bubbleTime, mine ? styles.timeMine : styles.timeTheirs]}>
                      {formatDateTimeET(message.at)}
                    </Text>
                    {mine ? (
                      <Lucide
                        name={message.status === 'read' ? 'check-check' : 'check'}
                        size={fS(12)}
                        color={c.overlayTextMuted}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
          {typingThread === thread.id ? <TypingDots /> : null}
        </ScrollView>

        <View
          style={[
            styles.composer,
            // Once the keyboard is up it already covers the home indicator, so
            // keeping the bottom inset would leave a second empty strip.
            { paddingBottom: keyboardUp ? vSize(8) : Math.max(vSize(8), insets.bottom) },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
            onPress={() => setAttach(true)}
            style={styles.composerBtn}>
            <Lucide name="paperclip" size={fS(20)} color={c.ink} />
          </Pressable>
          <TextArea
            accessibilityLabel="Message"
            value={text}
            onChangeText={setText}
            placeholder="Write a message"
            style={styles.composerInput}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={() => send()} style={styles.sendBtn}>
            <Lucide name="send" size={fS(16)} color={c.primaryForeground} />
          </Pressable>
        </View>

        <Sheet open={attach} title="Add attachment" onClose={() => setAttach(false)}>
          <View style={styles.sheetActions}>
            <Button onPress={() => send({ name: 'package-photo.jpg', kind: 'photo' })}>Photo</Button>
            <Button variant="secondary" onPress={() => send({ name: 'handling-note.pdf', kind: 'pdf' })}>
              PDF
            </Button>
          </View>
        </Sheet>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { notifications, markAllRead, markNotificationRead, pushToast } = useApp();

  const open = item => {
    markNotificationRead(item.id);
    const target = item.target;
    if (target.kind === 'shipment') navigation.navigate('ShipmentDetail', { id: target.id });
    else if (target.kind === 'quote') navigation.navigate('Quote', { id: target.id });
    else if (target.kind === 'chat') navigation.navigate('Chat', { id: target.id });
    else if (target.kind === 'pay') navigation.navigate('Payment', { id: target.id });
    else goTo(navigation, 'Home');
  };

  const today = notifications.filter(item => isTodayET(item.at));
  const earlier = notifications.filter(item => !isTodayET(item.at));

  const group = (title, items) =>
    items.length ? (
      <View key={title}>
        <Text style={styles.groupHead}>{title}</Text>
        <View style={styles.groupList}>
          {items.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => open(item)}
              style={[cardStyle, styles.notifRow, !item.read && styles.notifUnread]}>
              <View style={styles.notifTop}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                {!item.read ? <View style={styles.notifDot} /> : null}
              </View>
              <Text style={styles.notifBody}>{item.body}</Text>
              <Text style={styles.notifAt}>{formatDateTimeET(item.at)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    ) : null;

  return (
    <Screen tone="surface">
      <StackHeader
        backTo="Home"
        title="Notifications"
        right={
          <Pressable accessibilityRole="button" onPress={() => markAllRead()} hitSlop={8} style={styles.headerAction}>
            <Text style={styles.headerActionText}>Mark all read</Text>
          </Pressable>
        }
      />
      <Refreshable onRefresh={() => pushToast('Notifications updated')}>
        <AsyncBody
          boot
          emptyTitle="You're all caught up"
          emptyBody="Shipment and payment updates will land here.">
          <View style={styles.notifBodyWrap}>
            {group('Today', today)}
            {group('Earlier', earlier)}
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('NotificationSettings')}
              style={styles.settingsLink}>
              <Text style={styles.settingsLinkText}>Notification settings</Text>
            </Pressable>
          </View>
        </AsyncBody>
      </Refreshable>
    </Screen>
  );
}

/** The web labels these "Push", "Email" and "SMS" — SMS stays fully capitalised. */
const CHANNELS = [
  { key: 'push', label: 'Push' },
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
];

export function NotificationSettingsScreen() {
  const { notify, toggleNotify } = useApp();
  const categories = Object.keys(notify);
  return (
    <Screen tone="surface">
      <StackHeader title="Notification settings" backTo="Notifications" />
      <ScrollView style={styles.flex} contentContainerStyle={styles.notifySettings} showsVerticalScrollIndicator={false}>
        {categories.map(category => (
          <View key={category} style={[cardStyle, styles.notifyCard]}>
            <Text style={TEXT.button}>{category}</Text>
            {CHANNELS.map(channel => (
              <View key={channel.key} style={styles.notifyRow}>
                <Text style={TEXT.body}>{channel.label}</Text>
                <Switch
                  value={notify[category][channel.key]}
                  onValueChange={() => toggleNotify(category, channel.key)}
                  trackColor={{ false: c.border, true: c.primary }}
                  thumbColor={c.card}
                  ios_backgroundColor={c.border}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },

  threadList: { gap: vSize(8), paddingHorizontal: hSize(16), paddingBottom: vSize(24) },
  threadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: hSize(12), padding: hSize(12) },
  avatar: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...TEXT.chip, color: c.primary },
  threadText: { flex: 1, minWidth: 0 },
  threadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  threadTitle: { ...TEXT.button, flex: 1 },
  unreadPill: {
    borderRadius: RADIUS.full,
    backgroundColor: c.brand,
    paddingHorizontal: hSize(8),
    paddingVertical: vSize(2),
  },
  unreadText: { ...TEXT.chip, color: c.overlayText },
  threadPreview: { ...TEXT.body, marginTop: vSize(4), color: c.subtle },

  headerRight: { ...TEXT.caption, paddingRight: hSize(12) },
  headerAction: { minHeight: vSize(44), justifyContent: 'center', paddingRight: hSize(8) },
  headerActionText: { ...TEXT.chip, color: c.primary },

  chatScroll: { flex: 1, minHeight: 0, backgroundColor: c.surface },
  chatBody: { gap: vSize(12), paddingHorizontal: hSize(16), paddingVertical: vSize(16) },
  bubbleRow: { flexDirection: 'row' },
  rowEnd: { justifyContent: 'flex-end' },
  rowStart: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: RADIUS.lg, paddingHorizontal: hSize(12), paddingVertical: vSize(8) },
  bubbleMine: { backgroundColor: c.primary },
  bubbleTheirs: { backgroundColor: c.card },
  onDark: { color: c.overlayText },
  onLight: { color: c.ink },
  attachChip: {
    ...TEXT.caption,
    marginBottom: vSize(4),
    borderRadius: 10,
    backgroundColor: c.bubbleChip,
    paddingHorizontal: hSize(8),
    paddingVertical: vSize(4),
  },
  bubbleText: { ...TEXT.body, lineHeight: LEADING.relaxed(fS(14)) },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: hSize(4), marginTop: vSize(4) },
  bubbleTime: { fontFamily: TEXT.caption.fontFamily, fontSize: fS(10) },
  timeMine: { color: c.overlayTextMuted },
  timeTheirs: { color: c.mutedForeground },

  typing: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: hSize(4),
    borderRadius: RADIUS.full,
    backgroundColor: c.card,
    paddingHorizontal: hSize(12),
    paddingVertical: vSize(8),
  },
  typingDot: { width: hSize(8), height: hSize(8), borderRadius: RADIUS.full, backgroundColor: c.faint },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: hSize(8),
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.card,
    paddingHorizontal: hSize(12),
    paddingTop: vSize(8),
  },
  composerBtn: { width: hSize(44), height: hSize(44), alignItems: 'center', justifyContent: 'center' },
  composerInput: { flex: 1, minHeight: vSize(44), maxHeight: vSize(96), paddingTop: vSize(10), paddingBottom: vSize(10) },
  sendBtn: {
    width: hSize(44),
    height: hSize(44),
    borderRadius: RADIUS.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: { gap: vSize(8) },

  notifBodyWrap: { gap: vSize(20), paddingHorizontal: hSize(16), paddingBottom: vSize(32) },
  groupHead: {
    ...TEXT.chip,
    paddingHorizontal: hSize(4),
    color: c.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupList: { marginTop: vSize(8), gap: vSize(8) },
  notifRow: { padding: hSize(12) },
  notifUnread: { borderColor: c.primary },
  notifTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: hSize(8) },
  notifTitle: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, flex: 1 },
  notifDot: { width: hSize(8), height: hSize(8), borderRadius: RADIUS.full, backgroundColor: c.brand },
  notifBody: { ...TEXT.body, marginTop: vSize(4), color: c.subtle },
  notifAt: { ...TEXT.caption, marginTop: vSize(4) },
  settingsLink: { minHeight: vSize(44), justifyContent: 'center' },
  settingsLinkText: { ...TEXT.label, fontFamily: TEXT.chip.fontFamily, color: c.primary },

  notifySettings: { paddingHorizontal: hSize(16), paddingBottom: vSize(32) },
  notifyCard: { marginBottom: vSize(12), padding: hSize(16) },
  notifyRow: {
    marginTop: vSize(12),
    minHeight: vSize(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
