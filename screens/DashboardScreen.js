import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebase';

const DashboardScreen = () => {
  const navigation = useNavigation();

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* App Bar */}
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
          <Text style={styles.creditsText}>Credits: 80</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Dashboard Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <View style={styles.badgesContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl 4</Text>
            </View>
            <View style={styles.proBadge}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#7C3AED" />
              </View>
              <Text style={styles.proText}>Pro</Text>
            </View>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#3B82F6'}]}>2</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#10B981'}]}>3</Text>
            <Text style={styles.statLabel}>Active Exchanges</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, {color: '#F59E0B'}]}>15</Text>
            <Text style={[styles.statLabel, {fontSize: 10}]}>XP to Next Level</Text>
          </View>
        </View>
        
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.verifiedBadge}>
            <View style={styles.verifiedCheckCircle}>
              <Ionicons name="checkmark" size={10} color="#7C3AED" />
            </View>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
          
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>J</Text>
          </View>
          
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back, John!</Text>
            <Text style={styles.subWelcomeText}>Ready to exchange skills today?</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.teachButton}>
            <Text style={styles.buttonText}>Teach a Skill</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.learnButton}>
            <Text style={styles.buttonText}>Learn a Skill</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        {/* Your Skills Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Skills</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Skills Cards */}
        <View style={styles.skillsContainer}>
          <View style={styles.skillCard}>
            <View style={[styles.skillColorBar, {backgroundColor: '#3B82F6'}]} />
            <Text style={styles.skillName}>Python</Text>
            <Text style={styles.skillLevel}>Advanced</Text>
          </View>
          
          <View style={styles.skillCard}>
            <View style={[styles.skillColorBar, {backgroundColor: '#60A5FA'}]} />
            <Text style={styles.skillName}>UI Design</Text>
            <Text style={styles.skillLevel}>Intermediate</Text>
          </View>
          
          <View style={styles.skillCard}>
            <View style={[styles.skillColorBar, {backgroundColor: '#93C5FD'}]} />
            <Text style={styles.skillName}>JavaScript</Text>
            <Text style={styles.skillLevel}>Beginner</Text>
          </View>
        </View>
        
        {/* Add New Skill Button */}
        <TouchableOpacity style={styles.addSkillButton}>
          <View style={styles.plusCircle}>
            <Text style={styles.plusText}>+</Text>
          </View>
          <Text style={styles.addSkillText}>Add New Skill</Text>
        </TouchableOpacity>
        
        {/* Recommended Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>More</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recommendation Card */}
        <TouchableOpacity style={styles.recommendationCard}>
          <View style={[styles.recommendColorBar, {backgroundColor: '#10B981'}]} />
          <View style={styles.recommendContent}>
            <View style={styles.recommendHeader}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI</Text>
              </View>
              <Text style={styles.recommendTitle}>Data Science</Text>
              <View style={styles.arrowCircle}>
                <Feather name="arrow-right" size={16} color="#6B7280" />
              </View>
            </View>
            <Text style={styles.recommendDetails}>Based on your Python skills • 5 credits</Text>
          </View>
        </TouchableOpacity>
        
        {/* Active Exchanges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Exchanges</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Teaching Session Card */}
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
        
        {/* Add some space at the bottom */}
        <View style={{height: 80}} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color="#3B82F6" />
          <Text style={[styles.navText, {color: '#3B82F6'}]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </View>
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 15,
    borderColor: '#BFDBFE',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedCheckCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  verifiedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  welcomeTextContainer: {
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  subWelcomeText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  teachButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(37, 99, 235, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  learnButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 16,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(16, 185, 129, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginTop: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
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
  },
  aiText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
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
  bottomNavigation: {
    height: 60,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default DashboardScreen; 