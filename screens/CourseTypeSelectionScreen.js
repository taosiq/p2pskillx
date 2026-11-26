import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Button, Card, EmptyState, Header, Pill, PressableScale, Screen } from '../components/ui';
import { CATEGORIES } from '../constants/categories';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';

const LEVEL_COLORS = { Beginner: '#10B981', Intermediate: '#3B82F6', Advanced: '#8B6CFF', Expert: '#FF7A45' };

const STEPS = [
  { icon: 'ribbon', title: 'Pick a verified skill', text: 'Only proven skills can be taught, so learners can trust you.' },
  { icon: 'layers', title: 'Build your lessons', text: 'Add videos, readings and images, lesson by lesson.' },
  { icon: 'flash', title: 'Set a price & publish', text: 'Earn credits every time someone joins, plus +80 XP.' },
];

/** Teach, step 1: choose which verified skill the course is about. */
const CourseTypeSelectionScreen = ({ navigation }) => {
  const { colors, gradients, radius } = useTheme();
  const { profile } = useUser();
  const skills = Object.entries(profile?.verifiedSkills || {});

  const pick = (name, data) => {
    const category = CATEGORIES.find((c) => c.name === data.category) || CATEGORIES.find((c) => c.skills.includes(name)) || null;
    navigation.navigate('CourseCreation', { skill: name, skillLevel: data.level, category });
  };

  return (
    <Screen header={<Header title="Teach a course" onBack={() => navigation.goBack()} />}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderRadius: radius.xl }]}>
        <AppText variant="overline" color="rgba(255,255,255,0.8)">
          Share what you know
        </AppText>
        <AppText variant="h2" color="#fff" style={{ marginTop: 4 }}>
          Turn your skills into credits
        </AppText>
        <View style={{ marginTop: 14, gap: 10 }}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepNum}>
                <AppText variant="smallStrong" color="#fff">
                  {i + 1}
                </AppText>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <AppText variant="bodyStrong" color="#fff">
                  {s.title}
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.85)">
                  {s.text}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>

      <AppText variant="h3" style={{ marginTop: 26, marginBottom: 12 }}>
        Which skill will you teach?
      </AppText>

      {skills.length ? (
        <View style={{ gap: 10 }}>
          {skills.map(([name, data], i) => {
            const c = LEVEL_COLORS[data.level] || colors.primary;
            return (
              <Animated.View key={name} entering={FadeInDown.delay(i * 50)}>
                <PressableScale onPress={() => pick(name, data)} scaleTo={0.98} accessibilityLabel={`Teach ${name}`}>
                  <Card padding={16} style={styles.skill}>
                    <View style={[styles.skillIcon, { backgroundColor: c + '22' }]}>
                      <Ionicons name="ribbon" size={22} color={c} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <AppText variant="title">{name}</AppText>
                      <AppText variant="caption" tone="muted">
                        {data.category || 'General'}
                      </AppText>
                    </View>
                    <Pill label={data.level || 'Verified'} color={c} />
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: 8 }} />
                  </Card>
                </PressableScale>
              </Animated.View>
            );
          })}
          <Button title="Verify another skill" icon="add" variant="ghost" onPress={() => navigation.navigate('SkillCategory')} full />
        </View>
      ) : (
        <Card>
          <EmptyState
            icon="ribbon-outline"
            title="Verify a skill first"
            message="To keep courses trustworthy, you can only teach skills you’ve proven with a quick AI quiz."
            actionLabel="Verify a skill"
            onAction={() => navigation.navigate('SkillCategory')}
          />
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: { padding: 20 },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  skill: { flexDirection: 'row', alignItems: 'center' },
  skillIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

export default CourseTypeSelectionScreen;
