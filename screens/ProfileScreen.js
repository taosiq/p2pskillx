import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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
import { auth, db } from '../config/firebase';
import { getUserCourses, getUserEnrolledCourses } from '../services/courseService';
import { addComment, createPost, deletePost, getUserPosts, toggleLikePost } from '../services/postService';
import { getUserVerifiedSkills } from '../services/skillService';
import {
    checkIfFollowing,
    followUser,
    getUserFollowersCount,
    getUserFollowingCount,
    unfollowUser,
    uploadProfileImage
} from '../services/userService';

const ProfileScreen = ({ navigation }) => {
  const route = useRoute();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postMenuVisible, setPostMenuVisible] = useState(null);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: null,
    bio: '',
    credits: 0,
    xp: 0,
    level: 1,
    badgeType: 'Bronze',
  });
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState('');
  const [userCourses, setUserCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(true);
  const [profileUserId, setProfileUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [verifiedSkills, setVerifiedSkills] = useState({});
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Use effect to handle tab changes coming from navigation
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Update useEffect to check if this is the current user's profile
  useEffect(() => {
    const refresh = async () => {
      // Check if we're viewing someone else's profile
      if (route.params?.userId) {
        const paramsUserId = route.params.userId;
        const currentAuthId = auth.currentUser?.uid;
        console.log("Profile params userId:", paramsUserId, "Current auth uid:", currentAuthId);
        
        // Always update the profile ID when navigating
        setProfileUserId(paramsUserId);
        const isCurrent = currentAuthId === paramsUserId;
        console.log("Is current user profile:", isCurrent);
        setIsCurrentUserProfile(isCurrent);
        
        // If we're viewing someone else's profile, fetch their data
        if (currentAuthId !== paramsUserId) {
          console.log("Fetching other user data");
          await fetchOtherUserData(paramsUserId);
          const isFollowing = await checkIfFollowing(paramsUserId);
          setIsFollowing(isFollowing.success ? isFollowing.isFollowing : false);
          
          // Get follower and following counts
          const followersResult = await getUserFollowersCount(paramsUserId);
          setFollowersCount(followersResult.success ? followersResult.count : 0);
          
          const followingResult = await getUserFollowingCount(paramsUserId);
          setFollowingCount(followingResult.success ? followingResult.count : 0);
          
          // Fetch verified skills for this user
          await fetchUserSkills(paramsUserId);
        } else {
          console.log("Fetching current user data (from params)");
          await fetchUserData(); // Still our profile, just navigated with params
          await fetchUserSkills(currentAuthId);
        }
      } else {
        // Our own profile
        console.log("No userId in params, showing current user profile");
        setIsCurrentUserProfile(true);
        setProfileUserId(auth.currentUser?.uid);
        await fetchUserData();
        await fetchUserSkills(auth.currentUser?.uid);
      }
      
      // Fetch posts for the profile we're viewing
      await fetchUserPosts();
    };
    
    refresh();
  }, [route.params?.userId]);

  // Load user skills from the database
  const fetchUserSkills = async (userId) => {
    if (!userId) return;
    
    try {
      setLoadingSkills(true);
      
      // Use the skill service to get verified skills
      const skillsResult = await getUserVerifiedSkills(userId);
      
      if (skillsResult.success && skillsResult.skills && Object.keys(skillsResult.skills).length > 0) {
        console.log('Successfully fetched skills:', skillsResult.skills);
        setVerifiedSkills(skillsResult.skills);
      } else {
        console.log('Falling back to user document for skills');
        // Fallback to user document
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().verifiedSkills) {
          console.log('Found skills in user document:', userDoc.data().verifiedSkills);
          setVerifiedSkills(userDoc.data().verifiedSkills);
        } else {
          console.log('No skills found in user document');
          setVerifiedSkills({});
        }
      }
    } catch (error) {
      console.error('Error in fetchUserSkills:', error);
      setVerifiedSkills({});
    } finally {
      setLoadingSkills(false);
    }
  };

  // Use focus effect to refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused');
      
      const refreshCounts = async () => {
        if (profileUserId) {
          // Always refresh follower and following counts
          const followersResult = await getUserFollowersCount(profileUserId);
          setFollowersCount(followersResult.success ? followersResult.count : 0);
          
          const followingResult = await getUserFollowingCount(profileUserId);
          setFollowingCount(followingResult.success ? followingResult.count : 0);
          
          // If this is another user's profile, check if we're following them
          if (!isCurrentUserProfile) {
            const isFollowing = await checkIfFollowing(profileUserId);
            setIsFollowing(isFollowing.success ? isFollowing.isFollowing : false);
          }
        }
      };
      
      refreshCounts();
      
      return () => {
        // cleanup if needed
      };
    }, [profileUserId, isCurrentUserProfile])
  );

  // Load user courses when tab changes to 'courses'
  useEffect(() => {
    if (activeTab === 'courses') {
      console.log("Courses tab selected, isCurrentUserProfile:", isCurrentUserProfile, "profileUserId:", profileUserId);
      if (isCurrentUserProfile) {
        console.log("Loading current user's courses");
        loadUserCourses();
      } else if (profileUserId) {
        console.log("Loading other user's courses with ID:", profileUserId);
        loadOtherUserCourses(profileUserId);
      }
    }
  }, [activeTab, isCurrentUserProfile, profileUserId]);
  
  // Load enrolled courses when tab changes to 'enrolled'
  useEffect(() => {
    if (activeTab === 'enrolled' && isCurrentUserProfile) {
      loadEnrolledCourses();
    }
  }, [activeTab, isCurrentUserProfile]);

  // Load user posts when tab changes to 'posts'
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchUserPosts();
    }
  }, [activeTab]);

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Set user data
        setUserData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || currentUser.email || '',
          profileImage: data.profileImage || null,
          bio: data.bio || 'App developer passionate about creating user-friendly applications',
          credits: data.credits || 0,
          xp: data.xp || 0,
          level: data.level || 1,
          badgeType: data.badgeType || 'Bronze',
        });
        
        // Generate initials
        const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase();
        setUserInitials(initials || 'U');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch user courses
  const fetchUserCourses = async () => {
    try {
      setLoadingCourses(true);
      const result = await getUserCourses();
      
      if (result.success) {
        setUserCourses(result.courses);
      } else {
        console.error('Error fetching user courses:', result.error);
      }
    } catch (error) {
      console.error('Error in fetchUserCourses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Add function to fetch another user's data
  const fetchOtherUserData = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Set user data
        setUserData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          profileImage: data.profileImage || null,
          bio: data.bio || 'App developer passionate about creating user-friendly applications',
          credits: 0, // Don't show other users' credits
          xp: data.xp || 0,
          level: data.level || 1,
          badgeType: data.badgeType || 'Bronze',
        });
        
        // Generate initials
        const initials = `${data.firstName?.charAt(0) || ''}${data.lastName?.charAt(0) || ''}`.toUpperCase();
        setUserInitials(initials || 'U');
        
        // Fetch student count for this user
        fetchStudentCount(userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user posts
  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      
      // Determine which user's posts to fetch
      let targetUserId = profileUserId;
      
      if (!targetUserId) {
        // Default to current user
        targetUserId = auth.currentUser?.uid;
      }
      
      if (!targetUserId) {
        setLoadingPosts(false);
        return;
      }
      
      console.log(`Fetching posts for user ID: ${targetUserId}`);
      const result = await getUserPosts(targetUserId);
      
      if (result.success) {
        // Initialize each post with showComments = false
        const postsWithCommentFlags = result.posts.map(post => ({
          ...post,
          showComments: false
        }));
        setUserPosts(postsWithCommentFlags);
      } else {
        console.error('Error loading user posts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Function handlers for clickable elements
  const handleEditProfile = () => {
    console.log('Edit Profile clicked');
    navigation.navigate('EditProfile');
  };

  const handleAddImage = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to allow access to your photos to upload a profile picture.');
        return;
      }
      
      // Launch image picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!pickerResult.canceled) {
        const imageUri = pickerResult.assets[0].uri;
        
        // Show loading indicator
        setLoading(true);
        
        // Use our userService to upload image
        const result = await uploadProfileImage(imageUri);
        
        if (result.success) {
          // Refresh user data to show the updated image
          await fetchUserData();
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          Alert.alert('Error', result.error || 'Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'There was a problem updating your profile image');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowersPress = () => {
    console.log('Followers clicked');
    // Navigate to followers screen
    navigation.navigate('FollowersList', {
      userId: profileUserId || auth.currentUser?.uid,
      userName: `${userData.firstName} ${userData.lastName}`.trim(),
      isCurrentUser: isCurrentUserProfile
    });
  };

  const handleFollowingPress = () => {
    console.log('Following clicked');
    // Navigate to following screen
    navigation.navigate('FollowingList', {
      userId: profileUserId || auth.currentUser?.uid,
      userName: `${userData.firstName} ${userData.lastName}`.trim(),
      isCurrentUser: isCurrentUserProfile
    });
  };

  const handleAccessCourse = (courseId) => {
    navigation.navigate('CourseAccess', { courseId });
  };

  const handleBackPress = () => {
    navigation.toggleDrawer();
  };

  const handleCreatePost = () => {
    setPostText('');
    setPostImage(null);
    setShowCreatePost(true);
  };

  const handleAddPostImage = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to allow access to your photos to add an image.');
        return;
      }
      
      // Launch image picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!pickerResult.canceled) {
        setPostImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was a problem selecting the image');
    }
  };

  const submitPost = async () => {
    if (postText.trim() === '') {
      Alert.alert('Error', 'Please enter some text for your post');
      return;
    }

    try {
      // Show loading state
      setLoadingPosts(true);
      
      // Convert image to base64 if present
      let base64Image = null;
      if (postImage) {
        // Fetch the image as blob
        const response = await fetch(postImage);
        const blob = await response.blob();
        
        // Convert blob to base64
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(blob);
        });
      }
      
      // Create post data object
      const postData = {
      text: postText,
        image: base64Image,
      };
      
      // Create post in Firebase
      const result = await createPost(postData);
      
      if (result.success) {
        // Add new post to the local state
        setUserPosts([result.post, ...userPosts]);
        
        // Reset form and close modal
    setPostText('');
        setPostImage(null);
    setShowCreatePost(false);

    // Show success message
    Alert.alert('Success', 'Your post has been published!');
      } else {
        Alert.alert('Error', result.error || 'Failed to publish your post');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert('Error', 'There was a problem publishing your post');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const result = await toggleLikePost(postId);
      
      if (result.success) {
        // Update local state with proper like handling
        setUserPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              // Get current user ID
              const userId = auth.currentUser.uid;
              // Check if user already liked the post
              const userLiked = (post.likes || []).includes(userId);
              
              // Create a new likes array based on the toggle action
              let newLikes;
              if (userLiked) {
                // If user already liked, remove their ID (unlike)
                newLikes = (post.likes || []).filter(id => id !== userId);
              } else {
                // If user hasn't liked, add their ID exactly once
                newLikes = [...(post.likes || [])];
                if (!newLikes.includes(userId)) {
                  newLikes.push(userId);
                }
              }
              
              // Return updated post with new likes array
              return { 
                ...post, 
                likes: newLikes
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const result = await deletePost(postId);
              
              if (result.success) {
                // Remove post from local state
                setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                Alert.alert("Success", "Post deleted successfully");
              } else {
                Alert.alert("Error", result.error || "Failed to delete post");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert("Error", "There was a problem deleting the post");
    }
  };
  
  const handleComment = async (postId, commentText) => {
    try {
      if (!commentText.trim()) {
        return false;
      }
      
      const result = await addComment(postId, commentText);
      
      if (result.success) {
        // Get the post first to ensure we have the latest data
        const postToUpdate = userPosts.find(post => post.id === postId);
        
        if (postToUpdate) {
          // Make sure comments is an array, then add the new comment
          const existingComments = Array.isArray(postToUpdate.comments) ? postToUpdate.comments : [];
          
          // Make sure we don't add duplicate comments
          const isDuplicate = existingComments.some(comment => 
            comment.id === result.comment.id
          );
          
          if (!isDuplicate) {
            // Update local state with a proper immutable update
            setUserPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === postId 
                  ? { 
                      ...post, 
                      comments: [...existingComments, result.comment]
                    }
                  : post
              )
            );
          }
        }
        
        return true; // Comment added successfully
      }
      
      return false;
    } catch (error) {
      console.error('Error commenting on post:', error);
      return false;
    }
  };

  // Render the star ratings
  const renderStars = (rating = 4) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={i <= rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const loadUserCourses = async () => {
    try {
      setLoadingCourses(true);
      
      const result = await getUserCourses();
      
      if (result.success) {
        setUserCourses(result.courses);
      } else {
        console.error('Error loading courses:', result.error);
      }
    } catch (error) {
      console.error('Error loading user courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };
  
  const loadEnrolledCourses = async () => {
    try {
      setLoadingEnrolled(true);
      
      const result = await getUserEnrolledCourses();
      
      if (result.success) {
        setEnrolledCourses(result.courses);
      } else {
        console.error('Error loading enrolled courses:', result.error);
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    } finally {
      setLoadingEnrolled(false);
    }
  };

  // Add the missing renderPost function to fix the crashing issue
  const renderPost = (post) => {
    const isCurrentUserPost = post.userId === auth.currentUser?.uid;
    const userHasLiked = post.likes && post.likes.includes(auth.currentUser?.uid);
    
    return (
      <View key={post.id} style={styles.postItem}>
        <View style={styles.postHeader}>
          <View style={styles.postUser}>
            {post.userProfileImage ? (
              <Image 
                source={{ uri: post.userProfileImage }} 
                style={styles.postUserImage} 
              />
            ) : (
              <View style={styles.postUserInitials}>
                <Text style={styles.postUserInitialsText}>
                  {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={styles.postUserInfo}>
              <Text style={styles.postUserName}>{post.userName || 'User'}</Text>
              <Text style={styles.postTime}>
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
              </Text>
            </View>
          </View>
          
          {isCurrentUserPost && (
            <TouchableOpacity 
              style={styles.postMenuButton}
              onPress={() => setPostMenuVisible(postMenuVisible === post.id ? null : post.id)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        
        {postMenuVisible === post.id && (
          <View style={styles.postMenuDropdown}>
            <TouchableOpacity 
              style={styles.postMenuItem}
              onPress={() => {
                setPostMenuVisible(null);
                handleDeletePost(post.id);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.postMenuItemTextDelete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={styles.postText}>{post.text}</Text>
        
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}
        
        <View style={styles.postStats}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => handleLikePost(post.id)}
          >
            <Ionicons 
              name={userHasLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={userHasLiked ? "#EF4444" : "#64748B"} 
            />
            <Text style={styles.statText}>
              {post.likes ? post.likes.length : 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => {
              // Toggle showing comments for this post
              setUserPosts(prevPosts => 
                prevPosts.map(p => 
                  p.id === post.id 
                    ? { ...p, showComments: !p.showComments } 
                    : p
                )
              );
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
            <Text style={styles.statText}>
              {post.comments ? post.comments.length : 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {post.showComments && (
          <CommentSection 
            post={post} 
            onAddComment={handleComment}
          />
        )}
      </View>
    );
  };

  // Add CommentSection component for rendering comments
  const CommentSection = ({ post, onAddComment }) => {
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmitComment = async () => {
      if (commentText.trim() === '' || isSubmitting) return;
      
      setIsSubmitting(true);
      const success = await onAddComment(post.id, commentText);
      
      if (success) {
        setCommentText('');
      }
      setIsSubmitting(false);
    };
    
    return (
      <View style={styles.commentsContainer}>
        {/* Comment input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity 
            style={[
              styles.commentSubmitButton,
              (commentText.trim() === '' || isSubmitting) && styles.disabledButton
            ]}
            onPress={handleSubmitComment}
            disabled={commentText.trim() === '' || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Comments list */}
        {Array.isArray(post.comments) && post.comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <View style={styles.commentUserAvatar}>
                {comment.userProfileImage ? (
                  <Image 
                    source={{ uri: comment.userProfileImage }} 
                    style={styles.commentUserImage}
                  />
                ) : (
                  <View style={styles.commentUserInitialsContainer}>
                    <Text style={styles.commentUserInitialsText}>
                      {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.commentContent}>
                <Text style={styles.commentUserName}>
                  {comment.userName || 'User'}
                </Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render tab content with added skills section
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <View style={styles.tabContent}>
            {loadingPosts ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No posts yet</Text>
                {isCurrentUserProfile && (
            <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={() => setShowCreatePost(true)}
            >
                    <Text style={styles.createFirstButtonText}>Create Your First Post</Text>
            </TouchableOpacity>
                  )}
                </View>
            ) : (
              userPosts.map(post => renderPost(post))
            )}
          </View>
        );
        
      case 'courses':
        return (
          <View style={styles.tabContent}>
            {loadingCourses ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : userCourses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No courses created yet</Text>
                {isCurrentUserProfile && (
            <TouchableOpacity 
                    style={styles.createFirstButton}
              onPress={() => navigation.navigate('CourseTypeSelection')}
            >
                    <Text style={styles.createFirstButtonText}>Create Your First Course</Text>
            </TouchableOpacity>
                )}
                </View>
            ) : (
              userCourses.map(course => renderCourseCard(course))
            )}
              </View>
        );
      
      case 'enrolled':
        if (!isCurrentUserProfile) {
          return (
            <View style={styles.emptyContainer}>
              <Ionicons name="lock-closed-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>This section is private</Text>
                </View>
          );
        }
        
        return (
          <View style={styles.tabContent}>
            {loadingEnrolled ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                  </View>
            ) : enrolledCourses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmarks-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No enrolled courses yet</Text>
                <TouchableOpacity 
                  style={styles.createFirstButton}
                  onPress={() => navigation.navigate('Dashboard')}
                >
                  <Text style={styles.createFirstButtonText}>Explore Courses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              enrolledCourses.map(course => renderEnrolledCourseCard(course))
            )}
            </View>
        );
        
      case 'skills':
        return (
          <View style={styles.tabContent}>
            {loadingSkills ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : Object.keys(verifiedSkills).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ribbon-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No verified skills yet</Text>
                {isCurrentUserProfile && (
                  <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={() => navigation.navigate('SkillCategory')}
                  >
                    <Text style={styles.createFirstButtonText}>Verify Your First Skill</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.skillsListContainer}>
                {Object.entries(verifiedSkills).map(([skill, data], index) => (
                  <View key={skill} style={styles.skillCard}>
                    <View style={styles.skillNumberContainer}>
                      <Text style={styles.skillNumber}>{index + 1}</Text>
                </View>
                    <View style={styles.skillInfo}>
                      <Text style={styles.skillName}>{skill}</Text>
                      <View style={styles.skillLevelBadge}>
                        <Text style={styles.skillLevelText}>{data.level || 'Intermediate'}</Text>
                  </View>
                      <View style={styles.verificationInfo}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.verifiedIcon} />
                        <Text style={styles.verifiedText}>Verified</Text>
                        {data.verifiedAt && (
                          <Text style={styles.verifiedDate}>
                            {new Date(data.verifiedAt).toLocaleDateString()}
                  </Text>
                        )}
                  </View>
                </View>
              </View>
                ))}
              </View>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  // Add this new function to handle adding a new skill
  const handleAddSkill = () => {
    navigation.navigate('SkillCategory');
  };

  const handleFollowToggle = async () => {
    try {
      if (!profileUserId) return;
      
      setLoadingFollow(true);
      let result;
      
      if (isFollowing) {
        // Unfollow the user
        result = await unfollowUser(profileUserId);
      } else {
        // Follow the user
        result = await followUser(profileUserId);
      }
      
      if (result.success) {
        // Only toggle the following state if not already in the desired state
        if (!result.alreadyFollowing && !result.notFollowing) {
          // Toggle the following state
          setIsFollowing(!isFollowing);
        }
        
        // Update counters
        const newFollowersCount = await getUserFollowersCount(profileUserId);
        if (newFollowersCount.success) {
          setFollowersCount(newFollowersCount.count);
        }
        
        const newFollowingCount = await getUserFollowingCount(auth.currentUser?.uid);
        if (newFollowingCount.success) {
          setFollowingCount(newFollowingCount.count);
        }
      } else {
        // Show specific error message
        Alert.alert(
          isFollowing ? 'Unfollow Failed' : 'Follow Failed', 
          result.error || `Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`
        );
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert(
        'Error', 
        'There was a problem processing your request. Please check your internet connection and try again.'
      );
    } finally {
      setLoadingFollow(false);
    }
  };

  // Add effect to check if current user is following the profile user when viewing another profile
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!isCurrentUserProfile && profileUserId) {
        try {
          setLoadingFollow(true);
          
          // Check if the current user is following this profile
          const followResult = await checkIfFollowing(profileUserId);
          if (followResult.success) {
            setIsFollowing(followResult.isFollowing);
          }
          
          // Get followers count
          const followersResult = await getUserFollowersCount(profileUserId);
          if (followersResult.success) {
            setFollowersCount(followersResult.count);
          }
          
          // Get following count
          const followingResult = await getUserFollowingCount(profileUserId);
          if (followingResult.success) {
            setFollowingCount(followingResult.count);
          }
        } catch (error) {
          console.error('Error fetching follow status:', error);
        } finally {
          setLoadingFollow(false);
        }
      }
    };
    
    fetchFollowStatus();
  }, [isCurrentUserProfile, profileUserId]);

  // Add function to load another user's courses
  const loadOtherUserCourses = async (userId) => {
    try {
      console.log("Loading courses for other user with ID:", userId);
      setLoadingCourses(true);
      
      // Query courses directly from Firestore
      const q = query(
        collection(db, 'courses'),
        where('creatorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const courses = [];
      
      querySnapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("Successfully loaded other user courses:", courses.length);
      setUserCourses(courses);
    } catch (error) {
      console.error('Error loading other user courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Function to fetch and calculate unique student count for a user
  const fetchStudentCount = async (userId) => {
    try {
      // First get all courses created by this user
      const q = query(
        collection(db, 'courses'),
        where('creatorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Use a simpler method - just sum up the enrollments count from each course
      // This is more efficient than checking each user
      let totalEnrollments = 0;
      
      querySnapshot.forEach((doc) => {
        const courseData = doc.data();
        totalEnrollments += courseData.enrollments || 0;
      });
      
      setStudentCount(totalEnrollments);
    } catch (error) {
      console.error('Error calculating student count:', error);
      setStudentCount(0);
    }
  };

  // Add missing renderCourseCard function
  const renderCourseCard = (course) => {
    return (
      <TouchableOpacity 
        key={course.id} 
        style={styles.courseCard}
        onPress={() => handleAccessCourse(course.id)}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseTitle}>{course.title || 'Course Title'}</Text>
          <View style={styles.courseStatusBadge}>
            <Text style={styles.courseStatusText}>
              {course.status || 'ACTIVE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.courseContent}>
          <View style={styles.courseIconContainer}>
            {course.thumbnail ? (
              <Image 
                source={{ uri: course.thumbnail }} 
                style={styles.courseThumbnail}
              />
            ) : (
              <Ionicons name="create-outline" size={30} color="#3B82F6" />
            )}
          </View>
          
          <View style={styles.courseDetails}>
            <View style={styles.courseStatsRow}>
              <Text style={styles.courseStatText}>
                {course.enrollments || 0} students
              </Text>
              <Text style={styles.courseStatText}>
                {course.ratings ? `${course.ratings.average.toFixed(1)}★` : '4.0★'}
              </Text>
            </View>
            
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description || 'No description available'}
            </Text>
            
            {course.category && (
              <View style={styles.courseCategoryBadge}>
                <Text style={styles.courseCategoryText}>
                  {course.category}
                </Text>
              </View>
            )}
            
            <View style={styles.courseFooter}>
              <Text style={styles.courseDateText}>
                Created: {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Recently'}
              </Text>
              <Text style={styles.courseCreditsText}>
                {course.credits || 5} credits
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.courseActions}>
          <TouchableOpacity 
            style={styles.courseActionButton}
            onPress={() => handleAccessCourse(course.id)}
          >
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.courseActionText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Add missing renderEnrolledCourseCard function
  const renderEnrolledCourseCard = (course) => {
    const progress = course.progress || 0;
    
    return (
      <TouchableOpacity 
        key={course.id} 
        style={styles.enrolledCourseCard}
        onPress={() => handleAccessCourse(course.id)}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseTitle}>{course.title || 'Course Title'}</Text>
          <View style={[styles.courseStatusBadge, styles.enrolledStatusBadge]}>
            <Text style={[styles.courseStatusText, styles.enrolledStatusText]}>
              {progress === 100 ? 'COMPLETED' : 'ENROLLED'}
            </Text>
          </View>
        </View>
        
        <View style={styles.courseContent}>
          <View style={[styles.courseIconContainer, styles.enrolledIconContainer]}>
            {course.thumbnail ? (
              <Image 
                source={{ uri: course.thumbnail }} 
                style={styles.courseThumbnail}
              />
            ) : (
              <Ionicons name="school" size={30} color="#10B981" />
            )}
          </View>
          
          <View style={styles.courseDetails}>
            <View style={styles.courseStatsRow}>
              <Text style={styles.courseStatText}>
                By: {course.creatorName || 'Instructor'}
              </Text>
              <Text style={styles.courseStatText}>
                {course.enrollments || 0} students
              </Text>
            </View>
            
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description || 'No description available'}
            </Text>
            
            <View style={styles.enrolledProgressContainer}>
              <View style={styles.enrolledProgressBar}>
                <View 
                  style={[
                    styles.enrolledProgressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.enrolledProgressText}>
                {progress}% Complete
              </Text>
            </View>
            
            <View style={styles.courseFooter}>
              <Text style={styles.courseDateText}>
                Enrolled: {course.enrollmentDate ? new Date(course.enrollmentDate).toLocaleDateString() : 'Recently'}
              </Text>
              <Text style={styles.courseCreditsText}>
                {course.credits || 5} credits
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.courseActions}>
          <TouchableOpacity 
            style={[styles.courseActionButton, styles.enrolledActionButton]}
            onPress={() => handleAccessCourse(course.id)}
          >
            <Ionicons name="play-circle-outline" size={16} color="#10B981" />
            <Text style={[styles.courseActionText, styles.enrolledActionText]}>
              {progress === 100 ? 'Review Course' : 'Continue Learning'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Add this new function to handle starting a conversation
  const handleMessageUser = async () => {
    try {
      setLoadingFollow(true); // Reuse the loading state from follow functionality
      
      // Create or get an existing conversation with this user
      const conversationId = await createOrGetConversation(profileUserId);
      
      // Navigate to the chat detail screen
      navigation.navigate('ChatDetail', {
        conversationId,
        otherUserName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        otherUserId: profileUserId,
        initials: userInitials,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    } finally {
      setLoadingFollow(false);
    }
  };

  // Updated render for the follow/message buttons in the profile header
  const renderProfileActions = () => {
    if (isCurrentUserProfile) {
      return (
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={styles.profileActionsContainer}>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followingButton : {}
            ]}
            onPress={handleFollowToggle}
            disabled={loadingFollow}
          >
            {loadingFollow ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessageUser}
            disabled={loadingFollow}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <View style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>P2PSkillX</Text>
        </View>
        
        <View style={styles.headerRight}>
          {isCurrentUserProfile ? (
          <TouchableOpacity onPress={handleEditProfile} style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                  {userData.profileImage ? (
                <Image 
                      source={{ uri: userData.profileImage }}
                  style={styles.profileImageContent}
                />
                  ) : (
                    <View style={styles.initials}>
                      <Text style={styles.initialsText}>{userInitials}</Text>
              </View>
                  )}
                </View>
                {isCurrentUserProfile ? (
              <TouchableOpacity style={styles.editImageButton} onPress={handleAddImage}>
                <Ionicons name="add" size={16} color="white" />
              </TouchableOpacity>
                ) : (
              <TouchableOpacity 
                onPress={handleFollowToggle} 
                style={[
                  styles.followButtonBelow, 
                  isFollowing ? styles.followingButtonBelow : null
                ]}
                disabled={loadingFollow}
              >
                {loadingFollow ? (
                  <ActivityIndicator size="small" color={isFollowing ? "#3B82F6" : "#FFFFFF"} />
                ) : (
                  <Text style={[
                    styles.followButtonTextBelow,
                    isFollowing && { color: '#3B82F6' }
                  ]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
                )}
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                  <Text style={styles.profileName}>
                    {`${userData.firstName} ${userData.lastName}`.trim() || 'User'}
                  </Text>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Lvl {userData.level}</Text>
                </View>
              </View>
              <View style={styles.ratingsContainer}>
                <Text style={styles.ratingsLabel}>Ratings:</Text>
                {renderStars(4)}
              </View>
                <Text style={styles.profileBio}>{userData.bio}</Text>
            </View>
          </View>
          )}

          {/* Stats container */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowersPress}>
              <Text style={styles.statValue}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statItem} onPress={handleFollowingPress}>
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            
            {!isCurrentUserProfile && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{studentCount}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            )}
            
            {isCurrentUserProfile && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData.posts || userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            )}
          </View>
          
          {/* Achievements Card */}
          <View style={styles.cardContainer}>
            <View style={{padding: 16}}>
              <View style={styles.achievementHeader}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => {
                    Alert.alert(
                      'Achievements System',
                      '• Credits: Used to access courses and teaching tools\n• XP: Earned from teaching and learning activities\n• Badge: Changes as you level up (Bronze → Silver → Gold → Titan → Diamond)\n• Level: Increases as you gain XP, unlocking new benefits',
                      [{ text: 'Got it!' }]
                    );
                  }}
                >
                  <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.achievementsRow}>
                {isCurrentUserProfile ? (
                  <View style={styles.achievementItem}>
                    <Text style={styles.achievementLabel}>💰 Credits</Text>
                    <Text style={styles.achievementValue}>{userData.credits}</Text>
                  </View>
                ) : (
                  <View style={styles.achievementItem}>
                    <Text style={styles.achievementLabel}>👨‍🎓 Students</Text>
                    <Text style={styles.achievementValue}>{studentCount}</Text>
                  </View>
                )}
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementLabel}>⭐ XP</Text>
                  <Text style={styles.achievementValue}>{userData.xp}</Text>
                </View>
              </View>
              <View style={styles.achievementsRow}>
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementLabel}>🏅 Badge</Text>
                  <Text style={styles.achievementValue}>{userData.badgeType}</Text>
                </View>
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementLabel}>📊 Level</Text>
                  <Text style={styles.achievementValue}>{userData.level}</Text>
                </View>
              </View>
              <View style={styles.xpProgressContainer}>
                <View style={styles.xpProgressBar}>
                  <View style={[styles.xpProgressFill, { width: `${(userData.xp || 0) / (userData.level * 100) * 100}%` }]} />
                </View>
                <Text style={styles.xpProgressText}>
                  {userData.xp || 0}/{userData.level * 100} XP to Level {userData.level + 1}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Content tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'posts' && styles.activeTabItem]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="document-text" 
              size={22} 
              color={activeTab === 'posts' ? '#3B82F6' : '#94A3B8'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'posts' && styles.activeTabText
            ]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'courses' && styles.activeTabItem]}
            onPress={() => setActiveTab('courses')}
          >
            <Ionicons 
              name="school" 
              size={22} 
              color={activeTab === 'courses' ? '#3B82F6' : '#94A3B8'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'courses' && styles.activeTabText
            ]}>
              Courses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'skills' && styles.activeTabItem]}
            onPress={() => setActiveTab('skills')}
          >
            <Ionicons 
              name="ribbon" 
              size={22} 
              color={activeTab === 'skills' ? '#3B82F6' : '#94A3B8'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'skills' && styles.activeTabText
            ]}>
              Skills
            </Text>
          </TouchableOpacity>
          {isCurrentUserProfile && (
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'enrolled' && styles.activeTabItem]}
              onPress={() => setActiveTab('enrolled')}
            >
              <Ionicons 
                name="bookmarks" 
                size={22} 
                color={activeTab === 'enrolled' ? '#3B82F6' : '#94A3B8'} 
              />
              <Text style={[
                styles.tabText, 
                activeTab === 'enrolled' && styles.activeTabText
              ]}>
                Enrolled
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Create post button (only on "posts" tab) */}
        {activeTab === 'posts' && isCurrentUserProfile && (
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={handleCreatePost}
          >
            <View style={styles.createPostContent}>
              <Ionicons name="create-outline" size={24} color="#3B82F6" />
              <Text style={styles.createPostText}>Create a Post</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Tab content */}
        {renderTabContent()}
        
        {/* Bottom padding to account for the navigation bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Create post modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.createPostModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreatePost(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              multiline
              value={postText}
              onChangeText={setPostText}
            />
            
            {postImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: postImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setPostImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.attachmentOptions}>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAddPostImage}
              >
                <Ionicons name="image-outline" size={20} color="#3B82F6" />
                <Text style={styles.attachmentText}>Add Image</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.submitPostButton,
                postText.trim() === '' && styles.disabledButton
              ]}
              onPress={submitPost}
              disabled={postText.trim() === ''}
            >
              <Text style={styles.submitPostButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <BottomNavigation 
        activeScreen="Profile" 
        onNavigate={(screenName) => navigation.navigate(screenName)}
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
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 80, // Match the width of the menu button side
    alignItems: 'flex-end',
  },
  editProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: 'space-around',
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  backButton: {
    padding: 5,
    width: 80, // Fixed width to balance the header
  },
  scrollView: {
    flex: 1,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  profileImageContent: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  profileSection: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  levelBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'white',
    marginLeft: 'auto',
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F8EF7',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starFilled: {
    color: '#FFD700',
    fontSize: 16,
  },
  starEmpty: {
    color: '#DDD',
    fontSize: 16,
  },
  profileBio: {
    fontSize: 13,
    color: '#444',
    marginTop: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  cardContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    // Removed padding for alignment
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  achievementText: {
    fontSize: 14,
    color: '#333',
  },
  postTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  postContent: {
    flexDirection: 'row',
  },
  postImageContainer: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    textAlign: 'center',
  },
  postDetailsContainer: {
    flex: 1,
    marginLeft: 15,
  },
  accessButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  accessButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  postRatingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postRatingsLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  postDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chatText: {
    fontSize: 12,
    color: '#666',
  },
  enrolledText: {
    fontSize: 12,
    color: '#666',
  },
  creditsContainer: {
    alignItems: 'flex-end',
  },
  creditsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  bottomPadding: {
    height: 80,
  },
  tabContent: {
    padding: 16,
  },
  createPostButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#64748B',
  },
  postItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    paddingRight: 12, /* Reduce right padding to give more space for menu */
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 0,
  },
  postMenu: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8, /* Further adjust to keep within container */
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUserInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postUserInitialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
  },
  postMenuButton: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  postMenuDropdown: {
    position: 'absolute',
    right: 5,
    top: 35,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    width: 110,
    padding: 5,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
  },
  postMenuItemTextDelete: {
    color: '#EF4444',
    marginLeft: 8,
    fontSize: 14,
  },
  postText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createPostModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 5,
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  attachmentOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  attachmentText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontSize: 14,
  },
  submitPostButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  submitPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createCourseButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createCourseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createCourseText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  exploreCoursesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exploreCoursesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreCoursesText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  courseStatusBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  courseContent: {
    flexDirection: 'row',
    padding: 12,
  },
  courseIconContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseDetails: {
    flex: 1,
  },
  courseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseStatText: {
    fontSize: 12,
    color: '#64748B',
  },
  courseDescription: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  courseCreditsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  courseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 8,
  },
  courseActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  enrolledActionButton: {
    
  },
  courseActionText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  enrolledActionText: {
    color: '#10B981',
  },
  enrolledProgressContainer: {
    marginTop: 4,
  },
  enrolledProgressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  enrolledProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  enrolledProgressText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  enrolledCourseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  enrolledIconContainer: {
    backgroundColor: '#F0FDF4',
  },
  enrolledStatusBadge: {
    backgroundColor: '#E6FFFA',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  enrolledStatusText: {
    color: '#059669',
  },
  enrolledInfoContainer: {
    marginTop: 4,
  },
  enrolledCreditsContainer: {
    marginTop: 2,
  },
  enrolledInfoText: {
    fontSize: 12,
    color: '#64748B',
  },
  courseThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  privateTabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  privateTabText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoButton: {
    padding: 4,
  },
  achievementItem: {
    flex: 1,
  },
  achievementLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  achievementValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  xpProgressContainer: {
    marginTop: 12,
  },
  xpProgressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  xpProgressText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  initials: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  courseCategoryBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  courseCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUserInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  postUserInitialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  commentsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentUserAvatar: {
    marginRight: 8,
  },
  commentUserImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentUserInitialsContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentUserInitialsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
  },
  viewMoreComments: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  viewCommentsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  viewCommentsText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 5,
  },
  selectedImageContainer: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 15,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPostsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followButtonBelow: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24, // Added margin to move the button down
    width: '100%',
  },
  followingButtonBelow: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  followButtonTextBelow: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  
  messageButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageButtonBelow: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 5,
  },
  
  messageButtonTextBelow: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  userActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 5,
  },
});

export default ProfileScreen; 