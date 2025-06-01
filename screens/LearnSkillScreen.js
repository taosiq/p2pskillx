import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { auth } from '../config/firebase';
import { getAllCourses, isUserEnrolledInCourse } from '../services/courseService';

// Remove the try/catch for the deleted image and just set defaultThumbnail to null
// We'll handle fallbacks directly in the rendering code
const defaultThumbnail = null;

const LearnSkillScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  
  // Mock data for topics (categories)
  const topics = [
    { id: 1, title: 'All' },
    { id: 2, title: 'Computer Science' },
    { id: 3, title: 'Business' },
    { id: 4, title: 'Data Science' },
    { id: 5, title: 'Design' },
    { id: 6, title: 'Marketing' },
    { id: 7, title: 'Health' }
  ];
  
  // Load courses on component mount
  useEffect(() => {
    loadCourses();
    setSelectedTopic('All');
  }, []);
  
  // Filter courses when topic changes
  useEffect(() => {
    filterCoursesByTopic();
  }, [selectedTopic, courses]);
  
  const loadCourses = async () => {
    try {
      setLoading(true);
      const result = await getAllCourses();
      
      if (result.success) {
        setCourses(result.courses);
      } else {
        console.error('Error loading courses:', result.error);
        Alert.alert('Error', 'Failed to load courses. Please try again.');
      }
    } catch (error) {
      console.error('Error in loadCourses:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterCoursesByTopic = () => {
    if (!selectedTopic || selectedTopic === 'All') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => course.category === selectedTopic);
      setFilteredCourses(filtered);
    }
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
  };

  const handleCoursePress = async (course) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Sign In Required', 'Please sign in to access courses.');
        return;
      }
      
      // Check if current user is the creator
      const isCreator = course.creatorId === currentUser.uid;
      
      // Check if user is already enrolled
      const enrollmentResult = await isUserEnrolledInCourse(course.id);
      const isEnrolled = enrollmentResult.success && enrollmentResult.enrolled;
      
      // If creator or enrolled, navigate directly to course access screen
      if (isCreator || isEnrolled) {
        navigation.navigate('CourseAccess', { courseId: course.id });
      } else {
        // Ask for enrollment confirmation
        Alert.alert(
          'Enroll in Course',
          `This course costs ${course.credits} credits. Do you want to enroll?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Enroll',
              onPress: () => {
                // Navigate to CourseAccess with enrollment flag
                navigation.navigate('CourseAccess', { 
                  courseId: course.id,
                  requiresEnrollment: true,
                  credits: course.credits
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling course press:', error);
      Alert.alert('Error', 'Failed to process your request.');
    }
  };

  // SearchBar Component
  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for skills..."
        placeholderTextColor="#A0A0A0"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Topic Pill Component
  const TopicPill = ({ title, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.topicPill,
        isSelected && styles.selectedTopicPill
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.topicText,
          isSelected && styles.selectedTopicText
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Skill Card Component
  const SkillCard = ({ course, onPress }) => {
    const [isOwner, setIsOwner] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    
    useEffect(() => {
      const checkStatus = async () => {
        try {
          setCheckingStatus(true);
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            // Check if current user is owner
            setIsOwner(course.creatorId === currentUser.uid);
            
            // Check if user is enrolled
            const result = await isUserEnrolledInCourse(course.id);
            setIsEnrolled(result.success && result.enrolled);
          }
        } catch (error) {
          console.error('Error checking course status:', error);
        } finally {
          setCheckingStatus(false);
        }
      };
      
      checkStatus();
    }, [course.id]);
    
    const getButtonText = () => {
      if (isOwner) return "View";
      if (isEnrolled) return "Continue";
      return "Get Enrolled";
    };
    
    const getRandomColor = () => {
      const colors = ['#5E72E4', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    return (
      <TouchableOpacity style={styles.skillCard} onPress={() => onPress(course)}>
        <View style={[styles.skillImageContainer, { backgroundColor: (course.color || getRandomColor()) + '20' }]}>
          {course.thumbnail ? (
            <Image 
              source={{ uri: course.thumbnail }} 
              style={styles.skillImage}
              resizeMode="cover"
            />
          ) : defaultThumbnail ? (
            <Image 
              source={defaultThumbnail} 
              style={styles.skillImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.defaultImageContainer}>
              <Ionicons name="school-outline" size={40} color="#3B82F6" />
            </View>
          )}
        </View>
        <Text style={styles.skillTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <Text style={styles.skillInstructor} numberOfLines={1}>
          By {course.creatorEmail?.split('@')[0] || 'Unknown'}
        </Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{course.category}</Text>
        </View>
        <View style={styles.courseMetaRow}>
          <Text style={styles.skillRating}>★ {course.rating || '0'}</Text>
          <Text style={styles.enrollmentCount}>{course.enrollments || 0} enrolled</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.accessCourseButton, 
            isOwner && styles.viewCourseButton,
            isEnrolled && styles.continueCourseButton
          ]} 
          onPress={() => onPress(course)}
          disabled={checkingStatus}
        >
          {checkingStatus ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.accessCourseText}>{getButtonText()}</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Skills</Text>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <SearchBar />
        
        {/* Topics Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Topics</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicsScrollView}
            contentContainerStyle={styles.topicsContainer}
          >
            {topics.map((topic) => (
              <TopicPill
                key={topic.id}
                title={topic.title}
                isSelected={selectedTopic === topic.title}
                onPress={() => handleTopicSelect(topic.title)}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* New Skills Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Skills on P2PSKILLX</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : filteredCourses.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.skillsScrollView}
              contentContainerStyle={styles.skillsContainer}
            >
              {filteredCourses.map((course) => (
                <SkillCard
                  key={course.id}
                  course={course}
                  onPress={handleCoursePress}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                No courses found for this topic
              </Text>
            </View>
          )}
        </View>
        
        {/* Add padding at the bottom for the navigation bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeScreen="" 
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
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchIconContainer: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3949AB',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topicsScrollView: {
    paddingLeft: 16,
  },
  topicsContainer: {
    paddingRight: 16,
  },
  topicPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#3949AB',
    marginRight: 8,
    backgroundColor: 'white',
  },
  selectedTopicPill: {
    backgroundColor: '#EBF2FF',
  },
  topicText: {
    color: '#3949AB',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTopicText: {
    fontWeight: '700',
  },
  skillsScrollView: {
    paddingLeft: 16,
  },
  skillsContainer: {
    paddingRight: 16,
  },
  skillCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 0,
  },
  skillImageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    overflow: 'hidden',
  },
  skillImage: {
    width: '100%',
    height: '100%',
  },
  categoryContainer: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  skillInstructor: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  courseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  skillRating: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  enrollmentCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  accessCourseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
    margin: 8,
    marginTop: 4,
  },
  viewCourseButton: {
    backgroundColor: '#059669', // Green for view button
  },
  continueCourseButton: {
    backgroundColor: '#F59E0B', // Amber for continue button
  },
  accessCourseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  defaultImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
  },
});

export default LearnSkillScreen; 