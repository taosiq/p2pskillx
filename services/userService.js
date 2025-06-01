import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

// Register a new user
export const registerUser = async (userData) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Get the user's UID
    const uid = userCredential.user.uid;
    
    // Create user document in Firestore (without password)
    const { password, ...userDataWithoutPassword } = userData;
    
    await setDoc(doc(db, 'users', uid), {
      ...userDataWithoutPassword,
      credits: 100, // Default initial credits
      xp: 0,
      level: 1,
      badgeType: 'Bronze',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true, uid };
  } catch (error) {
    console.error('Error registering user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to register user' 
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    console.error('Error logging in:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to log in' 
    };
  }
};

// Get current user data
export const getCurrentUser = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    return { 
      success: true, 
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        ...userDoc.data()
      }
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to get user data' 
    };
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Update user document
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...userData,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update profile' 
    };
  }
};

// Upload profile image
export const uploadProfileImage = async (imageUri) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Convert image uri to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
    
    // Upload image
    const uploadTask = await uploadBytesResumable(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);
    
    // Update user profile in Firestore
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      profileImage: downloadURL
    });
    
    return { success: true, imageUrl: downloadURL };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { success: false, error: error.message };
  }
};

// Delete profile image
export const deleteProfileImage = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Create storage reference
    const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
    
    // Delete image from storage
    await deleteObject(storageRef);
    
    // Update user profile in Firestore
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      profileImage: null
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return { success: false, error: error.message };
  }
};

// Get user's current credits
export const getUserCredits = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', credits: 0 };
    }
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, credits: userData.credits || 0 };
    } else {
      return { success: false, error: 'User document not found', credits: 0 };
    }
  } catch (error) {
    console.error('Error getting user credits:', error);
    return { success: false, error: error.message, credits: 0 };
  }
};

// Update user's credits (add or deduct)
export const updateUserCredits = async (amount, isDeduction = false) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get current credits
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.credits || 0;
    
    // Calculate new credits
    let newCredits;
    if (isDeduction) {
      // Check if user has enough credits
      if (currentCredits < amount) {
        return { 
          success: false, 
          error: 'Insufficient credits', 
          currentCredits,
          requiredCredits: amount 
        };
      }
      newCredits = currentCredits - amount;
    } else {
      newCredits = currentCredits + amount;
    }
    
    // Update credits in database
    await updateDoc(userDocRef, { credits: newCredits });
    
    // Return success with updated credits
    return { 
      success: true, 
      previousCredits: currentCredits,
      currentCredits: newCredits,
      difference: isDeduction ? -amount : amount
    };
  } catch (error) {
    console.error('Error updating user credits:', error);
    return { success: false, error: error.message };
  }
};

