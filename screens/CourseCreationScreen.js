import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, LinearTransition } from 'react-native-reanimated';
import CourseCard from '../components/CourseCard';
import { AppText, Button, Card, Chip, Header, IconButton, PressableScale, ProgressBar, Screen, TextField } from '../components/ui';
import { useUser } from '../context/UserContext';
import { COURSE_LIMITS, createCourse } from '../services/courseService';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';
import { pickImage } from '../utils/media';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const STEP_TITLES = ['Basics', 'Lessons', 'Price & publish'];
const newLesson = () => ({ id: `l${Date.now()}${Math.random().toString(36).slice(2, 6)}`, title: '', description: '', videoLink: '', documentLink: '', files: [] });

const CourseCreationScreen = ({ navigation, route }) => {
  const { skill, skillLevel, category } = route.params || {};
  const { colors, radius, gradients } = useTheme();
  const { displayName } = useUser();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(skill ? `${skill} essentials` : '');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(skillLevel === 'Expert' || skillLevel === 'Advanced' ? 'Intermediate' : 'Beginner');
  const [cover, setCover] = useState(null);
  const [lessons, setLessons] = useState([newLesson()]);
  const [credits, setCredits] = useState(20);
  const [errors, setErrors] = useState({});
  const [publishing, setPublishing] = useState(false);

  const filledLessons = lessons.filter((l) => l.title.trim());
  const suggested = Math.min(COURSE_LIMITS.maxCredits, Math.max(COURSE_LIMITS.minCredits, filledLessons.length * 8));

  const updateLesson = (id, field, value) => setLessons((ls) => ls.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  const removeLesson = (id) => setLessons((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));
  const moveLesson = (id, dir) =>
    setLessons((ls) => {
      const i = ls.findIndex((l) => l.id === id);
      const j = i + dir;
      if (j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const addImage = async (id) => {
    const picked = await pickImage({ quality: 0.4 });
    if (!picked?.dataUri) return;
    setLessons((ls) =>
      ls.map((l) => (l.id === id && l.files.length < 3 ? { ...l, files: [...l.files, { id: String(Date.now()), name: 'Image', type: 'image', base64: picked.dataUri }] } : l))
    );
  };

  const pickCover = async () => {
    const picked = await pickImage({ aspect: [16, 9], quality: 0.4 });
    if (picked?.dataUri) setCover(picked.dataUri);
  };

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (title.trim().length < 4) e.title = 'Give your course a clear title (4+ characters).';
      if (description.trim().length < 20) e.description = 'Describe what learners will get (20+ characters).';
    }
    if (s === 1) {
      if (!filledLessons.length) e.lessons = 'Add at least one lesson with a title.';
      lessons.forEach((l) => {
        if (l.title.trim() && !l.description.trim() && !l.videoLink.trim() && !l.documentLink.trim() && !l.files.length) {
          e[l.id] = 'Add some content: text, a link or an image.';
        }
      });
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Rough payload check: Firestore documents max out at 1 MiB.
  const payloadKb = Math.round((JSON.stringify(lessons).length + (cover?.length || 0)) / 1024);

  const next = () => {
    if (!validate(step)) {
      haptics.warning();
      return;
    }
    haptics.tap();
    if (step === 0 && credits === 20) setCredits(suggested);
    setStep((s) => s + 1);
  };

  const publish = async () => {
    if (payloadKb > 900) {
      Alert.alert('Course too large', 'Remove some images (each lesson’s images are stored with the course).');
      return;
    }
    setPublishing(true);
    const r = await createCourse({
      title,
      description,
      level,
      category: category?.name || 'General',
      skills: skill ? [skill] : [],
      credits,
      thumbnail: cover,
      sections: lessons,
    });
    setPublishing(false);
    if (r.success) {
      haptics.success();
      Alert.alert('Course published! 🎉', 'You earned +80 XP. Learners can now find it in Learn.', [
        { text: 'View course', onPress: () => navigation.replace('CourseAccess', { courseId: r.courseId }) },
      ]);
    } else {
      haptics.error();
      Alert.alert('Couldn’t publish', r.error);
    }
  };

  const back = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  return (
    <Screen
      keyboard
      edges={['top', 'bottom']}
      header={<Header title={STEP_TITLES[step]} subtitle={`Step ${step + 1} of 3${skill ? ` · ${skill}` : ''}`} onBack={back} />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.bgElevated }]}>
          {step < 2 ? (
            <Button title="Continue" iconRight="arrow-forward" onPress={next} full size="lg" />
          ) : (
            <Button title={`Publish for ${credits} credits`} icon="rocket" onPress={publish} loading={publishing} full size="lg" />
          )}
        </View>
      }
    >
      <ProgressBar value={(step + 1) / 3} height={6} style={{ marginBottom: 20 }} />

      {step === 0 ? (
        <Animated.View key="s0" entering={FadeInRight}>
          <PressableScale onPress={pickCover} scaleTo={0.98} accessibilityLabel="Choose a cover image">
            <View style={[styles.cover, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderRadius: radius.lg }]}>
              {cover ? (
                <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={30} color={colors.textFaint} />
                  <AppText variant="smallStrong" tone="muted" style={{ marginTop: 6 }}>
                    Add a cover image (optional)
                  </AppText>
                </>
              )}
            </View>
          </PressableScale>
          <TextField label="Course title" required value={title} onChangeText={setTitle} maxLength={COURSE_LIMITS.title} error={errors.title} hint={`${title.length}/${COURSE_LIMITS.title}`} style={{ marginTop: 18 }} />
          <TextField
            label="What will learners get?"
            required
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={COURSE_LIMITS.description}
            error={errors.description}
            placeholder="E.g. Build your first website from scratch: HTML, CSS and deploying it live."
            hint={`${description.length}/${COURSE_LIMITS.description}`}
          />
          <AppText variant="smallStrong" tone="muted" style={{ marginBottom: 8 }}>
            Difficulty
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {LEVELS.map((l) => (
              <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
            ))}
          </View>
        </Animated.View>
      ) : null}

      {step === 1 ? (
        <Animated.View key="s1" entering={FadeInRight}>
          {errors.lessons ? (
            <AppText variant="small" tone="danger" style={{ marginBottom: 10 }}>
              {errors.lessons}
            </AppText>
          ) : null}
          {lessons.map((l, i) => (
            <Animated.View key={l.id} layout={LinearTransition}>
              <Card padding={14} style={{ marginBottom: 12, borderColor: errors[l.id] ? colors.danger : colors.border }}>
                <View style={styles.lessonHead}>
                  <View style={[styles.num, { backgroundColor: colors.primarySoft }]}>
                    <AppText variant="smallStrong" tone="primary">
                      {i + 1}
                    </AppText>
                  </View>
                  <AppText variant="title" style={{ flex: 1, marginLeft: 10 }}>
                    Lesson {i + 1}
                  </AppText>
                  <IconButton icon="arrow-up" size={34} iconSize={16} variant="ghost" onPress={() => moveLesson(l.id, -1)} disabled={i === 0} accessibilityLabel="Move up" />
                  <IconButton icon="arrow-down" size={34} iconSize={16} variant="ghost" onPress={() => moveLesson(l.id, 1)} disabled={i === lessons.length - 1} accessibilityLabel="Move down" />
                  <IconButton icon="trash-outline" size={34} iconSize={16} variant="ghost" color={colors.danger} onPress={() => removeLesson(l.id)} disabled={lessons.length === 1} accessibilityLabel="Remove lesson" />
                </View>
                <TextField placeholder="Lesson title" value={l.title} onChangeText={(t) => updateLesson(l.id, 'title', t)} maxLength={COURSE_LIMITS.sectionTitle} style={{ marginTop: 10 }} />
                <TextField placeholder="Notes, explanation or exercise" value={l.description} onChangeText={(t) => updateLesson(l.id, 'description', t)} multiline maxLength={COURSE_LIMITS.sectionText} />
                <TextField icon="logo-youtube" placeholder="Video link (YouTube, Vimeo…)" value={l.videoLink} onChangeText={(t) => updateLesson(l.id, 'videoLink', t)} autoCapitalize="none" keyboardType="url" />
                <TextField icon="document-text-outline" placeholder="Reading link (Docs, PDF, article…)" value={l.documentLink} onChangeText={(t) => updateLesson(l.id, 'documentLink', t)} autoCapitalize="none" keyboardType="url" />
                <View style={styles.images}>
                  {l.files.map((f) => (
                    <View key={f.id}>
                      <Image source={{ uri: f.base64 }} style={[styles.thumb, { borderRadius: radius.sm }]} />
                      <IconButton
                        icon="close"
                        size={24}
                        iconSize={12}
                        variant="glass"
                        color="#fff"
                        style={styles.thumbX}
                        onPress={() => updateLesson(l.id, 'files', l.files.filter((x) => x.id !== f.id))}
                        accessibilityLabel="Remove image"
                      />
                    </View>
                  ))}
                  {l.files.length < 3 ? (
                    <PressableScale onPress={() => addImage(l.id)} accessibilityLabel="Add image">
                      <View style={[styles.thumb, styles.addThumb, { borderColor: colors.borderStrong, borderRadius: radius.sm }]}>
                        <Ionicons name="add" size={22} color={colors.textFaint} />
                      </View>
                    </PressableScale>
                  ) : null}
                </View>
                {errors[l.id] ? (
                  <AppText variant="caption" tone="danger" style={{ marginTop: 8 }}>
                    {errors[l.id]}
                  </AppText>
                ) : null}
              </Card>
            </Animated.View>
          ))}
          {lessons.length < COURSE_LIMITS.sections ? (
            <Button title="Add lesson" icon="add" variant="secondary" onPress={() => setLessons((ls) => [...ls, newLesson()])} full />
          ) : null}
          <AppText variant="caption" tone={payloadKb > 800 ? 'warning' : 'faint'} align="center" style={{ marginTop: 10 }}>
            Course size {payloadKb} KB / 900 KB
          </AppText>
        </Animated.View>
      ) : null}

      {step === 2 ? (
        <Animated.View key="s2" entering={FadeInRight}>
          <Card padding={18}>
            <AppText variant="smallStrong" tone="muted">
              Price per learner
            </AppText>
            <View style={styles.priceRow}>
              <IconButton icon="remove" onPress={() => setCredits((c) => Math.max(COURSE_LIMITS.minCredits, c - 5))} accessibilityLabel="Lower price" />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flash" size={26} color={colors.warning} />
                  <AppText variant="statLg" style={{ marginLeft: 4 }}>
                    {credits}
                  </AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  credits
                </AppText>
              </View>
              <IconButton icon="add" onPress={() => setCredits((c) => Math.min(COURSE_LIMITS.maxCredits, c + 5))} accessibilityLabel="Raise price" />
            </View>
            <PressableScale onPress={() => setCredits(suggested)} style={{ alignSelf: 'center' }}>
              <AppText variant="smallStrong" tone="primary">
                Use suggested price: {suggested} credits
              </AppText>
            </PressableScale>
          </Card>

          <AppText variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>
            Preview
          </AppText>
          <View style={{ alignItems: 'center' }}>
            <CourseCard
              course={{ title, category: category?.name || 'General', credits, thumbnail: cover, enrollments: 0, sections: filledLessons, creatorName: displayName }}
              onPress={() => {}}
            />
          </View>

          <Card variant="tinted" tint={colors.successSoft} padding={14} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trophy" size={22} color={colors.success} />
            <AppText variant="small" style={{ flex: 1, marginLeft: 10 }}>
              Publishing earns <AppText variant="smallStrong" tone="success">+80 XP</AppText>. {filledLessons.length} lesson{filledLessons.length === 1 ? '' : 's'} · {level}
            </AppText>
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  footer: { padding: 16, paddingBottom: 8, borderTopWidth: 1 },
  cover: { height: 160, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lessonHead: { flexDirection: 'row', alignItems: 'center' },
  num: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  images: { flexDirection: 'row', gap: 8 },
  thumb: { width: 72, height: 72 },
  thumbX: { position: 'absolute', top: 2, right: 2 },
  addThumb: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
});

export default CourseCreationScreen;
