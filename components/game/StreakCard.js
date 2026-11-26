import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText, Card } from '../ui';

/** Current streak with the last seven days as flame dots. */
export default function StreakCard({ streak = 0, best = 0, week = [], style }) {
  const { colors, gradients } = useTheme();
  const hot = streak > 0;

  return (
    <Card style={style} padding={16}>
      <View style={styles.head}>
        <LinearGradient colors={hot ? gradients.fire : [colors.surfaceAlt, colors.surfaceAlt]} style={styles.flame}>
          <Ionicons name="flame" size={24} color={hot ? '#fff' : colors.textFaint} />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.row}>
            <AppText variant="stat">{streak}</AppText>
            <AppText variant="bodyStrong" tone="muted" style={{ marginLeft: 6, marginBottom: 2 }}>
              day streak
            </AppText>
          </View>
          <AppText variant="caption" tone="muted">
            {hot ? 'Come back tomorrow to keep it alive' : 'Open the app daily to build a streak'} · Best {best}
          </AppText>
        </View>
      </View>

      <View style={styles.week}>
        {week.map((d) => (
          <View key={d.key} style={styles.day}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: d.active ? colors.warning : colors.surfaceAlt,
                  borderColor: d.isToday ? colors.warning : 'transparent',
                },
              ]}
            >
              {d.active ? <Ionicons name="flame" size={14} color="#fff" /> : null}
            </View>
            <AppText variant="caption" tone={d.isToday ? 'default' : 'faint'} style={{ marginTop: 4 }}>
              {d.label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  flame: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  day: { alignItems: 'center', flex: 1 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
