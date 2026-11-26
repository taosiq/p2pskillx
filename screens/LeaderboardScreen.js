import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, documentId, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { TierBadge } from '../components/game';
import { AppText, Avatar, EmptyState, Header, PressableScale, Screen, Segmented, Skeleton } from '../components/ui';
import { db } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { levelInfo } from '../utils/gamification';

const TOP_N = 50;

// Only the public, non-sensitive fields are used from each profile.
const toEntry = (d) => {
  const data = d.data();
  const xp = Number(data.xp) || 0;
  return {
    id: d.id,
    name: [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Learner',
    photo: data.profileImage,
    xp,
    info: levelInfo(xp),
    skills: Object.keys(data.verifiedSkills || {}).length,
  };
};

async function fetchGlobal() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('xp', 'desc'), limit(TOP_N)));
  return snap.docs.map(toEntry);
}

async function fetchFollowing(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
    out.push(...snap.docs.map(toEntry));
  }
  return out.sort((a, b) => b.xp - a.xp);
}

const MEDALS = [
  ['#FFE066', '#F59E0B'],
  ['#F1F5F9', '#94A3B8'],
  ['#E7A574', '#9A5B36'],
];

const LeaderboardScreen = ({ navigation }) => {
  const { colors, gradients, radius } = useTheme();
  const { user, profile, game, displayName } = useUser();
  const [scope, setScope] = useState('global');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      if (scope === 'global') {
        setRows(await fetchGlobal());
      } else {
        const ids = [...new Set([...(profile?.following || []), user.uid])];
        setRows(await fetchFollowing(ids));
      }
    } catch (e) {
      console.warn('Leaderboard failed:', e?.code || e?.message);
      setError(true);
      setRows([]);
    }
  }, [scope, profile?.following, user?.uid]);

  useEffect(() => {
    setRows(null);
    load();
  }, [scope]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const myIndex = useMemo(() => (rows || []).findIndex((r) => r.id === user?.uid), [rows, user?.uid]);
  const podium = (rows || []).slice(0, 3);
  const rest = (rows || []).slice(3);

  const openUser = (row) => {
    if (row.id === user?.uid) navigation.navigate('Main', { screen: 'Profile' });
    else navigation.navigate('UserProfile', { userId: row.id });
  };

  const renderRow = ({ item, index }) => {
    const rank = index + 4;
    const me = item.id === user?.uid;
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40)}>
        <PressableScale onPress={() => openUser(item)} scaleTo={0.98} accessibilityLabel={`Rank ${rank}, ${item.name}, ${item.xp} XP`}>
          <View
            style={[
              styles.row,
              {
                backgroundColor: me ? colors.primarySoft : colors.surface,
                borderColor: me ? colors.primary : colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <AppText variant="title" tone="muted" style={styles.rank}>
              {rank}
            </AppText>
            <Avatar uri={item.photo} name={item.name} size={42} ring={item.info.tier.colors} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.name}
                {me ? ' (you)' : ''}
              </AppText>
              <AppText variant="caption" tone="muted">
                Level {item.info.level} · {item.skills} skill{item.skills === 1 ? '' : 's'}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="title" tone="xp">
                {item.xp.toLocaleString()}
              </AppText>
              <AppText variant="caption" tone="faint">
                XP
              </AppText>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  const PodiumSpot = ({ entry, place }) => {
    if (!entry) return <View style={styles.podiumCol} />;
    const tall = place === 1 ? 118 : place === 2 ? 88 : 68;
    return (
      <Animated.View entering={FadeInUp.delay(place * 120)} style={styles.podiumCol}>
        <PressableScale onPress={() => openUser(entry)} style={{ alignItems: 'center' }} accessibilityLabel={`Rank ${place}, ${entry.name}`}>
          {place === 1 ? <Ionicons name="trophy" size={26} color="#FFC83D" style={{ marginBottom: 4 }} /> : null}
          <Avatar uri={entry.photo} name={entry.name} size={place === 1 ? 74 : 60} ring={MEDALS[place - 1]} />
          <AppText variant="smallStrong" numberOfLines={1} align="center" style={{ marginTop: 6, maxWidth: 100 }}>
            {entry.name.split(' ')[0]}
          </AppText>
          <AppText variant="caption" tone="xp" style={{ fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
            {entry.xp.toLocaleString()} XP
          </AppText>
        </PressableScale>
        <LinearGradient colors={MEDALS[place - 1]} style={[styles.step, { height: tall }]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
          <AppText variant="statLg" color={place === 1 ? '#7A4A00' : place === 2 ? '#334155' : '#4A2513'} style={{ fontSize: 32 }}>
            {place}
          </AppText>
        </LinearGradient>
      </Animated.View>
    );
  };

  const header = (
    <>
      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: 'global', label: 'Global' },
          { value: 'following', label: 'Following' },
        ]}
        style={{ marginBottom: 18 }}
      />
      {rows === null ? (
        <View style={styles.podium}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="30%" height={180} radius={16} />
          ))}
        </View>
      ) : rows.length ? (
        <View style={styles.podium}>
          <PodiumSpot entry={podium[1]} place={2} />
          <PodiumSpot entry={podium[0]} place={1} />
          <PodiumSpot entry={podium[2]} place={3} />
        </View>
      ) : (
        <EmptyState
          icon={error ? 'cloud-offline-outline' : 'podium-outline'}
          title={error ? 'Couldn’t load rankings' : 'No rankings yet'}
          message={
            error
              ? 'Check your connection and pull down to try again.'
              : scope === 'following'
              ? 'Follow other learners to compete with friends.'
              : 'Earn XP to put yourself on the board.'
          }
        />
      )}
    </>
  );

  // Pinned "your position" bar when you're outside what's on screen.
  const mine =
    game && rows && rows.length && myIndex === -1 ? (
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.mine, { borderRadius: radius.lg }]}>
        <AppText variant="title" color="#fff" style={styles.rank}>
          {TOP_N}+
        </AppText>
        <Avatar uri={profile?.profileImage} name={displayName} size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="bodyStrong" color="#fff">
            You
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            {game.level.remaining.toLocaleString()} XP to Level {game.level.level + 1}
          </AppText>
        </View>
        <TierBadge tier={game.level.tier} compact />
      </LinearGradient>
    ) : null;

  return (
    <Screen
      scroll={false}
      padded={false}
      edges={['top', 'bottom']}
      header={<Header title="Leaderboard" subtitle="Ranked by XP" onBack={() => navigation.goBack()} />}
      footer={mine ? <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>{mine}</View> : null}
    >
      <FlatList
        data={rest}
        keyExtractor={(r) => r.id}
        renderItem={renderRow}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  podiumCol: { flex: 1, alignItems: 'center' },
  step: { alignSelf: 'stretch', marginTop: 10, borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1.5 },
  rank: { width: 34, textAlign: 'center', marginRight: 6 },
  mine: { flexDirection: 'row', alignItems: 'center', padding: 12 },
});

export default LeaderboardScreen;
