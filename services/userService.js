import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, increment, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
    
    // Public profile (visible to other learners) and private details (owner only).
    const { firstName, lastName, occupation, email, dateOfBirth, gender } = userData;
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), {
      firstName,
      lastName,
      occupation,
      credits: 100, // starting balance
      xp: 0,
      level: 1,
      badgeType: 'Bronze',
      createdAt: now,
      updatedAt: now,
    });
    batch.set(doc(db, 'users', uid, 'private', 'details'), { email, dateOfBirth, gender, createdAt: now });
    await batch.commit();

    return { success: true, uid };
  } catch (error) {
    console.warn('Registration failed:', error?.code);
    return {
      success: false,
      code: error?.code,
      error: error.message || 'Failed to register user'
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    console.warn('Sign-in failed:', error?.code);
    return {
      success: false,
      code: error?.code,
      error: error.message || 'Failed to log in'
    };
  }
};

// Permanently delete the signed-in user's account (App Store requirement).
// The password is asked again because Firebase requires a recent sign-in.
// The profile document is removed first, then the login itself.
export const deleteAccount = async (password) => {
  const current = auth.currentUser;
  if (!current?.email) return { success: false, code: 'auth/no-current-user' };
  try {
    const credential = EmailAuthProvider.credential(current.email, password);
    await reauthenticateWithCredential(current, credential);
    // The server removes the profile, posts, notifications and follow links.
    const { apiConfigured, cleanupAccount } = await import('./api');
    if (apiConfigured) {
      await cleanupAccount();
    } else {
      await deleteDoc(doc(db, 'users', current.uid, 'private', 'details')).catch(() => {});
      await deleteDoc(doc(db, 'users', current.uid));
    }
    await deleteUser(current);
    return { success: true };
  } catch (error) {
    console.warn('Account deletion failed:', error?.code);
    return { success: false, code: error?.code };
  }
};

// Email a password reset link. Always reports success to the caller so the
// screen never reveals whether the address has an account.
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    if (error?.code === 'auth/network-request-failed' || error?.code === 'auth/too-many-requests') {
      return { success: false, code: error.code };
    }
  }
  return { success: true };
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

// Profile photo: stored inline as a small compressed JPEG data URI on the
// user document (Firebase Storage isn't configured for this project).
const MAX_PHOTO_BYTES = 350 * 1024;

export const setProfilePhoto = async (dataUri) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, error: 'No authenticated user' };
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUri || '')) return { success: false, error: 'Unsupported image' };
  if (dataUri.length > MAX_PHOTO_BYTES) return { success: false, error: 'too_large' };
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { profileImage: dataUri, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const removeProfilePhoto = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false };
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { profileImage: null });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Kept for older screens: now routes through the inline photo storage.
export const uploadProfileImage = async () => ({ success: false, error: 'Use setProfilePhoto' });

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

// Follow / unfollow: one atomic batch updates both users, so lists and
// counts can never drift apart. Security rules only let you add or remove
// your own uid on someone else's followers list.
export const followUser = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, error: 'No authenticated user' };
  if (!targetUserId || targetUserId === currentUser.uid) return { success: false, error: 'You cannot follow yourself' };
  try {
    const me = await getDoc(doc(db, 'users', currentUser.uid));
    if ((me.data()?.following || []).includes(targetUserId)) return { success: true, alreadyFollowing: true };
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUser.uid), { following: arrayUnion(targetUserId), followingCount: increment(1) });
    batch.update(doc(db, 'users', targetUserId), { followers: arrayUnion(currentUser.uid), followersCount: increment(1) });
    await batch.commit();
    try {
      const { createUserFollowNotification } = await import('./notificationService');
      await createUserFollowNotification(targetUserId, currentUser.uid, me.data() || {});
    } catch {}
    return { success: true };
  } catch (error) {
    console.warn('Follow failed:', error?.code);
    return { success: false, error: 'Couldn’t follow right now. Please try again.' };
  }
};

export const unfollowUser = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, error: 'No authenticated user' };
  try {
    const me = await getDoc(doc(db, 'users', currentUser.uid));
    if (!(me.data()?.following || []).includes(targetUserId)) return { success: true, notFollowing: true };
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUser.uid), { following: arrayRemove(targetUserId), followingCount: increment(-1) });
    batch.update(doc(db, 'users', targetUserId), { followers: arrayRemove(currentUser.uid), followersCount: increment(-1) });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.warn('Unfollow failed:', error?.code);
    return { success: false, error: 'Couldn’t unfollow right now. Please try again.' };
  }
};

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
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, error: 'No authenticated user' };
  try {
    const me = await getDoc(doc(db, 'users', currentUser.uid));
    if (!(me.data()?.followers || []).includes(followerId)) return { success: true, notFollowing: true };
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', currentUser.uid), { followers: arrayRemove(followerId), followersCount: increment(-1) });
    batch.update(doc(db, 'users', followerId), { following: arrayRemove(currentUser.uid), followingCount: increment(-1) });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.warn('Remove follower failed:', error?.code);
    return { success: false, error: 'Couldn’t remove follower. Please try again.' };
  }
};

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