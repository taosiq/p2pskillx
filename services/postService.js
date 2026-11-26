import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Create a new post
export const createPost = async (postData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get user data to include name with post
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }
    
    const userData = userDoc.data();
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const profileImage = userData.profileImage || null;
    
    // Generate initials from name
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    const initials = (firstInitial + lastInitial).toUpperCase() || 'U';
    
    // Create the post object
    const newPost = {
      userId: currentUser.uid,
      userName: `${firstName} ${lastName}`.trim() || 'User',
      userInitials: initials,
      userProfileImage: profileImage,
      text: postData.text,
      image: postData.image || null,
      likes: [],
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add post to Firestore
    const postRef = await addDoc(collection(db, 'posts'), newPost);
    
    // Add post ID to user's posts array
    await updateDoc(userDocRef, {
      posts: arrayUnion(postRef.id)
    });
    
    // Notify followers about the new post
    try {
      const userFollowers = userData.followers || [];
      
      if (userFollowers.length > 0) {
        // Import on demand to avoid circular dependency
        const { createFollowingPostNotification } = await import('./notificationService');
        
        // Create notifications for all followers
        await createFollowingPostNotification(
          postRef.id,
          currentUser.uid,
          userData,
          postData.text,
          userFollowers
        );
      }
    } catch (notificationError) {
      console.error('Error creating follower post notifications:', notificationError);
      // Don't fail the post creation if notifications fail
    }
    
    return { 
      success: true, 
      postId: postRef.id,
      post: {
        id: postRef.id,
        ...newPost,
        createdAt: new Date().toISOString() // For immediate display before server timestamp resolves
      }
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: error.message };
  }
};

// Get all posts for home feed
export const getAllPosts = async (max = 60) => {
  try {
    // Newest posts first, capped so the feed stays fast as the community grows
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max));
    const querySnapshot = await getDocs(q);
    
    const posts = [];
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      
      // Format timestamps for display
      const createdAt = postData.createdAt ? new Date(postData.createdAt.toDate()) : new Date();
      const timeAgo = getTimeAgo(createdAt);
      
      posts.push({
        id: doc.id,
        ...postData,
        createdAt: createdAt.toISOString(),
        timeAgo
      });
    });
    
    return { success: true, posts };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { success: false, error: error.message, posts: [] };
  }
};

// Get user's posts
export const getUserPosts = async (userId = null) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser && !userId) {
      return { success: false, error: 'No authenticated user', posts: [] };
    }
    
    const targetUserId = userId || currentUser.uid;
    
    // Query posts by user ID
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const posts = [];
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      
      // Format timestamps for display
      const createdAt = postData.createdAt ? new Date(postData.createdAt.toDate()) : new Date();
      const timeAgo = getTimeAgo(createdAt);
      
      posts.push({
        id: doc.id,
        ...postData,
        createdAt: createdAt.toISOString(),
        timeAgo
      });
    });
    
    return { success: true, posts };
  } catch (error) {
    console.error('Error getting user posts:', error);
    return { success: false, error: error.message, posts: [] };
  }
};

// Like or unlike a post
export const toggleLikePost = async (postId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return { success: false, error: 'Post not found' };
    }
    
    const postData = postDoc.data();
    const likes = postData.likes || [];
    const userLiked = likes.includes(currentUser.uid);
    
    // Toggle like status
    if (userLiked) {
      // Unlike
      await updateDoc(postRef, {
        likes: arrayRemove(currentUser.uid)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: arrayUnion(currentUser.uid)
      });
      
      // Only create notification when liking, not when unliking
      if (postData.userId !== currentUser.uid) {
        try {
          // Get current user data for notification
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Import on demand to avoid circular dependency
            const { createPostLikeNotification } = await import('./notificationService');
            
            // Create notification for post owner
            await createPostLikeNotification(
              postId,
              postData.userId,
              currentUser.uid,
              userData,
              postData.text
            );
          }
        } catch (notificationError) {
          console.error('Error creating like notification:', notificationError);
          // Don't fail the like operation if notification fails
        }
      }
    }
    
    return { 
      success: true, 
      liked: !userLiked,
      likeCount: userLiked ? likes.length - 1 : likes.length + 1
    };
  } catch (error) {
    console.error('Error toggling post like:', error);
    return { success: false, error: error.message };
  }
};

