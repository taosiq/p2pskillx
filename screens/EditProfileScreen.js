import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
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
    View
} from 'react-native';
import { auth, db } from '../config/firebase';

const EditProfileScreen = ({ navigation, route }) => {
  // State for form fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simulating getting existing user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user ID
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.log('No authenticated user found');
        return;
      }
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Set state from user data
        setUsername(userData.firstName + ' ' + userData.lastName || 'User');
        setBio(userData.bio || 'App developer passionate about creating user-friendly applications');
        setEmail(userData.email || auth.currentUser.email);
        setContactNumber(userData.contactNumber || '');
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback data if fetch fails
      setUsername('User');
      setBio('App developer passionate about creating user-friendly applications');
      setEmail(auth.currentUser?.email || '');
    }
  };

  // Request permission for accessing the image library
  useEffect(() => {
    (async () => {
      if (true) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry, we need camera roll permissions to change your profile photo!');
        }
      }
    })();
  }, []);

  // Handle profile image selection
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Handle discard changes
  const handleCancel = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  // Handle form submission
  const handleSave = async () => {
    // Validate required fields
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (!bio.trim()) {
      Alert.alert('Error', 'Bio is required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setLoading(true);
      
      // Get current user ID
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to update your profile');
        setLoading(false);
        return;
      }
      
      // Upload profile image if it's a new one (URI starts with 'file://')
      let profileImageUrl = profileImage;
      
      if (profileImage && profileImage.startsWith('file://')) {
        try {
          // Convert image to base64
          const response = await fetch(profileImage);
          const blob = await response.blob();
          
          // Convert blob to base64
          profileImageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);
          });
          
          console.log('Profile image converted to base64');
        } catch (uploadError) {
          console.error('Error processing image:', uploadError);
          Alert.alert('Upload Error', 'Failed to process profile image. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Split username into first and last name
      const nameParts = username.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Prepare data for submission
      const updatedUserData = {
        firstName,
        lastName,
        bio,
        email,
        contactNumber,
        profileImage: profileImageUrl,
        updatedAt: new Date().toISOString()
      };

      // Update Firestore document
      await updateDoc(doc(db, "users", userId), updatedUserData);
      
      // Show success message
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Top Navigation Bar */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.navBar}
      >
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButton}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoContainer}>
            <View style={styles.profileImageWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Ionicons name="person" size={60} color="#d8d8d8" />
                </View>
              )}
              <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>
          
          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Username*</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              autoCapitalize="words"
            />
            
            <Text style={styles.fieldLabel}>Bio*</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <Text style={styles.fieldLabel}>Additional Email*</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.fieldLabel}>Contact Number (optional)</Text>
            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#3B82F6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a4a4a',
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
});

export default EditProfileScreen; 