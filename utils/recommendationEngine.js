import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Sample mock data for when offline
const MOCK_RECOMMENDATIONS = [
  {
    id: 'mock1',
    title: 'JavaScript Fundamentals',
    category: 'Web Development',
    reason: 'Popular course for beginners',
    credits: 10,
    creatorName: 'Alex Johnson',
    duration: '4 hours',
    rating: 4.8,
    source: 'skill'
  },
  {
    id: 'mock2',
    title: 'Python Data Science',
    category: 'Data Science',
    reason: 'Trending in tech community',
    credits: 15,
    creatorName: 'Sarah Williams',
    duration: '6 hours',
    rating: 4.9,
    source: 'popular'
  },
  {
    id: 'mock3',
    title: 'UI/UX Design Principles',
    category: 'Design',
    reason: 'Highly rated by students',
    credits: 12,
    creatorName: 'Michael Chen',
    duration: '5 hours',
    rating: 4.7,
    source: 'interest'
  },
  {
    id: 'mock4',
    title: 'Mobile App Development with React Native',
    category: 'Mobile Development',
    reason: 'Based on your programming skills',
    credits: 20,
    creatorName: 'David Kim',
    duration: '8 hours',
    rating: 4.6,
    source: 'skill'
  },
  {
    id: 'mock5',
    title: 'Digital Marketing Masterclass',
    category: 'Marketing',
    reason: 'From an instructor you might like',
    credits: 18,
    creatorName: 'Emily Rodriguez',
    duration: '7 hours',
    rating: 4.5,
    source: 'social'
  }
];

/**
 * Get personalized recommendations for a user based on:
 * 1. User's verified skills (to suggest complementary skills)
 * 2. User's learning history and interests
 * 3. User's followings and social connections
 * 4. Popular feeds/categories that user engages with
 */
