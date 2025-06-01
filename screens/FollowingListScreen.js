import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
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
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../config/firebase';
import { followUser, unfollowUser } from '../services/userService';

const FollowingListScreen = ({ navigation, route }) => {
  const { userId, userName, isCurrentUser } = route.params;
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      
      // Get user document to access their following list
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const followingIds = userData.following || [];
      
      if (followingIds.length === 0) {
        setFollowing([]);
        setLoading(false);
        return;
      }
      
      // Query to get details of each following user
      const followingData = [];
      
      // Use Promise.all to process all queries in parallel
      await Promise.all(followingIds.map(async (followingId) => {
        const followingRef = doc(db, 'users', followingId);
        const followingDoc = await getDoc(followingRef);
        
        if (followingDoc.exists()) {
          const data = followingDoc.data();
          
          followingData.push({
            id: followingId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            profileImage: data.profileImage || null,
            email: data.email || '',
            isFollowing: true // Since this is from the following list, all are being followed
          });
        }
      }));
      
      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching following:', error);
      Alert.alert('Error', 'Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (user) => {
    if (!isCurrentUser) {
      return; // Only the current user can toggle following
    }
    
    try {
      // Show loading state for this specific user
      setProcessingUser(user.id);
      
      let result;
      
      if (user.isFollowing) {
        // Unfollow the user
        result = await unfollowUser(user.id);
      } else {
        // Follow the user
        result = await followUser(user.id);
      }
      
      if (result.success) {
        // Update the local state
        setFollowing(prevFollowing => {
          if (user.isFollowing) {
            // If we were unfollowing, remove from the list
            return prevFollowing.filter(u => u.id !== user.id);
          } else {
            // If we were following, update the isFollowing status
            return prevFollowing.map(u => 
              u.id === user.id ? { ...u, isFollowing: true } : u
            );
          }
        });
        
        // For already following/not following cases, don't show alerts
        if (result.alreadyFollowing || result.notFollowing) {
          return;
        }
      } else {
        // Show specific error message
        Alert.alert(
          'Action Failed', 
          result.error || 'Failed to update follow status. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert(
        'Error', 
        'There was a problem processing your request. Please check your internet connection and try again.'
      );
    } finally {
      setProcessingUser(null);
    }
  };

  const handleUserPress = (user) => {
    navigation.navigate('Profile', { 
      userId: user.id,
      timestamp: new Date().getTime()
    });
  };

  const renderInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCurrentUser ? 'Following' : `${userName}'s Following`}
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading following...</Text>
        </View>
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {isCurrentUser 
              ? "You aren't following anyone yet."
              : `${userName} isn't following anyone yet.`
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {following.map(user => (
            <View key={user.id} style={styles.userItem}>
              <TouchableOpacity 
                style={styles.userInfo}
                onPress={() => handleUserPress(user)}
              >
                {user.profileImage ? (
                  <Image 
                    source={{ uri: user.profileImage }} 
                    style={styles.userAvatar} 
                  />
                ) : (
                  <View style={styles.userInitialsContainer}>
                    <Text style={styles.userInitialsText}>
                      {renderInitials(user.firstName, user.lastName)}
                    </Text>
                  </View>
                )}
                <View style={styles.userName}>
                  <Text style={styles.userFullName}>
                    {`${user.firstName} ${user.lastName}`.trim() || 'User'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {isCurrentUser && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    user.isFollowing ? styles.followingButton : null
                  ]}
                  onPress={() => handleToggleFollow(user)}
                  disabled={processingUser === user.id}
                >
                  {processingUser === user.id ? (
                    <ActivityIndicator size="small" color={user.isFollowing ? "#3B82F6" : "#FFFFFF"} />
                  ) : (
                    <Text style={[
                      styles.followButtonText,
                      user.isFollowing ? styles.followingButtonText : null
                    ]}>
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 40, // To balance with back button
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInitialsContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitialsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    marginLeft: 16,
  },
  userFullName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  followButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default FollowingListScreen; 