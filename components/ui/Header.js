import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import AppText from './AppText';
import IconButton from './IconButton';

/**
 * Top bar. Pass onBack for a back arrow; `right` for actions.
 * large: big left-aligned title (for tab roots).
 */
export default function Header({ title, subtitle, onBack, left, right, large = false, transparent = false, style }) {
  const { spacing, colors } = useTheme();
  // Solid backdrop so scrolled content never shows through the header.
  const backdrop = transparent ? null : { backgroundColor: colors.headerBg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border };

  if (large) {
    return (
      <View style={[styles.large, { paddingHorizontal: spacing.xl }, backdrop, style]}>
        <View style={styles.flex}>
          {subtitle ? (
            <AppText variant="overline" tone="primary" style={{ marginBottom: 4 }}>
              {subtitle}
            </AppText>
          ) : null}
          <AppText variant="h1" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingHorizontal: spacing.lg }, backdrop, style]}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton icon="chevron-back" onPress={onBack} accessibilityLabel="Go back" size={42} />
        ) : (
          left
        )}
      </View>
      <View style={styles.center}>
        <AppText variant="title" numberOfLines={1} align="center">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1} align="center">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  large: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8, paddingBottom: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 },
  bar: { flexDirection: 'row', alignItems: 'center', height: 60 },
  side: { minWidth: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideRight: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
});
