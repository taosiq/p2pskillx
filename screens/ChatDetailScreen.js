import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../config/firebase';
import { getMessages, markMessagesAsRead, sendMessage } from '../utils/chatService';

const ChatDetailScreen = ({ route, navigation }) => {
  const { conversationId, otherUserName, otherUserId, initials, color, courseId } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const flatListRef = useRef();
  const currentUserId = auth.currentUser?.uid; // Get actual user ID
  
  // Load messages and set up real-time listener
  useEffect(() => {
    if (!conversationId) {
      console.error('No conversation ID provided');
      setLoading(false);
      return;
    }
    
    console.log(`Setting up message listener for conversation ${conversationId}`);
    
    // Set up real-time listener for messages
    const unsubscribe = getMessages(conversationId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
      
      // Mark messages as read when conversation is opened
      markMessagesAsRead(conversationId)
        .catch(error => console.error('Error marking messages as read:', error));
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [conversationId]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const today = new Date();
    
    // Check if message is from today
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    
    // Check if message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    
    // For other dates show the full date
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    
    setSending(true);
    
    try {
      // Send message using Firestore
      await sendMessage(conversationId, text.trim());
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Group messages by date for date separators
  const groupMessagesByDate = () => {
    if (!messages || messages.length === 0) {
      return [];
    }
    
    const groups = {};
    
    messages.forEach(message => {
      const date = formatMessageDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    const result = [];
    Object.keys(groups).forEach(date => {
      // Add date separator
      result.push({
        id: `date-${date}`,
        type: 'date',
        date
      });
      
      // Add messages for this date
      groups[date].forEach(message => {
        result.push({
          ...message,
          type: 'message'
        });
      });
    });
    
    return result;
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Future implementation: Actually delete from Firestore
            Alert.alert('Feature Coming Soon', 'Message deletion will be available soon.');
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }
    
    const isCurrentUser = item.senderId === currentUserId;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {item.deleted ? (
          <View style={styles.deletedMessage}>
            <Text style={styles.deletedMessageText}>{item.text}</Text>
          </View>
        ) : (
          <View style={styles.messageWrapper}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
            
            <View style={styles.messageFooter}>
              <Text style={styles.messageTime}>
                {formatTime(item.timestamp)}
              </Text>
              
              {isCurrentUser && (
                <View style={styles.statusIndicator}>
                  {item.read ? (
                    <Ionicons name="checkmark-done" size={16} color="#3B82F6" />
                  ) : (
                    <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                  )}
                </View>
              )}
            </View>
            
            {isCurrentUser && (
              <TouchableOpacity 
                style={styles.messageOptions}
                onPress={() => handleDeleteMessage(item.id)}
              >
                <MaterialIcons name="more-vert" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerUser}>
          <View style={[styles.userAvatar, { backgroundColor: color || '#3B82F6' }]}>
            <Text style={styles.userInitials}>
              {initials || (otherUserName ? otherUserName.substring(0, 2).toUpperCase() : 'U')}
            </Text>
          </View>
          
          <Text style={styles.userName}>{otherUserName || 'User'}</Text>
          
          {courseId && (
            <Text style={styles.courseTag}>Course Chat</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={groupMessagesByDate()}
            renderItem={renderItem}
            keyExtractor={item => item.id || `${item.timestamp}-${Math.random()}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 90}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={text}
                onChangeText={setText}
                multiline
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!text.trim() || sending) && styles.disabledButton
                ]}
                onPress={handleSend}
                disabled={!text.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  courseTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  statusIndicator: {
    marginLeft: 8,
  },
  messageOptions: {
    padding: 8,
    marginLeft: 4,
  },
  deletedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  deletedMessageText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
});

export default ChatDetailScreen; 