import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '../ui';

/** Hexagon-ish medal in the tier's colours with its icon. */
export function TierMedal({ tier, size = 44 }) {
  return (
    <LinearGradient
      colors={tier.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.medal, { width: size, height: size, borderRadius: size * 0.32 }]}
    >
      <Ionicons name={tier.icon} size={size * 0.5} color={tier.key === 'silver' ? '#334155' : '#fff'} />
    </LinearGradient>
  );
}

/** Small "Gold · Skilled" style tag. */
export default function TierBadge({ tier, compact = false, style }) {
  const dark = tier.key === 'silver' || tier.key === 'gold';
  return (
    <LinearGradient
      colors={tier.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.tag, style]}
    >
      <Ionicons name={tier.icon} size={12} color={dark ? '#1E1B4B' : '#fff'} />
      <AppText variant="caption" color={dark ? '#1E1B4B' : '#fff'} style={styles.tagText}>
        {compact ? tier.name : `${tier.name} · ${tier.title}`}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  medal: { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  tagText: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
});
