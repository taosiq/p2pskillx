import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { gradientForCategory } from '../components/CourseCard';
import { AppText, Button, Card, EmptyState, Header, IconButton, PressableScale, ProgressBar, ProgressRing, Screen, Sheet, Skeleton } from '../components/ui';
import { useUser } from '../context/UserContext';
import { deleteCourse, getCourseById, getCourseContent, getCourseReviews, setLessonDone, submitCourseReview } from '../services/courseService';
import { useTheme } from '../theme';
import { createCourseConversation } from '../utils/chatService';
import haptics from '../utils/haptics';
import { Stars } from './CourseDetailsScreen';

const openLink = async (url) => {
  if (!/^https:\/\//i.test(url || '')) {
    Alert.alert('Link unavailable', 'This lesson link isn’t valid.');
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } catch {
    Alert.alert('Couldn’t open link', url);
  }
};

const CourseAccessScreen = ({ route, navigation }) => {
  const { courseId, justEnrolled } = route.params || {};
  const { colors, radius, fonts, gradients } = useTheme();
  const { user, profile } = useUser();
  const [course, setCourse] = useState(undefined);
  const [sections, setSections] = useState(null);
  const [open, setOpen] = useState(0);
  const [reviews, setReviews] = useState(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(!!justEnrolled);

  const isOwner = course?.creatorId === user?.uid;
  const isEnrolled = !!profile?.enrolledCourses?.[courseId];
  const done = useMemo(() => new Set(profile?.courseProgress?.[courseId]?.done || []), [profile?.courseProgress, courseId]);

  const load = useCallback(async () => {
    const [c, content, rv] = await Promise.all([getCourseById(courseId), getCourseContent(courseId), getCourseReviews(courseId)]);
    setCourse(c.success ? c.course : null);
    setSections(content.success ? content.sections : []);
    setReviews(rv);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  // No access: send them to the course page to enrol.
  useEffect(() => {
    if (course && profile && !isOwner && !isEnrolled) navigation.replace('CourseDetails', { courseId });
  }, [course, profile, isOwner, isEnrolled]);

  const total = sections?.length || 0;
  const progress = total ? done.size / total : 0;
  const complete = total > 0 && done.size >= total;
  const myReview = reviews?.reviews?.find((r) => r.id === user?.uid);

  const toggleDone = async (i) => {
    const next = !done.has(i);
    haptics[next ? 'success' : 'tap']();
    await setLessonDone(courseId, i, next, total);
    if (next && done.size + 1 === total && !myReview) setTimeout(() => setRateOpen(true), 600);
    if (next && i === open && i + 1 < total) setOpen(i + 1);
  };

  const saveReview = async () => {
    setSaving(true);
    const r = await submitCourseReview(courseId, stars, reviewText);
    setSaving(false);
    if (r.success) {
      haptics.success();
      setRateOpen(false);
      setReviews(await getCourseReviews(courseId));
    } else Alert.alert('Couldn’t save review', 'Please try again.');
  };

  const chat = async () => {
    try {
      const conversationId = await createCourseConversation(courseId, course.creatorId);
      navigation.navigate('ChatDetail', { conversationId, otherUserId: course.creatorId, otherUserName: course.creatorName });
    } catch {
      Alert.alert('Couldn’t open chat', 'Please try again.');
    }
  };

  const remove = () =>
    Alert.alert(
      course.enrollments ? 'Archive course?' : 'Delete course?',
      course.enrollments
        ? 'Learners have paid for this course, so it will be hidden from new learners but stay available to them.'
        : 'This permanently deletes the course.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: course.enrollments ? 'Archive' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const r = await deleteCourse(courseId);
            if (r.success) navigation.goBack();
            else Alert.alert('Couldn’t update course', r.error);
          },
        },
      ]
    );

  if (course === null) {
    return (
      <Screen header={<Header title="Course" onBack={() => navigation.goBack()} />}>
        <EmptyState icon="alert-circle-outline" title="Course not found" />
      </Screen>
    );
  }

  const g = gradientForCategory(course?.category);

  return (
    <Screen
      header={
        <Header
          title={course?.title || 'Course'}
          subtitle={isOwner ? 'Your course' : `${done.size}/${total} lessons`}
          onBack={() => navigation.goBack()}
          right={isOwner ? <IconButton icon="trash-outline" color={colors.danger} onPress={remove} accessibilityLabel="Delete course" /> : <IconButton icon="chatbubble-ellipses-outline" onPress={chat} accessibilityLabel="Message instructor" />}
        />
      }
    >
      {banner ? (
        <Animated.View entering={FadeInDown}>
          <Card variant="gradient" gradient={gradients.success} style={styles.banner}>
            <Ionicons name="checkmark-circle" size={26} color="#fff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText variant="title" color="#fff">
                You’re in! +25 XP
              </AppText>
              <AppText variant="small" color="rgba(255,255,255,0.9)">
                Work through the lessons and tick them off as you go.
              </AppText>
            </View>
            <IconButton icon="close" size={32} iconSize={16} variant="glass" color="#fff" onPress={() => setBanner(false)} accessibilityLabel="Dismiss" />
          </Card>
        </Animated.View>
      ) : null}

      {/* Progress / owner stats */}
      <Card padding={18} style={styles.progressCard}>
        {isOwner ? (
          <View style={styles.ownerStats}>
            <OwnerStat icon="people" value={course?.enrollments ?? '–'} label="Learners" color={g[0]} />
            <OwnerStat icon="star" value={reviews?.count ? reviews.avg.toFixed(1) : '–'} label={`${reviews?.count || 0} reviews`} color={colors.warning} />
            <OwnerStat icon="flash" value={course?.credits ?? '–'} label="Price" color={colors.accent} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ProgressRing size={84} stroke={9} value={progress} gradient={complete ? gradients.success : g}>
              <AppText variant="title">{Math.round(progress * 100)}%</AppText>
            </ProgressRing>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <AppText variant="h3">{complete ? 'Course complete! 🎓' : done.size ? 'Keep going!' : 'Let’s start'}</AppText>
              <AppText variant="small" tone="muted" style={{ marginTop: 2 }}>
                {complete ? 'Nice work. Share what you learned or teach it next.' : `${total - done.size} lesson${total - done.size === 1 ? '' : 's'} left`}
              </AppText>
              {complete ? (
                <Button
                  title={myReview ? 'Edit your review' : 'Rate this course'}
                  icon="star"
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setStars(myReview?.rating || 5);
                    setReviewText(myReview?.text || '');
                    setRateOpen(true);
                  }}
                  style={{ marginTop: 10, alignSelf: 'flex-start' }}
                />
              ) : null}
            </View>
          </View>
        )}
      </Card>

      <AppText variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>
        Lessons
      </AppText>

      {sections === null ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} radius={18} />
          ))}
        </View>
      ) : sections.length ? (
        <View style={{ gap: 10 }}>
          {sections.map((s, i) => {
            const expanded = open === i;
            const isDone = done.has(i);
            return (
              <Animated.View key={s.id || i} layout={LinearTransition.springify().damping(18)}>
                <Card padding={0} style={{ borderColor: expanded ? g[0] + '88' : colors.border, overflow: 'hidden' }}>
                  <PressableScale onPress={() => setOpen(expanded ? -1 : i)} scaleTo={0.99} accessibilityLabel={`Lesson ${i + 1}: ${s.title}`}>
                    <View style={styles.lessonHead}>
                      <PressableScale
                        onPress={() => !isOwner && toggleDone(i)}
                        disabled={isOwner}
                        haptic={null}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isDone }}
                        accessibilityLabel={isDone ? 'Mark as not done' : 'Mark as done'}
                      >
                        <View
                          style={[
                            styles.check,
                            isDone ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: colors.borderStrong },
                          ]}
                        >
                          {isDone ? <Ionicons name="checkmark" size={16} color="#fff" /> : <AppText variant="smallStrong" tone="muted">{i + 1}</AppText>}
                        </View>
                      </PressableScale>
                      <AppText variant="title" numberOfLines={expanded ? 3 : 1} style={{ flex: 1, marginLeft: 12 }} tone={isDone && !expanded ? 'muted' : 'default'}>
                        {s.title}
                      </AppText>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
                    </View>
                  </PressableScale>

                  {expanded ? (
                    <View style={styles.lessonBody}>
                      {s.description ? (
                        <AppText variant="body" tone="muted" style={{ marginBottom: 12 }}>
                          {s.description}
                        </AppText>
                      ) : null}
                      <View style={{ gap: 8 }}>
                        {s.videoLink ? <Resource icon="play-circle" color={colors.danger} title="Watch video" url={s.videoLink} /> : null}
                        {s.documentLink ? <Resource icon="document-text" color={colors.info} title="Open reading" url={s.documentLink} /> : null}
                      </View>
                      {s.files?.map((f) => (
                        <Image key={f.id} source={{ uri: f.base64 }} style={[styles.image, { borderRadius: radius.md }]} resizeMode="cover" accessibilityLabel={f.name} />
                      ))}
                      {!isOwner ? (
                        <Button
                          title={isDone ? 'Completed' : 'Mark as complete'}
                          icon={isDone ? 'checkmark-done' : 'checkmark'}
                          variant={isDone ? 'secondary' : 'success'}
                          size="sm"
                          onPress={() => toggleDone(i)}
                          style={{ marginTop: 14, alignSelf: 'flex-start' }}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="construct-outline" title="No lessons yet" message="The instructor is still preparing this course." />
      )}

      <Sheet visible={rateOpen} onClose={() => setRateOpen(false)} title="How was this course?" subtitle="Your review helps other learners choose.">
        <View style={styles.starsPick}>
          {[1, 2, 3, 4, 5].map((n) => (
            <PressableScale key={n} onPress={() => setStars(n)} haptic="select" accessibilityLabel={`${n} stars`}>
              <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={40} color={colors.warning} />
            </PressableScale>
          ))}
        </View>
        <TextInput
          value={reviewText}
          onChangeText={setReviewText}
          placeholder="What did you like? (optional)"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={500}
          style={[styles.reviewInput, { color: colors.text, fontFamily: fonts.medium, backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}
        />
        <Button title="Submit review" icon="send" onPress={saveReview} loading={saving} full style={{ marginTop: 14 }} />
      </Sheet>
    </Screen>
  );
};

function Resource({ icon, color, title, url }) {
  const { colors, radius } = useTheme();
  let host = '';
  try {
    host = url.replace(/^https?:\/\//, '').split('/')[0];
  } catch {}
  return (
    <PressableScale onPress={() => openLink(url)} scaleTo={0.98} accessibilityLabel={`${title}, ${host}`}>
      <View style={[styles.resource, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
        <Ionicons name={icon} size={22} color={color} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {host}
          </AppText>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.textFaint} />
      </View>
    </PressableScale>
  );
}

function OwnerStat({ icon, value, label, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Ionicons name={icon} size={20} color={color} />
      <AppText variant="stat" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  progressCard: { marginTop: 4 },
  ownerStats: { flexDirection: 'row' },
  lessonHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  check: { width: 32, height: 32, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  lessonBody: { paddingHorizontal: 14, paddingBottom: 16 },
  resource: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  image: { width: '100%', aspectRatio: 4 / 3, marginTop: 10 },
  starsPick: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  reviewInput: { minHeight: 90, padding: 12, fontSize: 15, textAlignVertical: 'top' },
});

export default CourseAccessScreen;
