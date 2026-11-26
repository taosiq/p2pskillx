import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SUPPORT_EMAIL } from '../constants/app';
import { useTheme } from '../theme';
import { AppText, Card, PressableScale } from './ui';

/** A titled block of reading content with an icon. */
export function DocSection({ icon, title, children, color }) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <Card padding={16} style={{ marginBottom: 12 }}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: c + '22' }]}>
          <Ionicons name={icon} size={18} color={c} />
        </View>
        <AppText variant="title" style={{ flex: 1, marginLeft: 10 }}>
          {title}
        </AppText>
      </View>
      <View style={{ marginTop: 10, gap: 8 }}>{children}</View>
    </Card>
  );
}

export function P({ children }) {
  return (
    <AppText variant="body" tone="muted">
      {children}
    </AppText>
  );
}

export function Bullet({ children }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      <AppText variant="body" tone="muted" style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

/** Expandable question / answer. */
export function Faq({ q, a }) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <PressableScale onPress={() => setOpen((o) => !o)} scaleTo={0.99} accessibilityLabel={q} accessibilityState={{ expanded: open }}>
      <View style={[styles.faq, { backgroundColor: colors.surface, borderColor: open ? colors.primary + '66' : colors.border, borderRadius: radius.lg }]}>
        <View style={styles.head}>
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {q}
          </AppText>
          <Ionicons name={open ? 'remove-circle' : 'add-circle'} size={22} color={colors.primary} />
        </View>
        {open ? (
          <Animated.View entering={FadeIn}>
            <AppText variant="body" tone="muted" style={{ marginTop: 8 }}>
              {a}
            </AppText>
          </Animated.View>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function ContactCard() {
  const { colors } = useTheme();
  return (
    <Card variant="tinted" padding={16} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }} onPress={SUPPORT_EMAIL ? () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`) : undefined}>
      <Ionicons name="mail" size={22} color={colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <AppText variant="title">Still need help?</AppText>
        <AppText variant="small" tone="muted">
          {SUPPORT_EMAIL ? `Email us at ${SUPPORT_EMAIL}` : 'Use “Report” on any post or profile, and our team will review it.'}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9, marginRight: 10 },
  faq: { padding: 14, borderWidth: 1 },
});
