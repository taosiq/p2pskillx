import { Feather, Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { auth, db } from '../config/firebase';
import { getUserCourses, getUserEnrolledCourses } from '../services/courseService';
import { getVerifiedSkills } from '../services/skillService';

const DashboardScreen = ({ navigation }) => {
  const [verifiedSkills, setVerifiedSkills] = useState({});
  const [showSkillOptions, setShowSkillOptions] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseCounts, setCourseCounts] = useState({
    enrolled: 0,
    active: 0
  });
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    initials: 'U',
    credits: 100
  });

  useEffect(() => {
    loadVerifiedSkills();
    loadRecommendations();
    fetchUserData();
    fetchCourseCounts();
    
    // Refresh verified skills whenever the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadVerifiedSkills();
      fetchUserData();
      fetchCourseCounts();
    });
    
    // Cleanup the listener on component unmount
    return unsubscribe;
  }, [navigation]);

  const loadVerifiedSkills = async () => {
    try {
      // Fetch verified skills from the skill service
      const skillsResult = await getVerifiedSkills();
      
      if (skillsResult.success && Object.keys(skillsResult.skills).length > 0) {
        setVerifiedSkills(skillsResult.skills);
        return;
      }
      
      // Fallback to user document if skill service fails
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.verifiedSkills && Object.keys(userData.verifiedSkills).length > 0) {
            setVerifiedSkills(userData.verifiedSkills);
            return;
          }
        }
      }
      
      // If no skills found, use an empty object
      setVerifiedSkills({});
      
    } catch (error) {
      console.error("Error loading verified skills:", error);
      // Silent fail - initialize empty object
      setVerifiedSkills({});
    }
  };

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Use hardcoded recommendations for the demo
      const demoRecommendations = [
        {
          id: '1',
          title: 'React Native Development',
          category: 'Mobile App Development',
          source: 'skill',
          reason: 'Based on your JavaScript skill • 50 credits',
          credits: 50
        },
        {
          id: '2',
          title: 'Data Science with Python',
          category: 'Data Science',
          source: 'social',
          reason: 'Popular among your connections • 45 credits',
          credits: 45
        },
        {
          id: '3',
          title: 'UI/UX Design Fundamentals',
          category: 'Design',
          source: 'interest',
          reason: 'Matches your interests • 40 credits',
          credits: 40
        },
        {
          id: '4',
          title: 'Node.js Backend Development',
          category: 'Web Development',
          source: 'popular',
          reason: 'Trending in your region • 55 credits',
          credits: 55
        }
      ];
      
      setRecommendations(demoRecommendations);
    } catch (error) {
      console.log('Using demo recommendations');
      // Silent fail with fallback recommendations
      setRecommendations([
        {
          id: '1',
          title: 'React Native Development',
          category: 'Mobile App Development',
          source: 'skill',
          reason: 'Based on your JavaScript skill • 50 credits',
          credits: 50
        },
        {
          id: '2',
          title: 'Data Science with Python',
          category: 'Data Science',
          source: 'social',
          reason: 'Popular among your connections • 45 credits',
          credits: 45
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }
      
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // If credits are missing, initialize them to 100
        if (data.credits === undefined || data.credits === null) {
          console.log('Initializing user credits to 100');
          await updateDoc(userDocRef, { credits: 100 });
          data.credits = 100;
        }
        
        // Get initials from first and last name
        const firstInitial = data.firstName ? data.firstName.charAt(0) : '';
        const lastInitial = data.lastName ? data.lastName.charAt(0) : '';
        const initials = (firstInitial + lastInitial).toUpperCase();
        
        // Set user data
        setUserData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          initials: initials || 'U',
          credits: data.credits || 100
        });
        
        console.log(`Dashboard updated with ${data.credits} credits`);
      } else {
        // If user document doesn't exist, create it with default values
        const defaultUserData = {
          firstName: '',
          lastName: '',
          credits: 100,
          xp: 0,
          level: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(userDocRef, defaultUserData);
        
        setUserData({
          firstName: '',
          lastName: '',
          initials: 'U',
          credits: 100
        });
        
        console.log('Created new user document with 100 credits');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchCourseCounts = async () => {
    try {
      // Fetch enrolled courses
      const enrolledResult = await getUserEnrolledCourses();
      const enrolledCount = enrolledResult.success ? enrolledResult.courses.length : 0;
      
      // Fetch active courses (courses the user created)
      const activeCourseResult = await getUserCourses();
      const activeCount = activeCourseResult.success ? activeCourseResult.courses.length : 0;
      
      // Update the counts
      setCourseCounts({
        enrolled: enrolledCount,
        active: activeCount
      });
      
      console.log(`Dashboard updated with: ${enrolledCount} enrolled courses, ${activeCount} active courses`);
    } catch (error) {
      console.error('Error fetching course counts:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLearnSkill = () => {
    console.log('Learn Skill pressed');
    navigation.navigate('LearnSkill');
  };

  const handleTeachSkill = () => {
    console.log('Teach Skill pressed');
    navigation.navigate('CourseTypeSelection');
  };

  const handleViewAllSkills = () => {
    navigation.navigate('Profile', { initialTab: 'skills' });
  };

  const handleMoreRecommendations = () => {
    navigation.navigate('Recommendations');
  };

  const handleAddNewSkill = () => {
    navigation.navigate('SkillCategory');
  };

  // Navigation functions for stats cards
  const handleEnrolledSkillsPress = () => {
    // Navigate to profile screen with enrolled tab active
    navigation.navigate('Profile', { initialTab: 'enrolled' });
  };

  const handleActiveCoursesPress = () => {
    // Navigate to profile screen with courses tab active
    navigation.navigate('Profile', { initialTab: 'courses' });
  };

  // Functions to show gamification info popups
  const showLevelInfoModal = () => {
    Alert.alert(
      "Level System",
      "Level progression is based on XP:\n\n" +
      "• Level 1 (0-99 XP): Beginner - Bronze Badge\n" +
      "  Benefit: 100 free credits on account creation\n\n" +
      "• Level 2 (100-199 XP): Intermediate - Silver Badge\n" +
      "  Benefit: 70 bonus credits\n\n" +
      "• Level 3 (200-299 XP): Pro - Gold Badge\n" +
      "  Benefit: 100 bonus credits\n\n" +
      "• Level 4 (300-399 XP): Legendary - Titan Badge\n" +
      "  Benefit: 150 bonus credits\n\n" +
      "• Level 5 (400+ XP): Master - Diamond Badge\n" +
      "  Benefit: 200 bonus credits",
      [{ text: "Got it!" }]
    );
  };

  const showProInfoModal = () => {
    Alert.alert(
      "Beginner Status",
      "You are currently at Beginner level (Level 1: 0-99 XP).\n\n" +
      "As you progress through the system, you'll unlock:\n\n" +
      "• Level 2 (100-199 XP): Intermediate - Silver Badge\n" +
      "• Level 3 (200-299 XP): Pro - Gold Badge\n" +
      "• Level 4 (300-399 XP): Legendary - Titan Badge\n" +
      "• Level 5 (400+ XP): Master - Diamond Badge\n\n" +
      "Keep teaching and learning to earn XP and level up!",
      [{ text: "Got it!" }]
    );
  };

  const showXpInfoModal = () => {
    Alert.alert(
      "XP System",
      "How to earn XP:\n\n" +
      "• Teaching: +5 XP for each credit earned from your courses\n" +
      "• Course Completion: +10 XP for each course you complete\n" +
      "• Skill Verification: +15 XP for each skill you verify\n" +
      "• Engagement: +2 XP for each day you're active on the platform\n\n" +
      "XP drives your level progression, unlocking new badges and credit bonuses!",
      [{ text: "Got it!" }]
    );
  };

  const handleSkillLongPress = (skill) => {
    setShowSkillOptions(skill);
  };

  const handleEditSkill = (skill) => {
    Alert.alert(
      "Edit Skill",
      `Would you like to edit your ${skill} skill?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowSkillOptions(null) },
        { 
          text: "Edit", 
          onPress: () => {
            setShowSkillOptions(null);
            navigation.navigate('SkillCategory', { editingSkill: skill });
          } 
        }
      ]
    );
  };

  const handleDeleteSkill = (skill) => {
    Alert.alert(
      "Delete Skill",
      `Are you sure you want to delete your ${skill} skill?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowSkillOptions(null) },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            // Create a copy of the skills object without the deleted skill
            const updatedSkills = { ...verifiedSkills };
            delete updatedSkills[skill];
            setVerifiedSkills(updatedSkills);
            setShowSkillOptions(null);
            
            // Here you would typically also update the backend
            // updateSkillsInDatabase(updatedSkills);
          } 
        }
      ]
    );
  };

  const handleCoursePress = (course) => {
    // Navigate to course details
    navigation.navigate('CourseDetails', { courseId: course.id });
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'skill':
        return <Ionicons name="school-outline" size={12} color="#10B981" />;
      case 'social':
        return <Ionicons name="people-outline" size={12} color="#3B82F6" />;
      case 'interest':
        return <Ionicons name="heart-outline" size={12} color="#EC4899" />;
      case 'popular':
        return <Ionicons name="trending-up-outline" size={12} color="#F59E0B" />;
      default:
        return <Ionicons name="star-outline" size={12} color="#6B7280" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      <View style={styles.appBar}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>P2PSKILLX</Text>
        <View style={styles.creditsBadge}>
          <Text style={styles.creditsText}>Credits: {userData.credits}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <View style={styles.badgesContainer}>
              <TouchableOpacity style={styles.levelBadge} onPress={showLevelInfoModal}>
                <Text style={styles.levelText}>Lvl 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.proBadge, {backgroundColor: '#F59E0B'}]} onPress={showProInfoModal}>
                <View style={styles.checkCircle}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                </View>
                <Text style={styles.proText}>BEGINNER</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleLearnSkill}
            >
              <Ionicons name="school-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Learn a Skill</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleTeachSkill}
            >
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Teach a Skill</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={handleEnrolledSkillsPress}
          >
            <Text style={[styles.statNumber, {color: '#3B82F6'}]}>{courseCounts.enrolled}</Text>
            <Text style={styles.statLabel}>Enrolled Skills</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={handleActiveCoursesPress}
          >
            <Text style={[styles.statNumber, {color: '#10B981'}]}>{courseCounts.active}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={showXpInfoModal}
          >
            <Text style={[styles.statNumber, {color: '#F59E0B'}]}>0</Text>
            <Text style={[styles.statLabel, {fontSize: 10}]}>XP to Next Level</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeBanner}>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedInitial}>{userData.initials}</Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeBannerText}>
              Welcome back, {userData.firstName ? `${userData.firstName} ${userData.lastName}` : 'User'}
            </Text>
            <Text style={styles.subWelcomeText}>What would you like to do today?</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Skills</Text>
          <TouchableOpacity onPress={handleViewAllSkills}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.skillsContainer}>
          {Object.keys(verifiedSkills).length > 0 ? (
            <View style={styles.skillsRow}>
              {Object.entries(verifiedSkills).map(([skill, data], index) => (
                <TouchableOpacity 
                  key={skill} 
                  style={styles.skillCard}
                  onLongPress={() => handleSkillLongPress(skill)}
                  delayLongPress={500}
                >
                  <View style={[styles.skillColorBar, {
                    backgroundColor: index === 0 ? '#3B82F6' : 
                                   index === 1 ? '#60A5FA' : '#93C5FD'
                  }]} />
                  <Text style={styles.skillName}>{skill}</Text>
                  <Text style={styles.skillLevel}>{data.level || 'Verified'}</Text>
                  <View style={styles.verificationBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noSkillsContainer}>
              <Ionicons name="ribbon-outline" size={48} color="#CBD5E1" />
              <Text style={styles.noSkillsText}>No verified skills yet</Text>
              <TouchableOpacity 
                style={styles.addSkillButton}
                onPress={handleAddNewSkill}
              >
                <Text style={styles.addSkillButtonText}>Add Skill</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.addSkillCardBelow}
          onPress={handleAddNewSkill}
        >
          <Ionicons name="add-circle" size={32} color="#3B82F6" />
          <Text style={styles.addSkillText}>Add New Skill</Text>
        </TouchableOpacity>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <TouchableOpacity onPress={handleMoreRecommendations}>
            <Text style={styles.viewAllText}>More</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding perfect skills for you...</Text>
          </View>
        ) : recommendations.length > 0 ? (
          <View>
            {recommendations.slice(0, 3).map((course, index) => (
              <TouchableOpacity 
                key={course.id} 
                style={styles.recommendationCard}
                onPress={() => handleCoursePress(course)}
              >
                <View 
                  style={[
                    styles.recommendColorBar, 
                    {backgroundColor: 
                      course.source === 'skill' ? '#10B981' : 
                      course.source === 'social' ? '#3B82F6' : 
                      course.source === 'interest' ? '#EC4899' : '#F59E0B'
                    }
                  ]} 
                />
                <View style={styles.recommendContent}>
                  <View style={styles.recommendHeader}>
                    <View style={styles.aiBadge}>
                      {getSourceIcon(course.source)}
                      <Text style={styles.aiText}>
                        {course.source === 'skill' ? 'SKILL' : 
                         course.source === 'social' ? 'SOCIAL' : 
                         course.source === 'interest' ? 'INTEREST' : 'POPULAR'}
                      </Text>
                    </View>
                    <Text style={styles.recommendTitle}>{course.title || course.category}</Text>
                    <View style={styles.arrowCircle}>
                      <Feather name="arrow-right" size={16} color="#6B7280" />
                    </View>
                  </View>
                  <Text style={styles.recommendDetails}>
                    {course.reason || `Recommended for you • ${course.credits || 5} credits`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyRecommendationsContainer}>
            <Ionicons name="search" size={40} color="#D1D5DB" />
            <Text style={styles.emptyRecommendationsText}>
              Complete your profile to get personalized recommendations
            </Text>
            <TouchableOpacity 
              style={styles.updateProfileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.updateProfileButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Courses</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.sessionCard}>
          <View style={[styles.sessionColorBar, {backgroundColor: '#3B82F6'}]} />
          <View style={styles.sessionContent}>
            <View style={styles.sessionHeader}>
              <View style={styles.teachingBadge}>
                <Text style={styles.teachingText}>TEACHING</Text>
              </View>
              <Text style={styles.sessionTitle}>Python Basics</Text>
              <View style={styles.joinButton}>
                <Text style={styles.joinText}>JOIN</Text>
              </View>
            </View>
            <Text style={styles.sessionDetails}>Today at 3:00 PM • 45 minutes</Text>
          </View>
        </TouchableOpacity>
        
        <View style={{height: 80}} />
      </ScrollView>
      
      <BottomNavigation 
        activeScreen="Dashboard" 
        onNavigate={(screenName) => {
          navigation.navigate('Main', { screen: screenName });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  appBar: {
    height: 56,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: 'space-around',
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: 'white',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  creditsBadge: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  creditsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 16,
    marginBottom: 8,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 16,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#BFDBFE',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
  },
  levelBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  proBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  proText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '32%',
    height: 45,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  verifiedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  welcomeTextContainer: {
    marginLeft: 12,
  },
  welcomeBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  subWelcomeText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  skillsContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skillCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '31%',
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  skillName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827',
    marginTop: 4,
  },
  skillLevel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  addSkillButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 60,
    marginHorizontal: 16,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  plusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  addSkillText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    height: 75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  recommendColorBar: {
    width: 6,
    height: '100%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  recommendContent: {
    flex: 1,
    padding: 14,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 4,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  recommendDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    height: 75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  sessionColorBar: {
    width: 6,
    height: '100%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  sessionContent: {
    flex: 1,
    padding: 14,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teachingBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  teachingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  joinText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  sessionDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  verificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  skillOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  skillOptionsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  skillOptionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  skillOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyRecommendationsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyRecommendationsText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  updateProfileButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  updateProfileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noSkillsContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  noSkillsText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  addSkillCardBelow: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 60,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  addSkillButtonText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default DashboardScreen; 