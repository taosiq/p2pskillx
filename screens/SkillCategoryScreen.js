import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Card, Header, PressableScale, Screen } from '../components/ui';
import { CATEGORIES } from '../constants/categories';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';

/** Verify, step 1: choose a category. */
const SkillCategoryScreen = ({ navigation, route }) => {
  const { colors, radius } = useTheme();
  const { profile } = useUser();
  const editing = route.params?.editingSkill;

  // Re-verifying an existing skill skips straight to the quiz setup.
  useEffect(() => {
    if (!editing) return;
    const data = profile?.verifiedSkills?.[editing];
    const category = CATEGORIES.find((c) => c.name === data?.category) || CATEGORIES.find((c) => c.skills.includes(editing)) || CATEGORIES[0];
    navigation.replace('SkillVerificationInput', { category, skill: editing });
  }, [editing]);

  const verifiedCount = Object.keys(profile?.verifiedSkills || {}).length;

  return (
    <Screen header={<Header title="Verify a skill" onBack={() => navigation.goBack()} />}>
      <Card variant="tinted" padding={16} style={styles.intro}>
        <Ionicons name="sparkles" size={22} color={colors.primary} />
        <AppText variant="small" style={{ flex: 1, marginLeft: 12 }}>
          Take a short AI-generated quiz. Score <AppText variant="smallStrong">70%+</AppText> to earn a verified badge, up to{' '}
          <AppText variant="smallStrong" tone="xp">
            +100 XP
          </AppText>
          , and the right to teach it.
          {verifiedCount ? ` You’ve verified ${verifiedCount} so far.` : ''}
        </AppText>
      </Card>

      <AppText variant="h3" style={{ marginTop: 22, marginBottom: 12 }}>
        Choose a category
      </AppText>
      <View style={{ gap: 10 }}>
        {CATEGORIES.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * 40)}>
            <PressableScale onPress={() => navigation.navigate('SkillVerificationInput', { category: c })} scaleTo={0.98} accessibilityLabel={c.name}>
              <Card padding={14} style={styles.row}>
                <LinearGradient colors={c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.icon, { borderRadius: radius.md }]}>
                  <Ionicons name={c.icon} size={24} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <AppText variant="title" numberOfLines={1}>
                    {c.name}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={2}>
                    {c.description}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Card>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
});

export default SkillCategoryScreen;
