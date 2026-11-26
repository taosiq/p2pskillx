import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { AppText } from './ui';

/**
 * The mark: two peers (dots) whose exchange arrows cross to form an "X",
 * both arrows pointing up: people swapping skills and levelling each other up.
 */
export function LogoMark({ size = 56, style, flat = false }) {
  const { gradients, glow, colors } = useTheme();
  const glyph = (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 100 100">
      {/* Right-hand peer and its arrow up to the left (one group so overlaps don't double up) */}
      <G opacity={0.72}>
        <Path d="M68 70 C 56 58, 46 46, 30 30" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d="M30 48 L30 30 L48 30" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={73} cy={80} r={9} fill="#FFFFFF" />
      </G>
      {/* Arrow from the left-hand peer up to the right */}
      <Path d="M32 70 C 44 58, 54 46, 70 30" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" />
      <Path d="M52 30 L70 30 L70 48" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* The two peers */}
      <Circle cx={27} cy={80} r={9} fill="#FFFFFF" />
    </Svg>
  );

  if (flat) return <View style={[styles.center, { width: size, height: size }, style]}>{glyph}</View>;

  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.center, { width: size, height: size, borderRadius: size * 0.3 }, glow(colors.primary, 1), style]}
    >
      {glyph}
    </LinearGradient>
  );
}

/** Mark + "P2PSkillX" wordmark. direction: 'row' | 'column' */
export default function Logo({ size = 56, wordmark = true, direction = 'row', tagline, style }) {
  const column = direction === 'column';
  const fontSize = column ? size * 0.42 : size * 0.46;
  return (
    <View style={[column ? styles.column : styles.row, style]}>
      <LogoMark size={size} />
      {wordmark ? (
        <View style={column ? { alignItems: 'center', marginTop: size * 0.28 } : { marginLeft: size * 0.24 }}>
          <AppText style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize, lineHeight: fontSize * 1.2, letterSpacing: -0.5 }}>
            P2PSkill
            <AppText tone="primary" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize, lineHeight: fontSize * 1.2 }}>
              X
            </AppText>
          </AppText>
          {tagline ? (
            <AppText variant="overline" tone="muted" style={{ marginTop: 2, letterSpacing: 2 }}>
              {tagline}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
