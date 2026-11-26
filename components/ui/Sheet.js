import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import AppText from './AppText';

/** Bottom sheet (slides up over a dimmed backdrop). Tap outside to close. */
export default function Sheet({ visible, onClose, title, subtitle, children, scroll = false }) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgElevated,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingBottom: insets.bottom + 16,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          {title ? (
            <View style={styles.head}>
              <AppText variant="h3">{title}</AppText>
              {subtitle ? (
                <AppText variant="small" tone="muted" style={{ marginTop: 4 }}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
          <Body style={scroll ? { maxHeight: 520 } : null} contentContainerStyle={scroll ? { paddingBottom: 8 } : undefined}>
            {children}
          </Body>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 20, paddingTop: 10, borderWidth: 1, borderBottomWidth: 0 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  head: { marginBottom: 14 },
});
