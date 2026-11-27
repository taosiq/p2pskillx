import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../../hooks/useKeyboardScroll';
import { useTheme } from '../../theme';
import AppText from './AppText';

/** Bottom sheet (slides up over a dimmed backdrop). Tap outside to close. */
export default function Sheet({ visible, onClose, title, subtitle, children, scroll = false }) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const Body = scroll ? ScrollView : View;
  // iOS doesn't move modals for the keyboard, so lift the sheet by the keyboard's
  // height. (Android resizes the modal window itself.)
  const keyboard = useKeyboardHeight();
  const lift = Platform.OS === 'ios' ? keyboard : 0;
  const maxBody = Math.max(160, Math.min(520, screenHeight - lift - insets.top - 160));

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
              paddingBottom: lift ? lift + 12 : insets.bottom + 16,
              maxHeight: screenHeight - insets.top - 12,
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
          <Body
            style={scroll ? { maxHeight: maxBody } : null}
            contentContainerStyle={scroll ? { paddingBottom: 8 } : undefined}
            keyboardShouldPersistTaps={scroll ? 'handled' : undefined}
          >
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
