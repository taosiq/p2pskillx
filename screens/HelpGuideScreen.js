import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const HelpGuideScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // FAQ data
  const faqSections = [
    {
      id: 'onboarding',
      title: 'Getting Started',
      icon: 'rocket-outline',
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'To create an account, tap on "Sign Up" on the login screen. Enter your email address, create a password, and verify your account through the email sent to you.'
        },
        {
          question: 'How do I reset my password?',
          answer: 'On the login screen, tap "Forgot Password" and enter your email address. You will receive an email with instructions to reset your password.'
        },
        {
          question: 'Is my personal information secure?',
          answer: 'Yes, we use industry-standard encryption and security measures to protect your data. For more information, please review our Privacy Policy.'
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      icon: 'person-outline',
      questions: [
        {
          question: 'How do I add skills to my profile?',
          answer: 'Go to your Profile page and tap "Add Skills". You can then search for skills and add them to your profile after verification.'
        },
        {
          question: 'How does skill verification work?',
          answer: 'Our app uses AI-generated multiple-choice questions to verify your knowledge in a specific skill. You need to answer a series of questions correctly to add the skill to your profile.'
        },
        {
          question: 'How do I edit my profile information?',
          answer: 'Go to your Profile page and tap the "Edit" button. You can update your profile picture, bio, contact information, and other details.'
        }
      ]
    },
    {
      id: 'features',
      title: 'Features & Navigation',
      icon: 'apps-outline',
      questions: [
        {
          question: 'How do I find people with specific skills?',
          answer: 'Use the Search function on the Home screen to look for specific skills. You can filter results based on skill level, location, and availability.'
        },
        {
          question: 'How do I message another user?',
          answer: 'Navigate to their profile and tap the "Message" button, or find them in the Users list and tap the message icon.'
        },
        {
          question: 'How do I learn new skills?',
          answer: 'Go to the "Learn Skills" section from the Dashboard. Browse available courses or use the search function to find specific skills you want to learn.'
        }
      ]
    },
    {
      id: 'credits',
      title: 'Credits System',
      icon: 'cash-outline',
      questions: [
        {
          question: 'What are credits and how do they work?',
          answer: 'Credits are the in-app currency used for skill exchanges. You earn credits by teaching others and spend credits when learning from others.'
        },
        {
          question: 'How do I earn more credits?',
          answer: 'You can earn credits by teaching skills to other users, completing verification for your skills, or participating in community challenges.'
        },
        {
          question: 'How many credits do I need to learn a skill?',
          answer: 'The credit cost varies depending on the skill complexity and duration. Most basic skills cost 1-3 credits, while advanced skills may cost 5-10 credits.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: 'help-buoy-outline',
      questions: [
        {
          question: 'The app is running slowly. What can I do?',
          answer: 'Try clearing the app cache, ensuring you have a stable internet connection, and closing other apps running in the background. If problems persist, try uninstalling and reinstalling the app.'
        },
        {
          question: 'Why am I not receiving notifications?',
          answer: 'Check your device notification settings and ensure P2PSkillX has permission to send notifications. Also verify your in-app notification settings are enabled.'
        },
        {
          question: 'How do I report inappropriate content or users?',
          answer: 'On any user profile or content, tap the three dots in the top-right corner and select "Report". Fill out the form explaining the issue and submit it for review.'
        }
      ]
    }
  ];

  // FAQ section component
  const FaqSection = ({ section }) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.id)}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={section.icon} size={22} color="#3B82F6" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Ionicons
          name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#3B82F6"
        />
      </TouchableOpacity>
      
      {expandedSection === section.id && (
        <View style={styles.questionsContainer}>
          {section.questions.map((item, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
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
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Guide & FAQs</Text>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Welcome to P2PSkillX</Text>
          <Text style={styles.introText}>
            Your comprehensive platform for peer-to-peer skill exchange. This guide will help you navigate the app and answer common questions.
          </Text>
        </View>
        
        {/* FAQ Sections */}
        {faqSections.map((section) => (
          <FaqSection key={section.id} section={section} />
        ))}
        
        {/* Additional Help */}
        <View style={styles.additionalHelpContainer}>
          <Text style={styles.additionalHelpTitle}>Need More Help?</Text>
          <Text style={styles.additionalHelpText}>
            If you couldn't find the answer to your question, feel free to contact our support team at tosiqbrave3@gmail.com.
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
    backgroundColor: '#F8F9FA',
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
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  questionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  questionContainer: {
    marginBottom: 16,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  answer: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  additionalHelpContainer: {
    padding: 16,
    backgroundColor: '#EBF2FF',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 8,
  },
  additionalHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
  },
  additionalHelpText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
});

export default HelpGuideScreen; 