// Add comment to post
export const addComment = async (postId, commentText) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get user data for comment
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User profile not found' };
    }
    
    const userData = userDoc.data();
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const profileImage = userData.profileImage || null;
    
    // Create comment object - use regular Date instead of serverTimestamp()
    // because serverTimestamp() cannot be used with arrayUnion()
    const now = new Date();
    const newComment = {
      id: now.getTime().toString(), // Unique ID
      userId: currentUser.uid,
      userName: `${firstName} ${lastName}`.trim() || 'User',
      userInitials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U',
      userProfileImage: profileImage,
      text: commentText,
      createdAt: now.toISOString() // Use ISO string instead of serverTimestamp
    };
    
    // Update post with new comment
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      updatedAt: serverTimestamp() // serverTimestamp is ok here since it's direct in updateDoc
    });
    
    // Get post data to create notification
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const postData = postDoc.data();
      
      // Only create notification if commenting on someone else's post
      if (postData.userId !== currentUser.uid) {
        try {
          // Import on demand to avoid circular dependency
          const { createPostCommentNotification } = await import('./notificationService');
          
          // Create notification for post owner
          await createPostCommentNotification(
            postId,
            postData.userId,
            currentUser.uid,
            userData,
            commentText,
            postData.text
          );
        } catch (notificationError) {
          console.error('Error creating comment notification:', notificationError);
          // Don't fail the comment operation if notification fails
        }
      }
    }
    
    return { 
      success: true, 
      comment: newComment // Already has ISO string timestamp
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get the post to check ownership
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return { success: false, error: 'Post not found' };
    }
    
    const postData = postDoc.data();
    
    // Verify the current user is the post owner
    if (postData.userId !== currentUser.uid) {
      return { success: false, error: 'You can only delete your own posts' };
    }
    
    // Remove post ID from user's posts array in user document
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      posts: arrayRemove(postId)
    });
    
    // Delete the post document
    await deleteDoc(postRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to format time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}; 
// ---------- Safety (App Store guideline 1.2: report & block for user content) ----------

const REPORT_REASONS = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];
export { REPORT_REASONS };

// Report a post or user for moderation. Reports are write-only for clients.
export const reportContent = async ({ type, targetId, targetUserId, reason, details = '' }) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, error: 'No authenticated user' };
    if (!REPORT_REASONS.includes(reason)) return { success: false, error: 'Invalid reason' };
    await addDoc(collection(db, 'reports'), {
      type, // 'post' | 'user' | 'comment' | 'message' | 'course'
      targetId,
      targetUserId: targetUserId || null,
      reason,
      details: String(details).slice(0, 500),
      reporterId: currentUser.uid,
      status: 'open',
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.warn('Report failed:', error?.code);
    return { success: false, error: error.message };
  }
};

// Block a user: their posts, comments and messages are hidden from you.
export const blockUser = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser || targetUserId === currentUser.uid) return { success: false };
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { blocked: arrayUnion(targetUserId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const unblockUser = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false };
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { blocked: arrayRemove(targetUserId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { getTimeAgo };

/**
 * Older versions of the app saved the author's email on each post, where every
 * signed-in user could read it. Remove it from the current user's own posts.
 */
export const removeEmailFromMyPosts = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;
  const snap = await getDocs(query(collection(db, 'posts'), where('userId', '==', uid)));
  const legacy = snap.docs.filter((d) => d.data().userEmail !== undefined);
  await Promise.all(legacy.map((d) => updateDoc(d.ref, { userEmail: deleteField() })));
  return legacy.length;
};
