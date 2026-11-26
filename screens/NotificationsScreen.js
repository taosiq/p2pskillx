import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Avatar, Button, EmptyState, Header, PressableScale, Screen, Segmented, Skeleton } from '../components/ui';
import { useUser } from '../context/UserContext';
import { deleteNotification, listenToNotifications, markAllNotificationsRead, markNotificationAsRead } from '../services/notificationService';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';
import { timeAgo } from '../utils/time';

const TYPE = {
  post_like: { icon: 'heart', color: '#FF5470' },
  post_comment: { icon: 'chatbubble', color: '#12C2FF' },
  course_enrollment: { icon: 'school', color: '#2EE59D' },
  user_follow: { icon: 'person-add', color: '#8B6CFF' },
  credit_deduction: { icon: 'flash', color: '#FFB547' },
  credit_earned: { icon: 'flash', color: '#2EE59D' },
  following_post: { icon: 'newspaper', color: '#2F8CFF' },
  following_course: { icon: 'easel', color: '#FF7A45' },
  skill_verified: { icon: 'ribbon', color: '#2EE59D' },
  tier_reward: { icon: 'trophy', color: '#FFC83D' },
};

const describe = (n) => {
  switch (n.type) {
    case 'post_like':
      return { title: `${n.senderName || 'Someone'} liked your post`, body: n.postText };
    case 'post_comment':
      return { title: `${n.senderName || 'Someone'} commented`, body: n.commentText || n.postText };
    case 'course_enrollment':
      return { title: `${n.senderName || 'Someone'} joined your course`, body: n.courseTitle };
    case 'user_follow':
      return { title: `${n.senderName || 'Someone'} started following you`, body: 'Follow back to see their posts' };
    case 'credit_deduction':
      return { title: `${n.creditsAmount || ''} credits spent`, body: n.courseTitle ? `Enrolled in ${n.courseTitle}` : n.reason };
    case 'credit_earned':
      return { title: `+${n.creditsAmount || ''} credits earned`, body: n.courseTitle ? `From ${n.courseTitle}` : n.reason };
    case 'following_post':
      return { title: `${n.senderName || 'Someone'} posted`, body: n.postText };
    case 'following_course':
      return { title: `${n.senderName || 'Someone'} published a course`, body: n.courseTitle };
    case 'tier_reward':
      return { title: `Tier reward: +${n.creditsAmount || ''} credits`, body: n.reason };
    default:
      return { title: `${n.senderName || 'P2PSkillX'} ${n.action || ''}`.trim(), body: n.reason };
  }
};

const bucket = (d) => {
  const days = (Date.now() - d.getTime()) / 86400000;
  if (days < 1 && new Date().getDate() === d.getDate()) return 'Today';
  if (days < 7) return 'This week';
  return 'Earlier';
};

const NotificationsScreen = ({ navigation }) => {
  const { colors, radius } = useTheme();
  const { user, profile } = useUser();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => (user ? listenToNotifications((list) => setItems(list)) : undefined), [user?.uid]);

  const blocked = profile?.blocked || [];
  const unread = (items || []).filter((n) => !n.read);

  const sections = useMemo(() => {
    const list = (items || []).filter((n) => !blocked.includes(n.senderId)).filter((n) => (filter === 'unread' ? !n.read : true));
    const groups = {};
    list.forEach((n) => {
      const k = bucket(n.date);
      (groups[k] = groups[k] || []).push(n);
    });
    return ['Today', 'This week', 'Earlier'].filter((k) => groups[k]).map((k) => ({ title: k, data: groups[k] }));
  }, [items, filter, blocked]);

  const open = (n) => {
    if (!n.read) markNotificationAsRead(n.id);
    if (n.courseId) navigation.navigate(n.type === 'course_enrollment' ? 'CourseAccess' : 'CourseDetails', { courseId: n.courseId });
    else if (n.postId) navigation.navigate('Main', { screen: 'Home' });
    else if (n.senderId && n.senderId !== user?.uid) navigation.navigate('UserProfile', { userId: n.senderId });
  };

  const remove = (n) => {
    haptics.tap();
    deleteNotification(n.id);
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <Header
          title="Notifications"
          subtitle={unread.length ? `${unread.length} unread` : 'All caught up'}
          onBack={() => navigation.goBack()}
          right={
            unread.length ? (
              <Button
                title="Read all"
                variant="ghost"
                size="sm"
                onPress={() => {
                  haptics.success();
                  markAllNotificationsRead(unread.map((n) => n.id));
                }}
              />
            ) : null
          }
        />
      }
    >
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: 20, paddingTop: 12 }}
        ListHeaderComponent={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unread.length },
            ]}
            style={{ marginBottom: 6 }}
          />
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="overline" tone="faint" style={{ marginTop: 18, marginBottom: 8 }}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item: n, index }) => {
          const t = TYPE[n.type] || { icon: 'notifications', color: colors.primary };
          const d = describe(n);
          return (
            <Animated.View entering={index < 10 ? FadeInDown.delay(index * 30) : undefined} style={{ marginBottom: 8 }}>
              <PressableScale onPress={() => open(n)} onLongPress={() => remove(n)} scaleTo={0.98} accessibilityLabel={`${d.title}. Long-press to delete`}>
                <View
                  style={[
                    styles.row,
                    {
                      borderRadius: radius.lg,
                      backgroundColor: n.read ? colors.surface : colors.primarySoft,
                      borderColor: n.read ? colors.border : colors.primary + '44',
                    },
                  ]}
                >
                  <View>
                    {n.systemNotification || !n.senderName ? (
                      <View style={[styles.sys, { backgroundColor: t.color + '26' }]}>
                        <Ionicons name={t.icon} size={22} color={t.color} />
                      </View>
                    ) : (
                      <Avatar uri={n.senderProfileImage} name={n.senderName} size={46} />
                    )}
                    {!n.systemNotification && n.senderName ? (
                      <View style={[styles.typeDot, { backgroundColor: t.color, borderColor: colors.bg }]}>
                        <Ionicons name={t.icon} size={10} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText variant="bodyStrong" numberOfLines={2}>
                      {d.title}
                    </AppText>
                    {d.body ? (
                      <AppText variant="small" tone="muted" numberOfLines={2}>
                        {d.body}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" tone={n.read ? 'faint' : 'primary'} style={{ marginTop: 3 }}>
                      {timeAgo(n.date)}
                    </AppText>
                  </View>
                  {!n.read ? <View style={[styles.unread, { backgroundColor: colors.primary }]} /> : null}
                </View>
              </PressableScale>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          items === null ? (
            <View style={{ gap: 10, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={74} radius={18} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="notifications-off-outline"
              title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
              message="Likes, comments, new followers and enrolments show up here."
            />
          )
        }
        ListFooterComponent={
          sections.length ? (
            <AppText variant="caption" tone="faint" align="center" style={{ marginTop: 12 }}>
              Long-press a notification to delete it
            </AppText>
          ) : null
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
  sys: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeDot: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
});

export default NotificationsScreen;