// Specific function to deduct credits for course access
export const deductCreditsForCourse = async (courseId, requiredCredits) => {
  try {
    console.log(`Starting credit deduction for course: ${courseId}, credits: ${requiredCredits}`);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('No authenticated user found');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course details to verify credit amount
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (!courseDoc.exists()) {
      console.log('Course not found');
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    requiredCredits = courseData.credits || requiredCredits;
    console.log(`Course found. Required credits: ${requiredCredits}`);
    
    // Check if user already enrolled
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('User data not found - creating user document with default credits');
      // Create user document with default credits if it doesn't exist
      await setDoc(userDocRef, {
        email: currentUser.email,
        credits: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Re-fetch the user document
      const newUserDoc = await getDoc(userDocRef);
      if (!newUserDoc.exists()) {
        return { success: false, error: 'Failed to create user data' };
      }
      
      const userData = newUserDoc.data();
      const enrolledCourses = userData.enrolledCourses || {};
      
      if (enrolledCourses[courseId]) {
        console.log('User already enrolled in course');
        return { success: true, alreadyEnrolled: true, message: 'You are already enrolled in this course' };
      }
      
      // Check if user has enough credits directly
      const currentCredits = userData.credits || 100; // Default to 100 if not set
      console.log(`User has ${currentCredits} credits`);
      
      if (currentCredits < requiredCredits) {
        console.log(`Insufficient credits: ${currentCredits} < ${requiredCredits}`);
        return { 
          success: false, 
          error: `Insufficient credits. You have ${currentCredits} credits, but this course requires ${requiredCredits} credits.`, 
          currentCredits,
          requiredCredits 
        };
      }
      
      console.log(`Deducting ${requiredCredits} credits from ${currentCredits}`);
      // Directly update user's credits
      const newCredits = currentCredits - requiredCredits;
      await updateDoc(userDocRef, { credits: newCredits });
      console.log(`Credits updated to ${newCredits}`);
    } else {
      const userData = userDoc.data();
      const enrolledCourses = userData.enrolledCourses || {};
      
      if (enrolledCourses[courseId]) {
        console.log('User already enrolled in course');
        return { success: true, alreadyEnrolled: true, message: 'You are already enrolled in this course' };
      }
      
      // Check if user has enough credits and initialize to 100 if not set
      let currentCredits = userData.credits;
      if (currentCredits === undefined || currentCredits === null) {
        console.log('Credits not found in user data, initializing to 100');
        currentCredits = 100;
        // Update the user document with default credits
        await updateDoc(userDocRef, { credits: currentCredits });
      }
      
      console.log(`User has ${currentCredits} credits`);
      
      if (currentCredits < requiredCredits) {
        console.log(`Insufficient credits: ${currentCredits} < ${requiredCredits}`);
        return { 
          success: false, 
          error: `Insufficient credits. You have ${currentCredits} credits, but this course requires ${requiredCredits} credits.`, 
          currentCredits,
          requiredCredits 
        };
      }
      
      console.log(`Deducting ${requiredCredits} credits from ${currentCredits}`);
      // Directly update user's credits
      const newCredits = currentCredits - requiredCredits;
      await updateDoc(userDocRef, { credits: newCredits });
      console.log(`Credits updated to ${newCredits}`);
    }
    
    // Record this transaction in a transactions collection for history
    try {
      const transactionRef = doc(collection(db, 'transactions'));
      await setDoc(transactionRef, {
        userId: currentUser.uid,
        courseId,
        creditsDeducted: requiredCredits,
        timestamp: new Date().toISOString(),
        type: 'course_access'
      });
      console.log('Transaction recorded');
    } catch (error) {
      console.error('Error recording transaction:', error);
      // Continue with enrollment even if transaction recording fails
    }
    
    // Update user's enrolled courses
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`enrolledCourses.${courseId}`]: {
          enrolledAt: new Date().toISOString(),
          creditsSpent: requiredCredits
        }
      });
      console.log('User enrolled courses updated');
    } catch (error) {
      console.error('Error updating enrolled courses:', error);
      // Try to refund credits if enrollment fails
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;
        await updateDoc(doc(db, 'users', currentUser.uid), { 
          credits: currentCredits + requiredCredits 
        });
      }
      return { success: false, error: 'Failed to update enrollment data' };
    }
    
    // Update course enrollments count
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        enrollments: (courseData.enrollments || 0) + 1
      });
      console.log('Course enrollment count updated');
    } catch (error) {
      console.error('Error updating course enrollment count:', error);
      // Don't display this error to the user since enrollment still succeeded
      // This error is likely due to security rules restricting updates to courses
      // by non-owner users, which is expected behavior in some security configurations
    }
    
    // Create notifications
    try {
      // Get user data for notification
      const userData = (await getDoc(userDocRef)).data();
      
      // Import on demand to avoid circular dependency
      const { createCreditDeductionNotification, createCourseEnrollmentNotification } = 
        await import('./notificationService');
      
      // Notification for credit deduction to current user
      await createCreditDeductionNotification(
        currentUser.uid,
        requiredCredits,
        'course enrollment',
        courseId,
        courseData.title
      );
      
      // Notification for course creator about the enrollment
      if (courseData.creatorId && courseData.creatorId !== currentUser.uid) {
        await createCourseEnrollmentNotification(
          courseId,
          courseData.creatorId,
          currentUser.uid,
          userData,
          courseData.title
        );
      }
    } catch (notificationError) {
      console.error('Error creating enrollment notifications:', notificationError);
      // Don't fail the enrollment if notifications fail
    }
    
    // Get updated credit amount for the return value
    const updatedUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const updatedCredits = updatedUserDoc.exists() ? (updatedUserDoc.data().credits || 0) : 0;
    
    console.log('Enrollment successful');
    return { 
      success: true, 
      currentCredits: updatedCredits,
      message: 'Enrollment successful'
    };
  } catch (error) {
    console.error('Error deducting credits for course:', error);
    return { success: false, error: error.message };
  }
};

