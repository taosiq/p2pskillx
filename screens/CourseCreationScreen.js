import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { createCourse, fileToBase64, uploadCourseThumbnail } from '../services/courseService';
import { getVerifiedSkills } from '../services/skillService';

const CourseCreationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params || {};
  
  const [verifiedSkills, setVerifiedSkills] = useState({});
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseSections, setCourseSections] = useState([
    { id: Date.now().toString(), title: '', description: '', files: [], videoLink: '', documentLink: '' }
  ]);
  const [courseThumbnail, setCourseThumbnail] = useState(null);
  const [credits, setCredits] = useState(5); // Default credits value
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  
  // Load verified skills when component mounts
  useEffect(() => {
    loadVerifiedSkills();
  }, []);
  
  const loadVerifiedSkills = async () => {
    try {
      setLoadingSkills(true);
      // Try to load user's verified skills from the skill service
      const skillsResult = await getVerifiedSkills();
      
      if (skillsResult.success && Object.keys(skillsResult.skills).length > 0) {
        setVerifiedSkills(skillsResult.skills);
        // Select the first skill by default
        setSelectedSkills([Object.keys(skillsResult.skills)[0]]);
        setLoadingSkills(false);
        return;
      }
      
      // Fallback to user document if skill service fails
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userSkills = userData.verifiedSkills || {};
          
          if (Object.keys(userSkills).length > 0) {
            setVerifiedSkills(userSkills);
            setSelectedSkills([Object.keys(userSkills)[0]]);
            setLoadingSkills(false);
            return;
          }
        }
      }
      
      // Fall back to demo skills if no verified skills found
      const demoSkills = {
        "JavaScript": { verified: true, level: "Advanced" },
        "Python": { verified: true, level: "Intermediate" },
        "Web Development": { verified: true, level: "Expert" },
        "Data Science": { verified: true, level: "Beginner" },
        "Machine Learning": { verified: true, level: "Intermediate" }
      };
      
      setVerifiedSkills(demoSkills);
      
      // If a category was selected, filter skills by that category
      if (category) {
        const categorySkills = Object.keys(demoSkills).filter(skill => 
          category.skills && category.skills.includes(skill)
        );
        
        if (categorySkills.length > 0) {
          setSelectedSkills([categorySkills[0]]);
        }
      } else if (Object.keys(demoSkills).length > 0) {
        // If no category selected, just use the first skill
        setSelectedSkills([Object.keys(demoSkills)[0]]);
      }
    } catch (error) {
      console.log('Error loading skills, using demo skills', error);
      // Fallback to basic skills if anything fails
      const fallbackSkills = {
        "JavaScript": { verified: true, level: "Advanced" },
        "Python": { verified: true, level: "Intermediate" }
      };
      setVerifiedSkills(fallbackSkills);
      setSelectedSkills(["JavaScript"]);
    } finally {
      setLoadingSkills(false);
    }
  };
  
  const handleSkillToggle = (skill) => {
    setSelectedSkills(prevSelectedSkills => {
      // Check if this skill is already selected
      if (prevSelectedSkills.includes(skill)) {
        // Don't allow deselecting the last skill
        if (prevSelectedSkills.length === 1) {
          return prevSelectedSkills;
        }
        // Remove this skill
        return prevSelectedSkills.filter(s => s !== skill);
      } else {
        // Add this skill
        return [...prevSelectedSkills, skill];
      }
    });
  };
  
  const handleAddSection = () => {
    const newId = Date.now().toString();
      
    setCourseSections([
      ...courseSections, 
      { id: newId, title: '', description: '', files: [], videoLink: '', documentLink: '' }
    ]);
  };
  
  const handleRemoveSection = (id) => {
    if (courseSections.length <= 1) {
      Alert.alert('Cannot Remove', 'You need at least one section in your course.');
      return;
    }
    
    setCourseSections(courseSections.filter(section => section.id !== id));
  };
  
  const updateSectionField = (id, field, value) => {
    setCourseSections(courseSections.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };
  
  const pickThumbnailImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your photos to upload a thumbnail.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setCourseThumbnail(result.assets[0].uri);
    }
  };
  
  const addFileToSection = async (sectionId) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow access to your files to upload content.');
      return;
    }
    
    // Show file type selection options
    Alert.alert(
      'Add Content',
      'What type of content would you like to add?',
      [
        {
          text: 'Image',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            
            if (!result.canceled) {
              try {
                // Convert to base64
                const fileResult = await fileToBase64(result.assets[0].uri);
                
                if (fileResult.success) {
                  const newFile = {
                    id: Date.now().toString(),
                    base64: fileResult.base64File,
                    type: 'image',
                    name: result.assets[0].fileName || `Image-${Date.now()}`,
                  };
                  
                  setCourseSections(courseSections.map(section => 
                    section.id === sectionId 
                      ? { ...section, files: [...section.files, newFile] } 
                      : section
                  ));
                } else {
                  Alert.alert('Error', 'Failed to process the image file.');
                }
              } catch (error) {
                console.error('Error adding image file:', error);
                Alert.alert('Error', 'Failed to add the image file.');
              }
            }
          }
        },
        {
          text: 'Document/PDF',
          onPress: async () => {
            Alert.alert('Feature Coming Soon', 'We are working on adding support for document files.');
            // In the future, we would implement document uploading with base64 encoding
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };
  
  const removeFileFromSection = (sectionId, fileId) => {
    setCourseSections(courseSections.map(section => 
      section.id === sectionId 
        ? { ...section, files: section.files.filter(file => file.id !== fileId) } 
        : section
    ));
  };
  
  const validateCourse = () => {
    if (!courseTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter a course title.');
      return false;
    }
    
    if (!courseDescription.trim()) {
      Alert.alert('Missing Information', 'Please enter a course description.');
      return false;
    }
    
    if (selectedSkills.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one skill.');
      return false;
    }
    
    if (credits < 5) {
      Alert.alert('Invalid Credits', 'Course credits must be at least 5.');
      return false;
    }
    
    // Check if at least one section has a title
    const hasSectionTitle = courseSections.some(section => section.title.trim() !== '');
    if (!hasSectionTitle) {
      Alert.alert('Missing Information', 'Please add at least one section title.');
      return false;
    }
    
    return true;
  };
  
  const handleCreateCourse = async () => {
    if (!validateCourse()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format the course data
      const courseData = {
        title: courseTitle,
        description: courseDescription,
        skills: selectedSkills,
        sections: courseSections.map(section => ({
          title: section.title,
          description: section.description,
          videoLink: section.videoLink,
          documentLink: section.documentLink,
          files: section.files
        })),
        credits: parseInt(credits),
        category: category?.name || 'General'
      };
      
      // Upload thumbnail if available
      if (courseThumbnail) {
        const thumbnailResult = await uploadCourseThumbnail(courseThumbnail);
        
        if (thumbnailResult.success) {
          courseData.thumbnail = thumbnailResult.imageUrl;
        } else {
          console.error('Failed to upload thumbnail:', thumbnailResult.error);
          // Continue without thumbnail
        }
      }
      
      // Create the course
      const result = await createCourse(courseData);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your course has been created successfully.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create course.');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderSkillItem = (skill) => {
    const isSelected = selectedSkills.includes(skill);
    
    return (
      <TouchableOpacity
        key={skill}
        style={[styles.skillItem, isSelected && styles.selectedSkillItem]}
        onPress={() => handleSkillToggle(skill)}
      >
        <Text style={[styles.skillText, isSelected && styles.selectedSkillText]}>
          {skill}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Course</Text>
        <View style={{width: 24}} />
      </LinearGradient>
      
      <KeyboardAvoidingView behavior="height" style={{flex: 1}}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {/* Thumbnail Upload Section */}
            <TouchableOpacity
              style={styles.thumbnailContainer}
              onPress={pickThumbnailImage}
            >
              {courseThumbnail ? (
                <Image 
                  source={{ uri: courseThumbnail }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.thumbnailText}>Upload Thumbnail</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Course Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a descriptive title"
                value={courseTitle}
                onChangeText={setCourseTitle}
                maxLength={100}
              />
            </View>
            
            {/* Course Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What will students learn in this course?"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={courseDescription}
                onChangeText={setCourseDescription}
                maxLength={500}
              />
            </View>
            
            {/* Skills Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Skills (you can select multiple)</Text>
              {loadingSkills ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : Object.keys(verifiedSkills).length > 0 ? (
                <View style={styles.skillsContainer}>
                  {Object.keys(verifiedSkills).map(skill => renderSkillItem(skill))}
                </View>
              ) : (
                <Text style={styles.noSkillsText}>
                  You don't have any verified skills yet. Please verify skills to create courses.
                </Text>
              )}
            </View>
            
            {/* Credits */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credit Cost</Text>
              <View style={styles.creditsContainer}>
                <TouchableOpacity 
                  style={styles.creditButton}
                  onPress={() => credits > 5 && setCredits(credits - 5)}
                >
                  <Ionicons name="remove" size={24} color="#3B82F6" />
                </TouchableOpacity>
                <TextInput
                  style={styles.creditsInput}
                  value={credits.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setCredits(Math.max(5, value));
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.creditButton}
                  onPress={() => setCredits(credits + 5)}
                >
                  <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.creditsInfo}>
                Minimum 5 credits. Higher-value courses may attract more students.
              </Text>
            </View>
            
            {/* Course Sections */}
            <View style={styles.sectionsContainer}>
              <Text style={styles.sectionHeader}>Course Content</Text>
              
              {courseSections.map((section, index) => (
                <View key={section.id} style={styles.sectionItem}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionNumber}>Section {index + 1}</Text>
                    {courseSections.length > 1 && (
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveSection(section.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Section Title"
                    value={section.title}
                    onChangeText={(text) => updateSectionField(section.id, 'title', text)}
                  />
                  
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Section Description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={section.description}
                    onChangeText={(text) => updateSectionField(section.id, 'description', text)}
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Video Link (optional)"
                    value={section.videoLink}
                    onChangeText={(text) => updateSectionField(section.id, 'videoLink', text)}
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Document Link (optional)"
                    value={section.documentLink}
                    onChangeText={(text) => updateSectionField(section.id, 'documentLink', text)}
                  />
                  
                  {section.files.length > 0 && (
                    <View style={styles.filesContainer}>
                      {section.files.map(file => (
                        <View key={file.id} style={styles.fileItem}>
                          <Text style={styles.fileName}>{file.name}</Text>
                          <TouchableOpacity
                            onPress={() => removeFileFromSection(section.id, file.id)}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.addFileButton}
                    onPress={() => addFileToSection(section.id)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                    <Text style={styles.addFileText}>Add File</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.addSectionButton}
                onPress={handleAddSection}
              >
                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                <Text style={styles.addSectionText}>Add Section</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateCourse}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Course</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    marginTop: 8,
    fontSize: 16,
    color: '#94A3B8',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSkillItem: {
    backgroundColor: '#3B82F6',
  },
  skillText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedSkillText: {
    color: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 6,
  },
  noSkillsText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155',
  },
  creditsInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  sectionsContainer: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  sectionItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  removeButton: {
    padding: 6,
  },
  filesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#334155',
  },
  addFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addFileText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  addSectionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CourseCreationScreen; 