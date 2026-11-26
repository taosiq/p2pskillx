import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CourseCard from '../components/CourseCard';
import { AchievementTile, LevelCard, QuestList, StreakCard } from '../components/game';
import { TAB_BAR_SPACE } from '../components/TabBar';
import {
  AppText,
  Avatar,
  Card,
  EmptyState,
  IconButton,
  PressableScale,
  Screen,
  SectionHeader,
  Sheet,
  Skeleton,
  StatTile,
} from '../components/ui';
import { useUser } from '../context/UserContext';
import useUnreadNotifications from '../hooks/useUnreadNotifications';
import { getAllCourses } from '../services/courseService';
import { rankCourses } from '../utils/recommend';
import { removeVerifiedSkill } from '../services/skillService';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';

const LEVEL_GRADIENTS = {
  Beginner: ['#10B981', '#2EE59D'],
  Intermediate: ['#3B82F6', '#22D3EE'],
  Advanced: ['#7C5CFF', '#C04BFF'],
  Expert: ['#FF8A3D', '#FF4FD8'],
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardScreen = ({ navigation, route }) => {
  const { colors, gradients, spacing } = useTheme();
  const { profile, game, displayName, profileLoading, user } = useUser();
  const unread = useUnreadNotifications();
  const [recs, setRecs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [skillMenu, setSkillMenu] = useState(null);
  const [welcome, setWelcome] = useState(!!route.params?.welcome);

  const loadRecs = useCallback(async () => {
    try {
      const r = await getAllCourses();
      setRecs(rankCourses(r.courses || [], profile, user?.uid).slice(0, 8).map((x) => x.course));
    } catch {
      setRecs([]);
    }
  }, [profile, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (recs === null) loadRecs();
    }, [recs, loadRecs])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecs();
    setRefreshing(false);
  };

  const skills = useMemo(() => Object.entries(profile?.verifiedSkills || {}), [profile?.verifiedSkills]);

  // Unlocked first (newest feel), then the ones closest to unlocking.
  const featuredAchievements = useMemo(() => {
    if (!game) return [];
    const unlocked = game.achievements.filter((a) => a.unlocked);
    const locked = game.achievements.filter((a) => !a.unlocked).sort((a, b) => b.progress - a.progress);
    return [...locked.slice(0, 3), ...unlocked].slice(0, 6);
  }, [game]);

  const openCourse = (course) => navigation.navigate('CourseDetails', { courseId: course.id });

  const deleteSkill = (name) => {
    setSkillMenu(null);
    Alert.alert('Remove skill?', `“${name}” will be removed from your verified skills. You can verify it again later.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const r = await removeVerifiedSkill(name);
          if (r.success) haptics.success();
          else Alert.alert('Couldn’t remove skill', 'Please try again.');
        },
      },
    ]);
  };

  const quickActions = [
    { key: 'learn', label: 'Learn', icon: 'compass', gradient: gradients.ocean, onPress: () => navigation.navigate('LearnSkill') },
    { key: 'teach', label: 'Teach', icon: 'easel', gradient: gradients.primary, onPress: () => navigation.navigate('CourseTypeSelection') },
    { key: 'verify', label: 'Verify', icon: 'ribbon', gradient: gradients.success, onPress: () => navigation.navigate('SkillCategory') },
    { key: 'ranks', label: 'Ranks', icon: 'podium', gradient: gradients.gold, onPress: () => navigation.navigate('Leaderboard') },
  ];

  const firstName = profile?.firstName || displayName.split(' ')[0];
  const loading = profileLoading && !profile;

  return (
    <Screen
      contentStyle={{ paddingBottom: TAB_BAR_SPACE }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <PressableScale onPress={() => navigation.navigate('Profile')} accessibilityLabel="Your profile">
          <Avatar uri={profile?.profileImage} name={displayName} size={46} ring={game?.level.tier.colors} />
        </PressableScale>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <AppText variant="small" tone="muted">
            {greeting()}
          </AppText>
          <AppText variant="h3" numberOfLines={1}>
            {firstName} 👋
          </AppText>
        </View>
        <PressableScale onPress={() => navigation.navigate('Achievements')} accessibilityLabel={`${profile?.credits ?? 0} credits`}>
          <View style={[styles.credits, { backgroundColor: colors.warningSoft, borderColor: colors.warning + '50' }]}>
            <Ionicons name="flash" size={15} color={colors.warning} />
            <AppText variant="smallStrong" tone="warning" style={{ marginLeft: 4 }}>
              {profile?.credits ?? '–'}
            </AppText>
          </View>
        </PressableScale>
        <IconButton
          icon="notifications-outline"
          badge={unread}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel={`Notifications, ${unread} unread`}
          style={{ marginLeft: 10 }}
        />
      </View>

      {welcome ? (
        <Animated.View entering={FadeInDown}>
          <Card variant="gradient" gradient={gradients.cool} style={styles.welcome}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" color="#fff">
                Welcome to P2PSkillX! 🎉
              </AppText>
              <AppText variant="small" color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }}>
                You’ve got 100 credits. Verify your first skill to earn XP and unlock your first badge.
              </AppText>
            </View>
            <IconButton icon="close" variant="glass" color="#fff" size={34} iconSize={18} onPress={() => setWelcome(false)} accessibilityLabel="Dismiss" />
          </Card>
        </Animated.View>
      ) : null}

      {/* Level */}
      <Animated.View entering={FadeInDown.delay(50)}>
        {loading || !game ? (
          <Skeleton height={170} radius={24} />
        ) : (
          <LevelCard level={game.level} onPress={() => navigation.navigate('Achievements')} />
        )}
      </Animated.View>

      {/* Quick actions */}
      <View style={styles.actions}>
        {quickActions.map((a) => (
          <PressableScale key={a.key} onPress={a.onPress} style={styles.action} accessibilityLabel={a.label}>
            <LinearGradient colors={a.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionIcon}>
              <Ionicons name={a.icon} size={24} color="#fff" />
            </LinearGradient>
            <AppText variant="smallStrong" style={{ marginTop: 6 }}>
              {a.label}
            </AppText>
          </PressableScale>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatTile
          icon="ribbon"
          label="Skills"
          value={skills.length}
          gradient={gradients.violet}
          onPress={() => navigation.navigate('Profile', { initialTab: 'skills' })}
        />
        <StatTile
          icon="school"
          label="Learning"
          value={Object.keys(profile?.enrolledCourses || {}).length}
          gradient={gradients.ocean}
          onPress={() => navigation.navigate('Profile', { initialTab: 'enrolled' })}
        />
        <StatTile
          icon="easel"
          label="Teaching"
          value={(profile?.courses || []).length}
          gradient={gradients.pink}
          onPress={() => navigation.navigate('Profile', { initialTab: 'courses' })}
        />
      </View>

      {/* Streak + quests */}
      {game ? (
        <>
          <StreakCard streak={game.streak} best={game.bestStreak} week={game.week} style={{ marginTop: spacing.lg }} />
          <QuestList quests={game.quests} onQuestPress={(q) => navigation.navigate(q.route)} style={{ marginTop: spacing.md }} />
        </>
      ) : null}

      {/* Skills */}
      <SectionHeader
        title="Your skills"
        action={skills.length ? 'See all' : undefined}
        onAction={() => navigation.navigate('Profile', { initialTab: 'skills' })}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList} style={styles.bleed}>
        {skills.map(([name, data]) => {
          const g = LEVEL_GRADIENTS[data.level] || gradients.violet;
          return (
            <PressableScale
              key={name}
              onLongPress={() => {
                haptics.press();
                setSkillMenu(name);
              }}
              onPress={() => setSkillMenu(name)}
              accessibilityLabel={`${name}, ${data.level || 'verified'}. Tap for options`}
            >
              <View style={[styles.skill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.skillBar} />
                <View style={styles.skillHead}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <AppText variant="caption" tone="muted" style={{ marginLeft: 4 }}>
                    Verified
                  </AppText>
                </View>
                <AppText variant="title" numberOfLines={2} style={{ marginTop: 8 }}>
                  {name}
                </AppText>
                <AppText variant="smallStrong" color={g[0]} style={{ marginTop: 4 }}>
                  {data.level || 'Verified'}
                </AppText>
              </View>
            </PressableScale>
          );
        })}
        <PressableScale onPress={() => navigation.navigate('SkillCategory')} accessibilityLabel="Verify a new skill">
          <View style={[styles.skill, styles.addSkill, { borderColor: colors.primary + '66', backgroundColor: colors.primarySoft }]}>
            <View style={[styles.addIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <AppText variant="smallStrong" tone="primary" align="center" style={{ marginTop: 10 }}>
              Verify a skill
            </AppText>
            <AppText variant="caption" tone="muted" align="center">
              up to +100 XP
            </AppText>
          </View>
        </PressableScale>
      </ScrollView>

      {/* Achievements */}
      {game ? (
        <>
          <SectionHeader
            title={`Achievements · ${game.unlockedCount}/${game.achievements.length}`}
            action="See all"
            onAction={() => navigation.navigate('Achievements')}
          />
          <FlatList
            horizontal
            data={featuredAchievements}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => <AchievementTile achievement={item} onPress={() => navigation.navigate('Achievements')} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            style={styles.bleed}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          />
        </>
      ) : null}

      {/* Recommendations */}
      <SectionHeader title="Recommended for you" action="More" onAction={() => navigation.navigate('Recommendations')} />
      {recs === null ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={230} height={210} radius={18} />
          <Skeleton width={120} height={210} radius={18} />
        </View>
      ) : recs.length ? (
        <FlatList
          horizontal
          data={recs}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CourseCard course={item} onPress={() => openCourse(item)} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          style={styles.bleed}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      ) : (
        <Card>
          <EmptyState
            icon="rocket-outline"
            title="Be the first to teach"
            message="No community courses match you yet. Share what you know and earn credits."
            actionLabel="Create a course"
            onAction={() => navigation.navigate('CourseTypeSelection')}
            style={{ paddingVertical: 12 }}
          />
        </Card>
      )}

      {/* Skill options */}
      <Sheet visible={!!skillMenu} onClose={() => setSkillMenu(null)} title={skillMenu || ''} subtitle={skillMenu ? `${profile?.verifiedSkills?.[skillMenu]?.level || 'Verified'} · verified skill` : ''}>
        <View style={{ gap: 10 }}>
          <SheetAction
            icon="easel-outline"
            label="Teach this skill"
            onPress={() => {
              setSkillMenu(null);
              navigation.navigate('CourseTypeSelection');
            }}
          />
          <SheetAction
            icon="refresh-outline"
            label="Re-verify at a higher level"
            onPress={() => {
              const s = skillMenu;
              setSkillMenu(null);
              navigation.navigate('SkillCategory', { editingSkill: s });
            }}
          />
          <SheetAction icon="trash-outline" label="Remove skill" danger onPress={() => deleteSkill(skillMenu)} />
        </View>
      </Sheet>
    </Screen>
  );
};

function SheetAction({ icon, label, onPress, danger }) {
  const { colors, radius } = useTheme();
  const c = danger ? colors.danger : colors.text;
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={label}>
      <View style={[styles.sheetAction, { backgroundColor: danger ? colors.dangerSoft : colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
        <Ionicons name={icon} size={20} color={c} />
        <AppText variant="bodyStrong" color={c} style={{ marginLeft: 12 }}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 18 },
  credits: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 34, borderRadius: 17, borderWidth: 1 },
  welcome: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  action: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 20 },
  bleed: { marginHorizontal: -20 },
  hList: { paddingHorizontal: 20, gap: 12 },
  skill: { width: 150, minHeight: 128, borderRadius: 18, borderWidth: 1, padding: 14, paddingTop: 16, overflow: 'hidden' },
  skillBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  skillHead: { flexDirection: 'row', alignItems: 'center' },
  addSkill: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
  addIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetAction: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
});

export default DashboardScreen;
