import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CourseCard from '../components/CourseCard';
import { TAB_BAR_SPACE } from '../components/TabBar';
import { AppText, Chip, EmptyState, Header, IconButton, PressableScale, Screen, Segmented, Skeleton } from '../components/ui';
import { CATEGORIES } from '../constants/categories';
import { useUser } from '../context/UserContext';
import { getAllCourses } from '../services/courseService';
import { useTheme } from '../theme';

const SORTS = [
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'Newest' },
  { value: 'cheap', label: 'Lowest cost' },
];

const LearnSkillScreen = ({ navigation, route }) => {
  const { colors, radius, fonts, spacing, glow } = useTheme();
  const { user, profile } = useUser();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(route.params?.search || '');
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('popular');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params?.search != null) setSearch(route.params.search);
  }, [route.params?.search]);

  const load = useCallback(async () => {
    setError(false);
    const r = await getAllCourses();
    if (r.success) setCourses(r.courses.filter((c) => c.status !== 'archived'));
    else {
      setError(true);
      setCourses((c) => c || []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const enrolled = profile?.enrolledCourses || {};
  const skills = Object.keys(profile?.verifiedSkills || {});

  const filtered = useMemo(() => {
    if (!courses) return null;
    const q = search.trim().toLowerCase();
    let list = courses.filter((c) => {
      if (category && c.category !== category) return false;
      if (!q) return true;
      const hay = [c.title, c.description, c.category, ...(c.skills || [])].join(' ').toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
    list = [...list].sort((a, b) => {
      if (sort === 'new') return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      if (sort === 'cheap') return (a.credits || 0) - (b.credits || 0);
      return (b.enrollments || 0) - (a.enrollments || 0);
    });
    return list;
  }, [courses, search, category, sort]);

  // "Picked for you": matches your verified skills or their category, not yet joined, not yours.
  const forYou = useMemo(() => {
    if (!courses) return [];
    const words = skills.map((s) => s.toLowerCase());
    return courses
      .filter((c) => c.creatorId !== user?.uid && !enrolled[c.id])
      .map((c) => {
        const hay = [c.title, c.category, ...(c.skills || [])].join(' ').toLowerCase();
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 2 : 0), 0) + Math.min(3, (c.enrollments || 0) / 5);
        return { c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.c);
  }, [courses, skills, enrolled, user?.uid]);

  const open = (course) => {
    const mine = course.creatorId === user?.uid;
    navigation.navigate(mine || enrolled[course.id] ? 'CourseAccess' : 'CourseDetails', { courseId: course.id });
  };

  const browsing = !!search.trim() || !!category;

  const header = (
    <View>
      {/* Search */}
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Ionicons name="search" size={20} color={colors.textFaint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses, skills, topics…"
          placeholderTextColor={colors.textFaint}
          style={[styles.searchInput, { color: colors.text, fontFamily: fonts.medium }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search ? (
          <PressableScale onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={colors.textFaint} />
          </PressableScale>
        ) : null}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.hList}>
        <Chip label="All" icon="apps" selected={!category} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.name.split(' & ')[0]} icon={c.icon} selected={category === c.name} color={c.gradient[1]} onPress={() => setCategory(category === c.name ? null : c.name)} />
        ))}
      </ScrollView>

      {!browsing ? (
        <>
          {/* Teach banner */}
          <PressableScale onPress={() => navigation.navigate('CourseTypeSelection')} scaleTo={0.98} accessibilityLabel="Teach a course">
            <LinearGradient colors={['#FFC83D', '#FF8A3D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.teach, { borderRadius: radius.lg }, glow('#FF8A3D', 0.6)]}>
              <View style={{ flex: 1 }}>
                <AppText variant="h3" color="#2B1600">
                  Know something cool?
                </AppText>
                <AppText variant="small" color="rgba(43,22,0,0.8)" style={{ marginTop: 2 }}>
                  Teach a course · earn credits · +80 XP
                </AppText>
              </View>
              <View style={styles.teachIcon}>
                <Ionicons name="easel" size={26} color="#FF8A3D" />
              </View>
            </LinearGradient>
          </PressableScale>

          {/* For you */}
          {forYou.length ? (
            <>
              <AppText variant="h3" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
                Picked for you
              </AppText>
              <FlatList
                horizontal
                data={forYou}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => <CourseCard course={item} onPress={() => open(item)} />}
                showsHorizontalScrollIndicator={false}
                style={styles.bleed}
                contentContainerStyle={styles.hList}
                ItemSeparatorComponent={() => <View style={{ width: 4 }} />}
              />
            </>
          ) : null}

          {/* Categories grid */}
          <AppText variant="h3" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
            Explore topics
          </AppText>
          <View style={styles.grid}>
            {CATEGORIES.map((c) => {
              const count = (courses || []).filter((x) => x.category === c.name).length;
              return (
                <PressableScale key={c.id} onPress={() => setCategory(c.name)} style={styles.tileWrap} scaleTo={0.96} accessibilityLabel={`${c.name}, ${count} courses`}>
                  <LinearGradient colors={c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tile, { borderRadius: radius.lg }]}>
                    <Ionicons name={c.icon} size={26} color="#fff" />
                    <AppText variant="smallStrong" color="#fff" numberOfLines={2} style={{ marginTop: 10 }}>
                      {c.name}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.85)">
                      {count} course{count === 1 ? '' : 's'}
                    </AppText>
                  </LinearGradient>
                </PressableScale>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.listHead}>
        <AppText variant="h3">{browsing ? `${filtered?.length ?? 0} result${filtered?.length === 1 ? '' : 's'}` : 'All courses'}</AppText>
      </View>
      <Segmented value={sort} onChange={setSort} options={SORTS} style={{ marginBottom: spacing.md }} />
    </View>
  );

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <Header
          large
          transparent
          title="Learn"
          subtitle={`${Object.keys(enrolled).length} enrolled · ${profile?.credits ?? 0} credits`}
          right={<IconButton icon="sparkles-outline" onPress={() => navigation.navigate('Recommendations')} accessibilityLabel="Recommendations" />}
        />
      }
    >
      <FlatList
        data={filtered || []}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 8 ? FadeInDown.delay(index * 40) : undefined}>
            <CourseCard
              course={item}
              layout="row"
              onPress={() => open(item)}
              badge={
                enrolled[item.id] ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                ) : item.creatorId === user?.uid ? (
                  <Ionicons name="person-circle" size={22} color={colors.primary} />
                ) : null
              }
            />
          </Animated.View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          filtered === null ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={100} radius={18} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'search-outline'}
              title={error ? 'Couldn’t load courses' : 'Nothing found'}
              message={error ? 'Pull down to try again.' : 'Try another search, or be the first to teach this topic.'}
              actionLabel={error ? undefined : 'Teach this topic'}
              onAction={() => navigation.navigate('CourseTypeSelection')}
            />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  bleed: { marginHorizontal: -20, marginTop: 14 },
  hList: { paddingHorizontal: 20, gap: 8 },
  teach: { flexDirection: 'row', alignItems: 'center', padding: 18, marginTop: 20 },
  teachIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '48%' },
  tile: { padding: 14, minHeight: 118 },
  listHead: { marginTop: 28, marginBottom: 12 },
});

export default LearnSkillScreen;
