import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SkillVerificationResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { results } = route.params || { results: { scores: {}, isPassed: false, passedSkills: [] } };
  
  const [savedSkills, setSavedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [questionsData, setQuestionsData] = useState([]);
  const [allSkillsQuestionsData, setAllSkillsQuestionsData] = useState({});

  useEffect(() => {
    loadSavedSkills();
    
    // If questions and user answers were passed directly, use them
    if (results && results.questions && results.userAnswers) {
      // Create a data structure to hold questions for the current skill
      const currentSkillQuestionsData = {
        [results.currentSkill]: {
          questions: results.questions,
          userAnswers: results.userAnswers
        }
      };
      
      setAllSkillsQuestionsData(currentSkillQuestionsData);
    } else {
      // Otherwise fetch questions from cache
      fetchQuestionsData();
    }
    
    // If no results were passed (possible navigation failure), try to recover from cache
    if (!route.params?.results) {
      recoverResultsFromCache();
    }
  }, []);

  // Load previously saved skills
  const loadSavedSkills = async () => {
    try {
      const savedSkillsJson = await AsyncStorage.getItem('@verified_skills');
      if (savedSkillsJson) {
        const parsedSkills = JSON.parse(savedSkillsJson);
        // Ensure it's an array
        setSavedSkills(Array.isArray(parsedSkills) ? parsedSkills : []);
      } else {
        // Initialize with empty array if no saved skills
        setSavedSkills([]);
      }
    } catch (error) {
      console.error('Error loading saved skills:', error);
      // Initialize with empty array on error
      setSavedSkills([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the questions and answers for display
  const fetchQuestionsData = async () => {
    try {
      // Try to get the cached questions for each skill
      if (results && results.passedSkills && results.passedSkills.length > 0) {
        const allQuestionsData = [];
        const skillQuestionsMap = {};
        
        for (const skill of results.passedSkills) {
          const cachedKey = `mcqs-${skill.toLowerCase().replace(/\s+/g, '-')}`;
          const cachedQuestions = await AsyncStorage.getItem(cachedKey);
          
          if (cachedQuestions) {
            const parsedQuestions = JSON.parse(cachedQuestions);
            allQuestionsData.push({
              skill,
              questions: parsedQuestions
            });
            
            // Also store in the map for all skills
            skillQuestionsMap[skill] = {
              questions: parsedQuestions,
              // No user answers available from cache
              userAnswers: {}
            };
          }
        }
        
        setQuestionsData(allQuestionsData);
        setAllSkillsQuestionsData(skillQuestionsMap);
      }
    } catch (error) {
      console.error('Error fetching questions data:', error);
    }
  };

  // Save new verified skills to AsyncStorage
  const saveVerifiedSkills = async () => {
    try {
      if (!results || !results.passedSkills || results.passedSkills.length === 0) {
        return;
      }

      // Get existing verified skills
      const savedSkillsJson = await AsyncStorage.getItem('@verified_skills');
      let existingSkills = savedSkillsJson ? JSON.parse(savedSkillsJson) : [];
      
      // Add new skills (avoiding duplicates)
      const newSkills = results.passedSkills.filter(skill => !existingSkills.includes(skill));
      
      if (newSkills.length === 0) {
        // No new skills to add
        return;
      }
      
      const updatedSkills = [...existingSkills, ...newSkills];
      
      // Save updated skills list
      await AsyncStorage.setItem('@verified_skills', JSON.stringify(updatedSkills));
      
      // Update state
      setSavedSkills(updatedSkills);
      
      // Show confirmation
      Alert.alert(
        "Skills Verified",
        `Congratulations! ${newSkills.join(', ')} ${newSkills.length > 1 ? 'have' : 'has'} been added to your profile.`,
        [{ text: "Great!" }]
      );
    } catch (error) {
      console.error('Error saving verified skills:', error);
      Alert.alert(
        "Error",
        "There was a problem saving your verified skills. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleContinue = () => {
    // Save verified skills first
    saveVerifiedSkills().then(() => {
      // Navigate back to dashboard
      navigation.navigate('Main', { screen: 'Dashboard' });
    });
  };

  const toggleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  // Calculate the total questions and required score
  const getTotalQuestions = () => {
    if (results && results.passingCriteria && results.passingCriteria.totalQuestions) {
      return results.passingCriteria.totalQuestions;
    }
    return 15; // Default to 15 if not specified
  };

  const getRequiredScore = () => {
    if (results && results.passingCriteria && results.passingCriteria.requiredScore) {
      return results.passingCriteria.requiredScore;
    }
    return Math.ceil(getTotalQuestions() * 0.7); // Default to 70% if not specified
  };

  const getScorePercentage = (skill) => {
    if (!results.scores[skill]) return 0;
    return Math.round((results.scores[skill] / getTotalQuestions()) * 100);
  };

  // Check if a skill has been previously verified
  const isSkillVerified = (skill) => {
    return Array.isArray(savedSkills) && savedSkills.includes(skill);
  };

  // Function to recover results from cache if navigation failed
  const recoverResultsFromCache = async () => {
    try {
      const cachedResults = await AsyncStorage.getItem('@last_verification_results');
      if (cachedResults) {
        const parsedResults = JSON.parse(cachedResults);
        // Update the route.params object to include the recovered results
        if (route.params) {
          route.params.results = parsedResults;
        } else {
          route.params = { results: parsedResults };
        }
        
        // Clear the cached results to prevent reuse
        await AsyncStorage.removeItem('@last_verification_results');
      }
    } catch (error) {
      console.error('Error recovering cached results:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <LinearGradient
        colors={['#2563EB', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Verification Results</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            {results.isPassed ? 'Congratulations!' : 'Almost there!'}
          </Text>
          
          <View style={styles.iconContainer}>
            {results.isPassed ? (
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={60} color="white" />
              </View>
            ) : (
              <View style={styles.failIconCircle}>
                <Ionicons name="close" size={60} color="white" />
              </View>
            )}
          </View>
          
          <Text style={styles.resultMessage}>
            {results.isPassed
              ? `You've successfully verified ${results.passedSkills.length > 1 ? 'these skills' : 'this skill'}!`
              : 'You need to score at least 70% to verify a skill.'}
          </Text>
          
          <View style={styles.skillScoresContainer}>
            {Object.entries(results.scores || {}).map(([skill, score]) => {
              const isPassed = score >= getRequiredScore();
              const wasAlreadyVerified = isSkillVerified(skill);
              
              return (
                <View key={skill} style={styles.skillScoreCard}>
                  <View style={styles.skillNameContainer}>
                    <Text style={styles.skillName}>{skill}</Text>
                    {wasAlreadyVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>Already verified</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreTextContainer}>
                      <Text style={[styles.scoreText, isPassed ? styles.passedScore : styles.failedScore]}>
                        {score}/{getTotalQuestions()}
                      </Text>
                      <Text style={[styles.percentageText, isPassed ? styles.passedScore : styles.failedScore]}>
                        {getScorePercentage(skill)}%
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.scoreBar, 
                      { width: '100%', backgroundColor: '#E5E7EB' }
                    ]}>
                      <View style={[
                        styles.scoreProgress,
                        isPassed ? styles.passedProgressBar : styles.failedProgressBar,
                        { width: `${getScorePercentage(skill)}%` }
                      ]} />
                    </View>
                    
                    <Text style={styles.requiredScoreText}>
                      Required: {getRequiredScore()} correct answers ({results.passingCriteria?.percentage || '70%'})
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          
          {results.isPassed && (
            <View style={styles.congratsContainer}>
              <Text style={styles.congratsText}>
                These skills will be added to your profile!
              </Text>
              <View style={styles.skillBadgesContainer}>
                {results.passedSkills.map(skill => (
                  <View key={skill} style={styles.skillBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.badgeIcon} />
                    <Text style={styles.badgeText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Show Answers Button - always visible now */}
          <TouchableOpacity 
            style={styles.showAnswersButton}
            onPress={toggleShowAnswers}
          >
            <Text style={styles.showAnswersText}>
              {showAnswers ? "Hide Answers" : "Show Questions & Answers"}
            </Text>
            <Ionicons 
              name={showAnswers ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#2563EB" 
            />
          </TouchableOpacity>
          
          {showAnswers && (
            <View style={styles.answersSection}>
              <Text style={styles.answersSectionTitle}>Questions and Answers</Text>
              
              {/* Display questions and answers for the current skill */}
              {results.questions && results.userAnswers && (
                <View style={styles.skillQuestionsContainer}>
                  <Text style={styles.skillQuestionsTitle}>{results.currentSkill}</Text>
                  
                  {results.questions.map((question, questionIndex) => {
                    const userAnswerIndex = results.userAnswers[question.id];
                    const isCorrect = userAnswerIndex === question.correctAnswer;
                    const userAnswerText = userAnswerIndex !== undefined && userAnswerIndex >= 0 
                      ? question.options[userAnswerIndex] 
                      : "Not answered";
                    
                    return (
                      <View key={questionIndex} style={styles.questionContainer}>
                        <Text style={styles.questionText}>
                          {questionIndex + 1}. {question.question}
                        </Text>
                        
                        {/* User's selected answer */}
                        <View style={styles.answerContainer}>
                          <Text style={styles.yourAnswerLabel}>Your Answer:</Text>
                          <Text style={[
                            styles.answerText,
                            isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText
                          ]}>
                            {userAnswerText} {isCorrect ? "✓" : "✗"}
                          </Text>
                        </View>
                        
                        {/* Correct answer - only show if user was wrong */}
                        {!isCorrect && (
                          <View style={styles.correctAnswerContainer}>
                            <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
                            <Text style={styles.correctAnswerText}>
                              {question.options[question.correctAnswer]}
                            </Text>
                          </View>
                        )}
                        
                        <Text style={styles.explanationText}>{question.explanation}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              
              {/* If we don't have direct question data, show from cached data */}
              {!results.questions && questionsData.map((skillData, skillIndex) => (
                <View key={skillIndex} style={styles.skillQuestionsContainer}>
                  <Text style={styles.skillQuestionsTitle}>{skillData.skill}</Text>
                  
                  {skillData.questions.map((question, questionIndex) => (
                    <View key={questionIndex} style={styles.questionContainer}>
                      <Text style={styles.questionText}>
                        {questionIndex + 1}. {question.question}
                      </Text>
                      <View style={styles.correctAnswerContainer}>
                        <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
                        <Text style={styles.correctAnswerText}>
                          {question.options[question.correctAnswer]}
                        </Text>
                      </View>
                      <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    width: '100%',
    zIndex: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 10,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultMessage: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  skillScoresContainer: {
    marginBottom: 20,
  },
  skillScoreCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  skillNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#0284C7',
  },
  scoreContainer: {
    marginTop: 8,
  },
  scoreTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
  },
  passedScore: {
    color: '#059669',
  },
  failedScore: {
    color: '#DC2626',
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  passedProgressBar: {
    backgroundColor: '#10B981',
  },
  failedProgressBar: {
    backgroundColor: '#EF4444',
  },
  requiredScoreText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  congratsContainer: {
    marginTop: 16,
  },
  congratsText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
  },
  skillBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: '#065F46',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  showAnswersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  showAnswersText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  answersSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  answersSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  skillQuestionsContainer: {
    marginBottom: 20,
  },
  skillQuestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  questionContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  correctAnswerContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginRight: 4,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#059669',
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 8,
  },
  answerContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start', 
    flexWrap: 'wrap'
  },
  yourAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 4,
  },
  answerText: {
    fontSize: 14,
    flex: 1,
  },
  incorrectAnswerText: {
    color: '#DC2626',
  },
});

export default SkillVerificationResultsScreen; 