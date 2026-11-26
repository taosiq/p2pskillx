import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradientForCategory, iconForCategory } from '../components/CourseCard';
import { AppText, Avatar, Button, Card, Chip, EmptyState, IconButton, Pill, PressableScale, Screen, Sheet, Skeleton } from '../components/ui';
import { useUser } from '../context/UserContext';
import { enrollInCourse } from '../services/api';
import { getCourseById, getCourseReviews } from '../services/courseService';
import { useTheme } from '../theme';
import { createCourseConversation } from '../utils/chatService';
import haptics from '../utils/haptics';
import { safeImageUri } from '../utils/media';
import { timeAgo } from '../utils/time';

export function Stars({ value = 0, size = 14, color }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline'} size={size} color={color || colors.warning} />
      ))}
    </View>
  );
}

const CourseDetailsScreen = ({ route, navigation }) => {
  const { courseId } = route.params || {};
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  const [course, setCourse] = useState(undefined);
  const [reviews, setReviews] = useState({ reviews: [], avg: 0, count: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await getCourseById(courseId);
    setCourse(r.success ? r.course : null);
    setReviews(await getCourseReviews(courseId));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = course && course.creatorId === user?.uid;
  const isEnrolled = !!profile?.enrolledCourses?.[courseId];
  const balance = profile?.credits ?? 0;
  const price = course?.credits ?? 0;
  const short = Math.max(0, price - balance);

  // Already have access: go straight to the lessons.
  useEffect(() => {
    if (course && (isOwner || isEnrolled) && !confirmOpen) navigation.replace('CourseAccess', { courseId });
  }, [course, isOwner, isEnrolled]);

  const enroll = async () => {
    setEnrolling(true);
    setEnrollError('');
    try {
      await enrollInCourse(courseId);
      haptics.success();
      setConfirmOpen(false);
      navigation.replace('CourseAccess', { courseId, justEnrolled: true });
    } catch (e) {
      haptics.error();
      setEnrollError(e.message || 'Couldn’t enrol. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const chat = async () => {
    setChatBusy(true);
    try {
      const conversationId = await createCourseConversation(courseId, course.creatorId);
      navigation.navigate('ChatDetail', { conversationId, otherUserId: course.creatorId, otherUserName: course.creatorName });
    } catch {
      /* chat errors are shown in ChatDetail */
    } finally {
      setChatBusy(false);
    }
  };

  if (course === null) {
    return (
      <Screen>
        <View style={{ paddingTop: 12 }}>
          <IconButton icon="chevron-back" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        </View>
        <EmptyState icon="alert-circle-outline" title="Course not found" message="It may have been removed by the instructor." />
      </Screen>
    );
  }

  const g = gradientForCategory(course?.category);
  const thumb = safeImageUri(course?.thumbnail);
  const outline = course?.outline || [];
  const rating = reviews.count ? reviews.avg : course?.ratingAvg || 0;

  return (
    <Screen
      padded={false}
      edges={[]}
      ambient={false}
      statusBarStyle="light"
      contentStyle={{ paddingBottom: 140 }}
      footer={
        course ? (
          <View style={[styles.footer, { backgroundColor: colors.bgElevated, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash" size={20} color={colors.warning} />
                <AppText variant="stat" style={{ marginLeft: 4 }}>
                  {price}
                </AppText>
                <AppText variant="smallStrong" tone="muted" style={{ marginLeft: 4, marginTop: 4 }}>
                  credits
                </AppText>
              </View>
              <AppText variant="caption" tone={short ? 'danger' : 'muted'}>
                {short ? `You need ${short} more` : `You have ${balance}`}
              </AppText>
            </View>
            <Button
              title={short ? 'Earn credits' : 'Enrol now'}
              icon={short ? 'flash-outline' : 'lock-open'}
              variant={short ? 'secondary' : 'primary'}
              onPress={() => (short ? navigation.navigate('Achievements') : setConfirmOpen(true))}
              style={{ minWidth: 160 }}
            />
          </View>
        ) : null
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <Ionicons name={iconForCategory(course?.category)} size={120} color="rgba(255,255,255,0.18)" style={styles.heroIcon} />
          </LinearGradient>
        )}
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', colors.bg]} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroBar, { paddingTop: insets.top + 8 }]}>
          <IconButton icon="chevron-back" variant="glass" color="#fff" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, marginTop: -40 }}>
        {course === undefined ? (
          <View style={{ gap: 10 }}>
            <Skeleton width="40%" height={22} />
            <Skeleton height={34} />
            <Skeleton height={80} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pill label={course.category || 'General'} color={g[0]} />
              {course.level ? <Pill label={course.level} icon="speedometer-outline" color={colors.info} /> : null}
            </View>
            <AppText variant="h1" style={{ marginTop: 10 }}>
              {course.title}
            </AppText>

            <View style={styles.statsRow}>
              <Stat icon="people" label={`${course.enrollments || 0} learners`} />
              <Stat icon="layers" label={`${outline.length} lessons`} />
              <View style={styles.stat}>
                <Stars value={rating} />
                <AppText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
                  {reviews.count ? `${rating.toFixed(1)} (${reviews.count})` : 'New'}
                </AppText>
              </View>
            </View>

            {/* Instructor */}
            <Card padding={14} style={styles.instructor} onPress={() => navigation.navigate('UserProfile', { userId: course.creatorId })}>
              <Avatar name={course.creatorName || 'Instructor'} size={46} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText variant="caption" tone="muted">
                  Instructor
                </AppText>
                <AppText variant="title">{course.creatorName || 'Instructor'}</AppText>
              </View>
              <IconButton icon="chatbubble-ellipses-outline" variant="primary" onPress={chat} disabled={chatBusy} accessibilityLabel="Message instructor" />
            </Card>

            <AppText variant="h3" style={styles.section}>
              About this course
            </AppText>
            <AppText variant="body" tone="muted">
              {course.description || 'No description yet.'}
            </AppText>

            {course.skills?.length ? (
              <>
                <AppText variant="h3" style={styles.section}>
                  Skills you’ll gain
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {course.skills.map((s) => (
                    <Chip key={s} label={s} icon="sparkles" size="sm" />
                  ))}
                </View>
              </>
            ) : null}

            <AppText variant="h3" style={styles.section}>
              Curriculum
            </AppText>
            <Card padding={6}>
              {outline.map((s, i) => (
                <View key={i} style={[styles.lesson, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={[styles.lessonNum, { backgroundColor: colors.surfaceAlt }]}>
                    <AppText variant="smallStrong" tone="muted">
                      {i + 1}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText variant="bodyStrong" numberOfLines={2}>
                      {s.title}
                    </AppText>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                      {s.hasVideo ? <Meta icon="play-circle" text="Video" /> : null}
                      {s.hasDocument ? <Meta icon="document-text" text="Reading" /> : null}
                      {s.images ? <Meta icon="image" text={`${s.images}`} /> : null}
                    </View>
                  </View>
                  <Ionicons name="lock-closed" size={16} color={colors.textFaint} />
                </View>
              ))}
              {!outline.length ? (
                <AppText variant="small" tone="muted" style={{ padding: 12 }}>
                  The instructor hasn’t added lessons yet.
                </AppText>
              ) : null}
            </Card>

            <AppText variant="h3" style={styles.section}>
              Reviews
            </AppText>
            {reviews.reviews.length ? (
              <View style={{ gap: 10 }}>
                {reviews.reviews.slice(0, 5).map((r) => (
                  <Card key={r.id} padding={14}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar name={r.userName} size={32} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <AppText variant="smallStrong">{r.userName}</AppText>
                        <Stars value={r.rating} size={12} />
                      </View>
                      <AppText variant="caption" tone="faint">
                        {timeAgo(r.createdAt)}
                      </AppText>
                    </View>
                    {r.text ? (
                      <AppText variant="small" tone="muted" style={{ marginTop: 8 }}>
                        {r.text}
                      </AppText>
                    ) : null}
                  </Card>
                ))}
              </View>
            ) : (
              <AppText variant="small" tone="muted">
                No reviews yet. Be the first learner!
              </AppText>
            )}
          </Animated.View>
        )}
      </View>

      <Sheet visible={confirmOpen} onClose={() => !enrolling && setConfirmOpen(false)} title="Confirm enrolment" subtitle={course?.title}>
        <Card variant="tinted" padding={16}>
          <Row label="Your balance" value={`${balance} credits`} />
          <Row label="Course price" value={`− ${price} credits`} tone="danger" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Row label="After enrolling" value={`${balance - price} credits`} strong />
        </Card>
        <View style={[styles.perk, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="sparkles" size={16} color={colors.success} />
          <AppText variant="small" tone="success" style={{ marginLeft: 8, flex: 1 }}>
            +25 XP for joining, and lifetime access to every lesson.
          </AppText>
        </View>
        {enrollError ? (
          <AppText variant="small" tone="danger" style={{ marginTop: 10 }}>
            {enrollError}
          </AppText>
        ) : null}
        <Button title={`Pay ${price} credits & enrol`} icon="lock-open" onPress={enroll} loading={enrolling} full style={{ marginTop: 16 }} />
      </Sheet>
    </Screen>
  );
};

function Stat({ icon, label }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <AppText variant="caption" tone="muted" style={{ marginLeft: 5 }}>
        {label}
      </AppText>
    </View>
  );
}

function Meta({ icon, text }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={icon} size={12} color={colors.textFaint} />
      <AppText variant="caption" tone="faint" style={{ marginLeft: 3 }}>
        {text}
      </AppText>
    </View>
  );
}

function Row({ label, value, tone, strong }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <AppText variant={strong ? 'bodyStrong' : 'body'} tone="muted">
        {label}
      </AppText>
      <AppText variant={strong ? 'title' : 'bodyStrong'} tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 270, overflow: 'hidden' },
  heroIcon: { position: 'absolute', right: -10, bottom: 30 },
  heroBar: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  instructor: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  section: { marginTop: 26, marginBottom: 10 },
  lesson: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  lessonNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  divider: { height: 1, marginVertical: 8 },
  perk: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 12 },
});

export default CourseDetailsScreen;
