import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CourseCard from '../components/CourseCard';
import { AppText, Card, EmptyState, Header, Screen, Skeleton } from '../components/ui';
import { CATEGORIES } from '../constants/categories';
import { useUser } from '../context/UserContext';
import { getAllCourses } from '../services/courseService';
import { useTheme } from '../theme';
import { rankCourses as rank } from '../utils/recommend';

const REASONS = {
  skill: { icon: 'ribbon', color: '#2EE59D', label: 'Builds on your skills' },
  interest: { icon: 'heart', color: '#FF4FD8', label: 'Matches your interests' },
  social: { icon: 'people', color: '#12C2FF', label: 'From people you follow' },
  popular: { icon: 'trending-up', color: '#FFB547', label: 'Popular right now' },
};

const RecommendationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, profile } = useUser();
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    getAllCourses().then((r) => setCourses(r.courses || []));
  }, []);

  const ranked = useMemo(() => (courses ? rank(courses, profile, user?.uid) : null), [courses, profile, user?.uid]);
  const groups = useMemo(() => {
    if (!ranked) return [];
    return Object.keys(REASONS)
      .map((k) => ({ key: k, items: ranked.filter((r) => r.reason === k).slice(0, 6) }))
      .filter((g) => g.items.length);
  }, [ranked]);

  const noSignals = !Object.keys(profile?.verifiedSkills || {}).length && !(profile?.interests || []).length;

  return (
    <Screen header={<Header title="For you" subtitle="Personalised picks" onBack={() => navigation.goBack()} />}>
      {noSignals ? (
        <Card variant="tinted" padding={14} style={styles.tip} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <AppText variant="small" style={{ flex: 1, marginLeft: 10 }}>
            Add your interests and verify a skill to get sharper recommendations.
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Card>
      ) : null}

      {ranked === null ? (
        <View style={{ gap: 10, marginTop: 16 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={100} radius={18} />
          ))}
        </View>
      ) : groups.length ? (
        groups.map((g, gi) => {
          const r = REASONS[g.key];
          return (
            <Animated.View key={g.key} entering={FadeInDown.delay(gi * 80)}>
              <View style={styles.groupHead}>
                <View style={[styles.reasonIcon, { backgroundColor: r.color + '26' }]}>
                  <Ionicons name={r.icon} size={16} color={r.color} />
                </View>
                <AppText variant="h3" style={{ marginLeft: 10 }}>
                  {r.label}
                </AppText>
              </View>
              <View style={{ gap: 10 }}>
                {g.items.map(({ course }) => (
                  <CourseCard key={course.id} course={course} layout="row" onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })} />
                ))}
              </View>
            </Animated.View>
          );
        })
      ) : (
        <EmptyState
          icon="compass-outline"
          title="Nothing new to recommend"
          message="You’ve seen everything for now. Why not teach something?"
          actionLabel="Teach a course"
          onAction={() => navigation.navigate('CourseTypeSelection')}
        />
      )}

      <AppText variant="h3" style={{ marginTop: 28, marginBottom: 12 }}>
        Explore by topic
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((c) => (
          <Card key={c.id} padding={10} style={styles.topic} onPress={() => navigation.navigate('Main', { screen: 'LearnSkill', params: { search: c.name.split(' & ')[0] } })}>
            <Ionicons name={c.icon} size={18} color={c.gradient[0]} />
            <AppText variant="smallStrong" numberOfLines={1} style={{ marginLeft: 8, flexShrink: 1 }}>
              {c.name.split(' & ')[0]}
            </AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tip: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  groupHead: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  reasonIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topic: { flexDirection: 'row', alignItems: 'center', width: '48%' },
});

export default RecommendationsScreen;