export const getPersonalizedRecommendations = async () => {
  try {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.log('User not authenticated, returning mock data');
      return MOCK_RECOMMENDATIONS;
    }
    
    try {
      // Fetch user data including skills, interests, and follows
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data() || {};
      
      // Get user's verified skills
      const userSkills = userData.verifiedSkills || {};
      const userSkillsList = Object.keys(userSkills);
      
      // Get user's interests
      const userInterests = userData.interests || [];
      
      // Get user's follows
      const userFollows = userData.following || [];
      
      // Fetch courses by popularity
      const coursesQuery = query(
        collection(db, 'courses'),
        orderBy('enrollments', 'desc'),
        limit(20)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const popularCourses = [];
      coursesSnapshot.forEach(doc => {
        popularCourses.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Calculate recommendations based on skill complementarity
      const skillBasedRecommendations = await getSkillComplementaryRecommendations(userSkillsList);
      
      // Get recommendations based on follows and social connections
      const socialRecommendations = await getSocialRecommendations(userFollows);
      
      // Get recommendations based on interests
      const interestRecommendations = await getInterestBasedRecommendations(userInterests);
      
      // Blend all recommendations and rank them
      let allRecommendations = [
        ...skillBasedRecommendations.map(item => ({...item, source: 'skill', weight: 3})),
        ...socialRecommendations.map(item => ({...item, source: 'social', weight: 2})),
        ...interestRecommendations.map(item => ({...item, source: 'interest', weight: 1})),
        ...popularCourses.map(item => ({...item, source: 'popular', weight: 0.5}))
      ];
      
      // If we have no recommendations at all, use mock data
      if (allRecommendations.length === 0) {
        console.log('No recommendations found, using mock data');
        return MOCK_RECOMMENDATIONS;
      }
      
      // Remove duplicates (prefer higher weights if duplicate)
      const uniqueRecommendations = {};
      allRecommendations.forEach(item => {
        if (!uniqueRecommendations[item.id] || uniqueRecommendations[item.id].weight < item.weight) {
          uniqueRecommendations[item.id] = item;
        }
      });
      
      // Convert back to array and sort by weight
      allRecommendations = Object.values(uniqueRecommendations)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 10); // Take top 10
      
      return allRecommendations;
    } catch (error) {
      console.error('Error accessing Firestore, using mock data:', error);
      return MOCK_RECOMMENDATIONS;
    }
  } catch (error) {
    console.error('Error getting recommendations, using mock data:', error);
    return MOCK_RECOMMENDATIONS;
  }
};

/**
 * Find skills that complement the user's existing skills
 */
const getSkillComplementaryRecommendations = async (userSkills) => {
  try {
    // Define skill relationships (which skills complement each other)
    const skillRelationships = {
      'JavaScript': ['React', 'Node.js', 'Angular', 'Web Development'],
      'Python': ['Data Science', 'Machine Learning', 'Django', 'Flask'],
      'Design': ['UI/UX', 'Photoshop', 'Illustrator', 'Web Design'],
      'Marketing': ['SEO', 'Social Media', 'Content Creation', 'Email Marketing'],
      'Photography': ['Photo Editing', 'Lightroom', 'Composition', 'Portrait Photography'],
      'Health & Fitness': ['Nutrition', 'Personal Training', 'Yoga', 'Mindfulness'],
      'Video Editing': ['Premiere Pro', 'After Effects', 'Final Cut Pro', 'Animation'],
      'Photo Editing': ['Photoshop', 'Lightroom', 'GIMP', 'RAW Processing'],
      // Add more relationships as needed
    };
    
    let complementarySkills = [];
    
    // For each of user's skills, find complementary skills
    userSkills.forEach(skill => {
      if (skillRelationships[skill]) {
        complementarySkills = [...complementarySkills, ...skillRelationships[skill]];
      }
    });
    
    // Remove any skills the user already has
    complementarySkills = complementarySkills.filter(skill => !userSkills.includes(skill));
    
    // Remove duplicates
    complementarySkills = [...new Set(complementarySkills)];
    
    // If there are no complementary skills found or user has no skills, return empty array
    if (complementarySkills.length === 0) {
      return [
        {
          id: 'rec1',
          title: 'Introduction to Web Development',
          category: 'Web Development',
          reason: 'Popular first course to try',
          credits: 10,
          creatorName: 'John Doe',
          duration: '4 hours',
          rating: 4.7
        },
        {
          id: 'rec2',
          title: 'Python for Beginners',
          category: 'Python',
          reason: 'Most popular programming language',
          credits: 15,
          creatorName: 'Jane Smith',
          duration: '6 hours',
          rating: 4.9
        }
      ];
    }
    
    // Firestore allows max 10 items in 'in' query, so limit the array
    const limitedSkills = complementarySkills.slice(0, 10);
    
    try {
      // Fetch actual courses based on these skills
      const coursesQuery = query(
        collection(db, 'courses'),
        where('category', 'in', limitedSkills),
        limit(10)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const recommendations = [];
      coursesSnapshot.forEach(doc => {
        recommendations.push({
          id: doc.id,
          ...doc.data(),
          reason: `Based on your ${userSkills.join(', ')} skills`
        });
      });
      
      // If no courses found in database, return sample recommendations
      if (recommendations.length === 0) {
        return limitedSkills.slice(0, 3).map((skill, index) => ({
          id: `skill${index}`,
          title: `Learn ${skill}`,
          category: skill,
          reason: `Based on your ${userSkills.join(', ')} skills`,
          credits: 10 + index * 5,
          creatorName: 'Expert Instructor',
          duration: '5 hours',
          rating: 4.5
        }));
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error querying courses:', error);
      // Return sample recommendations if firestore query fails
      return limitedSkills.slice(0, 3).map((skill, index) => ({
        id: `skill${index}`,
        title: `Learn ${skill}`,
        category: skill,
        reason: `Based on your ${userSkills.join(', ')} skills`,
        credits: 10 + index * 5,
        creatorName: 'Expert Instructor',
        duration: '5 hours',
        rating: 4.5
      }));
    }
  } catch (error) {
    console.error('Error getting skill recommendations:', error);
    return [];
  }
};

/**
 * Get recommendations based on who the user follows
 */
const getSocialRecommendations = async (followedUsers) => {
  try {
    if (!followedUsers || followedUsers.length === 0) {
      return [];
    }
    
    // Firestore allows max 10 items in 'in' query, so limit the array
    const limitedFollows = followedUsers.slice(0, 10);
    
    try {
      // Get courses created by users that this user follows
      const coursesQuery = query(
        collection(db, 'courses'),
        where('creatorId', 'in', limitedFollows),
        limit(10)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const recommendations = [];
      coursesSnapshot.forEach(doc => {
        recommendations.push({
          id: doc.id,
          ...doc.data(),
          reason: 'From someone you follow'
        });
      });
      
      // If no courses found in database, return empty array since we can't mock these reliably
      return recommendations;
    } catch (error) {
      console.error('Error querying courses by followed users:', error);
      // Return empty array for social, since these are specific to social connections
      return [];
    }
  } catch (error) {
    console.error('Error getting social recommendations:', error);
    return [];
  }
};

/**
 * Get recommendations based on user interests
 */
const getInterestBasedRecommendations = async (interests) => {
  try {
    if (!interests || interests.length === 0) {
      return [
        {
          id: 'int1',
          title: 'Photography Masterclass',
          category: 'Photography',
          reason: 'Popular interest-based course',
          credits: 20,
          creatorName: 'Michael Wong',
          duration: '8 hours',
          rating: 4.8
        }
      ];
    }
    
    // Firestore allows max 10 items for array-contains-any, so limit the array
    const limitedInterests = interests.slice(0, 10);
    
    try {
      // Get courses matching user interests
      const coursesQuery = query(
        collection(db, 'courses'),
        where('tags', 'array-contains-any', limitedInterests),
        limit(10)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const recommendations = [];
      coursesSnapshot.forEach(doc => {
        recommendations.push({
          id: doc.id,
          ...doc.data(),
          reason: 'Matches your interests'
        });
      });
      
      // If no courses found in database, return sample recommendations
      if (recommendations.length === 0) {
        return limitedInterests.slice(0, 2).map((interest, index) => ({
          id: `interest${index}`,
          title: `${interest} Deep Dive`,
          category: interest,
          reason: 'Matches your interests',
          credits: 15 + index * 5,
          creatorName: 'Interest Expert',
          duration: '6 hours',
          rating: 4.6
        }));
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error querying courses by interests:', error);
      // Return sample recommendations if firestore query fails
      return limitedInterests.slice(0, 2).map((interest, index) => ({
        id: `interest${index}`,
        title: `${interest} Deep Dive`,
        category: interest,
        reason: 'Matches your interests',
        credits: 15 + index * 5,
        creatorName: 'Interest Expert',
        duration: '6 hours',
        rating: 4.6
      }));
    }
  } catch (error) {
    console.error('Error getting interest recommendations:', error);
    return [];
  }
}; 