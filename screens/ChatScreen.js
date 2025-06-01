import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { getUserConversations } from '../utils/chatService';

const ChatScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Load conversations from Firestore
  useEffect(() => {
    const unsubscribe = getUserConversations((updatedConversations) => {
      setConversations(updatedConversations);
      setLoading(false);
    });
    
    // Clean up listener when component unmounts
    return () => unsubscribe();
  }, []);
  
  // Filter conversations based on active tab
  const getFilteredConversations = () => {
    if (activeTab === 'All') {
      return conversations;
    } else if (activeTab === 'Unread') {
      return conversations.filter(conv => conv.unreadCount > 0);
    } else {
      // Drafts - empty for now
      return [];
    }
  };
  
  const handleTabPress = (tab, index) => {
    setActiveTab(tab);
    
    // Animate the indicator
    Animated.spring(tabIndicatorPosition, {
      toValue: index * (100 / 3), // Divide equally for 3 tabs
      useNativeDriver: false,
      friction: 8,
    }).start();
    
    // Show alert for empty tabs
    if ((tab === 'Unread' && !conversations.some(conv => conv.unreadCount > 0)) || 
        (tab === 'Drafts')) {
      Alert.alert(`No ${tab.toLowerCase()} messages`, 
                 `You don't have any ${tab.toLowerCase()} messages at the moment.`);
    }
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleMessagePress = (conversation) => {
    // Navigate to individual chat screen with the conversation data
    navigation.navigate('ChatDetail', { 
      conversationId: conversation.conversationId,
      otherUserName: conversation.otherUserDetails?.name || 'User',
      otherUserId: conversation.otherUserId,
      initials: getInitials(conversation.otherUserDetails?.name),
      color: getAvatarColor(conversation.otherUserId)
    });
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Generate consistent color from user ID
  const getAvatarColor = (userId) => {
    const colors = ['#7C3AED', '#2563EB', '#DC2626', '#047857', '#9333EA', '#EA580C'];
    if (!userId) return colors[0];
    
    // Simple hash function to get consistent color for the same userId
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Format the time/date for display
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // If today, show time
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within the last 7 days, show day name
    const daysAgo = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[messageDate.getDay()];
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  };
  
  // Header component with back button and search
  const Header = () => (
    <LinearGradient
      colors={['#3B82F6', '#2563EB']}
      style={styles.header}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chat</Text>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );
  
  // Tabs component with animated indicator
  const Tabs = () => (
    <View style={styles.tabsWrapper}>
      <View style={styles.tabsContainer}>
        {['All', 'Unread', 'Drafts'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => handleTabPress(tab, index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Animated indicator */}
      <Animated.View 
        style={[
          styles.tabIndicator, 
          { 
            left: tabIndicatorPosition.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }) 
          }
        ]} 
      />
    </View>
  );
  
  // Avatar component
  const Avatar = ({ initials, color, photoURL }) => {
    if (photoURL) {
      return (
        <Image source={{ uri: photoURL }} style={styles.avatar} />
      );
    }
    
    return (
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };
  
  // Message item component
  const MessageItem = ({ item }) => {
    const initials = getInitials(item.otherUserDetails?.name);
    const color = getAvatarColor(item.otherUserId);
    
    return (
      <TouchableOpacity 
        style={styles.messageItem}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.7}
      >
        <Avatar 
          initials={initials} 
          color={color} 
          photoURL={item.otherUserDetails?.photoURL} 
        />
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageName}>{item.otherUserDetails?.name || 'User'}</Text>
            <Text style={styles.messageTime}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          <View style={styles.messageTextWrapper}>
            <Text 
              style={[
                styles.messageText, 
                item.unreadCount > 0 && styles.unreadMessageText
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage || 'Start a conversation'}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No messages</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'All' 
          ? "Start a conversation with your contacts" 
          : activeTab === 'Unread' 
            ? "You don't have any unread messages" 
            : "You don't have any draft messages"}
      </Text>
      <TouchableOpacity 
        style={styles.newChatButton}
        onPress={() => navigation.navigate('UsersList')}
      >
        <Text style={styles.newChatButtonText}>Start a New Chat</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Loading component
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading conversations...</Text>
    </View>
  );
  
  const filteredConversations = getFilteredConversations();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      <Header />
      <Tabs />
      
      {loading ? (
        <LoadingState />
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={({ item }) => <MessageItem item={item} />}
          keyExtractor={item => item.conversationId}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.messageDivider} />}
          contentContainerStyle={styles.messagesList}
        />
      ) : (
        <EmptyState />
      )}
      
      {/* Add new chat button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('UsersList')}
      >
        <Ionicons name="create-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <BottomNavigation 
        navigation={navigation} 
        activeScreen="Messages"
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
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#1E293B',
  },
  tabsWrapper: {
    height: 48,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '33.33%',
    height: 3,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  messagesList: {
    paddingBottom: 80, // Space for bottom nav
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 12,
    color: '#64748B',
  },
  messageTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#64748B',
  },
  unreadMessageText: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    height: 20,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newChatButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChatScreen; 