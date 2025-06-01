import { aiQuestions } from './aiQuestions';
import { cyberSecurityQuestions } from './cyberSecurityQuestions';
import { dataScienceQuestions } from './dataSciencelQuestions';
import { leadershipQuestions } from './leadershipQuestions';
import { webDevelopmentQuestions } from './webDevelopmentQuestions';

// Export all question banks
export const questionBanks = {
  'Web Development': webDevelopmentQuestions,
  'Data Science': dataScienceQuestions,
  'Cybersecurity': cyberSecurityQuestions,
  'Artificial Intelligence': aiQuestions,
  'Leadership': leadershipQuestions,
  // Team Leadership and Project Management are subcategories of Leadership
  'Team Leadership': leadershipQuestions.filter(q => q.id.startsWith('lead_team')),
  'Project Management': leadershipQuestions.filter(q => q.id.startsWith('lead_pm')),
  'Strategic Planning': leadershipQuestions.filter(q => q.id.startsWith('lead_strategy')),
};

/**
 * Get random questions for a specific skill with the specified difficulty mix
 * @param {string} skill - The skill to get questions for
 * @param {number} hardCount - Number of hard questions to include
 * @param {number} easyCount - Number of easy questions to include
 * @returns {Array} An array of questions
 */
export const getRandomQuestionsForSkill = (skill, hardCount = 10, easyCount = 5) => {
  // Get the question bank for the skill
  let questions = [];
  
  // Handle special case for non-exact matches (case insensitive)
  const normalizedSkill = skill.toLowerCase().trim();
  const bankKey = Object.keys(questionBanks).find(
    key => key.toLowerCase() === normalizedSkill
  );
  
  if (bankKey) {
    questions = questionBanks[bankKey];
  } else {
    // Try to find a partial match
    const partialMatch = Object.keys(questionBanks).find(
      key => normalizedSkill.includes(key.toLowerCase()) || 
             key.toLowerCase().includes(normalizedSkill)
    );
    
    if (partialMatch) {
      questions = questionBanks[partialMatch];
    } else {
      // Default to web development if no match found
      questions = questionBanks['Web Development'];
    }
  }
  
  // Filter questions by difficulty
  const hardQuestions = questions.filter(q => q.difficulty === 'hard' || q.difficulty === 'medium');
  const easyQuestions = questions.filter(q => q.difficulty === 'easy');
  
  // Shuffle and select the specified number of questions
  const selectedHard = shuffleArray(hardQuestions).slice(0, hardCount);
  const selectedEasy = shuffleArray(easyQuestions).slice(0, easyCount);
  
  // Combine and shuffle again to mix difficulties
  return shuffleArray([...selectedHard, ...selectedEasy]);
};

/**
 * Get all available skill categories for question banks
 * @returns {Array} Array of skill category names
 */
export const getAvailableSkillCategories = () => {
  return Object.keys(questionBanks);
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default {
  questionBanks,
  getRandomQuestionsForSkill,
  getAvailableSkillCategories
}; 