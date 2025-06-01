import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Firebase collections structure:
 * - conversations: stores metadata about conversations
 *   - participants: array of userIds involved in the conversation
 *   - lastMessage: preview of the most recent message
 *   - lastMessageTime: timestamp of the most recent message
 *   - createdAt: when the conversation started
 * 
 * - messages: stores individual messages
 *   - conversationId: reference to parent conversation
 *   - senderId: userId of sender
 *   - text: message content
 *   - timestamp: when the message was sent
 *   - read: whether the message has been read
 *   - attachments: optional array of attachment URLs
 */

/**
 * Start a new conversation or get existing one between users
 * @param {string} otherUserId - The ID of the user to chat with
 * @returns {Promise<string>} - The conversation ID
 */
export const createOrGetConversation = async (otherUserId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      throw new Error('You must be signed in to chat');
    }
    
    if (currentUserId === otherUserId) {
      throw new Error('Cannot create conversation with yourself');
    }
    
    // Check if a conversation already exists between these users
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let existingConversation = null;
    
    querySnapshot.forEach((doc) => {
      const conversationData = doc.data();
      if (conversationData.participants.includes(otherUserId)) {
        existingConversation = {
          id: doc.id,
          ...conversationData
        };
      }
    });
    
    if (existingConversation) {
      return existingConversation.id;
    }
    
    // Create a new conversation
    const conversationData = {
      participants: [currentUserId, otherUserId],
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: ''
    };
    
    const newConversationRef = await addDoc(conversationsRef, conversationData);
    
    // Also update user documents to keep track of their conversations
    await updateDoc(doc(db, 'users', currentUserId), {
      conversations: arrayUnion(newConversationRef.id)
    });
    
    await updateDoc(doc(db, 'users', otherUserId), {
      conversations: arrayUnion(newConversationRef.id)
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {string} text - The message content
 * @param {Array} attachments - Optional attachments (URLs)
 * @returns {Promise<string>} - The message ID
 */
export const sendMessage = async (conversationId, text, attachments = []) => {
  try {
    console.log("Starting sendMessage for conversation:", conversationId);
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      console.error("Send message failed: User not authenticated");
      throw new Error('You must be signed in to send messages');
    }
    
    // Create the message
    const messageData = {
      conversationId,
      senderId: currentUserId,
      text,
      timestamp: serverTimestamp(),
      read: false,
      attachments
    };
    
    console.log("Message data being sent:", messageData);
    
    const messagesRef = collection(db, 'messages');
    const newMessageRef = await addDoc(messagesRef, messageData);
    console.log("Message created with ID:", newMessageRef.id);
    
    // Update the conversation with the last message
    const conversationRef = doc(db, 'conversations', conversationId);
    const lastMessagePreview = text.length > 30 ? text.substring(0, 30) + '...' : text;
    
    await updateDoc(conversationRef, {
      lastMessage: lastMessagePreview,
      lastMessageTime: serverTimestamp()
    });
    console.log("Conversation updated with last message");
    
    return newMessageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get all messages for a conversation
 * @param {string} conversationId - The ID of the conversation
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} - Unsubscribe function
 */
export const getMessages = (conversationId, callback) => {
  try {
    console.log("Setting up messages listener for conversation:", conversationId);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    
    console.log("Query params:", {
      collection: "messages",
      where: `conversationId == ${conversationId}`,
      orderBy: "timestamp asc"
    });
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Message snapshot received, count:", snapshot.size);
      
      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Message document:", doc.id, "data:", data);
        
        let timestamp;
        try {
          // Handle different timestamp formats
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp && data.timestamp.seconds) {
            // Handle Firestore timestamp object format
            timestamp = new Date(data.timestamp.seconds * 1000 + (data.timestamp.nanoseconds || 0) / 1000000);
          } else {
            timestamp = new Date();
          }
        } catch (error) {
          console.error("Error converting timestamp:", error);
          timestamp = new Date();
        }
        
        messages.push({
          id: doc.id,
          ...data,
          timestamp: timestamp
        });
      });
      
      console.log("Total messages processed:", messages.length);
      callback(messages);
    }, (error) => {
      console.error('Error in messages snapshot listener:', error);
      
      // Enhanced error debugging for permissions
      if (error.code === 'permission-denied') {
        const currentUserId = auth.currentUser?.uid;
        console.error(`Permission denied error. Current user: ${currentUserId}, Conversation ID: ${conversationId}`);
        console.error("This is likely a Firebase rules issue. Make sure your rules allow this user to access this conversation.");
      }
      
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<void>}
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      console.log("No current user, skipping markMessagesAsRead");
      return;
    }
    
    console.log(`Marking messages as read in conversation ${conversationId} for user ${currentUserId}`);
    
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('senderId', '!=', currentUserId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} unread messages to mark as read`);
    
    if (querySnapshot.size === 0) {
      return; // No messages to update
    }
    
    const batch = db.batch();
    
    querySnapshot.forEach((document) => {
      const messageRef = doc(db, 'messages', document.id);
      batch.update(messageRef, { read: true });
      console.log(`Marking message ${document.id} as read`);
    });
    
    await batch.commit();
    console.log("Successfully marked messages as read");
  } catch (error) {
    console.error('Error marking messages as read:', error);
    
    // Enhanced error debugging for permissions
    if (error.code === 'permission-denied') {
      const currentUserId = auth.currentUser?.uid;
      console.error(`Permission denied error in markMessagesAsRead. Current user: ${currentUserId}, Conversation ID: ${conversationId}`);
      console.error("This is likely a Firebase rules issue. Make sure your rules allow this user to update messages in this conversation.");
    }
  }
};

/**
 * Get user details for conversation
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - User details
 */
export const getUserDetailsForChat = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        userId: userDoc.id,
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
        photoURL: userData.profileImage || null,
        // Add any other user details needed for the chat
      };
    } else {
      return { userId, name: 'User', photoURL: null };
    }
  } catch (error) {
    console.error('Error getting user details:', error);
    return { userId, name: 'User', photoURL: null };
  }
};

/**
 * Start a conversation with a course creator
 * @param {string} courseId - The ID of the course
 * @param {string} creatorId - The ID of the course creator
 * @returns {Promise<string>} - The conversation ID
 */
export const createCourseConversation = async (courseId, creatorId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      throw new Error('You must be signed in to chat');
    }
    
    if (currentUserId === creatorId) {
      throw new Error('Cannot create a conversation with yourself');
    }
    
    // Check if a conversation already exists for this course
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    
    let existingConversation = null;
    
    querySnapshot.forEach((doc) => {
      const conversationData = doc.data();
      if (
        conversationData.participants.includes(creatorId) && 
        conversationData.courseId === courseId
      ) {
        existingConversation = {
          id: doc.id,
          ...conversationData
        };
      }
    });
    
    if (existingConversation) {
      return existingConversation.id;
    }
    
    // Create a new conversation
    const conversationData = {
      participants: [currentUserId, creatorId],
      courseId, // Save the course ID for reference
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: ''
    };
    
    const newConversationRef = await addDoc(conversationsRef, conversationData);
    
    // Also update user documents to keep track of their conversations
    await updateDoc(doc(db, 'users', currentUserId), {
      conversations: arrayUnion(newConversationRef.id)
    });
    
    await updateDoc(doc(db, 'users', creatorId), {
      conversations: arrayUnion(newConversationRef.id)
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error('Error creating course conversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for the current user
 * @param {function} callback - Callback function for real-time updates
 * @returns {function} - Unsubscribe function
 */
export const getUserConversations = (callback) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      console.error("No current user found");
      callback([]);
      return () => {};
    }
    
    console.log(`Setting up conversations listener for user ${currentUserId}`);
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`Received ${snapshot.size} conversations`);
      
      const conversations = [];
      
      // Use Promise.all to handle all async operations in parallel
      const conversationPromises = snapshot.docs.map(async (doc) => {
        const conversation = doc.data();
        
        // Find the other participant's ID
        const otherUserId = conversation.participants.find(id => id !== currentUserId);
        
        if (!otherUserId) {
          console.error(`No other user found in conversation ${doc.id}`);
          return null;
        }
        
        try {
          // Get the other user's details
          const otherUserDetails = await getUserDetailsForChat(otherUserId);
          
          // Get unread message count
          const unreadCount = await getUnreadMessageCount(doc.id);
          
          // Create conversation object with all details
          return {
            conversationId: doc.id,
            otherUserId,
            otherUserDetails,
            lastMessage: conversation.lastMessage || '',
            lastMessageTime: conversation.lastMessageTime ? 
              (conversation.lastMessageTime.toDate ? conversation.lastMessageTime.toDate() : new Date(conversation.lastMessageTime)) : 
              new Date(),
            unreadCount,
            courseId: conversation.courseId || null, // Include courseId if this is a course conversation
          };
        } catch (error) {
          console.error(`Error processing conversation ${doc.id}:`, error);
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(conversationPromises);
      
      // Filter out null results and sort by lastMessageTime
      const validConversations = results
        .filter(conv => conv !== null)
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      
      console.log(`Processed ${validConversations.length} valid conversations`);
      callback(validConversations);
    }, (error) => {
      console.error('Error in conversations snapshot listener:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up conversations listener:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Get the count of unread messages in a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<number>} - The unread message count
 */
export const getUnreadMessageCount = async (conversationId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      return 0;
    }
    
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('senderId', '!=', currentUserId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Delete a message (actually marks as deleted to preserve conversation flow)
 * @param {string} messageId - The message ID to delete
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      text: '[This message was deleted]',
      deleted: true
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Check if the user is in a conversation
 * @param {string} conversationId - The conversation to check
 * @returns {Promise<boolean>} - Whether the user is in the conversation
 */
export const isUserInConversation = async (conversationId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      return false;
    }
    
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return false;
    }
    
    const data = conversationSnap.data();
    return data.participants.includes(currentUserId);
  } catch (error) {
    console.error('Error checking conversation membership:', error);
    return false;
  }
};

/**
 * Validate Firebase rules and permissions
 * This function helps debug permission issues by explicitly checking all required conditions
 * @param {string} conversationId - The conversation ID to validate
 * @returns {Promise<object>} - Validation results with detailed information
 */
export const validateFirestoreRules = async (conversationId) => {
  try {
    const currentUserId = auth.currentUser?.uid;
    const results = {
      isAuthenticated: false,
      conversationExists: false,
      isParticipant: false,
      authStatus: null,
      errors: []
    };
    
    // Check authentication
    if (!currentUserId) {
      results.errors.push("User not authenticated");
      console.error("Rule validation failed: User not authenticated");
      return results;
    }
    
    results.isAuthenticated = true;
    results.authStatus = {
      uid: currentUserId,
      email: auth.currentUser?.email || 'unknown'
    };
    
    // Check if conversation exists
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      results.errors.push("Conversation does not exist");
      console.error(`Rule validation failed: Conversation ${conversationId} does not exist`);
      return results;
    }
    
    results.conversationExists = true;
    
    // Check if user is a participant
    const conversationData = conversationSnap.data();
    if (!conversationData.participants.includes(currentUserId)) {
      results.errors.push("User is not a participant in the conversation");
      console.error(`Rule validation failed: User ${currentUserId} is not a participant in conversation ${conversationId}`);
      console.error("Participants:", conversationData.participants);
      return results;
    }
    
    results.isParticipant = true;
    
    // Try to read a test message to verify read permissions
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        limit(1)
      );
      
      await getDocs(q);
      results.canReadMessages = true;
    } catch (error) {
      results.canReadMessages = false;
      results.errors.push(`Cannot read messages: ${error.message}`);
      console.error("Rule validation failed: Cannot read messages", error);
    }
    
    // All validations passed
    if (results.errors.length === 0) {
      console.log(`Rule validation passed for conversation ${conversationId}`);
    }
    
    return results;
  } catch (error) {
    console.error("Error validating Firestore rules:", error);
    return {
      isAuthenticated: false,
      conversationExists: false,
      isParticipant: false,
      errors: [`Rule validation error: ${error.message}`]
    };
  }
}; 