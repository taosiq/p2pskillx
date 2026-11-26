import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Celebration } from './components/game';
import TabBar from './components/TabBar';
import { UserProvider, useUser } from './context/UserContext';
import AchievementsScreen from './screens/AchievementsScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import ChatScreen from './screens/ChatScreen';
import ConversationsScreen from './screens/ConversationsScreen';
import CourseAccessScreen from './screens/CourseAccessScreen';
import CourseCreationScreen from './screens/CourseCreationScreen';
import CourseDetailsScreen from './screens/CourseDetailsScreen';
import CourseTypeSelectionScreen from './screens/CourseTypeSelectionScreen';
import DashboardScreen from './screens/DashboardScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import FollowersListScreen from './screens/FollowersListScreen';
import FollowingListScreen from './screens/FollowingListScreen';
import HelpGuideScreen from './screens/HelpGuideScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import LearnSkillScreen from './screens/LearnSkillScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SignUpScreen from './screens/SignUpScreen';
import SkillCategoryScreen from './screens/SkillCategoryScreen';
import SkillVerificationInputScreen from './screens/SkillVerificationInputScreen';
import SkillVerificationMCQScreen from './screens/SkillVerificationMCQScreen';
import SkillVerificationResultsScreen from './screens/SkillVerificationResultsScreen';
import UserManualScreen from './screens/UserManualScreen';
import UsersListScreen from './screens/UsersListScreen';
import { ThemeProvider, useTheme } from './theme';
import { apiConfigured } from './services/api';
import { setupApiKey } from './utils/setupApi';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="LearnSkill" component={LearnSkillScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, initializing } = useUser();
  const { colors, isDark } = useTheme();

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colors, isDark]);

  // Keep the splash up until Firebase says whether someone is already signed
  // in, so a returning user goes straight to the app instead of the login screen.
  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync().catch(() => {});
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={user ? 'Main' : 'Login'}
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="UserProfile" component={ProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="UsersList" component={UsersListScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="CourseAccess" component={CourseAccessScreen} />
        <Stack.Screen name="CourseTypeSelection" component={CourseTypeSelectionScreen} />
        <Stack.Screen name="CourseCreation" component={CourseCreationScreen} />
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
        <Stack.Screen name="SkillCategory" component={SkillCategoryScreen} />
        <Stack.Screen name="SkillVerificationInput" component={SkillVerificationInputScreen} />
        <Stack.Screen name="SkillVerificationMCQ" component={SkillVerificationMCQScreen} />
        <Stack.Screen name="SkillVerificationResults" component={SkillVerificationResultsScreen} />
        <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
        <Stack.Screen name="FollowersList" component={FollowersListScreen} />
        <Stack.Screen name="FollowingList" component={FollowingListScreen} />
        <Stack.Screen name="UserManual" component={UserManualScreen} />
        <Stack.Screen name="HelpGuide" component={HelpGuideScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
      <Celebration />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  // Development fallback only: with the secure backend configured the app never
  // touches the OpenRouter key (it lives on the server).
  useEffect(() => {
    if (!apiConfigured) setupApiKey().catch(() => {});
  }, []);

  // If fonts fail to load the app still starts, falling back to the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <UserProvider>
            <RootNavigator />
          </UserProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
