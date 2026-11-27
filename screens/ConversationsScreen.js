import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { AppText, Avatar, EmptyState, Header, IconButton, PressableScale, Screen, Skeleton } from '../components/ui';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { deleteConversationForMe, getUserConversations } from '../utils/chatService';
import haptics from '../utils/haptics';
import { levelInfo } from '../utils/gamification';
import { chatTime } from '../utils/time';

const ConversationsScreen = ({ navigation }) => {
  const { colors, radius, fonts } = useTheme();
  const { user, profile } = useUser();
  const [list, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return undefined;
    return getUserConversations((rows, err) => {
      setFailed(!!err);
      setList(rows);
    });
  }, [user?.uid]);

  const blocked = profile?.blocked || [];
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list || [])
      .filter((c) => !blocked.includes(c.otherUserId))
      .filter((c) => !q || c.otherUserDetails.name.toLowerCase().includes(q) || (c.courseTitle || '').toLowerCase().includes(q));
  }, [list, search, blocked]);

  const unreadTotal = shown.reduce((s, c) => s + c.unreadCount, 0);

  const open = (c) =>
    navigation.navigate('ChatDetail', {
      conversationId: c.conversationId,
      otherUserId: c.otherUserId,
      otherUserName: c.otherUserDetails.name,
    });

  // Long-press a chat to delete it (for me only).
  const askDelete = (c) => {
    haptics.warning();
    Alert.alert(`Delete chat with ${c.otherUserDetails.name}?`, 'It will be removed from your chats. They will still have their copy.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setList((rows) => (rows || []).filter((r) => r.conversationId !== c.conversationId));
          try {
            await deleteConversationForMe(c.conversationId);
            haptics.success();
          } catch {
            Alert.alert('Couldn’t delete chat', 'Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item: c, index }) => {
    const unread = c.unreadCount > 0;
    const tier = levelInfo(c.otherUserDetails.xp).tier;
    const mine = c.lastSenderId === user?.uid;
    return (
      <Animated.View entering={index < 10 ? FadeInDown.delay(index * 35) : undefined}>
        <PressableScale onPress={() => open(c)} onLongPress={() => askDelete(c)} scaleTo={0.98} accessibilityLabel={`Chat with ${c.otherUserDetails.name}${unread ? `, ${c.unreadCount} unread` : ''}`}>
          <View style={[styles.row, { backgroundColor: unread ? colors.primarySoft : 'transparent', borderRadius: radius.lg }]}>
            <Avatar uri={c.otherUserDetails.photo} name={c.otherUserDetails.name} size={54} ring={tier.colors} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.line}>
                <AppText variant="title" numberOfLines={1} style={{ flex: 1 }}>
                  {c.otherUserDetails.name}
                </AppText>
                <AppText variant="caption" tone={unread ? 'primary' : 'faint'} style={unread && { fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {chatTime(c.lastMessageTime)}
                </AppText>
              </View>
              {c.courseTitle ? (
                <View style={styles.course}>
                  <Ionicons name="school" size={11} color={colors.info} />
                  <AppText variant="caption" tone="info" numberOfLines={1} style={{ marginLeft: 4 }}>
                    {c.courseTitle}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.line}>
                <AppText variant="small" tone={unread ? 'default' : 'muted'} numberOfLines={1} style={[{ flex: 1 }, unread && { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                  {c.lastMessage ? `${mine ? 'You: ' : ''}${c.lastMessage}` : 'Say hello 👋'}
                </AppText>
                {unread ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <AppText variant="caption" color="#fff" style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 11 }}>
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <Header
          large
          transparent
          title="Chats"
          subtitle={unreadTotal ? `${unreadTotal} unread` : 'Messages'}
          right={<IconButton icon="create-outline" variant="primary" onPress={() => navigation.navigate('UsersList')} accessibilityLabel="New message" />}
        />
      }
    >
      <FlatList
        data={shown}
        keyExtractor={(c) => c.conversationId}
        renderItem={renderItem}
        ListHeaderComponent={
          (list || []).length > 3 ? (
            <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Ionicons name="search" size={18} color={colors.textFaint} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search chats"
                placeholderTextColor={colors.textFaint}
                style={{ flex: 1, marginLeft: 8, color: colors.text, fontFamily: fonts.medium, fontSize: 15 }}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          list === null ? (
            <View style={{ gap: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={54} height={54} radius={27} />
                  <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
                    <Skeleton width="50%" height={14} />
                    <Skeleton width="80%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={failed ? 'cloud-offline-outline' : 'chatbubbles-outline'}
              title={failed ? 'Couldn’t load chats' : search ? 'No matches' : 'No conversations yet'}
              message={failed ? 'Check your connection.' : 'Message an instructor or a learner to swap skills.'}
              actionLabel={failed || search ? undefined : 'Find people'}
              onAction={() => navigation.navigate('UsersList')}
            />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: TAB_BAR_SPACE, gap: 2 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  line: { flexDirection: 'row', alignItems: 'center' },
  course: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  search: { flexDirection: 'row', alignItems: 'center', height: 46, paddingHorizontal: 12, borderWidth: 1, marginHorizontal: 6, marginBottom: 10 },
});

export default ConversationsScreen;
