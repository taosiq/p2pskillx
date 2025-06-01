import { Feather, Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../config/firebase';
import { getCourseById, isUserEnrolledInCourse } from '../services/courseService';
import { deductCreditsForCourse } from '../services/userService';

const { width } = Dimensions.get('window');

const CourseAccessScreen = ({ navigation }) => {
  const route = useRoute();
  const { courseId, requiresEnrollment, credits } = route.params;
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [processingEnrollment, setProcessingEnrollment] = useState(false);

  // Animation values
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  // Check if enrollment is required
  useEffect(() => {
    if (requiresEnrollment && course && !isEnrolled && !isOwner) {
      handleEnrollment();
    }
  }, [course, isEnrolled, isOwner, requiresEnrollment]);
  
  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      const result = await getCourseById(courseId);
      
      if (result.success) {
        setCourse(result.course);
        
        // Auto-expand first section
        if (result.course?.sections?.length > 0) {
          setExpandedSection(result.course.sections[0].id);
        }
        
        // Check if current user is the owner
        const currentUser = auth.currentUser;
        if (currentUser && result.course.creatorId === currentUser.uid) {
          setIsOwner(true);
        }
        
        // Check if user is already enrolled
        const enrollmentResult = await isUserEnrolledInCourse(courseId);
        if (enrollmentResult.success && enrollmentResult.enrolled) {
          setIsEnrolled(true);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to load course');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleEnrollment = async () => {
    try {
      setProcessingEnrollment(true);
      
      // Get current user credits to display in confirmation dialog
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to enroll in a course');
        setProcessingEnrollment(false);
      return;
    }
    
      // Double check course credits
      const courseCredits = course?.credits || credits;
      
      if (!courseCredits) {
        Alert.alert('Error', 'Could not determine course credit requirement');
        setProcessingEnrollment(false);
      return;
    }
    
      // Get user's current credits
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        Alert.alert('Error', 'User profile not found');
        setProcessingEnrollment(false);
        return;
      }
      
      const userData = userDoc.data();
      const userCredits = userData.credits || 0;
      
      // Log for debugging
      console.log(`User has ${userCredits} credits, course requires ${courseCredits} credits`);
      
      // Check if user has enough credits before even asking for confirmation
      if (userCredits < courseCredits) {
        Alert.alert(
          'Insufficient Credits',
          `This course requires ${courseCredits} credits but you only have ${userCredits} credits. Please earn more credits to enroll.`,
          [{ text: 'OK' }]
        );
        setProcessingEnrollment(false);
        return;
      }
      
      // Ask for confirmation
      Alert.alert(
        'Confirm Enrollment',
        `This will deduct ${courseCredits} credits from your account. You currently have ${userCredits} credits. Do you want to continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setProcessingEnrollment(false)
          },
          {
            text: 'Yes, Enroll Me',
            onPress: async () => {
              // Proceed with credit deduction and enrollment
              try {
                // Deduct credits and enroll user
                const result = await deductCreditsForCourse(courseId, courseCredits);
                console.log('Enrollment result:', result); // Debug log
                
                if (result.success) {
                  if (result.alreadyEnrolled) {
                    Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
                  } else {
                    // Show success message with updated credits
                    Alert.alert(
                      'Enrollment Successful', 
                      `You have successfully enrolled in this course! ${courseCredits} credits have been deducted from your account. You now have ${result.currentCredits} credits remaining.`,
                      [
                        { 
                          text: 'OK',
                          onPress: () => {
                            // Update global app state or refresh other screens if needed
                            // For example, you could use a context or redux to update the credit display
                            // across the app without requiring a full reload
                          }
                        }
                      ]
                    );
                  }
                  
                  setIsEnrolled(true);
                } else {
                  Alert.alert('Enrollment Failed', result.error || 'Not enough credits to enroll in this course.');
                }
              } catch (error) {
                console.error('Error enrolling in course:', error);
                Alert.alert('Error', 'Failed to enroll in course');
              } finally {
                setProcessingEnrollment(false);
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error initiating enrollment:', error);
      Alert.alert('Error', 'Failed to initiate enrollment process');
      setProcessingEnrollment(false);
    }
  };
  
  const toggleSection = (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  const openLink = async (url) => {
    if (!url) {
      Alert.alert('Invalid Link', 'This link is not available.');
      return;
    }
    
    // Check if the URL has a valid scheme
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }
    
    try {
      const supported = await Linking.canOpenURL(finalUrl);
      
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Error', `Cannot open URL: ${finalUrl}`);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };
  
  // Render a blurred section preview for non-enrolled users
  const renderBlurredSection = (section, index) => (
    <View key={section.id} style={styles.sectionContainer}>
      <View style={styles.sectionHeaderButton}>
        <View style={styles.sectionIndex}>
          <Text style={styles.sectionIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      <View style={styles.blurredContent}>
        <Text style={styles.blurredText}>This content is locked</Text>
        <Ionicons name="lock-closed" size={24} color="#CBD5E1" />
      </View>
    </View>
  );

  if (loading || processingEnrollment) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {processingEnrollment ? 'Processing enrollment...' : 'Loading course content...'}
        </Text>
      </SafeAreaView>
    );
  }
  
  if (!course) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Animated.Text 
            numberOfLines={1} 
            style={styles.headerTitle}
          >
            {course.title}
          </Animated.Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>
      
      <ScrollView 
        style={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.courseInfoCard}>
          <View style={styles.courseInfoHeader}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.courseMeta}>
              <View style={styles.skillBadge}>
                <Text style={styles.skillText}>{course.skill}</Text>
              </View>
              <Text style={styles.creditsText}>{course.credits} credits</Text>
            </View>
            
            {!isOwner && !isEnrolled && (
            <TouchableOpacity 
                style={styles.enrollButton}
                onPress={handleEnrollment}
            >
                <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </TouchableOpacity>
            )}
            
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>You created this course</Text>
              </View>
            )}
          </View>
          
          {course.thumbnail ? (
            <Image
              source={{ uri: course.thumbnail }}
              style={styles.courseThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.defaultThumbnailContainer}>
              <Ionicons name="school-outline" size={60} color="#3B82F6" />
            </View>
          )}
          
          <Text style={styles.courseDescription}>{course.description}</Text>
          
          <View style={styles.courseStats}>
            {/* First row with students and ratings */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="person" size={18} color="#6B7280" />
                <Text style={styles.statText}>{course.enrollments || 0} students</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={styles.statText}>{course.rating || 'No ratings'}</Text>
        </View>
            </View>
            
            {/* Created date - full width row */}
            <View style={styles.statRowSeparator} />
            <View style={styles.statRowFullWidth}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.statText}>Created {new Date(course.createdAt).toLocaleDateString()}</Text>
            </View>
            
            {/* Category - separate full width row */}
            <View style={styles.statRowSeparator} />
            <View style={styles.statRowFullWidth}>
              <Ionicons name="bookmark-outline" size={18} color="#6B7280" />
              <Text style={styles.statText}>Category: {course.category || 'General'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Course Content</Text>
        </View>
        
        {course.sections?.length > 0 ? (
          // If user is enrolled or owner, show full content, otherwise show blurred preview
          isEnrolled || isOwner ? (
            course.sections.map((section, index) => (
              <View key={section.id} style={styles.sectionContainer}>
                <TouchableOpacity
                  style={styles.sectionHeaderButton}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.sectionIndex}>
                    <Text style={styles.sectionIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Ionicons
                    name={expandedSection === section.id ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>
                
                {expandedSection === section.id && (
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionDescription}>{section.description}</Text>
                    
                    {section.videoLink && (
                      <TouchableOpacity
                        style={styles.resourceLink}
                        onPress={() => openLink(section.videoLink)}
                      >
                        <Ionicons name="videocam" size={20} color="#3B82F6" />
                        <Text style={styles.resourceLinkText}>Watch Video</Text>
                        <Feather name="external-link" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    )}
                    
                    {section.documentLink && (
                      <TouchableOpacity
                        style={styles.resourceLink}
                        onPress={() => openLink(section.documentLink)}
                      >
                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                        <Text style={styles.resourceLinkText}>View Document</Text>
                        <Feather name="external-link" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    )}
                    
                    {section.files && section.files.length > 0 && (
                      <View style={styles.filesContainer}>
                        <Text style={styles.filesHeader}>Attached Files</Text>
                        
                        {section.files.map(file => (
                          <View key={file.id} style={styles.fileItem}>
                            {file.type === 'image' && file.base64 && (
                              <Image
                                source={{ uri: file.base64 }}
                                style={styles.fileImage}
                                resizeMode="contain"
                              />
                            )}
                            <Text style={styles.fileName}>{file.name}</Text>
                          </View>
                        ))}
                </View>
                    )}
                  </View>
                )}
              </View>
            ))
          ) : (
            // Show blurred content for non-enrolled users
            <>
              <View style={styles.lockedMessageContainer}>
                <Ionicons name="lock-closed" size={32} color="#3B82F6" />
                <Text style={styles.lockedMessageTitle}>Course Content Locked</Text>
                <Text style={styles.lockedMessageText}>
                  Enroll in this course to access all the content and materials.
                </Text>
                <TouchableOpacity 
                  style={styles.enrollButtonLarge}
                  onPress={handleEnrollment}
                >
                  <Text style={styles.enrollButtonText}>
                    Enroll for {course.credits} Credits
                  </Text>
                </TouchableOpacity>
            </View>
              
              {course.sections.slice(0, 2).map((section, index) => (
                renderBlurredSection(section, index)
              ))}
            </>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No content available</Text>
        </View>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#3B82F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    paddingTop: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  courseInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseInfoHeader: {
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  courseThumbnail: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    marginBottom: 16,
  },
  courseDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  courseStats: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statRowFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statRowSeparator: {
    height: 8,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIndexText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resourceLinkText: {
    flex: 1,
    marginLeft: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filesContainer: {
    marginTop: 16,
  },
  filesHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    overflow: 'hidden',
  },
  fileImage: {
    width: 60,
    height: 60,
  },
  fileName: {
    padding: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ownerBadgeText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
  },
  enrollButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  enrollButtonLarge: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 16,
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  lockedMessageContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  lockedMessageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 8,
  },
  lockedMessageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  blurredContent: {
    height: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  blurredText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  defaultThumbnailContainer: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CourseAccessScreen; 