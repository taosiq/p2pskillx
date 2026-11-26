import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { RARITY } from '../../utils/gamification';
import { AppText, PressableScale, ProgressBar } from '../ui';

/** Achievement badge: full colour when unlocked, greyed with progress when locked. */
export default function AchievementTile({ achievement: a, onPress, width = 104 }) {
  const { colors, radius } = useTheme();
  const rarity = RARITY[a.rarity] || RARITY.common;

  return (
    <PressableScale
      onPress={() => onPress?.(a)}
      style={{ width }}
      accessibilityLabel={`${a.title}. ${a.description}. ${a.unlocked ? 'Unlocked' : `${a.value} of ${a.target}`}`}
    >
      <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: a.unlocked ? rarity.color + '66' : colors.border, borderRadius: radius.lg }]}>
        {a.unlocked ? (
          <LinearGradient colors={a.gradient} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={a.icon} size={26} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name={a.icon} size={24} color={colors.textFaint} />
            <View style={[styles.lock, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
              <Ionicons name="lock-closed" size={10} color={colors.textFaint} />
            </View>
          </View>
        )}
        <AppText variant="smallStrong" align="center" numberOfLines={1} tone={a.unlocked ? 'default' : 'muted'} style={{ marginTop: 8 }}>
          {a.title}
        </AppText>
        {a.unlocked ? (
          <AppText variant="caption" color={rarity.color} align="center" style={{ marginTop: 2, fontFamily: 'PlusJakartaSans_700Bold' }}>
            {rarity.label}
          </AppText>
        ) : (
          <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
            <ProgressBar value={a.progress} height={4} gradient={a.gradient} />
            <AppText variant="caption" tone="faint" align="center" style={{ marginTop: 3, fontSize: 10 }}>
              {a.value}/{a.target}
            </AppText>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', padding: 12, borderWidth: 1.5, minHeight: 132 },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lock: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
