import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentOptionsSheet } from '../components/social/SafetySheets';
import { AppText, Avatar, EmptyState, IconButton, PressableScale, Screen } from '../components/ui';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { getMessages, getUserDetailsForChat, markMessagesAsRead, sendMessage } from '../utils/chatService';
import { levelInfo } from '../utils/gamification';
import haptics from '../utils/haptics';
import { toDate } from '../utils/time';

const QUICK = ['Hi! 👋', 'Can you teach me this?', 'Thanks a lot!', 'When are you free?'];

const dayLabel = (d) => {
  const now = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
};

const ChatDetailScreen = ({ navigation, route }) => {
  const { conversationId, otherUserId, otherUserName } = route.params || {};
  const { colors, gradients, radius, fonts, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [other, setOther] = useState({ name: otherUserName || 'Learner', photo: null, xp: 0 });
  const [options, setOptions] = useState(null);
  const listRef = useRef(null);
  const blocked = (profile?.blocked || []).includes(otherUserId);

  useEffect(() => {
    if (otherUserId) getUserDetailsForChat(otherUserId).then(setOther);
  }, [otherUserId]);

  useEffect(() => {
    if (!conversationId) return undefined;
    markMessagesAsRead(conversationId);
    return getMessages(conversationId, (list, err) => {
      setError(err);
      setMessages(list);
      markMessagesAsRead(conversationId);
    });
  }, [conversationId]);

  // Messages + day separators, newest at the bottom (list is inverted).
  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;
    (messages || []).forEach((m, i) => {
      const d = toDate(m.timestamp) || new Date();
      const key = d.toDateString();
      if (key !== lastDay) {
        out.push({ type: 'day', id: `day-${key}`, label: dayLabel(d) });
        lastDay = key;
      }
      const next = messages[i + 1];
      out.push({ type: 'msg', ...m, mine: m.senderId === user?.uid, tail: !next || next.senderId !== m.senderId });
    });
    return out.reverse();
  }, [messages, user?.uid]);

  const send = async (value = text) => {
    const body = value.trim();
    if (!body || blocked) return;
    setText('');
    haptics.tap();
    try {
      await sendMessage(conversationId, body);
    } catch {
      setText(body);
      haptics.error();
    }
  };

  const tier = levelInfo(other.xp).tier;

  const renderRow = ({ item }) => {
    if (item.type === 'day') {
      return (
        <View style={styles.day}>
          <AppText variant="caption" tone="faint" style={[styles.dayPill, { backgroundColor: colors.surfaceAlt }]}>
            {item.label}
          </AppText>
        </View>
      );
    }
    const time = (toDate(item.timestamp) || new Date()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const bubble = (
      <View style={{ maxWidth: '100%' }}>
        <AppText variant="body" color={item.mine ? '#fff' : colors.text}>
          {item.text}
        </AppText>
        <View style={styles.meta}>
          <AppText variant="caption" color={item.mine ? 'rgba(255,255,255,0.75)' : colors.textFaint} style={{ fontSize: 10 }}>
            {time}
          </AppText>
          {item.mine ? <Ionicons name={item.pending ? 'time-outline' : 'checkmark-done'} size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} /> : null}
        </View>
      </View>
    );
    return (
      <Animated.View entering={FadeInUp.duration(200)} style={[styles.msgRow, { justifyContent: item.mine ? 'flex-end' : 'flex-start', marginBottom: item.tail ? 10 : 3 }]}>
        {item.mine ? (
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, { borderRadius: radius.lg, borderBottomRightRadius: item.tail ? 6 : radius.lg }]}
          >
            {bubble}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, borderBottomLeftRadius: item.tail ? 6 : radius.lg }]}>{bubble}</View>
        )}
      </Animated.View>
    );
  };

  return (
    <Screen scroll={false} padded={false} edges={['top']} ambient={false}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.headerBg }]}>
        <IconButton icon="chevron-back" onPress={() => navigation.goBack()} size={40} accessibilityLabel="Go back" />
        <PressableScale onPress={() => otherUserId && navigation.navigate('UserProfile', { userId: otherUserId })} style={styles.who} accessibilityLabel={`${other.name}'s profile`}>
          <Avatar uri={other.photo} name={other.name} size={40} ring={tier.colors} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <AppText variant="title" numberOfLines={1}>
              {other.name}
            </AppText>
            <AppText variant="caption" tone="muted">
              {tier.name} · Level {levelInfo(other.xp).level}
            </AppText>
          </View>
        </PressableScale>
        <IconButton
          icon="ellipsis-horizontal"
          variant="ghost"
          onPress={() => setOptions({ type: 'user', id: otherUserId, userId: otherUserId, userName: other.name, mine: false })}
          accessibilityLabel="More options"
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {error ? (
          <EmptyState icon="lock-closed-outline" title="Can’t open this chat" message="You may not have access to this conversation." />
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            inverted
            keyExtractor={(r) => r.id}
            renderItem={renderRow}
            contentContainerStyle={{ padding: spacing.lg, paddingTop: 8 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              messages && !messages.length ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Avatar uri={other.photo} name={other.name} size={76} ring={tier.colors} />
                  <AppText variant="h3" style={{ marginTop: 12 }}>
                    {other.name}
                  </AppText>
                  <AppText variant="small" tone="muted" align="center" style={{ marginTop: 4 }}>
                    Start the conversation: ask about their skills or courses.
                  </AppText>
                </View>
              ) : null
            }
          />
        )}

        {blocked ? (
          <View style={[styles.blocked, { backgroundColor: colors.surfaceAlt, paddingBottom: insets.bottom + 10 }]}>
            <AppText variant="small" tone="muted" align="center">
              You blocked this person. Unblock them from their profile to message again.
            </AppText>
          </View>
        ) : (
          <View style={{ paddingBottom: insets.bottom + 6, backgroundColor: colors.bgElevated, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }}>
            {messages && messages.length < 2 ? (
              <FlatList
                horizontal
                data={QUICK}
                keyExtractor={(q) => q}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, gap: 8 }}
                renderItem={({ item }) => (
                  <PressableScale onPress={() => send(item)}>
                    <View style={[styles.quick, { backgroundColor: colors.primarySoft }]}>
                      <AppText variant="smallStrong" tone="primary">
                        {item}
                      </AppText>
                    </View>
                  </PressableScale>
                )}
              />
            ) : null}
            <View style={styles.composer}>
              <View style={[styles.input, { backgroundColor: colors.surfaceAlt, borderRadius: 22 }]}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Message"
                  placeholderTextColor={colors.textFaint}
                  multiline
                  maxLength={2000}
                  style={{ flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 15, maxHeight: 120, paddingVertical: 10 }}
                />
              </View>
              <PressableScale onPress={() => send()} disabled={!text.trim()} haptic={null} accessibilityLabel="Send">
                <LinearGradient colors={text.trim() ? gradients.primary : [colors.surfaceAlt, colors.surfaceAlt]} style={styles.send}>
                  <Ionicons name="arrow-up" size={22} color={text.trim() ? '#fff' : colors.textFaint} />
                </LinearGradient>
              </PressableScale>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <ContentOptionsSheet target={options} onClose={() => setOptions(null)} onBlocked={() => navigation.goBack()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
  day: { alignItems: 'center', marginVertical: 10 },
  dayPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  msgRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9 },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  input: { flex: 1, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quick: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  blocked: { padding: 14 },
});

export default ChatDetailScreen;
