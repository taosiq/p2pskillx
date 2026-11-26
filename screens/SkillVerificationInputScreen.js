import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Chip, Header, PressableScale, Screen, TextField } from '../components/ui';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { XP_RULES } from '../utils/gamification';
import haptics from '../utils/haptics';

const LEVELS = [
  { key: 'Beginner', icon: 'leaf', desc: 'Core concepts and terminology', colors: ['#10B981', '#2EE59D'] },
  { key: 'Intermediate', icon: 'trending-up', desc: 'Practical, everyday use', colors: ['#3B82F6', '#12C2FF'] },
  { key: 'Advanced', icon: 'flash', desc: 'Deep knowledge and edge cases', colors: ['#8B6CFF', '#C04BFF'] },
  { key: 'Expert', icon: 'diamond', desc: 'Mastery-level, tricky questions', colors: ['#FF7A45', '#FF4FD8'] },
];

// Firestore field paths can't contain these characters.
const cleanSkill = (s) => s.replace(/[.~*/[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);

/** Verify, step 2: name the skill and pick the level to prove. */
const SkillVerificationInputScreen = ({ navigation, route }) => {
  const { category, skill: preset } = route.params || {};
  const { colors, radius } = useTheme();
  const { profile } = useUser();
  const [skill, setSkill] = useState(preset || '');
  const [level, setLevel] = useState('Intermediate');
  const [error, setError] = useState('');

  const existing = profile?.verifiedSkills?.[cleanSkill(skill)];

  const start = () => {
    const name = cleanSkill(skill);
    if (name.length < 2) {
      setError('Enter the skill you want to verify.');
      haptics.warning();
      return;
    }
    navigation.navigate('SkillVerificationMCQ', { skill: name, level, category: category?.name || 'General' });
  };

  return (
    <Screen keyboard edges={['top', 'bottom']} header={<Header title={category?.name || 'Verify a skill'} subtitle="Set up your quiz" onBack={() => navigation.goBack()} />}>
      <TextField
        label="Skill to verify"
        icon="ribbon-outline"
        placeholder="e.g. React Native, Public speaking"
        value={skill}
        onChangeText={(t) => {
          setSkill(t);
          setError('');
        }}
        error={error}
        maxLength={50}
        returnKeyType="done"
        autoCapitalize="words"
      />
      {category?.skills?.length ? (
        <View style={styles.suggestions}>
          {category.skills.map((s) => (
            <Chip key={s} label={s} size="sm" selected={cleanSkill(skill) === s} onPress={() => setSkill(s)} />
          ))}
        </View>
      ) : null}

      {existing ? (
        <Card variant="tinted" tint={colors.successSoft} padding={12} style={styles.notice}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="small" style={{ flex: 1, marginLeft: 8 }}>
            Already verified at <AppText variant="smallStrong">{existing.level}</AppText>. Pass a higher level to upgrade it.
          </AppText>
        </Card>
      ) : null}

      <AppText variant="h3" style={{ marginTop: 22, marginBottom: 12 }}>
        Choose your level
      </AppText>
      <View style={{ gap: 10 }}>
        {LEVELS.map((l) => {
          const active = level === l.key;
          return (
            <PressableScale key={l.key} onPress={() => setLevel(l.key)} haptic="select" scaleTo={0.98} accessibilityState={{ selected: active }} accessibilityLabel={`${l.key}, ${XP_RULES.skill[l.key]} XP`}>
              <View
                style={[
                  styles.level,
                  { borderRadius: radius.lg, backgroundColor: active ? colors.surface : colors.surfaceAlt, borderColor: active ? l.colors[0] : 'transparent' },
                ]}
              >
                <LinearGradient colors={l.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelIcon}>
                  <Ionicons name={l.icon} size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText variant="title">{l.key}</AppText>
                  <AppText variant="caption" tone="muted">
                    {l.desc}
                  </AppText>
                </View>
                <View style={[styles.xp, { backgroundColor: colors.warningSoft }]}>
                  <AppText variant="caption" tone="warning" style={{ fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                    +{XP_RULES.skill[l.key]} XP
                  </AppText>
                </View>
                <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? l.colors[0] : colors.textFaint} style={{ marginLeft: 10 }} />
              </View>
            </PressableScale>
          );
        })}
      </View>

      <Card padding={14} style={{ marginTop: 20 }}>
        {[
          ['help-circle-outline', '10 multiple-choice questions, written by AI'],
          ['timer-outline', '30 seconds per question on average'],
          ['checkmark-done-outline', 'Score 70% or more to pass'],
          ['refresh-outline', 'Didn’t pass? You can retry after a short cooldown'],
        ].map(([icon, text]) => (
          <View key={text} style={styles.rule}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <AppText variant="small" tone="muted" style={{ marginLeft: 10, flex: 1 }}>
              {text}
            </AppText>
          </View>
        ))}
      </Card>

      <Button title="Start quiz" icon="play" onPress={start} full size="lg" style={{ marginTop: 20 }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 },
  notice: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  level: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 2 },
  levelIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  xp: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rule: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
});

export default SkillVerificationInputScreen;
