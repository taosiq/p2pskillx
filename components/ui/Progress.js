import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { useTheme } from '../../theme';

const clamp = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** Horizontal progress bar that animates to its value. value: 0..1 */
export function ProgressBar({ value = 0, height = 10, gradient, track, style }) {
  const { colors, gradients } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamp(value), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={[
        { height, borderRadius: height, overflow: 'hidden', backgroundColor: track || (colors.isDark ? 'rgba(255,255,255,0.08)' : colors.surfaceAlt) },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(value) * 100) }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: height, overflow: 'hidden' }, fill]}>
        <LinearGradient
          colors={gradient || gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Circular progress ring with content in the middle. value: 0..1 */
export function ProgressRing({ size = 96, stroke = 10, value = 0, gradient, track, children, style }) {
  const { colors, gradients } = useTheme();
  const g = gradient || gradients.primary;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamp(value), { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // SVG ids must be plain characters; React's useId contains symbols like ":" or "«".
  const id = 'ring' + React.useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {g.map((c, i) => (
              <Stop key={c + i} offset={`${(i / Math.max(1, g.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track || (colors.isDark ? 'rgba(255,255,255,0.08)' : colors.surfaceAlt)}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
