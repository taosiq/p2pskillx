import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
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
import { auth } from '../config/firebase';
import { addComment, createPost, getAllPosts, toggleLikePost } from '../services/postService';

// Avatar Component with proper sizing and shadow
const Avatar = ({ initials, size = 48, color = '#4285F4' }) => {
  return (
    <View style={[
      styles.avatar, 
      { 
        width: size, 
        height: size, 
        backgroundColor: color,
        borderRadius: size / 2
      }
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

// Post Component with improved UI
const Post = ({ post, navigation, onLike, onComment, onToggleComments, onDelete }) => {
  const [commentText, setCommentText] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const handleLike = () => {
    onLike(post.id);
  };
  
  const handleProfilePress = () => {
    // Navigate to the user's profile with a fresh screen entry
    console.log('Navigating to profile of user:', post.userId);
    navigation.navigate('Profile', { 
      userId: post.userId,
      timestamp: new Date().getTime() // Force React Navigation to treat this as a new screen instance
    });
  };
  
  const handleCommentPress = () => {
    setCommentModalVisible(true);
  };
  
  const submitComment = async () => {
    if (commentText.trim() === '') {
      return;
    }

    try {
      setSubmittingComment(true);
      const success = await onComment(post.id, commentText);
      
      if (success) {
    setCommentText('');
        setCommentModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Something went wrong while posting your comment');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const isPostLiked = post.likes ? post.likes.includes(auth.currentUser?.uid) : false;
  
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress}>
          {post.userProfileImage ? (
            <Image 
              source={{ uri: post.userProfileImage }} 
              style={styles.userAvatar} 
            />
          ) : (
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>{post.userInitials || 'U'}</Text>
          </View>
          )}
          <View>
            <Text style={styles.userName}>{post.userName || 'User'}</Text>
            <Text style={styles.postTime}>{post.timeAgo || 'Just now'}</Text>
          </View>
        </TouchableOpacity>
        
                {post.userId === auth.currentUser?.uid && (
          <View style={styles.postMenu}>
        <TouchableOpacity 
              onPress={() => setMenuVisible(!menuVisible)}
              style={styles.postMenuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#64748B" />
        </TouchableOpacity>
            
            {menuVisible && (
              <View style={styles.postMenuDropdown}>
                <TouchableOpacity 
                  style={styles.postMenuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(post.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.postMenuItemTextDelete}>Delete</Text>
                </TouchableOpacity>
          </View>
            )}
        </View>
        )}
      </View>
      
      <Text style={styles.postContent}>{post.text}</Text>
      
      {post.image && (
        <Image 
          source={{ uri: post.image }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.engagementStats}>
        <View style={styles.statItem}>
          <Ionicons 
            name={isPostLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={isPostLiked ? "#EF4444" : "#64748B"} 
          />
          <Text style={styles.statText}>{post.likes ? post.likes.length : 0}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
          <Text style={styles.statText}>{post.comments ? post.comments.length : 0}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Ionicons 
            name={isPostLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isPostLiked ? "#EF4444" : "#64748B"} 
          />
          <Text style={[
            styles.actionButtonText,
            isPostLiked && { color: "#EF4444" }
          ]}>
            Like
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCommentPress}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
          <Text style={styles.actionButtonText}>Comment</Text>
        </TouchableOpacity>
      </View>
        
      {/* Comments Section with Facebook-style dropdown */}
      {post.comments && post.comments.length > 0 && (
        <View>
        <TouchableOpacity 
              style={styles.viewCommentsButton}
              onPress={() => {
                // Use the prop function to toggle comments
                onToggleComments(post.id);
              }}
            >
              <View style={styles.viewCommentsContent}>
                <Text style={styles.viewCommentsText}>
                  {post.showComments === true ? 'Hide Comments' : `View Comments (${post.comments.length})`}
                </Text>
                <Ionicons 
                  name={post.showComments === true ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#64748B" 
                />
      </View>
            </TouchableOpacity>

          {post.showComments === true && (
        <View style={styles.commentsSection}>
                              {post.comments.map((comment, index) => (
                  <View key={comment.id || index} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <TouchableOpacity 
                        style={styles.commentUserAvatar}
                        onPress={() => navigation.navigate('Profile', { 
                          userId: comment.userId,
                          timestamp: new Date().getTime()
                        })}
                      >
                        {comment.userProfileImage ? (
                          <Image 
                            source={{ uri: comment.userProfileImage }} 
                            style={styles.commentUserImage} 
                          />
                        ) : (
                          <View style={styles.commentUserInitialsContainer}>
                            <Text style={styles.commentUserInitialsText}>
                              {comment.userInitials || 'U'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.commentContent}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Profile', { 
                            userId: comment.userId,
                            timestamp: new Date().getTime()
                          })}
                        >
                          <Text style={styles.commentUser}>{comment.userName || 'User'}</Text>
                        </TouchableOpacity>
              <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    </View>
            </View>
          ))}
              
              {post.comments.length > 10 && (
                <TouchableOpacity onPress={handleCommentPress}>
                  <Text style={styles.viewAllComments}>
                    View all {post.comments.length} comments
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Comment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={commentModalVisible}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.commentModalContainer}>
          <View style={styles.commentModal}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Add Comment</Text>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.postPreview}>
              <Text style={styles.postPreviewText} numberOfLines={2}>
                {post.text}
              </Text>
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              autoFocus
            />
            
            <TouchableOpacity 
              style={[
                styles.submitCommentButton,
                (commentText.trim() === '' || submittingComment) && styles.disabledButton
              ]}
              onPress={submitComment}
              disabled={commentText.trim() === '' || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitCommentButtonText}>Post Comment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Post Creation Card
const PostCreationCard = ({ onCreatePost, userData }) => {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePostCreation = () => {
    setPostText('');
    setPostImage(null);
    setShowCreatePostModal(true);
  };
  
  const handleAddImage = async () => {
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
      setIsSubmitting(true);
      
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
      
      // Call the parent component's post creation handler
      const success = await onCreatePost(postData);
      
      if (success) {
        // Reset form and close modal
        setPostText('');
        setPostImage(null);
        setShowCreatePostModal(false);
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'There was a problem creating your post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <TouchableOpacity 
        style={styles.createPostCard}
        onPress={handlePostCreation}
      >
        <View style={styles.createPostContainer}>
          {userData.profileImage ? (
            <Image 
              source={{ uri: userData.profileImage }} 
              style={styles.userAvatar} 
            />
          ) : (
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>{userData.initials || 'U'}</Text>
            </View>
          )}
          <View style={styles.createPostInput}>
            <Text style={styles.createPostPlaceholder}>
              Share your knowledge with the community...
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Create Post Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCreatePostModal}
        onRequestClose={() => setShowCreatePostModal(false)}
      >
        <KeyboardAvoidingView
          behavior="height"
          style={styles.modalContainer}
        >
          <View style={styles.createPostModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
      <TouchableOpacity 
                onPress={() => setShowCreatePostModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput
        style={styles.postInput}
              placeholder="Share your knowledge with the community..."
              value={postText}
              onChangeText={setPostText}
              multiline
              autoFocus
            />
            
            {postImage && (
              <View style={styles.selectedImageContainer}>
                <Image 
                  source={{ uri: postImage }} 
                  style={styles.selectedImage}
                />
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
                onPress={handleAddImage}
      >
                <Ionicons name="image-outline" size={24} color="#3B82F6" />
                <Text style={styles.attachmentText}>Add Image</Text>
      </TouchableOpacity>
    </View>
            
            <TouchableOpacity 
              style={[
                styles.submitPostButton,
                (postText.trim() === '' || isSubmitting) && styles.disabledButton
              ]}
              onPress={submitPost}
              disabled={postText.trim() === '' || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitPostButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

// Trending Skills Component
const TrendingSkills = () => {
  const trendingSkills = [
    'JavaScript', 'React Native', 'Python', 'UI/UX Design', 'Flutter'
  ];
  
  const handleSkillPress = (skill) => {
    console.log(`Skill pressed: ${skill}`);
    // Here you would typically navigate to the skill detail page
    // or add a filter to show only posts with this skill
  };
  
  return (
    <View style={styles.trendingContainer}>
      <Text style={styles.trendingTitle}>Trending Skills</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
        {trendingSkills.map(skill => (
          <TouchableOpacity 
            key={skill} 
            style={styles.trendingItem}
            onPress={() => handleSkillPress(skill)}
          >
            <Text style={styles.trendingItemText}>#{skill}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    initials: 'U',
    profileImage: null,
  });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchUserData();
    fetchPosts();
    
    // Add a focus listener to refresh posts when returning to screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPosts();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const fetchUserData = async () => {
    // This would fetch from Firebase in a real app
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }
      
      // Update state with user data
      setUserData({
        id: currentUser.uid,
        email: currentUser.email,
        initials: 'U', // Replace with actual initials from Firestore
        profileImage: null, // Replace with actual profile image
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      
      const result = await getAllPosts();
      
      if (result.success) {
        // Initialize each post with showComments = false for dropdown functionality
        const postsWithCommentFlags = result.posts.map(post => ({
          ...post,
          showComments: false
        }));
        setPosts(postsWithCommentFlags);
      } else {
        console.error('Error fetching posts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePost = async (postData) => {
    try {
      const result = await createPost(postData);
      
      if (result.success) {
        // Add new post to the list with showComments initialized to false
        const newPost = {
          ...result.post,
          showComments: false // Initialize showComments flag for new posts
        };
        setPosts([newPost, ...posts]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating post:', error);
      return false;
    }
  };
  
  const handleLikePost = async (postId) => {
    try {
      const result = await toggleLikePost(postId);
      
      if (result.success) {
        // Update local state with proper like handling
        setPosts(prevPosts => 
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
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
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
  
  const handleAddComment = async (postId, commentText) => {
    try {
      if (!commentText.trim()) {
        return false;
      }
      
      const result = await addComment(postId, commentText);
      
      if (result.success) {
        // Get the post first to ensure we have the latest data
        const postToUpdate = posts.find(post => post.id === postId);
        
        if (postToUpdate) {
          // Make sure comments is an array, then add the new comment
          const existingComments = Array.isArray(postToUpdate.comments) ? postToUpdate.comments : [];
          
          // Make sure we don't add duplicate comments
          const isDuplicate = existingComments.some(comment => 
            comment.id === result.comment.id
          );
          
          if (!isDuplicate) {
            // Update local state with a proper immutable update
            setPosts(prevPosts => 
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
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };
  
  const handleMenuPress = () => {
    navigation.toggleDrawer();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      <View style={styles.appBar}>
        <TouchableOpacity 
          onPress={handleMenuPress}
          style={styles.menuButton}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>P2PSkillX</Text>
        <View style={styles.appBarRight} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <PostCreationCard 
          onCreatePost={handleCreatePost}
          userData={userData}
        />
        
        <TrendingSkills />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length > 0 ? (
          posts.map(post => (
          <Post 
            key={post.id} 
              post={post}
            navigation={navigation}
              onLike={handleLikePost}
              onComment={handleAddComment}
              onDelete={handleDeletePost}
              onToggleComments={(postId) => {
                // Toggle comment visibility for this post
                setPosts(prevPosts => 
                  prevPosts.map(p => 
                    p.id === postId 
                      ? { ...p, showComments: !(p.showComments === true) } 
                      : p
                  )
                );
              }}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No posts yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Be the first to share your knowledge!
            </Text>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      <BottomNavigation 
        activeScreen="Home" 
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
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    height: 60,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 16,
  },
  appBarRight: {
    width: 40,
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: 'space-around',
  },
  menuLine: {
    width: 24,
    height: 2.5,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E293B',
  },
  postTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  postMenu: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -2, /* Adjust to keep within container */
  },
  postMenuButton: {
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
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
  followButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingButton: {
    backgroundColor: '#E2E8F0',
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#334155',
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 250,
    marginBottom: 16,
  },
  skillBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skillBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  skillBadgeIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  skillBadgeName: {
    color: '#065F46',
    fontWeight: '500',
    fontSize: 12,
  },
  engagementStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 6,
    color: '#64748B',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  commentsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
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
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#334155',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    color: '#475569',
  },
  viewAllComments: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  viewCommentsButton: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewCommentsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCommentsText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },
  commentModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  commentModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  postPreview: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  postPreviewText: {
    fontSize: 14,
    color: '#475569',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitCommentButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  submitCommentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createPostCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 20,
    marginLeft: 12,
  },
  createPostPlaceholder: {
    color: '#64748B',
    fontSize: 14,
  },
  trendingContainer: {
    padding: 16,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  trendingScroll: {
    marginLeft: -6,
  },
  trendingItem: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  trendingItemText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 14,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  attachmentOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  attachmentText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  submitPostButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 76,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 16,
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
});

export default HomeScreen; 