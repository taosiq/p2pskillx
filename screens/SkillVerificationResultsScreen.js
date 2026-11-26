import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AppText, Button, Card, Header, Pill, PressableScale, ProgressRing, Screen } from '../components/ui';
import { useTheme } from '../theme';
import { XP_RULES } from '../utils/gamification';

const LETTERS = ['A', 'B', 'C', 'D'];

const SkillVerificationResultsScreen = ({ navigation, route }) => {
  const { result, skill, level, questions = [], answers = {} } = route.params || {};
  const { colors, gradients } = useTheme();
  const [reviewOpen, setReviewOpen] = useState(!result?.passed);
  const [shown, setShown] = useState(0);

  const percent = Math.round((result?.percent ?? 0) * 100);

  // Count-up for the score.
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(percent, v + 3);
      setShown(v);
      if (v >= percent) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [percent]);

  if (!result) {
    return (
      <Screen header={<Header title="Results" onBack={() => navigation.goBack()} />}>
        <AppText tone="muted">No results to show.</AppText>
      </Screen>
    );
  }

  const passed = result.passed;
  const review = Object.fromEntries((result.review || []).map((r) => [r.id, r]));
  const done = () => navigation.navigate('Main', { screen: 'Dashboard' });

  return (
    <Screen header={<Header title="Quiz results" left={<View />} right={<Button title="Done" variant="ghost" size="sm" onPress={done} />} />}>
      <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', marginTop: 8 }}>
        <ProgressRing size={170} stroke={14} value={shown / 100} gradient={passed ? gradients.success : [colors.danger, colors.warning]}>
          <AppText variant="statLg" style={{ fontSize: 46, lineHeight: 50 }}>
            {shown}%
          </AppText>
          <AppText variant="caption" tone="muted">
            {result.score}/{result.total} correct
          </AppText>
        </ProgressRing>

        <AppText variant="h1" align="center" style={{ marginTop: 20 }}>
          {passed ? 'Skill verified! 🎉' : 'Not quite yet'}
        </AppText>
        <AppText variant="body" tone="muted" align="center" style={{ marginTop: 6, paddingHorizontal: 12 }}>
          {passed
            ? `${skill} is now on your profile with a verified ${result.level || level} badge.`
            : `You needed 70% to pass ${skill} at ${level} level. Review the answers below and try again soon.`}
        </AppText>

        {passed ? (
          <View style={styles.rewards}>
            <Pill label={`${skill} · ${result.level || level}`} icon="ribbon" color={colors.success} />
            <Pill label={`+${XP_RULES.skill[result.level || level] || XP_RULES.skillDefault} XP`} icon="flash" color={colors.xp} />
          </View>
        ) : null}
      </Animated.View>

      <View style={{ gap: 10, marginTop: 24 }}>
        {passed ? (
          <>
            <Button title={`Teach ${skill}`} icon="easel" onPress={() => navigation.replace('CourseTypeSelection')} full size="lg" />
            <Button title="Verify another skill" icon="add" variant="secondary" onPress={() => navigation.replace('SkillCategory')} full />
          </>
        ) : (
          <>
            <Button title="Try an easier level" icon="refresh" onPress={() => navigation.goBack()} full size="lg" />
            <Button title="Back to home" variant="secondary" onPress={done} full />
          </>
        )}
      </View>

      {questions.length ? (
        <>
          <PressableScale onPress={() => setReviewOpen((o) => !o)} style={styles.reviewHead} accessibilityLabel="Toggle answer review">
            <AppText variant="h3">Review answers</AppText>
            <Ionicons name={reviewOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
          </PressableScale>
          {reviewOpen
            ? questions.map((q, i) => {
                const r = review[q.id] || {};
                const mine = answers[q.id];
                const correct = mine === r.correctAnswer;
                return (
                  <Animated.View key={q.id} entering={FadeInDown.delay(i * 40)}>
                    <Card padding={14} style={{ marginBottom: 10, borderColor: correct ? colors.success + '66' : colors.danger + '55' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Ionicons name={correct ? 'checkmark-circle' : 'close-circle'} size={22} color={correct ? colors.success : colors.danger} />
                        <AppText variant="bodyStrong" style={{ flex: 1, marginLeft: 8 }}>
                          {i + 1}. {q.question}
                        </AppText>
                      </View>
                      <View style={{ marginTop: 10, gap: 6 }}>
                        {q.options.map((o, oi) => {
                          const isCorrect = oi === r.correctAnswer;
                          const isMine = oi === mine;
                          if (!isCorrect && !isMine) return null;
                          return (
                            <View key={oi} style={[styles.ans, { backgroundColor: isCorrect ? colors.successSoft : colors.dangerSoft }]}>
                              <AppText variant="smallStrong" tone={isCorrect ? 'success' : 'danger'}>
                                {LETTERS[oi]}
                              </AppText>
                              <AppText variant="small" style={{ flex: 1, marginLeft: 8 }}>
                                {o}
                              </AppText>
                              <AppText variant="caption" tone={isCorrect ? 'success' : 'danger'}>
                                {isCorrect ? (isMine ? 'Your answer ✓' : 'Correct') : 'Your answer'}
                              </AppText>
                            </View>
                          );
                        })}
                        {mine == null ? (
                          <AppText variant="caption" tone="faint">
                            Not answered
                          </AppText>
                        ) : null}
                      </View>
                      {r.explanation ? (
                        <AppText variant="small" tone="muted" style={{ marginTop: 10 }}>
                          💡 {r.explanation}
                        </AppText>
                      ) : null}
                    </Card>
                  </Animated.View>
                );
              })
            : null}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  rewards: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 12 },
  ans: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10 },
});

export default SkillVerificationResultsScreen;
