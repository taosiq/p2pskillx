import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import BottomNavigation from '../components/BottomNavigation';
import { NOTIFICATION_TYPES, deleteNotification, getUserNotifications, markNotificationAsRead } from '../services/notificationService';

// Avatar component for notifications
const Avatar = ({ initials, imageUrl, size = 40, color = '#4F8EF7' }) => {
  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }} 
        style={[
          styles.avatar, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2 
          }
        ]} 
      />
    );
  }
  
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

// Swipeable notification item with delete action
const SwipeableNotificationItem = ({ notification, onPress, onDelete }) => {
  const renderRightActions = (progress, dragX) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => onDelete(notification.id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
    >
      <NotificationItem notification={notification} onPress={onPress} />
    </Swipeable>
  );
};

// Individual notification item component
const NotificationItem = ({ notification, onPress }) => {
  // Generate a color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.POST_LIKE:
        return '#EF4444'; // Red for likes
      case NOTIFICATION_TYPES.POST_COMMENT:
        return '#3B82F6'; // Blue for comments
      case NOTIFICATION_TYPES.COURSE_ENROLLMENT:
        return '#10B981'; // Green for enrollments
      case NOTIFICATION_TYPES.USER_FOLLOW:
        return '#8B5CF6'; // Purple for follows
      case NOTIFICATION_TYPES.CREDIT_DEDUCTION:
        return '#F59E0B'; // Amber for credits
      case NOTIFICATION_TYPES.FOLLOWING_POST:
        return '#6366F1'; // Indigo for following posts
      case NOTIFICATION_TYPES.FOLLOWING_COURSE:
        return '#0EA5E9'; // Sky blue for following courses
      default:
        return '#4F8EF7'; // Default blue
    }
  };
  
  // Build notification message based on type
  const getNotificationTarget = (notification) => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.POST_LIKE:
        return notification.postText || 'your post';
      case NOTIFICATION_TYPES.POST_COMMENT:
        return notification.postText || 'your post';
      case NOTIFICATION_TYPES.COURSE_ENROLLMENT:
        return notification.courseTitle || 'your course';
      case NOTIFICATION_TYPES.USER_FOLLOW:
        return '';
      case NOTIFICATION_TYPES.CREDIT_DEDUCTION:
        return `${notification.creditsAmount} credits for ${notification.reason || 'a purchase'}`;
      case NOTIFICATION_TYPES.FOLLOWING_POST:
        return notification.postText || 'a new post';
      case NOTIFICATION_TYPES.FOLLOWING_COURSE:
        return notification.courseTitle || 'a new course';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        notification.read ? styles.notificationRead : null
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <Avatar 
        initials={notification.senderInitials || 'SY'} 
        imageUrl={notification.senderProfileImage}
        color={getNotificationColor(notification.type)} 
        size={44}
      />
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationName}>{notification.senderName || 'System'}</Text>
          <Text style={styles.notificationAction}> {notification.action}</Text>
        </View>
        {getNotificationTarget(notification) ? (
          <Text style={styles.notificationTarget}>{getNotificationTarget(notification)}</Text>
        ) : null}
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