// Add credits to user (for rewards, refunds, etc.)
export const addCreditsToUser = async (amount, reason) => {
  try {
    const result = await updateUserCredits(amount, false);
    
    if (result.success) {
      // Record this transaction
      const transactionRef = doc(db, 'transactions', Date.now().toString());
      await setDoc(transactionRef, {
        userId: auth.currentUser.uid,
        creditsAdded: amount,
        reason: reason || 'credit_reward',
        timestamp: new Date().toISOString(),
        type: 'credit_add'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error adding credits to user:', error);
    return { success: false, error: error.message };
  }
};

// Follow a user
export const followUser = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    if (targetUserId === currentUser.uid) {
      return { success: false, error: 'You cannot follow yourself' };
    }
    
    // Check if target user exists
    const targetUserDocRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserDocRef);
    
    if (!targetUserDoc.exists()) {
      return { success: false, error: 'User does not exist' };
    }
    
    // Get current user doc ref
    const currentUserDocRef = doc(db, 'users', currentUser.uid);
    const currentUserDoc = await getDoc(currentUserDocRef);
    
    if (!currentUserDoc.exists()) {
      return { success: false, error: 'Your user profile does not exist' };
    }
    
    // Check if already following to prevent double counting
    const currentUserData = currentUserDoc.data();
    const following = currentUserData.following || [];
    
    if (following.includes(targetUserId)) {
      // Already following, return success without making changes
      return { success: true, alreadyFollowing: true };
    }
    
    // Extract current counts to ensure we don't get negative values
    const currentFollowingCount = currentUserData.followingCount || 0;
    
    const targetUserData = targetUserDoc.data();
    const targetFollowersCount = targetUserData.followersCount || 0;
    
    // First update current user's following list
    try {
      await updateDoc(currentUserDocRef, {
        following: arrayUnion(targetUserId),
        // Simply increment the count by 1
        followingCount: currentFollowingCount + 1
      });
    } catch (error) {
      console.error('Error updating following list:', error);
      return { success: false, error: 'Failed to update your following list' };
    }
    
    // Then update target user's followers list
    try {
      await updateDoc(targetUserDocRef, {
        followers: arrayUnion(currentUser.uid),
        // Simply increment the count by 1
        followersCount: targetFollowersCount + 1
      });
    } catch (error) {
      console.error('Error updating followers list:', error);
      // Attempt to rollback the following list update
      try {
        await updateDoc(currentUserDocRef, {
          following: arrayRemove(targetUserId),
          followingCount: Math.max(currentFollowingCount, 0) // Prevent negative counts
        });
      } catch (rollbackError) {
        console.error('Error rolling back following update:', rollbackError);
      }
      return { success: false, error: 'Failed to update their followers list' };
    }
    
    // Create a notification for the followed user
    try {
      // Import on demand to avoid circular dependency
      const { createUserFollowNotification } = await import('./notificationService');
      
      // Create follow notification
      await createUserFollowNotification(
        targetUserId,
        currentUser.uid,
        currentUserData
      );
    } catch (notificationError) {
      console.error('Error creating follow notification:', notificationError);
      // Don't fail the follow operation if notification fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message };
  }
};

// Unfollow a user
export const unfollowUser = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get current user doc ref
    const currentUserDocRef = doc(db, 'users', currentUser.uid);
    const currentUserDoc = await getDoc(currentUserDocRef);
    
    if (!currentUserDoc.exists()) {
      return { success: false, error: 'Your user profile does not exist' };
    }
    
    // Get target user doc ref
    const targetUserDocRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserDocRef);
    
    if (!targetUserDoc.exists()) {
      return { success: false, error: 'Target user does not exist' };
    }
    
    // Check if actually following to prevent negative counts
    const currentUserData = currentUserDoc.data();
    const following = currentUserData.following || [];
    
    if (!following.includes(targetUserId)) {
      // Not following, return success without making changes
      return { success: true, notFollowing: true };
    }
    
    // Get the current arrays for both users to properly update the counts
    // and avoid accidental resets
    const currentUserFollowingCount = currentUserData.followingCount || 0;
    
    const targetUserData = targetUserDoc.data();
    const targetUserFollowersCount = targetUserData.followersCount || 0;
    
    // Step 1: Remove targetUserId from current user's following list
    try {
      // Remove from array AND decrement count correctly
      await updateDoc(currentUserDocRef, {
        following: arrayRemove(targetUserId),
        // Prevent count from going below zero
        followingCount: Math.max(currentUserFollowingCount - 1, 0)
      });
      
      console.log(`Updated current user following list - removed: ${targetUserId}`);
    } catch (error) {
      console.error('Error updating following list:', error);
      return { success: false, error: 'Failed to update your following list' };
    }
    
    // Step 2: Remove current user from target user's followers list
    try {
      // Remove from array AND decrement count correctly
      await updateDoc(targetUserDocRef, {
        followers: arrayRemove(currentUser.uid),
        // Prevent count from going below zero
        followersCount: Math.max(targetUserFollowersCount - 1, 0)
      });
      
      console.log(`Updated target user followers list - removed: ${currentUser.uid}`);
    } catch (error) {
      console.error('Error updating followers list:', error);
      // Attempt to rollback the following list update
      try {
        await updateDoc(currentUserDocRef, {
          following: arrayUnion(targetUserId),
          followingCount: currentUserFollowingCount // Restore original count
        });
      } catch (rollbackError) {
        console.error('Error rolling back following update:', rollbackError);
      }
      return { success: false, error: 'Failed to update their followers list' };
    }
    
    // Optional: Call the synchronization function to ensure counts are correct
    try {
      await synchronizeFollowCounts(currentUser.uid);
      await synchronizeFollowCounts(targetUserId);
    } catch (syncError) {
      console.error('Error synchronizing counts (non-fatal):', syncError);
      // Don't fail the operation if sync fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message };
  }
};

