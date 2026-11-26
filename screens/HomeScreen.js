import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Composer, { ComposerPrompt } from '../components/social/Composer';
import PostCard from '../components/social/PostCard';
import { ContentOptionsSheet } from '../components/social/SafetySheets';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { AppText, Avatar, Card, Chip, EmptyState, Header, IconButton, PressableScale, Screen, Segmented, Skeleton } from '../components/ui';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';
import usePosts from '../hooks/usePosts';
import { followUser } from '../services/userService';
import { useTheme } from '../theme';
import { levelInfo } from '../utils/gamification';
import haptics from '../utils/haptics';

const TRENDING = [
  { label: 'AI & ML', icon: 'hardware-chip' },
  { label: 'Web Dev', icon: 'code-slash' },
  { label: 'UI/UX', icon: 'color-palette' },
  { label: 'Data Science', icon: 'analytics' },
  { label: 'Cyber Security', icon: 'shield-checkmark' },
  { label: 'Leadership', icon: 'people' },
];

const HomeScreen = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const { user, profile, displayName } = useUser();
  const { posts, error, load, like, comment, remove, prepend, blocked } = usePosts();
  const [scope, setScope] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [options, setOptions] = useState(null);
  const [people, setPeople] = useState([]);
  const [followed, setFollowed] = useState({});

  const loadPeople = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('xp', 'desc'), limit(15)));
      const following = profile?.following || [];
      setPeople(
        snap.docs
          .filter((d) => d.id !== user?.uid && !following.includes(d.id) && !(profile?.blocked || []).includes(d.id))
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              name: [x.firstName, x.lastName].filter(Boolean).join(' ') || 'Learner',
              photo: x.profileImage,
              info: levelInfo(Number(x.xp) || 0),
              topSkill: Object.keys(x.verifiedSkills || {})[0],
            };
          })
          .slice(0, 8)
      );
    } catch {
      setPeople([]);
    }
  }, [user?.uid, profile?.following, profile?.blocked]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (!people.length) loadPeople();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadPeople()]);
    setRefreshing(false);
  };

  const feed = useMemo(() => {
    if (!posts) return null;
    if (scope === 'following') {
      const following = new Set([...(profile?.following || []), user?.uid]);
      return posts.filter((p) => following.has(p.userId));
    }
    return posts;
  }, [posts, scope, profile?.following, user?.uid]);

  const openProfile = (uid) => {
    if (!uid) return;
    if (uid === user?.uid) navigation.navigate('Profile');
    else navigation.navigate('UserProfile', { userId: uid });
  };

  const follow = async (person) => {
    setFollowed((f) => ({ ...f, [person.id]: true }));
    haptics.success();
    const r = await followUser(person.id);
    if (!r.success) setFollowed((f) => ({ ...f, [person.id]: false }));
  };

  const author = { name: displayName, photo: profile?.profileImage };

  const header = (
    <View>
      <ComposerPrompt author={author} onPress={() => setComposerOpen(true)} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.hList}>
        {TRENDING.map((t) => (
          <Chip key={t.label} label={`#${t.label}`} icon={t.icon} onPress={() => navigation.navigate('LearnSkill', { search: t.label })} />
        ))}
      </ScrollView>

      {people.length ? (
        <>
          <View style={styles.sectionHead}>
            <AppText variant="h3">People to follow</AppText>
            <PressableScale onPress={() => navigation.navigate('UsersList')}>
              <AppText variant="smallStrong" tone="primary">
                Find people
              </AppText>
            </PressableScale>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.hList}>
            {people.map((p) => (
              <Card key={p.id} padding={14} style={styles.person} onPress={() => openProfile(p.id)} accessibilityLabel={p.name}>
                <Avatar uri={p.photo} name={p.name} size={58} ring={p.info.tier.colors} />
                <AppText variant="smallStrong" numberOfLines={1} align="center" style={{ marginTop: 8 }}>
                  {p.name}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1} align="center">
                  {p.topSkill || `Level ${p.info.level}`}
                </AppText>
                <PressableScale onPress={() => !followed[p.id] && follow(p)} style={{ marginTop: 10, alignSelf: 'stretch' }}>
                  <View style={[styles.followBtn, { backgroundColor: followed[p.id] ? colors.surfaceAlt : colors.primary }]}>
                    <Ionicons name={followed[p.id] ? 'checkmark' : 'person-add'} size={14} color={followed[p.id] ? colors.textMuted : '#fff'} />
                    <AppText variant="caption" color={followed[p.id] ? colors.textMuted : '#fff'} style={{ marginLeft: 5, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {followed[p.id] ? 'Following' : 'Follow'}
                    </AppText>
                  </View>
                </PressableScale>
              </Card>
            ))}
          </ScrollView>
        </>
      ) : null}

      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: 'all', label: 'For you' },
          { value: 'following', label: 'Following' },
        ]}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      />
    </View>
  );

  const empty =
    feed === null ? (
      <View style={{ gap: 12 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} height={180} radius={18} />
        ))}
      </View>
    ) : (
      <EmptyState
        icon={error ? 'cloud-offline-outline' : scope === 'following' ? 'people-outline' : 'chatbubbles-outline'}
        title={error ? 'Couldn’t load posts' : scope === 'following' ? 'Your circle is quiet' : 'No posts yet'}
        message={
          error
            ? 'Pull down to try again.'
            : scope === 'following'
            ? 'Follow people to see their posts here.'
            : 'Be the first to share something with the community.'
        }
        actionLabel={error ? undefined : 'Write a post'}
        onAction={() => setComposerOpen(true)}
      />
    );

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <Header
          large
          title="Community"
          subtitle="Learn together"
          transparent
          right={
            <>
              <IconButton icon="search" onPress={() => navigation.navigate('UsersList')} accessibilityLabel="Find people" />
              <IconButton icon="add" variant="primary" onPress={() => setComposerOpen(true)} accessibilityLabel="New post" />
            </>
          }
        />
      }
    >
      <FlatList
        data={feed || []}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 6 ? FadeInDown.delay(index * 50) : undefined}>
            <PostCard
              post={item}
              currentUid={user?.uid}
              blocked={blocked}
              onLike={like}
              onComment={comment}
              onOpenProfile={openProfile}
              onMore={(post, mine) => setOptions({ type: 'post', id: post.id, userId: post.userId, userName: post.userName, mine })}
            />
          </Animated.View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
      />

      <Composer visible={composerOpen} onClose={() => setComposerOpen(false)} onPosted={prepend} author={author} />
      <ContentOptionsSheet target={options} onClose={() => setOptions(null)} onDelete={(t) => remove(t.id)} onBlocked={() => load()} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -20, marginTop: 14 },
  hList: { paddingHorizontal: 20, gap: 8 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  person: { width: 140, alignItems: 'center' },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 32, borderRadius: 10 },
});

export default HomeScreen;
