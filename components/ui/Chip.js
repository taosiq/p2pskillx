import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';
import PressableScale from './Pressable';

/** Small rounded label. Selectable when onPress is given. */
export default function Chip({ label, icon, selected, onPress, color, size = 'md', style }) {
  const { colors, radius } = useTheme();
  const c = color || colors.primary;
  const bg = selected ? c : colors.isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceAlt;
  const fg = selected ? '#fff' : color ? c : colors.textMuted;
  const pad = size === 'sm' ? { paddingHorizontal: 10, height: 28 } : { paddingHorizontal: 14, height: 36 };

  const body = (
    <View style={[styles.chip, pad, { backgroundColor: bg, borderRadius: radius.pill }, style]}>
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 13 : 15} color={fg} style={styles.icon} /> : null}
      <AppText variant={size === 'sm' ? 'caption' : 'smallStrong'} color={fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} haptic="select" accessibilityState={{ selected: !!selected }}>
      {body}
    </PressableScale>
  );
}

/** Coloured status pill, e.g. "Verified", "Gold". */
export function Pill({ label, icon, color, style }) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[styles.pill, { backgroundColor: c + '22', borderColor: c + '55' }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={c} style={{ marginRight: 4 }} /> : null}
      <AppText variant="caption" color={c} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  icon: { marginRight: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
});
