import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { validateFirestoreRules } from './chatService';

/**
 * Utility function to test database permissions
 * Run this when experiencing permissions issues to determine the exact cause
 */
export const testDatabasePermissions = async (conversationId = null) => {
  try {
    const currentUser = auth.currentUser;
    
    console.log("=== Testing Database Permissions ===");
    console.log("User authentication status:", currentUser ? "Authenticated" : "Not authenticated");
    
    if (currentUser) {
      console.log("User ID:", currentUser.uid);
      console.log("User email:", currentUser.email);
      
      // Test reading user document
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        console.log("Can read user document:", userDoc.exists());
        if (userDoc.exists()) {
          console.log("User data:", userDoc.data());
        }
      } catch (error) {
        console.error("Error reading user document:", error.message);
      }
      
      // Test reading conversations
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', currentUser.uid));
        const snapshot = await getDocs(q);
        
        console.log("Found conversations:", snapshot.size);
        
        if (snapshot.size > 0) {
          snapshot.forEach(doc => {
            console.log("Conversation ID:", doc.id);
            console.log("Conversation data:", doc.data());
          });
          
          // If no specific conversation ID was provided, use the first one
          if (!conversationId && snapshot.size > 0) {
            const firstDoc = snapshot.docs[0];
            conversationId = firstDoc.id;
            console.log("Using first conversation for further testing:", conversationId);
          }
        }
      } catch (error) {
        console.error("Error reading conversations:", error.message);
      }
      
      // If we have a conversation ID, test permissions on it
      if (conversationId) {
        console.log("\n=== Testing specific conversation ===");
        console.log("Conversation ID:", conversationId);
        
        const validationResults = await validateFirestoreRules(conversationId);
        console.log("Validation results:", validationResults);
        
        if (validationResults.errors.length > 0) {
          console.error("Validation errors:", validationResults.errors);
        }
      }
    }
    
    return "Test completed. Check console for results.";
  } catch (error) {
    console.error("Error testing database permissions:", error);
    return `Test failed: ${error.message}`;
  }
};

/**
 * Creates a test conversation and message for debugging
 * This is helpful to verify that your rules are working correctly
 * @returns {Promise<string>} - The test conversation ID
 */
export const createTestConversation = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    // Create a test user if it doesn't exist
    const testUserId = "test_user_" + Date.now();
    await setDoc(doc(db, 'users', testUserId), {
      name: "Test User",
      email: "test@example.com",
      conversations: []
    });
    
    // Create a test conversation
    const conversationId = "test_conversation_" + Date.now();
    await setDoc(doc(db, 'conversations', conversationId), {
      participants: [currentUser.uid, testUserId],
      lastMessage: "Test message",
      lastMessageTime: new Date(),
      createdAt: new Date()
    });
    
    // Create a test message
    const messageId = "test_message_" + Date.now();
    await setDoc(doc(db, 'messages', messageId), {
      conversationId: conversationId,
      senderId: currentUser.uid,
      text: "This is a test message",
      timestamp: new Date(),
      read: false
    });
    
    console.log("Test conversation created:", conversationId);
    return conversationId;
  } catch (error) {
    console.error("Error creating test conversation:", error);
    throw error;
  }
}; 