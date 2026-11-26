import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme';

/** Soft coloured glow that fades to transparent (a radial gradient). */
function Orb({ color, size, style }) {
  const id = 'orb' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={size} height={size} style={[styles.orb, style]}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Soft coloured glows behind content: the "gaming" ambience. */
export function Ambient({ intensity = 1 }) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: intensity }]}>
      <Orb color={colors.glowA} size={460} style={styles.orbA} />
      <Orb color={colors.glowB} size={380} style={styles.orbB} />
    </View>
  );
}

/**
 * Page wrapper: theme background, safe area, status bar, optional scroll
 * and keyboard avoidance. `header` renders above the scrolling content.
 */
export default function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  keyboard = false,
  ambient = true,
  edges = ['top'],
  refreshControl,
  contentStyle,
  style,
  scrollRef,
  statusBarStyle,
}) {
  const { colors, spacing } = useTheme();
  const padding = padded ? { paddingHorizontal: spacing.xl } : null;

  let body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[padding, { paddingBottom: 32 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  if (keyboard) {
    body = (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }, style]}>
      <StatusBar style={statusBarStyle || (colors.isDark ? 'light' : 'dark')} />
      {ambient ? <Ambient /> : null}
      <SafeAreaView style={styles.flex} edges={edges}>
        {header}
        {body}
        {!keyboard ? footer : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  orb: { position: 'absolute' },
  orbA: { top: -230, left: -170 },
  orbB: { top: -20, right: -200 },
});
