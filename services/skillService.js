import { arrayRemove, arrayUnion, deleteField, doc, FieldPath, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Get verified skills for the current user
 * @returns {Promise<Object>} Result with success flag and skills object
 */
export const getVerifiedSkills = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user', skills: {} };
    }
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found', skills: {} };
    }
    
    const userData = userDoc.data();
    const verifiedSkills = userData.verifiedSkills || {};
    
    return { success: true, skills: verifiedSkills };
  } catch (error) {
    console.error('Error getting verified skills:', error);
    return { success: false, error: error.message, skills: {} };
  }
};

/**
 * Get verified skills for a specific user
 * @param {string} userId User ID to get skills for
 * @returns {Promise<Object>} Result with success flag and skills object
 */
export const getUserVerifiedSkills = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required', skills: {} };
    }
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found', skills: {} };
    }
    
    const userData = userDoc.data();
    const verifiedSkills = userData.verifiedSkills || {};
    
    return { success: true, skills: verifiedSkills };
  } catch (error) {
    console.error('Error getting user verified skills:', error);
    return { success: false, error: error.message, skills: {} };
  }
};

/**
 * Add a verified skill for the current user
 * @param {string} skillName Name of the skill
 * @param {string} level Skill level (Beginner, Intermediate, Advanced, Expert)
 * @param {string} category Skill category (optional)
 * @returns {Promise<Object>} Result with success flag
 */
export const addVerifiedSkill = async (skillName, level, category = '', score = null) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    if (!skillName || !level) {
      return { success: false, error: 'Skill name and level are required' };
    }
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    // Create the skill object
    // Keep the higher level if this skill was already verified.
    const ORDER = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const previous = userDoc.data().verifiedSkills?.[skillName];
    const bestLevel = previous && ORDER.indexOf(previous.level) > ORDER.indexOf(level) ? previous.level : level;
    const skillObject = {
      verified: true,
      level: bestLevel,
      verifiedAt: new Date().toISOString(),
      category: category || 'General',
      ...(score != null ? { score } : {}),
    };
    
    // Update the document by setting the skill in verifiedSkills object
    await updateDoc(userDocRef, {
      [`verifiedSkills.${skillName.replace(/[.~*/\[\]]/g, ' ').trim()}`]: skillObject,
      // Also add to skills array if we need a flat list
      skills: arrayUnion(skillName)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding verified skill:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a verified skill for the current user
 * @param {string} skillName Name of the skill to remove
 * @returns {Promise<Object>} Result with success flag
 */
export const removeVerifiedSkill = async (skillName) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    if (!skillName) {
      return { success: false, error: 'Skill name is required' };
    }
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    if (!userData.verifiedSkills?.[skillName]) {
      return { success: false, error: 'Skill not found' };
    }

    // Security rules allow removing a verified skill, never adding or editing one.
    await updateDoc(userDocRef, new FieldPath('verifiedSkills', skillName), deleteField(), 'skills', arrayRemove(skillName));
    return { success: true };
  } catch (error) {
    console.error('Error removing verified skill:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a verified skill for the current user
 * @param {string} skillName Name of the skill to update
 * @param {string} level New skill level
 * @param {string} category New skill category (optional)
 * @returns {Promise<Object>} Result with success flag
 */
export const updateVerifiedSkill = async (skillName, level, category) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    if (!skillName) {
      return { success: false, error: 'Skill name is required' };
    }
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    const verifiedSkills = userData.verifiedSkills || {};
    
    // Check if skill exists
    if (verifiedSkills[skillName]) {
      // Update the skill
      const updatedSkill = {
        ...verifiedSkills[skillName],
        level: level || verifiedSkills[skillName].level,
        category: category || verifiedSkills[skillName].category,
        updatedAt: new Date().toISOString()
      };
      
      // Update the document
      await updateDoc(userDocRef, {
        [`verifiedSkills.${skillName}`]: updatedSkill
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Skill not found' };
    }
  } catch (error) {
    console.error('Error updating verified skill:', error);
    return { success: false, error: error.message };
  }
}; 