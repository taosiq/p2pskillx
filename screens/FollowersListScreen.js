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
import { auth, db } from '../config/firebase';
import { removeFollower } from '../services/userService';

const FollowersListScreen = ({ navigation, route }) => {
  const { userId, userName, isCurrentUser } = route.params;
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingUser, setRemovingUser] = useState(null);

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      
      // Get user document to access their followers list
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const followerIds = userData.followers || [];
      
      if (followerIds.length === 0) {
        setFollowers([]);
        setLoading(false);
        return;
      }
      
      // Query to get details of each follower
      const followersData = [];
      
      // Use Promise.all to process all queries in parallel
      await Promise.all(followerIds.map(async (followerId) => {
        const followerRef = doc(db, 'users', followerId);
        const followerDoc = await getDoc(followerRef);
        
        if (followerDoc.exists()) {
          const data = followerDoc.data();
          
          // Check if current user is following this user
          const currentUserRef = doc(db, 'users', auth.currentUser?.uid);
          const currentUserDoc = await getDoc(currentUserRef);
          const currentUserData = currentUserDoc.data();
          const following = currentUserData.following || [];
          const isFollowing = following.includes(followerId);
          
          followersData.push({
            id: followerId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            profileImage: data.profileImage || null,
            email: data.email || '',
            isFollowing
          });
        }
      }));
      
      setFollowers(followersData);
    } catch (error) {
      console.error('Error fetching followers:', error);
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      // Show loading state for this specific user
      setRemovingUser(followerId);
      
      const result = await removeFollower(followerId);
      
      if (result.success) {
        // Remove from local state
        setFollowers(prevFollowers => prevFollowers.filter(user => user.id !== followerId));
        
        // For not following cases, don't show alerts
        if (result.notFollowing) {
          return;
        }
      } else {
        // Show specific error message
        Alert.alert(
          'Remove Failed', 
          result.error || 'Failed to remove follower. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error removing follower:', error);
      Alert.alert(
        'Error', 
        'There was a problem processing your request. Please check your internet connection and try again.'
      );
    } finally {
      setRemovingUser(null);
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
          {isCurrentUser ? 'Your Followers' : `${userName}'s Followers`}
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {isCurrentUser 
              ? "You don't have any followers yet."
              : `${userName} doesn't have any followers yet.`
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {followers.map(user => (
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
                  style={styles.removeButton}
                  onPress={() => handleRemoveFollower(user.id)}
                  disabled={removingUser === user.id}
                >
                  {removingUser === user.id ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text style={styles.removeButtonText}>Remove</Text>
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
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
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

export default FollowersListScreen; 