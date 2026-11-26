import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import AppText from './AppText';
import Button from './Button';
import PressableScale from './Pressable';

/** Section title with an optional "See all" style action. */
export function SectionHeader({ title, action, onAction, style }) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.section, { marginTop: spacing.xxl, marginBottom: spacing.md }, style]}>
      <AppText variant="h3">{title}</AppText>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={10}>
          <AppText variant="smallStrong" tone="primary">
            {action}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Friendly placeholder when a list has nothing to show. */
export function EmptyState({ icon = 'sparkles-outline', title, message, actionLabel, onAction, gradient, style }) {
  const { gradients } = useTheme();
  return (
    <View style={[styles.empty, style]}>
      <LinearGradient colors={gradient || gradients.primary} style={styles.emptyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Ionicons name={icon} size={30} color="#fff" />
      </LinearGradient>
      <AppText variant="h3" align="center" style={{ marginTop: 16 }}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" tone="muted" align="center" style={{ marginTop: 6, maxWidth: 300 }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 18 }} />
      ) : null}
    </View>
  );
}

/** Pulsing placeholder block shown while content loads. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1);
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton }, a, style]} />;
}

export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border }, style]} />;
}

/** Settings-style row. */
export function ListItem({ icon, iconColor, title, subtitle, right, onPress, danger, showChevron = !!onPress, style }) {
  const { colors, radius } = useTheme();
  const c = danger ? colors.danger : iconColor || colors.primary;
  const body = (
    <View style={[styles.item, style]}>
      {icon ? (
        <View style={[styles.itemIcon, { backgroundColor: c + '1F', borderRadius: radius.sm }]}>
          <Ionicons name={icon} size={20} color={c} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" tone={danger ? 'danger' : 'default'} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: 6 }} /> : null}
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={title}>
      {body}
    </PressableScale>
  ) : (
    body
  );
}

/** Segmented control (tabs inside a screen). */
export function Segmented({ options, value, onChange, style }) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            haptic="select"
            scaleTo={0.97}
            style={{ flex: 1 }}
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            <View
              style={[
                styles.segmentItem,
                { borderRadius: radius.sm },
                active && { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
              ]}
            >
              <AppText variant="smallStrong" tone={active ? 'default' : 'muted'} numberOfLines={1}>
                {o.label}
                {o.count != null ? ` · ${o.count}` : ''}
              </AppText>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  itemIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', padding: 4 },
  segmentItem: { height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
