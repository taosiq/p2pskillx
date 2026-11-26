import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText, Card, PressableScale, ProgressBar } from '../ui';

/** Today's quests with a completion bar and a chest when all are done. */
export default function QuestList({ quests = [], onQuestPress, style }) {
  const { colors, gradients } = useTheme();
  const done = quests.filter((q) => q.done).length;
  const all = quests.length > 0 && done === quests.length;

  return (
    <Card style={style} padding={16}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <AppText variant="title">Daily quests</AppText>
          <AppText variant="caption" tone="muted">
            {all ? 'All done! New quests at midnight' : `${done} of ${quests.length} complete · resets at midnight`}
          </AppText>
        </View>
        <LinearGradient colors={all ? gradients.gold : [colors.surfaceAlt, colors.surfaceAlt]} style={styles.chest}>
          <Ionicons name={all ? 'gift' : 'gift-outline'} size={22} color={all ? '#fff' : colors.textFaint} />
        </LinearGradient>
      </View>
      <ProgressBar value={quests.length ? done / quests.length : 0} height={6} gradient={gradients.gold} style={{ marginVertical: 12 }} />

      {quests.map((q) => (
        <PressableScale
          key={q.id}
          onPress={() => !q.done && q.route && onQuestPress?.(q)}
          disabled={q.done || !q.route}
          scaleTo={0.98}
          accessibilityLabel={`${q.title}, ${q.done ? 'completed' : 'not completed'}`}
        >
          <View style={styles.quest}>
            <View
              style={[
                styles.check,
                q.done
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : { borderColor: colors.borderStrong },
              ]}
            >
              {q.done ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Ionicons name={q.icon} size={14} color={colors.textFaint} />}
            </View>
            <View style={{ flex: 1 }}>
              <AppText
                variant="bodyStrong"
                tone={q.done ? 'muted' : 'default'}
                style={q.done && { textDecorationLine: 'line-through' }}
              >
                {q.title}
              </AppText>
              <AppText variant="caption" tone="faint">
                {q.description}
              </AppText>
            </View>
            <View style={[styles.xp, { backgroundColor: colors.warningSoft }]}>
              <AppText variant="caption" tone="warning" style={{ fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                +{q.xp} XP
              </AppText>
            </View>
          </View>
        </PressableScale>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  chest: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quest: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 12 },
  check: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  xp: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
