import { Feather, Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../config/firebase';
import { deductCreditsForCourse, getUserCredits } from '../services/userService';
import { createCourseConversation } from '../utils/chatService';

// Mock course data for offline or when course not found
const getMockCourseData = (courseId) => {
  return {
    id: courseId,
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, and JavaScript to build beautiful, responsive websites from scratch. This comprehensive course covers everything from setting up your development environment to deploying your first website.',
    creator: 'John Doe',
    creatorId: 'user123',
    duration: '6 hours',
    enrollments: 245,
    rating: 4.8,
    level: 'Beginner',
    price: 15,
    thumbnail: 'https://via.placeholder.com/300',
    sections: [
      { title: 'Getting Started', duration: '30 min' },
      { title: 'HTML Basics', duration: '1 hour' },
      { title: 'CSS Fundamentals', duration: '1.5 hours' },
      { title: 'JavaScript Introduction', duration: '2 hours' },
      { title: 'Building Your First Website', duration: '1 hour' },
    ]
  };
};

const CourseDetailsScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    loadCourseDetails();
    loadUserCredits();
    checkEnrollmentStatus();
  }, [courseId]);

  const loadUserCredits = async () => {
    try {
      const result = await getUserCredits();
      if (result.success) {
        setUserCredits(result.credits);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      try {
        // Try to fetch the actual course data from Firestore
        const courseDocRef = doc(db, 'courses', courseId);
        const courseSnapshot = await getDoc(courseDocRef);
        
        if (courseSnapshot.exists()) {
          // If we found the course, use that data
          setCourse({
            id: courseSnapshot.id,
            ...courseSnapshot.data()
          });
        } else {
          // If course doesn't exist, use mock data
          console.log('Course not found, using mock data');
          setCourse(getMockCourseData(courseId));
        }
      } catch (error) {
        // If there's an error (like being offline), use mock data
        console.error('Error fetching course details:', error);
        setCourse(getMockCourseData(courseId));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in loadCourseDetails:', error);
      setLoading(false);
      setCourse(getMockCourseData(courseId));
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;
      
      const userDocRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if this course is in the user's enrolled courses
        const enrolledCourses = userData.enrolledCourses || [];
        setIsEnrolled(enrolledCourses.includes(courseId));
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  };

  const handleEnroll = () => {
    // Check if user has enough credits
    if (userCredits < course.price) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${course.price} credits to enroll in this course, but you only have ${userCredits} credits.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get More Credits', 
            onPress: () => {
              // Navigate to credits purchase screen (if you have one)
              // navigation.navigate('PurchaseCredits');
              Alert.alert('Feature Coming Soon', 'Credit purchasing will be available soon!');
            } 
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Enroll in Course',
      `Do you want to enroll in ${course.title} for ${course.price} credits?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enroll', 
          onPress: async () => {
            setEnrolling(true);
            
            try {
              // Deduct credits for the course
              const result = await deductCreditsForCourse(courseId, course.price);
              
              if (result.success) {
                // Update local state with new credit amount
                setUserCredits(result.currentCredits);
                
                Alert.alert(
                  'Success', 
                  `You have successfully enrolled in this course! ${course.price} credits have been deducted from your account.`
                );
                
                // Navigate to the enrolled tab in profile
                navigation.navigate('Profile', { initialTab: 'enrolled' });
              } else {
                Alert.alert(
                  'Enrollment Failed',
                  result.error || 'There was an error processing your enrollment.'
                );
              }
            } catch (error) {
              console.error('Error enrolling in course:', error);
              Alert.alert(
                'Enrollment Error',
                'An unexpected error occurred while enrolling in the course.'
              );
            } finally {
              setEnrolling(false);
            }
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleChatWithCreator = async () => {
    try {
      if (!course || !course.creatorId) {
        Alert.alert('Error', 'Cannot find course creator information.');
        return;
      }
      
      setLoadingChat(true);
      
      // Create a conversation with the course creator for this specific course
      const conversationId = await createCourseConversation(courseId, course.creatorId);
      
      // Navigate to the chat detail screen
      navigation.navigate('ChatDetail', {
        conversationId,
        otherUserName: course.creator || 'Course Creator',
        otherUserId: course.creatorId,
        courseId: courseId
      });
    } catch (error) {
      console.error('Error starting course conversation:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: course.thumbnail }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{course.level}</Text>
          </View>
        </View>

        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <View style={styles.metaData}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{course.creator}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metaText}>{course.rating} ({course.enrollments})</Text>
            </View>
          </View>

          <View style={styles.creditsInfo}>
            <Text style={styles.yourCreditsLabel}>Your Credits:</Text>
            <Text style={styles.yourCreditsValue}>{userCredits}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.description}>{course.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Course Content</Text>
          {course.sections.map((section, index) => (
            <View key={index} style={styles.sectionItem}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.sectionDetails}>
                <Text style={styles.sectionItemTitle}>{section.title}</Text>
                <Text style={styles.sectionDuration}>{section.duration}</Text>
              </View>
              <Feather name="lock" size={18} color="#9CA3AF" />
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.creatorSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Course Creator</Text>
          </View>
          
          <View style={styles.creatorInfo}>
            <View style={styles.creatorProfile}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorInitials}>
                  {course?.creator ? course.creator.substring(0, 2).toUpperCase() : 'CC'}
                </Text>
              </View>
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{course?.creator || 'Course Creator'}</Text>
                <Text style={styles.creatorBio}>Course Instructor</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.messageCreatorButton}
              onPress={handleChatWithCreator}
              disabled={loadingChat}
            >
              {loadingChat ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.messageCreatorText}>Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          {isEnrolled ? (
            <>
              <TouchableOpacity 
                style={styles.accessCourseButton}
                onPress={() => navigation.navigate('CourseAccess', { courseId })}
              >
                <Text style={styles.buttonText}>Access Course</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={handleChatWithCreator}
                disabled={loadingChat}
              >
                {loadingChat ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Chat with Instructor</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.enrollButton}
              onPress={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  Enroll Now for {course?.price || 0} Credits
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{course.price}</Text>
            <Text style={styles.credits}>Credits</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  overlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  courseInfo: {
    padding: 16,
    backgroundColor: 'white',
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  metaData: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  sectionDetails: {
    flex: 1,
  },
  sectionItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  sectionDuration: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  spacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  credits: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  enrollButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  yourCreditsLabel: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  yourCreditsValue: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  loadingButton: {
    backgroundColor: '#60A5FA',
  },
  creatorSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  
  creatorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  creatorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  creatorInitials: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  creatorDetails: {
    flex: 1,
  },
  
  creatorName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  
  creatorBio: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  messageCreatorButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  messageCreatorText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  
  accessCourseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  chatButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CourseDetailsScreen; 