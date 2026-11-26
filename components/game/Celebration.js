import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../theme';
import haptics from '../../utils/haptics';
import { RARITY } from '../../utils/gamification';
import { AppText, Button } from '../ui';

const { width: W, height: H } = Dimensions.get('window');
const CONFETTI_COLORS = ['#7C5CFF', '#FF4FD8', '#22D3EE', '#2EE59D', '#FFC83D', '#FF7A45'];

function ConfettiPiece({ index }) {
  const p = useMemo(
    () => ({
      x: Math.random() * W,
      drift: (Math.random() - 0.5) * 140,
      delay: Math.random() * 500,
      duration: 2200 + Math.random() * 1400,
      size: 6 + Math.random() * 7,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      round: index % 3 === 0,
    }),
    [index]
  );
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: p.duration, easing: Easing.in(Easing.quad) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateX: p.x + p.drift * t.value },
      { translateY: -40 + t.value * (H + 80) },
      { rotate: `${t.value * 720}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: p.size, height: p.round ? p.size : p.size * 1.8, borderRadius: p.round ? p.size : 2, backgroundColor: p.color },
        style,
      ]}
    />
  );
}

/** Full-screen celebration for level-ups and unlocked achievements. Rendered once at the app root. */
export default function Celebration() {
  const { celebration, dismissCelebration } = useUser();
  const { colors, radius } = useTheme();
  const scale = useSharedValue(0.6);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!celebration) return;
    haptics.success();
    scale.value = 0.6;
    scale.value = withSequence(withSpring(1.08, { damping: 8 }), withSpring(1));
    spin.value = 0;
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1);
  }, [celebration]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  if (!celebration) return null;

  const isLevel = celebration.type === 'level';
  const a = celebration.achievement;
  const gradient = isLevel ? celebration.tier.colors : a?.gradient || ['#7C5CFF', '#FF4FD8'];
  const icon = isLevel ? celebration.tier.icon : a?.icon || 'trophy';
  const rarity = !isLevel && a ? RARITY[a.rarity] : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissCelebration} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: 'rgba(6,4,20,0.86)' }]}>
        {Array.from({ length: 36 }).map((_, i) => (
          <ConfettiPiece key={`${celebration.type}-${i}`} index={i} />
        ))}

        <Animated.View style={[styles.card, { backgroundColor: colors.bgElevated, borderRadius: radius.xxl, borderColor: colors.border }, pop]}>
          <View style={styles.medalWrap}>
            <Animated.View style={[styles.rays, rays]}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.ray, { backgroundColor: gradient[0] + '40', transform: [{ rotate: `${i * 30}deg` }] }]}
                />
              ))}
            </Animated.View>
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.medal}>
              {isLevel ? (
                <AppText variant="statLg" color="#fff" style={{ fontSize: 46, lineHeight: 52 }}>
                  {celebration.level}
                </AppText>
              ) : (
                <Ionicons name={icon} size={52} color="#fff" />
              )}
            </LinearGradient>
          </View>

          <AppText variant="overline" tone="primary" align="center">
            {isLevel ? 'Level up!' : 'Achievement unlocked'}
          </AppText>
          <AppText variant="h1" align="center" style={{ marginTop: 6 }}>
            {isLevel ? `You reached Level ${celebration.level}` : a?.title}
          </AppText>
          <AppText variant="body" tone="muted" align="center" style={{ marginTop: 8 }}>
            {isLevel
              ? celebration.tierChanged
                ? `Welcome to the ${celebration.tier.name} tier. You're now a ${celebration.tier.title}!`
                : `Keep going: ${celebration.tier.name} ${celebration.tier.title}s are making real progress.`
              : a?.description}
          </AppText>
          {rarity ? (
            <AppText variant="smallStrong" color={rarity.color} align="center" style={{ marginTop: 10 }}>
              {rarity.label} badge
            </AppText>
          ) : null}

          <Button title="Awesome!" onPress={dismissCelebration} full style={{ marginTop: 22 }} icon="sparkles" />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 380, padding: 24, paddingTop: 12, borderWidth: 1, alignItems: 'stretch' },
  medalWrap: { height: 170, alignItems: 'center', justifyContent: 'center' },
  rays: { position: 'absolute', width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 14, height: 220, borderRadius: 7 },
  medal: { width: 108, height: 108, borderRadius: 36, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
});
