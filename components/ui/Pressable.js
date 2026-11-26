import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import haptics from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable that shrinks slightly on press and gives a light haptic tap.
 * Used as the base of every tappable element so the whole app feels the same.
 */
export default function PressableScale({
  onPress,
  onLongPress,
  disabled,
  scaleTo = 0.96,
  haptic = 'tap',
  style,
  children,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
  ...rest
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={(e) => {
        if (haptic && haptics[haptic]) haptics[haptic]();
        onPress?.(e);
      }}
      onLongPress={onLongPress}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
