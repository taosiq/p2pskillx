import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const UserManualScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Define manual sections
  const manualSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket-outline',
      content: [
        { 
          title: 'Download and Installation',
          text: 'Download and install the P2PSkillX app from your device\'s app store.',
          image: null
        },
        { 
          title: 'Account Creation',
          text: 'Create an account or log in with existing credentials using your email and password.',
          image: null 
        },
        { 
          title: 'Profile Setup',
          text: 'Complete your profile information including a profile picture, bio, and your skills and expertise.',
          image: null 
        },
        { 
          title: 'Dashboard Navigation',
          text: 'Navigate the dashboard to discover available courses and connect with other users.',
          image: null 
        }
      ]
    },
    {
      id: 'managing-skills',
      title: 'Managing Your Skills',
      icon: 'ribbon-outline',
      content: [
        { 
          title: 'Adding Skills',
          text: 'Access the "Skills" tab from your profile and select "Add New Skill" to add skills to your profile.',
          image: null 
        },
        { 
          title: 'Skill Verification',
          text: 'Complete the verification process for each skill by providing evidence of proficiency through our verification test.',
          image: null 
        },
        { 
          title: 'Viewing Verified Skills',
          text: 'Your verified skills will be displayed on your profile with verification badges.',
          image: null 
        },
        { 
          title: 'Using Skills',
          text: 'Use your verified skills to create and teach courses on the platform.',
          image: null 
        }
      ]
    },
    {
      id: 'course-creation',
      title: 'Creating & Teaching Courses',
      icon: 'create-outline',
      content: [
        { 
          title: 'Starting Course Creation',
          text: 'Navigate to "Teach a Skill" from the dashboard to begin creating a new course.',
          image: null 
        },
        { 
          title: 'Course Type Selection',
          text: 'Select the course type (live session, pre-recorded, text-based) that best fits your teaching style.',
          image: null 
        },
        { 
          title: 'Skill Selection',
          text: 'Choose which of your verified skills this course will teach from the available options.',
          image: null 
        },
        { 
          title: 'Course Details',
          text: 'Fill in course details including title, description, and pricing (in credits).',
          image: null 
        },
        { 
          title: 'Adding Content',
          text: 'Add course sections, materials, and content as needed to create a comprehensive learning experience.',
          image: null 
        },
        { 
          title: 'Publishing',
          text: 'Publish your course for others to discover and enroll in once you\'ve completed the setup.',
          image: null 
        }
      ]
    },
    {
      id: 'finding-courses',
      title: 'Finding & Enrolling in Courses',
      icon: 'school-outline',
      content: [
        { 
          title: 'Browsing Courses',
          text: 'Browse recommended courses on your dashboard or use the search feature.',
          image: null 
        },
        { 
          title: 'Filtering Courses',
          text: 'Use search filters to find courses by skill, level, or instructor.',
          image: null 
        },
        { 
          title: 'Course Details',
          text: 'View course details including instructor ratings and student reviews before enrolling.',
          image: null 
        },
        { 
          title: 'Enrollment',
          text: 'Purchase courses using available credits from your account.',
          image: null 
        },
        { 
          title: 'Accessing Courses',
          text: 'Access enrolled courses from your profile\'s "Enrolled" tab.',
          image: null 
        },
        { 
          title: 'Tracking Progress',
          text: 'Track your progress through each course with the built-in progress system.',
          image: null 
        }
      ]
    },
    {
      id: 'social-features',
      title: 'Social Features',
      icon: 'people-outline',
      content: [
        { 
          title: 'Discovering Users',
          text: 'Discover other users through the search function or recommendations.',
          image: null 
        },
        { 
          title: 'Viewing Profiles',
          text: 'View user profiles to see their verified skills and courses.',
          image: null 
        },
        { 
          title: 'Following',
          text: 'Follow users to stay updated on their new courses and activities.',
          image: null 
        },
        { 
          title: 'Creating Posts',
          text: 'Create posts to share your learning journey or teaching insights.',
          image: null 
        },
        { 
          title: 'Engagement',
          text: 'Engage with the community through likes and comments on posts.',
          image: null 
        }
      ]
    },
    {
      id: 'credits-system',
      title: 'Credits System',
      icon: 'cash-outline',
      content: [
        { 
          title: 'Understanding Credits',
          text: 'Credits are the platform\'s currency for purchasing courses.',
          image: null 
        },
        { 
          title: 'Earning Credits',
          text: 'Earn credits by teaching courses to other users.',
          image: null 
        },
        { 
          title: 'Purchasing Credits',
          text: 'Purchase additional credits through the in-app store if needed.',
          image: null 
        },
        { 
          title: 'Tracking Balance',
          text: 'Track your credit balance on your dashboard or profile.',
          image: null 
        },
        { 
          title: 'Withdrawing Credits',
          text: 'Credits earned from teaching can be withdrawn after verification.',
          image: null 
        }
      ]
    }
  ];

  // Section component
  const ManualSection = ({ section }) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.id)}
      >
        <View style={styles.sectionTitleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name={section.icon} size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Ionicons
          name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#3B82F6"
        />
      </TouchableOpacity>
      
      {expandedSection === section.id && (
        <View style={styles.contentContainer}>
          {section.content.map((item, index) => (
            <View key={index} style={styles.contentItem}>
              <View style={styles.contentHeader}>
                <View style={styles.bulletPoint} />
                <Text style={styles.contentTitle}>{item.title}</Text>
              </View>
              <Text style={styles.contentText}>{item.text}</Text>
              {item.image && (
                <Image source={item.image} style={styles.contentImage} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Manual</Text>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <View style={styles.introHeader}>
            <Ionicons name="book-outline" size={32} color="#3B82F6" />
            <Text style={styles.introTitle}>P2PSkillX User Manual</Text>
          </View>
          <Text style={styles.introText}>
            This comprehensive guide will help you navigate and make the most of the P2PSkillX platform.
            Follow the instructions below to learn how to use all the features available to you.
          </Text>
        </View>
        
        {/* Manual Sections */}
        {manualSections.map((section) => (
          <ManualSection key={section.id} section={section} />
        ))}
        
        {/* Additional Help */}
        <View style={styles.additionalHelpContainer}>
          <Text style={styles.additionalHelpTitle}>Need More Help?</Text>
          <Text style={styles.additionalHelpText}>
            If you have any questions or need assistance, please contact our support team via email at
            tosiqbrave3@gmail.com or through the Help section in the app.
          </Text>
        </View>
        
        {/* Bottom padding for scrolling */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  introContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 10,
  },
  introText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  contentContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  contentItem: {
    marginBottom: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  contentText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginLeft: 16,
  },
  contentImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
    marginLeft: 16,
  },
  additionalHelpContainer: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  additionalHelpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  additionalHelpText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});

export default UserManualScreen; 