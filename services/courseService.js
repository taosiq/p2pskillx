import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Create a new course
export const createCourse = async (courseData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Generate a unique course ID
    const courseId = doc(collection(db, 'courses')).id;
    
    // Prepare course data
    const course = {
      ...courseData,
      id: courseId,
      creatorId: currentUser.uid,
      creatorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      enrollments: 0,
      rating: 0,
      reviews: []
    };
    
    // Save course to Firestore
    await setDoc(doc(db, 'courses', courseId), course);
    
    // Update user's courses array
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const courses = userData.courses || [];
      
      await updateDoc(userDocRef, {
        courses: [...courses, courseId]
      });
      
      // Notify followers about the new course
      try {
        const userFollowers = userData.followers || [];
        
        if (userFollowers.length > 0) {
          // Import on demand to avoid circular dependency
          const { createFollowingCourseNotification } = await import('./notificationService');
          
          // Create notifications for all followers
          await createFollowingCourseNotification(
            courseId,
            currentUser.uid,
            userData,
            courseData.title,
            userFollowers
          );
        }
      } catch (notificationError) {
        console.error('Error creating follower course notifications:', notificationError);
        // Don't fail the course creation if notifications fail
      }
    }
    
    return { success: true, courseId };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: error.message };
  }
};

// Get all courses created by current user
export const getUserCourses = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', courses: [] };
    }
    
    // Query courses where creatorId matches current user
    const q = query(
      collection(db, 'courses'),
      where('creatorId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const courses = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting user courses:', error);
    return { success: false, error: error.message, courses: [] };
  }
};

// Get a single course by ID
export const getCourseById = async (courseId) => {
  try {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (courseDoc.exists()) {
      return { 
        success: true, 
        course: { id: courseDoc.id, ...courseDoc.data() } 
      };
    } else {
      return { success: false, error: 'Course not found' };
    }
  } catch (error) {
    console.error('Error getting course:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing course
export const updateCourse = async (courseId, updateData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course to verify ownership
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    // Verify course ownership
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to update this course' };
    }
    
    // Update course
    await updateDoc(doc(db, 'courses', courseId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: error.message };
  }
};

// Add a new section to a course
export const addCourseSection = async (courseId, sectionData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course to verify ownership and get existing sections
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    // Verify course ownership
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to update this course' };
    }
    
    // Get existing sections or create empty array
    const sections = courseData.sections || [];
    
    // Add new section with ID
    const newSection = {
      ...sectionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    // Update course with new section
    await updateDoc(doc(db, 'courses', courseId), {
      sections: [...sections, newSection],
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, sectionId: newSection.id };
  } catch (error) {
    console.error('Error adding course section:', error);
    return { success: false, error: error.message };
  }
};

// Update a course section
export const updateCourseSection = async (courseId, sectionId, updateData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course to verify ownership and get existing sections
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    // Verify course ownership
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to update this course' };
    }
    
    // Get existing sections
    const sections = courseData.sections || [];
    
    // Find section index
    const sectionIndex = sections.findIndex(section => section.id === sectionId);
    
    if (sectionIndex === -1) {
      return { success: false, error: 'Section not found' };
    }
    
    // Update section
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = {
      ...sections[sectionIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Update course with updated sections
    await updateDoc(doc(db, 'courses', courseId), {
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating course section:', error);
    return { success: false, error: error.message };
  }
};

// Delete a course section
export const deleteCourseSection = async (courseId, sectionId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course to verify ownership and get existing sections
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    // Verify course ownership
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to update this course' };
    }
    
    // Get existing sections
    const sections = courseData.sections || [];
    
    // Filter out the section to delete
    const updatedSections = sections.filter(section => section.id !== sectionId);
    
    // Update course with updated sections
    await updateDoc(doc(db, 'courses', courseId), {
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting course section:', error);
    return { success: false, error: error.message };
  }
};

// Upload course thumbnail (using base64 like profile images)
export const uploadCourseThumbnail = async (courseId, imageUri) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Verify course ownership
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to update this course' };
    }
    
    if (!imageUri || !imageUri.startsWith('file://')) {
      return { success: false, error: 'Invalid image URI' };
    }
    
    // Read the image file and convert to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64Image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    
    // Update course with thumbnail
    await updateDoc(doc(db, 'courses', courseId), {
      thumbnail: base64Image,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error uploading course thumbnail:', error);
    return { success: false, error: error.message };
  }
};

// Delete a course
export const deleteCourse = async (courseId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get course to verify ownership
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    
    if (!courseDoc.exists()) {
      return { success: false, error: 'Course not found' };
    }
    
    const courseData = courseDoc.data();
    
    // Verify course ownership
    if (courseData.creatorId !== currentUser.uid) {
      return { success: false, error: 'You do not have permission to delete this course' };
    }
    
    // Delete course
    await deleteDoc(doc(db, 'courses', courseId));
    
    // Update user's courses array
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const courses = userData.courses || [];
      
      await updateDoc(userDocRef, {
        courses: courses.filter(id => id !== courseId)
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: error.message };
  }
};

// Convert file to base64 (for text files and images)
export const fileToBase64 = async (uri) => {
  try {
    if (!uri || !uri.startsWith('file://')) {
      return { success: false, error: 'Invalid file URI' };
    }
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64File = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    
    return { success: true, base64File };
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return { success: false, error: error.message };
  }
};

// Get all courses
export const getAllCourses = async (categoryFilter = null) => {
  try {
    let q;
    
    // If category filter is provided, filter courses by category
    if (categoryFilter) {
      q = query(
        collection(db, 'courses'),
        where('category', '==', categoryFilter)
      );
    } else {
      q = query(collection(db, 'courses'));
    }
    
    const querySnapshot = await getDocs(q);
    const courses = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting courses:', error);
    return { success: false, error: error.message, courses: [] };
  }
};

// Helper function to check if user is enrolled in a course
export const isUserEnrolledInCourse = async (courseId) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', enrolled: false };
    }
    
    // Get user document to check enrolled courses
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const enrolledCourses = userData.enrolledCourses || {};
      
      return { 
        success: true, 
        enrolled: Object.keys(enrolledCourses).includes(courseId) 
      };
    }
    
    return { success: true, enrolled: false };
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return { success: false, error: error.message, enrolled: false };
  }
};

// Get user enrolled courses
export const getUserEnrolledCourses = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', courses: [] };
    }
    
    // Get user document to get enrolled course IDs
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      return { success: true, courses: [] };
    }
    
    const userData = userDoc.data();
    const enrolledCourses = userData.enrolledCourses || {};
    const enrolledCourseIds = Object.keys(enrolledCourses);
    
    if (enrolledCourseIds.length === 0) {
      return { success: true, courses: [] };
    }
    
    // Fetch all enrolled courses
    const courses = [];
    
    for (const courseId of enrolledCourseIds) {
      const courseResult = await getCourseById(courseId);
      if (courseResult.success) {
        courses.push({
          ...courseResult.course,
          enrolledAt: enrolledCourses[courseId].enrolledAt,
          creditsSpent: enrolledCourses[courseId].creditsSpent
        });
      }
    }
    
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting enrolled courses:', error);
    return { success: false, error: error.message, courses: [] };
  }
};

// Get all courses created by a specific user
export const getCoursesByUserId = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required', courses: [] };
    }
    
    // Query courses where creatorId matches the specified user
    const q = query(
      collection(db, 'courses'),
      where('creatorId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const courses = [];
    
    querySnapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting user courses:', error);
    return { success: false, error: error.message, courses: [] };
  }
}; 