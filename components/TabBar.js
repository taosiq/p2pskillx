import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../theme';
import { listenUnreadTotal } from '../utils/chatService';
import { AppText, PressableScale } from './ui';

export const TAB_ICONS = {
  Dashboard: ['home', 'home-outline', 'Home'],
  LearnSkill: ['compass', 'compass-outline', 'Learn'],
  Home: ['people', 'people-outline', 'Community'],
  Messages: ['chatbubbles', 'chatbubbles-outline', 'Chats'],
  Profile: ['person', 'person-outline', 'Profile'],
};

/** Floating bottom tab bar with a gradient pill behind the active tab. */
export default function TabBar({ state, navigation }) {
  const { colors, gradients, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [unreadChats, setUnreadChats] = useState(0);
  useEffect(() => (user ? listenUnreadTotal(setUnreadChats) : undefined), [user?.uid]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: colors.tabBar, borderColor: colors.border }, shadow(3)]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const [activeIcon, icon, label] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline', route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              haptic="select"
              scaleTo={0.9}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {focused ? (
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activePill}>
                  <Ionicons name={activeIcon} size={22} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.iconBox}>
                  <Ionicons name={icon} size={22} color={colors.textFaint} />
                </View>
              )}
              {route.name === 'Messages' && unreadChats > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.tabBar }]}>
                  <AppText variant="caption" color="#fff" style={styles.badgeText}>
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </AppText>
                </View>
              ) : null}
              <AppText
                variant="caption"
                tone={focused ? 'default' : 'faint'}
                style={[styles.label, focused && { fontFamily: 'PlusJakartaSans_700Bold' }]}
                numberOfLines={1}
              >
                {label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: { flexDirection: 'row', borderRadius: 26, paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1 },
  item: { flex: 1, alignItems: 'center' },
  activePill: { width: 48, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 48, height: 34, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 3, fontSize: 11 },
  badge: { position: 'absolute', top: -2, right: '22%', minWidth: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontSize: 9, lineHeight: 11, fontFamily: 'PlusJakartaSans_800ExtraBold' },
});

/** Bottom padding a tab screen needs so content isn't hidden behind the bar. */
export const TAB_BAR_SPACE = 110;
