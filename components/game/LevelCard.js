import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText, PressableScale, ProgressBar, ProgressRing } from '../ui';
import TierBadge from './TierBadge';

/**
 * Hero card: level ring, tier, XP to next level.
 * Always dark-on-gradient so it pops in both light and dark themes.
 */
export default function LevelCard({ level, onPress, style }) {
  const { radius, glow, colors, gradients } = useTheme();
  if (!level) return null;
  const { tier, nextTier } = level;

  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={`Level ${level.level}, ${level.remaining} XP to next level`}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: radius.xl }, glow(colors.primary, 0.9), style]}
      >
        <View style={styles.shine} />
        <View style={styles.row}>
          <ProgressRing size={96} stroke={9} value={level.progress} gradient={tier.colors} track="rgba(255,255,255,0.14)">
            <AppText variant="overline" color="rgba(255,255,255,0.7)" style={{ fontSize: 9 }}>
              LEVEL
            </AppText>
            <AppText variant="statLg" color="#fff" style={{ fontSize: 34, lineHeight: 38 }}>
              {level.level}
            </AppText>
          </ProgressRing>

          <View style={styles.info}>
            <TierBadge tier={tier} />
            <View style={styles.xpRow}>
              <AppText variant="stat" color="#fff">
                {level.xp.toLocaleString()}
              </AppText>
              <AppText variant="smallStrong" color="rgba(255,255,255,0.75)" style={{ marginLeft: 4, marginBottom: 3 }}>
                XP
              </AppText>
            </View>
            <ProgressBar value={level.progress} height={8} gradient={['#FFE066', '#FF8A3D']} track="rgba(255,255,255,0.15)" />
            <AppText variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 6 }}>
              {level.isMax ? 'Max level reached' : `${level.remaining.toLocaleString()} XP to Level ${level.level + 1}`}
            </AppText>
          </View>
        </View>

        {nextTier ? (
          <View style={styles.footer}>
            <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.75)" />
            <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ marginLeft: 6, flex: 1 }}>
              {nextTier.name} tier unlocks at Level {nextTier.minLevel}
              {nextTier.reward ? ` · +${nextTier.reward} credits` : ''}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.75)" />
          </View>
        ) : null}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, overflow: 'hidden' },
  shine: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -110,
    right: -60,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 16 },
  xpRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
});
