import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { LogoMark } from './Logo';
import { AppText } from './ui';

const CHIPS = [
  { label: 'Python', icon: 'logo-python', x: -118, y: -52, color: '#3B82F6' },
  { label: 'Design', icon: 'color-palette', x: 98, y: -64, color: '#FF4FD8' },
  { label: 'Guitar', icon: 'musical-notes', x: -126, y: 44, color: '#FFB547' },
  { label: 'Spanish', icon: 'language', x: 104, y: 40, color: '#2EE59D' },
  { label: 'AI', icon: 'hardware-chip', x: -8, y: 92, color: '#12C2FF' },
];

function FloatingChip({ chip, index }) {
  const { colors } = useTheme();
  const t = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(200 + index * 120, withTiming(1, { duration: 500 }));
    t.value = withDelay(
      index * 300,
      withRepeat(withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: chip.x },
      { translateY: chip.y + (t.value - 0.5) * 10 },
      { scale: 0.8 + appear.value * 0.2 },
    ],
  }));

  return (
    <Animated.View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Ionicons name={chip.icon} size={13} color={chip.color} />
      <AppText variant="caption" style={{ marginLeft: 5, fontFamily: 'PlusJakartaSans_700Bold' }}>
        {chip.label}
      </AppText>
    </Animated.View>
  );
}

/** Logo mark with skill chips floating around it (login hero). */
export default function SkillOrbit({ size = 92 }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1);
  }, []);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.7 }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size * 0.34, borderColor: colors.primary }, ring]} />
      <LogoMark size={size} />
      {CHIPS.map((c, i) => (
        <FloatingChip key={c.label} chip={c} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 230, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 2 },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