// NotificationsScreen component
const NotificationsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedNotifications, setGroupedNotifications] = useState({
    today: [],
    thisWeek: [],
    earlier: []
  });

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await getUserNotifications(100);
      
      if (result.success) {
        setNotifications(result.notifications);
        groupNotifications(result.notifications);
      } else {
        console.error('Error fetching notifications:', result.error);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Group notifications by timeframe
  const groupNotifications = (notificationsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of the current week (Sunday)
    
    const groups = {
      today: [],
      thisWeek: [],
      earlier: []
    };
    
    notificationsList.forEach(notification => {
      // Use timestamp if it exists and is a Date, otherwise use current time
      const timestamp = notification.timestamp instanceof Date 
        ? notification.timestamp 
        : new Date();
      
      if (timestamp >= today) {
        groups.today.push(notification);
      } else if (timestamp >= thisWeekStart) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });
    
    setGroupedNotifications(groups);
  };

  // Handle notification deletion
  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await deleteNotification(notificationId);
      
      if (result.success) {
        // Update local state to remove the deleted notification
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        setNotifications(updatedNotifications);
        
        // Update grouped notifications
        setGroupedNotifications(prevGroups => {
          return {
            today: prevGroups.today.filter(n => n.id !== notificationId),
            thisWeek: prevGroups.thisWeek.filter(n => n.id !== notificationId),
            earlier: prevGroups.earlier.filter(n => n.id !== notificationId)
          };
        });
        
        // Show success message
        console.log('Notification deleted successfully');
      } else {
        console.error('Error deleting notification:', result.error);
        Alert.alert('Error', 'Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleDeleteNotification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const handleMenuPress = () => {
    console.log('Opening drawer');
    navigation.toggleDrawer();
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark notification as read
      if (!notification.read) {
        const result = await markNotificationAsRead(notification.id);
        
        if (result.success) {
          // Update the notification in local state
          setNotifications(prevNotifications => 
            prevNotifications.map(n => 
              n.id === notification.id ? { ...n, read: true } : n
            )
          );
          
          // Also update in grouped notifications
          setGroupedNotifications(prevGroups => {
            const updateGroup = group => 
              group.map(n => n.id === notification.id ? { ...n, read: true } : n);
              
            return {
              today: updateGroup(prevGroups.today),
              thisWeek: updateGroup(prevGroups.thisWeek),
              earlier: updateGroup(prevGroups.earlier)
            };
          });
        }
      }
      
      // Navigate based on notification type
      switch (notification.type) {
        case NOTIFICATION_TYPES.POST_LIKE:
        case NOTIFICATION_TYPES.POST_COMMENT:
          if (notification.postId) {
            // TODO: Navigate to post detail when implemented
            Alert.alert('Post', 'Navigating to post details coming soon!');
          }
          break;
          
        case NOTIFICATION_TYPES.COURSE_ENROLLMENT:
        case NOTIFICATION_TYPES.FOLLOWING_COURSE:
          if (notification.courseId) {
            navigation.navigate('CourseAccess', { courseId: notification.courseId });
          }
          break;
          
        case NOTIFICATION_TYPES.USER_FOLLOW:
          if (notification.senderId) {
            navigation.navigate('Profile', { 
              userId: notification.senderId,
              timestamp: new Date().getTime()
            });
          }
          break;
          
        case NOTIFICATION_TYPES.FOLLOWING_POST:
          if (notification.postId) {
            // TODO: Navigate to post detail when implemented
            Alert.alert('Post', 'Navigating to post details coming soon!');
          }
          break;
          
        default:
          // For other notification types, no navigation
          break;
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleSearchPress = () => {
    setShowSearch(!showSearch);
  };

  // Filter notifications based on search query
  const getFilteredNotifications = () => {
    if (!searchQuery.trim()) {
      return notifications;
    }
    
    const query = searchQuery.toLowerCase();
    return notifications.filter(notification => 
      (notification.senderName && notification.senderName.toLowerCase().includes(query)) ||
      (notification.action && notification.action.toLowerCase().includes(query)) ||
      (notification.postText && notification.postText.toLowerCase().includes(query)) ||
      (notification.courseTitle && notification.courseTitle.toLowerCase().includes(query))
    );
  };

  // Render notification section with title
  const renderNotificationSection = (title, data) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View>
        <Text style={styles.sectionLabel}>{title}</Text>
        {data.map(item => (
          <SwipeableNotificationItem 
            key={item.id}
            notification={item} 
            onPress={handleNotificationPress}
            onDelete={handleDeleteNotification}
          />
        ))}
      </View>
    );
  };

  // Render content based on search or regular view
  const renderNotificationContent = () => {
    if (searchQuery.trim()) {
      const filtered = getFilteredNotifications();
      
      return filtered.length > 0 ? (
        filtered.map(item => (
          <SwipeableNotificationItem 
            key={item.id}
            notification={item} 
            onPress={handleNotificationPress}
            onDelete={handleDeleteNotification}
          />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No notifications match your search</Text>
        </View>
      );
    } else {
      // Show grouped notifications
      return (
        <>
          {renderNotificationSection('Today', groupedNotifications.today)}
          {renderNotificationSection('This Week', groupedNotifications.thisWeek)}
          {renderNotificationSection('Earlier', groupedNotifications.earlier)}
          
          {notifications.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>You don't have any notifications yet</Text>
            </View>
          )}
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>P2PSkillX</Text>
        <View style={{width: 24}} />
      </LinearGradient>
      
      {/* Notifications header with search */}
      <View style={styles.notificationsHeader}>
        <Text style={styles.notificationsTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSearchPress} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      
      {/* Search bar - conditionally rendered */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setShowSearch(false);
            }}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Notifications content */}
      <View style={styles.notificationsContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={[]} // Empty data since we're using custom rendering
            renderItem={null}
            ListHeaderComponent={renderNotificationContent}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={['#3B82F6']}
              />
            }
          />
        )}
      </View>
      
      <BottomNavigation 
        activeScreen="Notifications" 
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
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    zIndex: 1,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Notifications header
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Search bar
  searchBarContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    height: 40,
    padding: 0,
  },
  
  // Notifications content
  notificationsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 20,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginHorizontal: 0,
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  
  // Notification item
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  notificationRead: {
    backgroundColor: '#F8FAFC',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  notificationName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  notificationAction: {
    fontSize: 14,
    color: '#666666',
  },
  notificationTarget: {
    fontSize: 14,
    color: '#333333',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  
  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Loading & empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Delete action style
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
});

export default NotificationsScreen; 