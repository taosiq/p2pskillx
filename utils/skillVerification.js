import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFIED_SKILLS_KEY = '@verified_skills';

export const storeVerifiedSkill = async (skill, score) => {
  try {
    if (!skill || typeof skill !== 'string') {
      console.error('Invalid skill passed to storeVerifiedSkill:', skill);
      return false;
    }
    
    const existingSkills = await getVerifiedSkills();
    const updatedSkills = {
      ...existingSkills,
      [skill]: {
        score,
        verifiedAt: new Date().toISOString(),
      },
    };
    await AsyncStorage.setItem(VERIFIED_SKILLS_KEY, JSON.stringify(updatedSkills));
    console.log(`Stored verified skill: ${skill} with score ${score}`);
    return true;
  } catch (error) {
    console.error('Error storing verified skill:', error);
    return false;
  }
};

export const getVerifiedSkills = async () => {
  try {
    console.log('Getting verified skills from storage');
    const skills = await AsyncStorage.getItem(VERIFIED_SKILLS_KEY);
    
    if (!skills) {
      console.log('No verified skills found in storage, returning empty object');
      return {};
    }
    
    try {
      const parsedSkills = JSON.parse(skills);
      if (parsedSkills && typeof parsedSkills === 'object') {
        console.log(`Retrieved ${Object.keys(parsedSkills).length} verified skills`);
        return parsedSkills;
      } else {
        console.error('Invalid skills data format:', parsedSkills);
        return {};
      }
    } catch (parseError) {
      console.error('Error parsing verified skills:', parseError);
      return {};
    }
  } catch (error) {
    console.error('Error getting verified skills:', error);
    return {};
  }
};

export const isSkillVerified = async (skill) => {
  try {
    if (!skill || typeof skill !== 'string') {
      console.error('Invalid skill passed to isSkillVerified:', skill);
      return false;
    }
    
    const verifiedSkills = await getVerifiedSkills();
    return !!verifiedSkills[skill];
  } catch (error) {
    console.error('Error checking skill verification:', error);
    return false;
  }
};

export const checkSkillPrerequisites = async (requiredSkills) => {
  try {
    if (!requiredSkills || !Array.isArray(requiredSkills)) {
      console.error('Invalid requiredSkills passed to checkSkillPrerequisites:', requiredSkills);
      return {
        verified: false,
        missingSkills: [],
      };
    }
    
    const verifiedSkills = await getVerifiedSkills();
    const missingSkills = requiredSkills.filter(skill => !verifiedSkills[skill]);
    
    return {
      verified: missingSkills.length === 0,
      missingSkills,
    };
  } catch (error) {
    console.error('Error checking skill prerequisites:', error);
    return {
      verified: false,
      missingSkills: requiredSkills,
    };
  }
}; 