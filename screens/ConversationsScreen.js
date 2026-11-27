import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown, useAnimatedStyle } from 'react-native-reanimated';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { AppText, Avatar, EmptyState, Header, IconButton, PressableScale, Screen, Skeleton } from '../components/ui';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { deleteConversationForMe, getUserConversations, setConversationArchived } from '../utils/chatService';
import haptics from '../utils/haptics';
import { levelInfo } from '../utils/gamification';
import { chatTime } from '../utils/time';

/** Swipe actions fade in with the swipe, so they never show behind the (see-through) row. */
function SwipeActions({ progress, children }) {
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 1.5) }));
  return <Animated.View style={[styles.actions, style]}>{children}</Animated.View>;
}

const ConversationsScreen = ({ navigation }) => {
  const { colors, radius, fonts } = useTheme();
  const { user, profile } = useUser();
  const [list, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    return getUserConversations((rows, err) => {
      setFailed(!!err);
      setList(rows);
    });
  }, [user?.uid]);

  const blocked = profile?.blocked || [];
  const visible = useMemo(() => (list || []).filter((c) => !blocked.includes(c.otherUserId)), [list, blocked]);
  const archivedCount = visible.filter((c) => c.archived).length;
  const archivedUnread = visible.filter((c) => c.archived && c.unreadCount > 0).length;
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible
      .filter((c) => c.archived === showArchived)
      .filter((c) => !q || c.otherUserDetails.name.toLowerCase().includes(q) || (c.courseTitle || '').toLowerCase().includes(q));
  }, [visible, search, showArchived]);

  // Leave the archive view once it's empty.
  useEffect(() => {
    if (showArchived && list && archivedCount === 0) setShowArchived(false);
  }, [showArchived, archivedCount, list]);

  const unreadTotal = shown.reduce((s, c) => s + c.unreadCount, 0);

  const open = (c) =>
    navigation.navigate('ChatDetail', {
      conversationId: c.conversationId,
      otherUserId: c.otherUserId,
      otherUserName: c.otherUserDetails.name,
    });

  const toggleArchive = async (c) => {
    setList((rows) => (rows || []).map((r) => (r.conversationId === c.conversationId ? { ...r, archived: !c.archived } : r)));
    try {
      await setConversationArchived(c.conversationId, !c.archived);
      haptics.success();
    } catch {
      Alert.alert('Couldn’t update chat', 'Please try again.');
    }
  };

  // Long-press a chat for its options.
  const askOptions = (c) => {
    haptics.warning();
    Alert.alert(c.otherUserDetails.name, undefined, [
      { text: c.archived ? 'Unarchive' : 'Archive', onPress: () => toggleArchive(c) },
      { text: 'Delete chat', style: 'destructive', onPress: () => askDelete(c) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Delete a chat (for me only).
  const askDelete = (c) => {
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

  const SwipeAction = ({ icon, label, color, onPress }) => (
    <PressableScale onPress={onPress} scaleTo={0.94} accessibilityLabel={label} style={[styles.action, { backgroundColor: color, borderRadius: radius.lg }]}>
      <Ionicons name={icon} size={22} color="#fff" />
      <AppText variant="caption" color="#fff" style={{ marginTop: 4, fontFamily: 'PlusJakartaSans_700Bold' }}>
        {label}
      </AppText>
    </PressableScale>
  );

  const renderActions = (c) => (progress, _translation, swipeable) => (
    <SwipeActions progress={progress}>
      <SwipeAction
        icon={c.archived ? 'arrow-undo' : 'archive'}
        label={c.archived ? 'Unarchive' : 'Archive'}
        color={colors.info}
        onPress={() => {
          swipeable.close();
          toggleArchive(c);
        }}
      />
      <SwipeAction
        icon="trash"
        label="Delete"
        color={colors.danger}
        onPress={() => {
          swipeable.close();
          askDelete(c);
        }}
      />
    </SwipeActions>
  );

  const renderItem = ({ item: c, index }) => {
    const unread = c.unreadCount > 0;
    const tier = levelInfo(c.otherUserDetails.xp).tier;
    const mine = c.lastSenderId === user?.uid;
    return (
      <Animated.View entering={index < 10 ? FadeInDown.delay(index * 35) : undefined}>
        <ReanimatedSwipeable
          renderRightActions={renderActions(c)}
          rightThreshold={40}
          friction={1.6}
          overshootRight={false}
          containerStyle={{ borderRadius: radius.lg }}
        >
          <PressableScale
            onPress={() => open(c)}
            onLongPress={() => askOptions(c)}
            scaleTo={0.98}
            accessibilityLabel={`Chat with ${c.otherUserDetails.name}${unread ? `, ${c.unreadCount} unread` : ''}`}
          >
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
                  <AppText
                    variant="small"
                    tone={unread ? 'default' : 'muted'}
                    numberOfLines={1}
                    style={[{ flex: 1 }, unread && { fontFamily: 'PlusJakartaSans_600SemiBold' }]}
                  >
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
        </ReanimatedSwipeable>
      </Animated.View>
    );
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        showArchived ? (
          <Header title="Archived" subtitle={`${archivedCount} chat${archivedCount === 1 ? '' : 's'}`} onBack={() => setShowArchived(false)} />
        ) : (
          <Header
            large
            transparent
            title="Chats"
            subtitle={unreadTotal ? `${unreadTotal} unread` : 'Messages'}
            right={<IconButton icon="create-outline" variant="primary" onPress={() => navigation.navigate('UsersList')} accessibilityLabel="New message" />}
          />
        )
      }
    >
      <FlatList
        data={shown}
        keyExtractor={(c) => c.conversationId}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {(list || []).length > 3 ? (
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
            ) : null}
            {!showArchived && archivedCount > 0 ? (
              <PressableScale onPress={() => setShowArchived(true)} scaleTo={0.98} accessibilityLabel={`Archived chats, ${archivedCount}`}>
                <View style={[styles.row, { borderRadius: radius.lg }]}>
                  <View style={[styles.archiveIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="archive-outline" size={22} color={colors.textMuted} />
                  </View>
                  <AppText variant="title" style={{ flex: 1, marginLeft: 12 }}>
                    Archived
                  </AppText>
                  <AppText variant="small" tone={archivedUnread ? 'primary' : 'faint'} style={{ marginRight: 6 }}>
                    {archivedCount}
                  </AppText>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </View>
              </PressableScale>
            ) : null}
            {!showArchived && (list || []).length > 0 && (list || []).length <= 3 ? (
              <AppText variant="caption" tone="faint" style={{ marginHorizontal: 10, marginBottom: 6 }}>
                Tip: swipe a chat left to archive or delete it.
              </AppText>
            ) : null}
          </>
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
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingLeft: 8, paddingVertical: 2 },
  action: { width: 78, alignItems: 'center', justifyContent: 'center' },
  archiveIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

export default ConversationsScreen;
