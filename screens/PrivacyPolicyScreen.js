import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleBackPress = () => {
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.lastUpdated}>Last Updated: June 15, 2023</Text>
          
          <Text style={styles.sectionTitle}>1. INTRODUCTION</Text>
          <Text style={styles.paragraph}>
            Welcome to P2PSkillX. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you use our application and tell you about your privacy rights and how the law protects you.
          </Text>

          <Text style={styles.sectionTitle}>2. DATA WE COLLECT</Text>
          <Text style={styles.paragraph}>
            We collect and process the following information:
          </Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Personal identification information (name, email address, phone number)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Profile information (skills, bio, profile picture)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Communication data (messages sent to other users)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Technical data (device information, IP address, location data, login information)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Usage data (information about how you use our application)</Text></Text>
          </View>

          <Text style={styles.sectionTitle}>3. HOW WE USE YOUR DATA</Text>
          <Text style={styles.paragraph}>
            We use your personal information for the following purposes:
          </Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To create and manage your account</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To provide the peer-to-peer skill exchange service</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To facilitate communication between users</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To verify skills through our assessment system</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To improve our application and services</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To process transactions (credits system)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>To send notifications about your account or activity</Text></Text>
          </View>

          <Text style={styles.sectionTitle}>4. DATA SHARING AND DISCLOSURE</Text>
          <Text style={styles.paragraph}>
            We may share your personal information with:
          </Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Other users (limited to what is necessary for the platform's functionality)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Service providers (for hosting, analytics, payment processing)</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Legal authorities (when required by law or to protect our rights)</Text></Text>
          </View>
          <Text style={styles.paragraph}>
            We will not sell your personal data to third parties.
          </Text>

          <Text style={styles.sectionTitle}>5. DATA SECURITY</Text>
          <Text style={styles.paragraph}>
            We have implemented appropriate security measures to protect your personal information from accidental loss, unauthorized access, alteration, and disclosure. We use industry-standard encryption for data transmission and secure storage methods for data at rest.
          </Text>
          <Text style={styles.paragraph}>
            While we take reasonable steps to protect your data, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
          </Text>

          <Text style={styles.sectionTitle}>6. DATA RETENTION</Text>
          <Text style={styles.paragraph}>
            We will retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including to satisfy any legal, accounting, or reporting requirements.
          </Text>
          <Text style={styles.paragraph}>
            In some circumstances, we may anonymize your personal data so that it can no longer be associated with you, in which case we may use such information without further notice to you.
          </Text>

          <Text style={styles.sectionTitle}>7. YOUR PRIVACY RIGHTS</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have the following rights regarding your personal data:
          </Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to access and receive a copy of your personal data</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to correct inaccurate or incomplete data</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to erasure (the "right to be forgotten")</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to restrict processing</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to data portability</Text></Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bulletPointText}>Right to object to processing of your data</Text></Text>
          </View>
          <Text style={styles.paragraph}>
            To exercise any of these rights, please contact us using the details provided in the "Contact Us" section.
          </Text>

          <Text style={styles.sectionTitle}>8. THIRD-PARTY SERVICES</Text>
          <Text style={styles.paragraph}>
            Our application may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party services and are not responsible for their privacy statements. We encourage you to read the privacy policy of every website you visit or service you use.
          </Text>

          <Text style={styles.sectionTitle}>9. CHILDREN'S PRIVACY</Text>
          <Text style={styles.paragraph}>
            Our service is not intended for individuals under the age of 16, and we do not knowingly collect personal information from children under 16. If we become aware that we have collected personal data from children without verification of parental consent, we take steps to remove that information from our servers.
          </Text>

          <Text style={styles.sectionTitle}>10. CHANGES TO THE PRIVACY POLICY</Text>
          <Text style={styles.paragraph}>
            We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this policy.
          </Text>
          <Text style={styles.paragraph}>
            You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.
          </Text>

          <Text style={styles.sectionTitle}>11. CONTACT US</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Email: tosiqbrave3@gmail.com{'\n'}
            Address: Attar Hostel Nust H-12
          </Text>
        </View>
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
  contentContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPointContainer: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 6,
  },
  bulletPointText: {
    fontSize: 14,
    color: '#4B5563',
  },
  contactInfo: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 8,
    marginLeft: 8,
  },
});

export default PrivacyPolicyScreen; 