// Check if current user is following target user
export const checkIfFollowing = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, isFollowing: false, error: 'No authenticated user' };
    }
    
    // Get current user data
    const currentUserDocRef = doc(db, 'users', currentUser.uid);
    const currentUserDoc = await getDoc(currentUserDocRef);
    
    if (!currentUserDoc.exists()) {
      return { success: false, isFollowing: false, error: 'Current user data not found' };
    }
    
    const currentUserData = currentUserDoc.data();
    const following = currentUserData.following || [];
    
    // Check if target user is in following list
    const isFollowing = following.includes(targetUserId);
    
    return { success: true, isFollowing };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, isFollowing: false, error: error.message };
  }
};

// Get user followers count
export const getUserFollowersCount = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, count: 0, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    return { success: true, count: userData.followersCount || 0 };
  } catch (error) {
    console.error('Error getting followers count:', error);
    return { success: false, count: 0, error: error.message };
  }
};

// Get user following count
export const getUserFollowingCount = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, count: 0, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    return { success: true, count: userData.followingCount || 0 };
  } catch (error) {
    console.error('Error getting following count:', error);
    return { success: false, count: 0, error: error.message };
  }
};

// Remove user from current user's followers list
export const removeFollower = async (followerId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get current user doc ref
    const currentUserDocRef = doc(db, 'users', currentUser.uid);
    const currentUserDoc = await getDoc(currentUserDocRef);
    
    if (!currentUserDoc.exists()) {
      return { success: false, error: 'Your user profile does not exist' };
    }
    
    // Get follower user doc ref
    const followerUserDocRef = doc(db, 'users', followerId);
    const followerUserDoc = await getDoc(followerUserDocRef);
    
    if (!followerUserDoc.exists()) {
      return { success: false, error: 'Follower user does not exist' };
    }
    
    // Check if user is actually a follower to prevent negative counts
    const currentUserData = currentUserDoc.data();
    const followers = currentUserData.followers || [];
    
    if (!followers.includes(followerId)) {
      // Not a follower, return success without making changes
      return { success: true, notFollowing: true };
    }
    
    // Extract current counts to ensure we don't get negative values
    const currentFollowersCount = currentUserData.followersCount || 0;
    
    const followerUserData = followerUserDoc.data();
    const followerFollowingCount = followerUserData.followingCount || 0;
    
    // First update current user's followers list
    try {
      await updateDoc(currentUserDocRef, {
        followers: arrayRemove(followerId),
        // Prevent count from going below 0
        followersCount: Math.max(currentFollowersCount - 1, 0)
      });
    } catch (error) {
      console.error('Error updating followers list:', error);
      return { success: false, error: 'Failed to update your followers list' };
    }
    
    // Then update follower user's following list
    try {
      await updateDoc(followerUserDocRef, {
        following: arrayRemove(currentUser.uid),
        // Prevent count from going below 0
        followingCount: Math.max(followerFollowingCount - 1, 0)
      });
    } catch (error) {
      console.error('Error updating following list:', error);
      // Attempt to rollback the followers list update
      try {
        await updateDoc(currentUserDocRef, {
          followers: arrayUnion(followerId),
          followersCount: currentFollowersCount // Restore original count
        });
      } catch (rollbackError) {
        console.error('Error rolling back followers update:', rollbackError);
      }
      return { success: false, error: 'Failed to update their following list' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing follower:', error);
    return { success: false, error: error.message };
  }
};

// Synchronize follower and following counts with actual arrays
export const synchronizeFollowCounts = async (userId = null) => {
  try {
    const currentUser = auth.currentUser;
    const targetUserId = userId || (currentUser ? currentUser.uid : null);
    
    if (!targetUserId) {
      return { success: false, error: 'No user specified or authenticated' };
    }
    
    // Get user document
    const userDocRef = doc(db, 'users', targetUserId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    
    // Get actual array lengths
    const followers = userData.followers || [];
    const following = userData.following || [];
    
    const followerCount = followers.length;
    const followingCount = following.length;
    
    // Current counts from the document
    const currentFollowersCount = userData.followersCount || 0;
    const currentFollowingCount = userData.followingCount || 0;
    
    // Only update if counts don't match
    if (followerCount !== currentFollowersCount || followingCount !== currentFollowingCount) {
      await updateDoc(userDocRef, {
        followersCount: followerCount,
        followingCount: followingCount
      });
      
      return {
        success: true,
        updated: true,
        previousCounts: {
          followers: currentFollowersCount,
          following: currentFollowingCount
        },
        newCounts: {
          followers: followerCount,
          following: followingCount
        }
      };
    }
    
    return {
      success: true,
      updated: false,
      counts: {
        followers: followerCount,
        following: followingCount
      }
    };
  } catch (error) {
    console.error('Error synchronizing follow counts:', error);
    return { success: false, error: error.message };
  }
}; 