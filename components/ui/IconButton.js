import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';
import PressableScale from './Pressable';

/**
 * Round icon button. variant: surface | ghost | primary | glass
 * badge: number shown as a red dot with count (0 hides it).
 */
export default function IconButton({
  icon,
  onPress,
  size = 44,
  iconSize = 22,
  variant = 'surface',
  color,
  badge,
  accessibilityLabel,
  style,
  disabled,
}) {
  const { colors } = useTheme();
  const bg = {
    surface: colors.surface,
    ghost: 'transparent',
    primary: colors.primarySoft,
    glass: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
  }[variant];
  const fg = color || (variant === 'primary' ? colors.primary : colors.text);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: variant === 'surface' ? colors.border : 'transparent',
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={fg} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.bg }]}>
          <AppText variant="caption" color="#fff" style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12, fontFamily: 'PlusJakartaSans_800ExtraBold' },
});
