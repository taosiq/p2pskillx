import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import PressableScale from './Pressable';

/**
 * Surface container.
 * variant: default | outline | gradient (pass `gradient` colours) | tinted (pass `tint`)
 */
export default function Card({
  children,
  onPress,
  onLongPress,
  variant = 'default',
  gradient,
  tint,
  padding = 16,
  radius: r,
  style,
  elevation = 1,
  accessibilityLabel,
}) {
  const { colors, gradients, radius, shadow } = useTheme();
  const br = r ?? radius.lg;

  const base = { borderRadius: br, padding };
  let body;

  if (variant === 'gradient') {
    body = (
      <LinearGradient
        colors={gradient || gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[base, style]}
      >
        {children}
      </LinearGradient>
    );
  } else {
    const v = {
      default: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderStrong },
      tinted: { backgroundColor: tint || colors.primarySoft, borderWidth: 0 },
    }[variant] || {};
    body = <View style={[base, v, variant === 'default' && shadow(elevation), style]}>{children}</View>;
  }

  if (!onPress && !onLongPress) return body;
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.98}
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </PressableScale>
  );
}
