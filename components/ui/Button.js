import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';
import PressableScale from './Pressable';

const sizes = {
  sm: { height: 38, paddingHorizontal: 14, icon: 16, text: 'smallStrong' },
  md: { height: 50, paddingHorizontal: 20, icon: 18, text: 'button' },
  lg: { height: 58, paddingHorizontal: 24, icon: 20, text: 'button' },
};

/**
 * variant: primary (brand gradient) | secondary | outline | ghost | danger | success | gold
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  full = false,
  style,
  gradient,
  accessibilityLabel,
}) {
  const { colors, gradients, radius, glow } = useTheme();
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  const gradientVariants = {
    primary: gradient || gradients.primary,
    success: gradients.success,
    gold: gradients.gold,
    danger: [colors.danger, '#FF7A8F'],
  };
  const isGradient = !!gradientVariants[variant];

  const flat = {
    secondary: { bg: colors.primarySoft, fg: colors.primary, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  }[variant] || { bg: colors.surfaceAlt, fg: colors.text, border: 'transparent' };

  const fg = isGradient ? colors.textOnBrand : flat.fg;

  const content = (
    <View style={[styles.row, { paddingHorizontal: s.paddingHorizontal }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={s.icon} color={fg} style={styles.iconLeft} /> : null}
          <AppText variant={s.text} color={fg} numberOfLines={1}>
            {title}
          </AppText>
          {iconRight ? <Ionicons name={iconRight} size={s.icon} color={fg} style={styles.iconRight} /> : null}
        </>
      )}
    </View>
  );

  const shape = { height: s.height, borderRadius: radius.md };

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic="press"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        full && styles.full,
        { opacity: isDisabled ? 0.5 : 1 },
        isGradient && !isDisabled && variant === 'primary' && glow(colors.primary, 0.8),
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientVariants[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[shape, styles.center]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            shape,
            styles.center,
            { backgroundColor: flat.bg, borderColor: flat.border, borderWidth: flat.border === 'transparent' ? 0 : 1.5 },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
