import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LogoMark } from '../components/Logo';
import { AppText, Button, EmptyState, IconButton, PressableScale, ProgressBar, ProgressRing, Screen } from '../components/ui';
import { startQuiz, submitQuiz } from '../services/api';
import { useTheme } from '../theme';
import haptics from '../utils/haptics';

const TIPS = [
  'Read every option before answering: the best answer isn’t always the first that looks right.',
  'You can jump between questions with the dots at the top.',
  'Unsure? Skip it and come back before you submit.',
  'Passing gives you a verified badge others can trust.',
  'Higher levels earn more XP: up to +100 for Expert.',
];

function Generating({ skill }) {
  const spin = useSharedValue(0);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1);
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const { colors, gradients } = useTheme();
  return (
    <View style={styles.center}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.spinRing, ring]}>
          <LinearGradient colors={[...gradients.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.spinGrad} />
        </Animated.View>
        <View style={[styles.spinInner, { backgroundColor: colors.bg }]}>
          <LogoMark size={64} />
        </View>
      </View>
      <AppText variant="h2" align="center" style={{ marginTop: 28 }}>
        Crafting your {skill} quiz
      </AppText>
      <AppText variant="body" tone="muted" align="center" style={{ marginTop: 6 }}>
        Our AI is writing fresh questions. This can take up to a minute.
      </AppText>
      <Animated.View key={tip} entering={FadeIn.duration(500)} style={[styles.tip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="bulb" size={18} color={colors.warning} />
        <AppText variant="small" tone="muted" style={{ flex: 1, marginLeft: 10 }}>
          {TIPS[tip]}
        </AppText>
      </Animated.View>
    </View>
  );
}

const LETTERS = ['A', 'B', 'C', 'D'];

const SkillVerificationMCQScreen = ({ navigation, route }) => {
  const { skill, level, category } = route.params || {};
  const { colors, radius, gradients } = useTheme();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    setQuiz(null);
    try {
      const q = await startQuiz({ skill, level, category });
      setQuiz(q);
      setSecondsLeft(q.timeLimit || q.questions.length * 30);
      setIndex(0);
      setAnswers({});
      submittedRef.current = false;
    } catch (e) {
      setError(e);
    }
  }, [skill, level, category]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async () => {
    if (!quiz || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitQuiz({ ...quiz, skill, level, category }, answers);
      haptics[result.passed ? 'success' : 'warning']();
      navigation.replace('SkillVerificationResults', {
        result,
        skill,
        level,
        category,
        questions: quiz.questions.map(({ id, question, options }) => ({ id, question, options })),
        answers,
      });
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      Alert.alert('Couldn’t submit', e.message || 'Please try again.');
    }
  }, [quiz, answers, skill, level, category]);

  // Countdown; auto-submit at zero.
  useEffect(() => {
    if (!quiz || submitting) return undefined;
    if (secondsLeft <= 0) {
      submit();
      return undefined;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [quiz, secondsLeft, submitting, submit]);

  const quit = useCallback(() => {
    if (!quiz) {
      navigation.goBack();
      return true;
    }
    Alert.alert('Leave the quiz?', 'Your answers will be lost and this attempt won’t count.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
    return true;
  }, [quiz]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', quit);
    return () => sub.remove();
  }, [quit]);

  if (error) {
    return (
      <Screen>
        <View style={{ paddingTop: 12 }}>
          <IconButton icon="close" onPress={() => navigation.goBack()} accessibilityLabel="Close" />
        </View>
        <EmptyState
          icon={error.code === 'cooldown' ? 'hourglass-outline' : 'cloud-offline-outline'}
          title={error.code === 'cooldown' ? 'Take a short break' : 'Couldn’t create the quiz'}
          message={error.message || 'Please check your connection and try again.'}
          actionLabel={error.code === 'cooldown' ? undefined : 'Try again'}
          onAction={load}
        />
      </Screen>
    );
  }

  if (!quiz) {
    return (
      <Screen scroll={false}>
        <View style={{ paddingTop: 12 }}>
          <IconButton icon="close" onPress={() => navigation.goBack()} accessibilityLabel="Cancel" />
        </View>
        <Generating skill={skill} />
      </Screen>
    );
  }

  const q = quiz.questions[index];
  const total = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const limit = quiz.timeLimit || total * 30;
  const low = secondsLeft <= 30;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const choose = (opt) => {
    haptics.select();
    setAnswers((a) => ({ ...a, [q.id]: opt }));
  };

  const finish = () => {
    const missing = total - answered;
    if (missing > 0) {
      Alert.alert(`${missing} unanswered`, 'Unanswered questions count as wrong. Submit anyway?', [
        { text: 'Review', style: 'cancel' },
        { text: 'Submit', onPress: submit },
      ]);
    } else submit();
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.top}>
        <IconButton icon="close" onPress={quit} accessibilityLabel="Leave quiz" />
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <AppText variant="smallStrong" numberOfLines={1}>
            {skill} · {level}
          </AppText>
          <ProgressBar value={answered / total} height={6} style={{ marginTop: 6 }} />
        </View>
        <ProgressRing size={52} stroke={5} value={secondsLeft / limit} gradient={low ? [colors.danger, colors.warning] : gradients.primary}>
          <AppText variant="caption" tone={low ? 'danger' : 'default'} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
            {mm}:{ss}
          </AppText>
        </ProgressRing>
      </View>

      {/* Question dots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dots} style={{ flexGrow: 0 }}>
        {quiz.questions.map((qq, i) => {
          const isA = answers[qq.id] != null;
          const cur = i === index;
          return (
            <PressableScale key={qq.id} onPress={() => setIndex(i)} haptic="select" accessibilityLabel={`Question ${i + 1}${isA ? ', answered' : ''}`}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: cur ? colors.primary : isA ? colors.primarySoft : colors.surfaceAlt,
                    borderColor: cur ? colors.primary : 'transparent',
                  },
                ]}
              >
                <AppText variant="caption" color={cur ? '#fff' : isA ? colors.primary : colors.textMuted} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {i + 1}
                </AppText>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={q.id} entering={FadeInRight.duration(250)} exiting={FadeOutLeft.duration(150)}>
          <AppText variant="overline" tone="primary">
            Question {index + 1} of {total}
          </AppText>
          <AppText variant="h2" style={{ marginTop: 8, marginBottom: 20 }}>
            {q.question}
          </AppText>
          <View style={{ gap: 10 }}>
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <PressableScale key={i} onPress={() => choose(i)} haptic={null} scaleTo={0.98} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${LETTERS[i]}: ${opt}`}>
                  <View
                    style={[
                      styles.option,
                      {
                        borderRadius: radius.lg,
                        backgroundColor: selected ? colors.primarySoft : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.letter, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}>
                      <AppText variant="smallStrong" color={selected ? '#fff' : colors.textMuted}>
                        {LETTERS[i]}
                      </AppText>
                    </View>
                    <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>
                      {opt}
                    </AppText>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.nav, { borderTopColor: colors.border }]}>
        <Button title="Back" icon="arrow-back" variant="outline" onPress={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} style={{ flex: 1 }} />
        {index < total - 1 ? (
          <Button title="Next" iconRight="arrow-forward" onPress={() => setIndex((i) => i + 1)} style={{ flex: 1.4 }} />
        ) : (
          <Button title="Submit" icon="checkmark-done" variant="success" onPress={finish} loading={submitting} style={{ flex: 1.4 }} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 60 },
  spinRing: { width: 132, height: 132, borderRadius: 66, overflow: 'hidden' },
  spinGrad: { flex: 1 },
  spinInner: { position: 'absolute', width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 28, minHeight: 64 },
  top: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  dots: { gap: 8, paddingVertical: 14 },
  dot: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  body: { paddingBottom: 24 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 2, minHeight: 60 },
  letter: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 6, borderTopWidth: StyleSheet.hairlineWidth },
});

export default SkillVerificationMCQScreen;
