import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { isOpenRouterConfigured } from '../utils/apiKeyManager';
import { logNetworkInfo } from '../utils/networkUtils';
import { generateQuestions } from '../utils/questionGenerator';

const { height } = Dimensions.get('window');

const SkillVerificationMCQScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { skills } = route.params;

  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loadingTimer, setLoadingTimer] = useState(60); // Countdown timer
  const loadingTimerRef = useRef(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  // Add a flag to track if user has chosen offline mode
  const [offlineModeChosen, setOfflineModeChosen] = useState(false);
  
  // Add state for offline mode toggle
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false);
  
  // Add timer state
  const [quizTimer, setQuizTimer] = useState(240); // 4 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const quizTimerRef = useRef(null);

  useEffect(() => {
    checkApiKeyAndLoadQuestions();
    
    // Check if offline mode is enabled in storage
    AsyncStorage.getItem('@offline_mode_enabled')
      .then(value => {
        if (value === 'true') {
          setIsOfflineModeEnabled(true);
          setOfflineModeChosen(true);
        }
      })
      .catch(err => console.error("Error checking offline mode:", err));
    
    // Cleanup function
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
      }
    };
  }, [currentSkillIndex]);

  // Add quiz timer effect
  useEffect(() => {
    if (isTimerRunning && quizTimer > 0) {
      quizTimerRef.current = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(quizTimerRef.current);
            // Auto-submit when timer reaches 0
            if (!showResults) {
              handleShowResults();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (quizTimer === 0 && !showResults) {
      handleShowResults();
    }
    
    return () => {
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
      }
    };
  }, [isTimerRunning, quizTimer, showResults]);

  // Format timer to display as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add countdown timer for loading state
  useEffect(() => {
    if (loading && !isGeneratingQuestions) {
      setIsGeneratingQuestions(true);
      setLoadingTimer(60);
      
      // Start countdown timer
      loadingTimerRef.current = setInterval(() => {
        setLoadingTimer(prev => {
          if (prev <= 1) {
            clearInterval(loadingTimerRef.current);
            // If we reach 0, show timeout message
            if (loading) {
              setError('Question generation timed out. Please try again or use offline questions.');
              setLoading(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!loading) {
      // Clear timer when no longer loading
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
      setIsGeneratingQuestions(false);
    }
    
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, [loading]);

  const checkApiKeyAndLoadQuestions = async () => {
    try {
      // Run network diagnostics first
      await logNetworkInfo();
      
      // If offline mode was explicitly chosen, skip API checks
      if (offlineModeChosen) {
        loadOfflineQuestions();
        return;
      }
      
      // Check if OpenRouter is configured
      const isConfigured = await isOpenRouterConfigured();
      if (!isConfigured) {
        // Show API key input if not configured
        setShowApiKeyInput(true);
        setLoading(false);
        return;
      }
      
      // If configured, load questions
      loadQuestions();
    } catch (error) {
      console.error("Error checking API configuration:", error);
      // Try to load questions anyway
      loadQuestions();
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      Alert.alert("Invalid API Key", "Please enter a valid OpenRouter API key");
      return;
    }
    
    try {
      // Import dynamically to avoid circular dependencies
      const { setApiKey } = require('../utils/apiKeyManager');
      await setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      setLoading(true);
      loadQuestions();
    } catch (error) {
      console.error("Error saving API key:", error);
      Alert.alert("Error", "Failed to save API key. Please try again.");
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    setIsGeneratingQuestions(true);
    // Reset quiz timer when loading new questions
    setQuizTimer(240);
    setIsTimerRunning(false);
    
    // Check if offline mode is enabled
    if (isOfflineModeEnabled || offlineModeChosen) {
      console.log("Offline mode is enabled - skipping API calls");
      loadOfflineQuestions();
      return;
    }
    
    try {
      // Run network diagnostics
      const networkInfo = await logNetworkInfo();
      
      // Only block if we're certain there's no internet (make the check less strict)
      if (networkInfo.hasInternet === false && networkInfo.error) {
        console.log("Network diagnostics indicates no connection, but we'll try API calls anyway");
      }
      
      // Get the current skill to verify
      const currentSkill = skills[currentSkillIndex];
      console.log(`Loading questions for ${currentSkill}...`);
      
      // Set up a timeout for the entire question generation process
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Question generation timed out. Please try again or use offline questions.'));
        }, 40000); // 40 second max timeout
      });
      
      // Generate questions
      const questionsPromise = generateQuestions(currentSkill, true);
      
      // Race between question generation and timeout
      const mcqs = await Promise.race([questionsPromise, timeoutPromise]);
      
      // Ensure all questions have the required format
      const formattedQuestions = mcqs.map((q, index) => ({
        id: q.id !== undefined ? q.id : index, // Use existing ID or create a new one
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || `Explanation for the correct answer: ${q.options[q.correctAnswer]}`
      }));
      
      setQuestions(formattedQuestions);
      setAnswers({});
      setShowResults(false);
      
      console.log(`Loaded ${formattedQuestions.length} questions for ${currentSkill}`);
      
      // Start the quiz timer once questions are loaded
      setIsTimerRunning(true);
    } catch (error) {
      console.error("Error loading questions:", error);
      setError(error.message);
      
      // Special handling for API key errors
      if (error.message && (
          error.message.includes("API key") || 
          error.message.includes("auth") || 
          error.message.includes("401") || 
          error.message.includes("403"))) {
        setShowApiKeyInput(true);
      } else {
        Alert.alert(
          "Error",
          error.message || "Failed to generate questions. Please try again later.",
          [
            { 
              text: "Try Again", 
              onPress: loadQuestions 
            },
            { 
              text: "Use Offline Questions", 
              onPress: async () => {
                try {
                  setLoading(true);
                  // Force using locally generated questions
                  const currentSkill = skills[currentSkillIndex];
                  
                  // Import the function directly to avoid circular dependencies
                  const { generateLocalQuestions } = require('../utils/questionGenerator');
                  const localQuestions = await generateLocalQuestions(currentSkill);
                  
                  // Cache these questions
                  const cachedKey = `mcqs-${currentSkill.toLowerCase().replace(/\s+/g, '-')}`;
                  await AsyncStorage.setItem(cachedKey, JSON.stringify(localQuestions));
                  
                  // Format and set questions
                  const formattedQuestions = localQuestions.map((q, index) => ({
                    id: q.id !== undefined ? q.id : index,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || `Explanation for the correct answer: ${q.options[q.correctAnswer]}`
                  }));
                  
                  setQuestions(formattedQuestions);
                  setAnswers({});
                  setShowResults(false);
                  setError(null);
                  console.log(`Loaded ${formattedQuestions.length} offline questions for ${currentSkill}`);
                  
                  // Start the quiz timer
                  setQuizTimer(240);
                  setIsTimerRunning(true);
                } catch (offlineError) {
                  console.error("Error loading offline questions:", offlineError);
                  setError("Failed to load offline questions: " + offlineError.message);
                } finally {
                  setLoading(false);
                }
              }
            },
            { 
              text: "Go Back", 
              onPress: () => navigation.goBack(),
              style: "cancel"
            }
          ]
        );
      }
    } finally {
      setLoading(false);
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswer = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleShowResults = () => {
    // Stop the timer when showing results
    setIsTimerRunning(false);
    if (quizTimerRef.current) {
      clearInterval(quizTimerRef.current);
    }
    
    // Check if all questions have been answered
    const answeredQuestionCount = Object.keys(answers).length;
    const totalQuestionCount = questions.length;
    
    if (answeredQuestionCount < totalQuestionCount) {
      // If timer expired, mark unanswered questions
      if (quizTimer === 0) {
        const updatedAnswers = { ...answers };
        questions.forEach((question) => {
          if (!(question.id in updatedAnswers)) {
            // Assign a default answer (-1) to unanswered questions
            updatedAnswers[question.id] = -1;
          }
        });
        setAnswers(updatedAnswers);
        setShowResults(true);
        return;
      }
      
      Alert.alert(
        "Incomplete Test",
        `Please answer all questions before viewing results. You have answered ${answeredQuestionCount} out of ${totalQuestionCount} questions.`,
        [{ text: "OK" }]
      );
      return;
    }
    setShowResults(true);
  };

  const handleSubmit = () => {
    // First, make sure to stop the timer
    setIsTimerRunning(false);
    if (quizTimerRef.current) {
      clearInterval(quizTimerRef.current);
    }
    
    try {
      const score = calculateScore();
      const currentSkill = skills[currentSkillIndex];
      const newScores = { ...scores, [currentSkill]: score };
      setScores(newScores);
  
      if (currentSkillIndex < skills.length - 1) {
        setCurrentSkillIndex(currentSkillIndex + 1);
      } else {
        // Calculate the required score for passing (70% of total questions)
        const totalQuestionsCount = questions.length;
        const requiredScore = Math.ceil(totalQuestionsCount * 0.7);
        
        // Consider a skill passed if they got at least 70% correct
        const passedSkills = Object.entries(newScores)
          .filter(([_, score]) => score >= requiredScore)
          .map(([skill]) => skill);
        
        // Prepare the results data including user's answers and the questions
        const resultsData = {
          scores: newScores,
          isPassed: passedSkills.length > 0,
          passedSkills: passedSkills,
          passingCriteria: {
            totalQuestions: totalQuestionsCount,
            requiredScore: requiredScore,
            percentage: '70%'
          },
          // Add questions and answers for display in results screen
          questions: questions,
          userAnswers: answers,
          currentSkill: skills[currentSkillIndex]
        };
        
        // Cache the results in case navigation fails
        try {
          AsyncStorage.setItem('@last_verification_results', JSON.stringify(resultsData));
        } catch (storageError) {
          console.error("Error caching results:", storageError);
        }
        
        // Introduce a slight delay before navigation to allow state updates to complete
        setTimeout(() => {
          try {
            navigation.navigate('SkillVerificationResults', { results: resultsData });
          } catch (navError) {
            console.error("Navigation error:", navError);
            Alert.alert(
              "Error",
              "There was a problem navigating to the results screen. Your results have been saved. Please restart the verification process.",
              [{ 
                text: "OK", 
                onPress: () => navigation.navigate('Main', { screen: 'Dashboard' })
              }]
            );
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error in handle submit:", error);
      Alert.alert(
        "Error",
        "There was a problem processing your results. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Add this function to handle refreshing questions
  const handleRefreshQuestions = () => {
    Alert.alert(
      "Refresh Questions",
      "This will fetch new AI-generated questions for this skill. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Refresh",
          onPress: () => {
            setLoading(true);
            loadQuestions();
          }
        }
      ]
    );
  };

  // Add a function specifically for loading offline questions
  const loadOfflineQuestions = async () => {
    try {
      setLoading(true);
      // Clear any existing timers
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
      
      // Get the current skill
      const currentSkill = skills[currentSkillIndex];
      
      // Import the function directly to avoid circular dependencies
      const { generateLocalQuestions } = require('../utils/questionGenerator');
      const localQuestions = await generateLocalQuestions(currentSkill);
      
      // Format and set questions
      const formattedQuestions = localQuestions.map((q, index) => ({
        id: q.id !== undefined ? q.id : index,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || `Explanation for the correct answer: ${q.options[q.correctAnswer]}`
      }));
      
      // Cache these questions for future use
      const cachedKey = `mcqs-${currentSkill.toLowerCase().replace(/\s+/g, '-')}`;
      try {
        await AsyncStorage.setItem(cachedKey, JSON.stringify(formattedQuestions));
      } catch (cacheError) {
        console.error("Error caching questions:", cacheError);
      }
      
      setQuestions(formattedQuestions);
      setAnswers({});
      setShowResults(false);
      setError(null);
      
      // Start the quiz timer
      setQuizTimer(240);
      setIsTimerRunning(true);
    } catch (e) {
      console.error("Error with offline questions:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Add function to toggle offline mode
  const toggleOfflineMode = async (value) => {
    try {
      setIsOfflineModeEnabled(value);
      setOfflineModeChosen(value);
      await AsyncStorage.setItem('@offline_mode_enabled', value ? 'true' : 'false');
      
      if (value) {
        // Reset API failure counter when explicitly enabling offline mode
        await AsyncStorage.setItem('@api_failure_count', '0');
      }
      
      // Show confirmation
      Alert.alert(
        value ? "Offline Mode Enabled" : "Offline Mode Disabled",
        value 
          ? "Questions will now be generated locally without using the internet." 
          : "App will try to use the internet to generate questions when available.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error setting offline mode:", error);
    }
  };

  if (showApiKeyInput) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.skillTitle}>API Configuration</Text>
          <Text style={styles.subtitle}>Enter your OpenRouter API key</Text>
        </View>
        
        <View style={styles.apiKeyContainer}>
          <Text style={styles.apiKeyInstructions}>
            You need to configure an OpenRouter API key to generate dynamic MCQs.
            You can get a free API key from openrouter.ai.
          </Text>
          
          <TextInput
            style={styles.apiKeyInput}
            placeholder="Enter OpenRouter API key"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleApiKeySubmit}
          >
            <Text style={styles.submitButtonText}>Save and Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => {
              setShowApiKeyInput(false);
              setOfflineModeChosen(true);
              loadOfflineQuestions();
            }}
          >
            <Text style={styles.skipButtonText}>Skip (Use offline questions)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          Generating questions for {skills[currentSkillIndex]}...
        </Text>
        <Text style={styles.loadingSubText}>
          Connecting to AI service. {isGeneratingQuestions ? `Timeout in ${loadingTimer}s` : ''}
        </Text>
        <Text style={styles.loadingTip}>
          Tip: If generation is taking too long, tap the button below to use offline questions.
        </Text>
        
        <TouchableOpacity 
          style={styles.offlineButton}
          onPress={async () => {
            // Set offline mode to true to prevent future API calls
            setOfflineModeChosen(true);
            loadOfflineQuestions();
          }}
        >
          <Text style={styles.offlineButtonText}>
            Use Offline Questions Instead
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.offlineButton}
          onPress={() => {
            setOfflineModeChosen(true);
            loadOfflineQuestions();
          }}
        >
          <Text style={styles.offlineButtonText}>Use Offline Questions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.apiConfigButton}
          onPress={() => setShowApiKeyInput(true)}
        >
          <Text style={styles.apiConfigButtonText}>Configure API</Text>
        </TouchableOpacity>
        
        {/* Add offline mode toggle */}
        <View style={styles.offlineModeContainer}>
          <Text style={styles.offlineModeLabel}>
            Always use offline mode:
          </Text>
          <TouchableOpacity 
            style={[
              styles.offlineModeToggle, 
              isOfflineModeEnabled ? styles.offlineModeEnabled : styles.offlineModeDisabled
            ]}
            onPress={() => toggleOfflineMode(!isOfflineModeEnabled)}
          >
            <Text style={styles.offlineModeToggleText}>
              {isOfflineModeEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.offlineModeHint}>
          Offline mode uses pre-built questions without API calls.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.skillTitle}>{skills[currentSkillIndex]}</Text>
        <Text style={styles.subtitle}>Answer all questions below</Text>
        <View style={styles.headerActions}>
          <Text style={styles.progress}>Skill {currentSkillIndex + 1} of {skills.length}</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefreshQuestions}
          >
            <Text style={styles.refreshButtonText}>Refresh Questions</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Quiz Timer */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBox}>
          <Text style={[
            styles.timerText,
            quizTimer <= 30 && styles.timerWarning,
            quizTimer <= 10 && styles.timerDanger
          ]}>
            {formatTime(quizTimer)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.questionsContainer}>
        {questions.map((question, index) => (
          <View key={index} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
            <View style={styles.optionsContainer}>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionButton,
                    answers[question.id] === optionIndex && styles.selectedOption,
                    showResults && optionIndex === question.correctAnswer && styles.correctOption,
                    showResults && answers[question.id] === optionIndex && 
                    optionIndex !== question.correctAnswer && styles.incorrectOption,
                  ]}
                  onPress={() => !showResults && handleAnswer(question.id, optionIndex)}
                  disabled={showResults}
                >
                  <Text style={[
                    styles.optionText,
                    answers[question.id] === optionIndex && styles.selectedOptionText,
                    showResults && optionIndex === question.correctAnswer && styles.correctOptionText,
                    showResults && answers[question.id] === optionIndex && 
                    optionIndex !== question.correctAnswer && styles.incorrectOptionText,
                  ]}>
                    {option}
                    {showResults && optionIndex === question.correctAnswer && " ✓"}
                    {showResults && answers[question.id] === optionIndex && 
                    optionIndex !== question.correctAnswer && " ✗"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showResults && (
              <View style={styles.explanationContainer}>
                <Text style={styles.explanationTitle}>
                  {answers[question.id] === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                </Text>
                <Text style={styles.explanation}>{question.explanation}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {!showResults ? (
          <TouchableOpacity 
            style={[
              styles.submitButton,
              Object.keys(answers).length < questions.length && styles.submitButtonDisabled
            ]} 
            onPress={handleShowResults}
            disabled={Object.keys(answers).length < questions.length && quizTimer > 0}
          >
            <Text style={styles.submitButtonText}>
              {Object.keys(answers).length < questions.length 
                ? `Answer All Questions (${Object.keys(answers).length}/${questions.length})` 
                : "Show Results"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {currentSkillIndex === skills.length - 1 ? 'Complete Verification' : 'Next Skill'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  skillTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  progress: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingTip: {
    marginTop: 20,
    fontSize: 13,
    color: '#FF9800',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  apiConfigButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    width: '80%',
    alignItems: 'center',
  },
  apiConfigButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  questionsContainer: {
    flex: 1,
    padding: 15,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionNumber: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 5,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  correctOption: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  incorrectOption: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  selectedOptionText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#4caf50',
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: '#f44336',
    fontWeight: '500',
  },
  explanationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  apiKeyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  apiKeyInstructions: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  apiKeyInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  skipButton: {
    marginTop: 10,
    padding: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  offlineButton: {
    marginTop: 30,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    width: '80%',
    alignItems: 'center',
  },
  offlineButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  // Timer styles
  timerContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timerBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  timerWarning: {
    color: '#FF9800',
  },
  timerDanger: {
    color: '#F44336',
  },
  offlineModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '80%',
  },
  offlineModeLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  offlineModeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  offlineModeEnabled: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  offlineModeDisabled: {
    backgroundColor: '#fff',
    borderColor: '#2196F3',
  },
  offlineModeToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineModeHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    width: '80%',
    fontStyle: 'italic',
  },
});

export default SkillVerificationMCQScreen; 