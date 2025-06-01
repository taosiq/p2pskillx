import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import CustomDrawer from './components/CustomDrawer';
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
import LearnSkillScreen from './screens/LearnSkillScreen';
import LoginScreen from './screens/LoginScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import ProfileScreen from './screens/ProfileScreen';
import RecommendationsScreen from './screens/RecommendationsScreen';
import SignUpScreen from './screens/SignUpScreen';
import SkillCategoryScreen from './screens/SkillCategoryScreen';
import SkillVerificationInputScreen from './screens/SkillVerificationInputScreen';
import SkillVerificationMCQScreen from './screens/SkillVerificationMCQScreen';
import SkillVerificationResultsScreen from './screens/SkillVerificationResultsScreen';
import UserManualScreen from './screens/UserManualScreen';
import UsersListScreen from './screens/UsersListScreen';
import { isApiConfigured, setupApiKey } from './utils/setupApi';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerActiveBackgroundColor: '#2563EB',
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#333',
      }}
      initialRouteName="Dashboard"
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="globe-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Messages" 
        component={ConversationsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="User Manual" 
        component={UserManualScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="book-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Help Guide & FAQs" 
        component={HelpGuideScreen}
        options={{
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Privacy Policy" 
        component={PrivacyPolicyScreen}
        options={{
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="shield-account-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// Main stack that includes auth screens and drawer navigation
function AppStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Main" component={DrawerNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="UsersList" component={UsersListScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="LearnSkill" component={LearnSkillScreen} />
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
    </Stack.Navigator>
  );
}

export default function App() {
  // Initialize OpenRouter API key on app start
  useEffect(() => {
    const initializeApiKey = async () => {
      try {
        // First check if API key is already set
        const configured = await isApiConfigured();
        
        if (!configured) {
          // If not configured, set up the API key
          console.log('Setting up OpenRouter API key...');
          await setupApiKey();
          console.log('OpenRouter API key set up successfully!');
        } else {
          console.log('OpenRouter API key already configured');
        }
      } catch (error) {
        console.error('Error initializing API key:', error);
      }
    };
    
    initializeApiKey();
  }, []);

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}