import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Notification types
export const NOTIFICATION_TYPES = {
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  COURSE_ENROLLMENT: 'course_enrollment',
  USER_FOLLOW: 'user_follow',
  CREDIT_DEDUCTION: 'credit_deduction',
  FOLLOWING_POST: 'following_post',
  FOLLOWING_COURSE: 'following_course'
};

/**
 * Create a notification in Firestore
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createNotification = async (notificationData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Create a unique notification ID
    const notificationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // Set common notification fields
    const notificationToSave = {
      ...notificationData,
      timestamp: serverTimestamp(),
      read: false,
      id: notificationId
    };
    
    await setDoc(notificationRef, notificationToSave);
    
    return { success: true, notificationId };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification when someone likes a post
 * @param {string} postId - The ID of the post that was liked
 * @param {string} postOwnerId - The user ID of the post owner
 * @param {string} likedByUserId - The user ID of the person who liked the post
 * @param {Object} likedByUserData - User data of the person who liked the post
 * @param {string} postText - The text of the post (truncated if needed)
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createPostLikeNotification = async (
  postId, 
  postOwnerId, 
  likedByUserId, 
  likedByUserData, 
  postText
) => {
  // Don't create notification if the user likes their own post
  if (postOwnerId === likedByUserId) {
    return { success: true, skipped: true };
  }
  
  // Truncate post text if it's too long
  const truncatedText = postText.length > 50 
    ? `${postText.substring(0, 50)}...` 
    : postText;
  
  return createNotification({
    type: NOTIFICATION_TYPES.POST_LIKE,
    recipientId: postOwnerId,
    senderId: likedByUserId,
    senderName: `${likedByUserData.firstName || ''} ${likedByUserData.lastName || ''}`.trim(),
    senderInitials: `${(likedByUserData.firstName || '').charAt(0)}${(likedByUserData.lastName || '').charAt(0)}`.toUpperCase(),
    senderProfileImage: likedByUserData.profileImage || null,
    postId,
    postText: truncatedText,
    action: 'liked your post'
  });
};

/**
 * Create a notification when someone comments on a post
 * @param {string} postId - The ID of the post that was commented on
 * @param {string} postOwnerId - The user ID of the post owner
 * @param {string} commentByUserId - The user ID of the commenter
 * @param {Object} commentByUserData - User data of the commenter
 * @param {string} commentText - The text of the comment
 * @param {string} postText - The text of the post (truncated if needed)
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createPostCommentNotification = async (
  postId, 
  postOwnerId, 
  commentByUserId, 
  commentByUserData, 
  commentText,
  postText
) => {
  // Don't create notification if the user comments on their own post
  if (postOwnerId === commentByUserId) {
    return { success: true, skipped: true };
  }
  
  // Truncate comment text if it's too long
  const truncatedComment = commentText.length > 50 
    ? `${commentText.substring(0, 50)}...` 
    : commentText;
    
  // Truncate post text if it's too long
  const truncatedPost = postText.length > 30 
    ? `${postText.substring(0, 30)}...` 
    : postText;
  
  return createNotification({
    type: NOTIFICATION_TYPES.POST_COMMENT,
    recipientId: postOwnerId,
    senderId: commentByUserId,
    senderName: `${commentByUserData.firstName || ''} ${commentByUserData.lastName || ''}`.trim(),
    senderInitials: `${(commentByUserData.firstName || '').charAt(0)}${(commentByUserData.lastName || '').charAt(0)}`.toUpperCase(),
    senderProfileImage: commentByUserData.profileImage || null,
    postId,
    commentText: truncatedComment,
    postText: truncatedPost,
    action: 'commented on your post'
  });
};

/**
 * Create a notification when someone enrolls in a course
 * @param {string} courseId - The ID of the course
 * @param {string} courseOwnerId - The user ID of the course owner
 * @param {string} enrolledUserId - The user ID of the enrolled user
 * @param {Object} enrolledUserData - User data of the enrolled user
 * @param {string} courseTitle - The title of the course
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createCourseEnrollmentNotification = async (
  courseId, 
  courseOwnerId, 
  enrolledUserId, 
  enrolledUserData, 
  courseTitle
) => {
  // Don't create notification if the course owner enrolls in their own course
  if (courseOwnerId === enrolledUserId) {
    return { success: true, skipped: true };
  }
  
  return createNotification({
    type: NOTIFICATION_TYPES.COURSE_ENROLLMENT,
    recipientId: courseOwnerId,
    senderId: enrolledUserId,
    senderName: `${enrolledUserData.firstName || ''} ${enrolledUserData.lastName || ''}`.trim(),
    senderInitials: `${(enrolledUserData.firstName || '').charAt(0)}${(enrolledUserData.lastName || '').charAt(0)}`.toUpperCase(),
    senderProfileImage: enrolledUserData.profileImage || null,
    courseId,
    courseTitle,
    action: 'enrolled in your course'
  });
};

/**
 * Create a notification when someone follows a user
 * @param {string} followedUserId - The user ID of the person being followed
 * @param {string} followerUserId - The user ID of the follower
 * @param {Object} followerUserData - User data of the follower
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createUserFollowNotification = async (
  followedUserId, 
  followerUserId, 
  followerUserData
) => {
  // Don't create notification if the user follows themselves (which shouldn't happen)
  if (followedUserId === followerUserId) {
    return { success: true, skipped: true };
  }
  
  return createNotification({
    type: NOTIFICATION_TYPES.USER_FOLLOW,
    recipientId: followedUserId,
    senderId: followerUserId,
    senderName: `${followerUserData.firstName || ''} ${followerUserData.lastName || ''}`.trim(),
    senderInitials: `${(followerUserData.firstName || '').charAt(0)}${(followerUserData.lastName || '').charAt(0)}`.toUpperCase(),
    senderProfileImage: followerUserData.profileImage || null,
    action: 'started following you'
  });
};

/**
 * Create a notification when credits are deducted
 * @param {string} userId - The user ID whose credits were deducted
 * @param {number} amount - The amount of credits deducted
 * @param {string} reason - The reason for the deduction
 * @param {string} courseId - Optional course ID if related to a course
 * @param {string} courseTitle - Optional course title if related to a course
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createCreditDeductionNotification = async (
  userId,
  amount,
  reason,
  courseId = null,
  courseTitle = null
) => {
  return createNotification({
    type: NOTIFICATION_TYPES.CREDIT_DEDUCTION,
    recipientId: userId,
    creditsAmount: amount,
    reason,
    courseId,
    courseTitle,
    action: 'credits deducted from your account',
    // System notification has no sender
    systemNotification: true,
    senderName: 'System',
    senderInitials: 'SY',
  });
};

/**
 * Create a notification when someone you follow creates a post
 * @param {string} postId - The ID of the post that was created
 * @param {string} postOwnerId - The user ID of the post creator
 * @param {Object} postOwnerData - User data of the post creator
 * @param {string} postText - The text of the post (truncated if needed)
 * @param {Array<string>} followerIds - Array of user IDs who follow the post creator
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createFollowingPostNotification = async (
  postId,
  postOwnerId,
  postOwnerData,
  postText,
  followerIds
) => {
  if (!followerIds || followerIds.length === 0) {
    return { success: true, skipped: true };
  }
  
  // Truncate post text if it's too long
  const truncatedText = postText.length > 50 
    ? `${postText.substring(0, 50)}...` 
    : postText;
  
  try {
    // Create notifications for each follower
    const notificationPromises = followerIds.map(followerId => 
      createNotification({
        type: NOTIFICATION_TYPES.FOLLOWING_POST,
        recipientId: followerId,
        senderId: postOwnerId,
        senderName: `${postOwnerData.firstName || ''} ${postOwnerData.lastName || ''}`.trim(),
        senderInitials: `${(postOwnerData.firstName || '').charAt(0)}${(postOwnerData.lastName || '').charAt(0)}`.toUpperCase(),
        senderProfileImage: postOwnerData.profileImage || null,
        postId,
        postText: truncatedText,
        action: 'created a new post'
      })
    );
    
    await Promise.all(notificationPromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating following post notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification when someone you follow creates a course
 * @param {string} courseId - The ID of the course that was created
 * @param {string} courseOwnerId - The user ID of the course creator
 * @param {Object} courseOwnerData - User data of the course creator
 * @param {string} courseTitle - The title of the course
 * @param {Array<string>} followerIds - Array of user IDs who follow the course creator
 * @returns {Promise<Object>} - Result object with success flag
 */
export const createFollowingCourseNotification = async (
  courseId,
  courseOwnerId,
  courseOwnerData,
  courseTitle,
  followerIds
) => {
  if (!followerIds || followerIds.length === 0) {
    return { success: true, skipped: true };
  }
  
  try {
    // Create notifications for each follower
    const notificationPromises = followerIds.map(followerId => 
      createNotification({
        type: NOTIFICATION_TYPES.FOLLOWING_COURSE,
        recipientId: followerId,
        senderId: courseOwnerId,
        senderName: `${courseOwnerData.firstName || ''} ${courseOwnerData.lastName || ''}`.trim(),
        senderInitials: `${(courseOwnerData.firstName || '').charAt(0)}${(courseOwnerData.lastName || '').charAt(0)}`.toUpperCase(),
        senderProfileImage: courseOwnerData.profileImage || null,
        courseId,
        courseTitle,
        action: 'created a new course'
      })
    );
    
    await Promise.all(notificationPromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating following course notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notifications for the current user
 * @param {number} limitCount - Maximum number of notifications to fetch
 * @returns {Promise<Object>} - Result object with notifications array
 */
export const getUserNotifications = async (limitCount = 50) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', notifications: [] };
    }
    
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamp to JavaScript Date for easier handling
      const timestamp = data.timestamp instanceof Timestamp 
        ? data.timestamp.toDate() 
        : new Date();
      
      // Format the time relative to now (e.g., "2 hrs ago")
      const timeAgo = formatTimeAgo(timestamp);
      
      notifications.push({
        ...data,
        time: timeAgo
      });
    });
    
    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {Promise<Object>} - Result object with success flag
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await setDoc(notificationRef, { read: true }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - The ID of the notification to delete
 * @returns {Promise<Object>} - Result object with success flag
 */
export const deleteNotification = async (notificationId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await deleteDoc(notificationRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format a date as a relative time string (e.g., "2 hrs ago")
 * @param {Date} date - The date to format
 * @returns {string} - Formatted relative time string
 */
export const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    return `${diffYears}y ago`;
  }
}; 