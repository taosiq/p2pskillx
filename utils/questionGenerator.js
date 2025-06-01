import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { generateQuestionsViaOpenRouter } from './directApi';
import { checkInternetConnection } from './networkUtils';
import { getAvailableSkillCategories, getRandomQuestionsForSkill } from './questionBanks';

// Hardcoded emergency questions for common skills to ensure app works even with total API failure
const emergencyQuestions = {
  "javascript": [
    {
      id: 0,
      question: "Which of the following is NOT a JavaScript data type?",
      options: ["Float", "String", "Boolean", "Object"],
      correctAnswer: 0,
      explanation: "Float is not a distinct data type in JavaScript. The number type handles both integers and floating-point values."
    },
    {
      id: 1,
      question: "What will `console.log(typeof [])` output in JavaScript?",
      options: ["object", "array", "list", "undefined"],
      correctAnswer: 0,
      explanation: "In JavaScript, arrays are a type of object, so typeof [] returns 'object'."
    },
    {
      id: 2, 
      question: "What is the correct way to check if a variable 'x' is an array in JavaScript?",
      options: ["Array.isArray(x)", "x instanceof Array", "typeof x === 'array'", "x.isArray()"],
      correctAnswer: 0,
      explanation: "Array.isArray() is the most reliable method to check if a variable is an array."
    },
    {
      id: 3,
      question: "Which statement creates a closure in JavaScript?",
      options: ["A function that accesses variables from its outer scope", "A function with no parameters", "A function that returns undefined", "A function that uses the 'this' keyword"],
      correctAnswer: 0,
      explanation: "A closure is formed when a function accesses variables from its parent scope."
    },
    {
      id: 4,
      question: "What does the 'use strict' directive do in JavaScript?",
      options: ["Enforces stricter parsing and error handling", "Makes the code run faster", "Allows the use of reserved keywords as variables", "Automatically fixes common coding mistakes"],
      correctAnswer: 0,
      explanation: "The 'use strict' directive enables a stricter mode of JavaScript that catches common coding mistakes and prevents unsafe actions."
    }
  ],
  "python": [
    {
      id: 0,
      question: "Which of the following is NOT a built-in data type in Python?",
      options: ["Array", "List", "Tuple", "Dictionary"],
      correctAnswer: 0,
      explanation: "Python doesn't have a built-in 'Array' type. It has Lists instead. Arrays exist in the NumPy library."
    },
    {
      id: 1,
      question: "What is the output of `print(2 ** 3)` in Python?",
      options: ["8", "6", "9", "5"],
      correctAnswer: 0,
      explanation: "The ** operator in Python represents exponentiation. 2 ** 3 equals 2³ which is 8."
    },
    {
      id: 2,
      question: "Which of the following is used to define a function in Python?",
      options: ["def", "function", "define", "func"],
      correctAnswer: 0,
      explanation: "The 'def' keyword is used to define a function in Python."
    },
    {
      id: 3,
      question: "What does the 'self' parameter refer to in Python class methods?",
      options: ["The instance of the class", "The class itself", "The parent class", "The module containing the class"],
      correctAnswer: 0,
      explanation: "'self' refers to the instance of the class. It's the first parameter passed to instance methods."
    },
    {
      id: 4,
      question: "Which of the following is a Python package manager?",
      options: ["pip", "npm", "yarn", "apt"],
      correctAnswer: 0,
      explanation: "pip is the standard package manager for Python. It's used to install and manage packages from PyPI."
    }
  ],
  "react": [
    {
      id: 0,
      question: "What function is used to update state in React functional components?",
      options: ["useState", "setState", "updateState", "modifyState"],
      correctAnswer: 0,
      explanation: "useState is a Hook that lets you add React state to functional components."
    },
    {
      id: 1,
      question: "What is the correct lifecycle method to make API calls in class components?",
      options: ["componentDidMount", "componentWillMount", "render", "constructor"],
      correctAnswer: 0,
      explanation: "componentDidMount is called after the component is mounted and is the best place to make API calls."
    },
    {
      id: 2,
      question: "Which prop is used to pass data from parent to child components?",
      options: ["props", "state", "context", "hooks"],
      correctAnswer: 0,
      explanation: "props (short for properties) are used to pass data from parent to child components."
    },
    {
      id: 3,
      question: "What is JSX in React?",
      options: ["A syntax extension that allows writing HTML-like code in JavaScript", "A new programming language", "A database query language", "A styling framework"],
      correctAnswer: 0,
      explanation: "JSX is a syntax extension for JavaScript that looks similar to HTML and makes it easier to write and add HTML in React."
    },
    {
      id: 4,
      question: "Which Hook is used for side effects in React?",
      options: ["useEffect", "useState", "useContext", "useReducer"],
      correctAnswer: 0,
      explanation: "useEffect Hook lets you perform side effects in function components, similar to componentDidMount and componentDidUpdate in class components."
    }
  ],
  "machine learning": [
    {
      id: 0,
      question: "Which of the following is NOT a type of machine learning?",
      options: ["Automated Learning", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"],
      correctAnswer: 0,
      explanation: "The main types of machine learning are supervised, unsupervised, and reinforcement learning. 'Automated Learning' is not a standard category."
    },
    {
      id: 1,
      question: "What does the 'Gradient Descent' algorithm do?",
      options: ["Minimizes the cost function", "Maximizes data variance", "Converts categorical data to numerical", "Splits data into clusters"],
      correctAnswer: 0,
      explanation: "Gradient Descent is an optimization algorithm that minimizes the cost/loss function by iteratively moving toward the steepest descent."
    },
    {
      id: 2,
      question: "Which of these is a popular deep learning framework?",
      options: ["TensorFlow", "Excel", "SPSS", "Tableau"],
      correctAnswer: 0,
      explanation: "TensorFlow is a popular open-source deep learning framework developed by Google."
    },
    {
      id: 3,
      question: "What is 'overfitting' in machine learning?",
      options: ["When a model learns the training data too well and performs poorly on new data", "When a model performs well on all types of data", "When a model is too simple to capture patterns", "When a model has too few parameters"],
      correctAnswer: 0,
      explanation: "Overfitting occurs when a model learns the noise in the training data rather than the underlying pattern, causing poor generalization to new data."
    },
    {
      id: 4,
      question: "Which algorithm is commonly used for recommendation systems?",
      options: ["Collaborative Filtering", "Decision Trees", "Linear Regression", "K-Means Clustering"],
      correctAnswer: 0,
      explanation: "Collaborative Filtering is commonly used in recommendation systems to predict user preferences based on similarities between users or items."
    }
  ],
  "data science": [
    {
      id: 0,
      question: "Which Python library is most commonly used for data manipulation and analysis?",
      options: ["pandas", "matplotlib", "scikit-learn", "TensorFlow"],
      correctAnswer: 0,
      explanation: "pandas is the most widely used Python library for data manipulation and analysis, providing data structures like DataFrames."
    },
    {
      id: 1,
      question: "What does EDA stand for in data science?",
      options: ["Exploratory Data Analysis", "Extreme Data Architecture", "External Data Access", "Extended Database Application"],
      correctAnswer: 0,
      explanation: "EDA (Exploratory Data Analysis) is the process of analyzing datasets to summarize their main characteristics, often with visual methods."
    },
    {
      id: 2,
      question: "Which of the following is NOT a common data visualization library?",
      options: ["DataViz", "matplotlib", "seaborn", "plotly"],
      correctAnswer: 0,
      explanation: "'DataViz' is not a standard data visualization library. matplotlib, seaborn, and plotly are all popular visualization libraries in Python."
    },
    {
      id: 3,
      question: "What does the term 'feature engineering' refer to in data science?",
      options: ["The process of creating new variables from existing data", "The design of machine learning models", "The collection of data from various sources", "The deployment of models to production"],
      correctAnswer: 0,
      explanation: "Feature engineering is the process of using domain knowledge to extract or create new features (variables) from raw data to improve model performance."
    },
    {
      id: 4,
      question: "Which metric is most appropriate for evaluating a regression model?",
      options: ["Mean Squared Error (MSE)", "Accuracy", "Precision", "F1 Score"],
      correctAnswer: 0,
      explanation: "Mean Squared Error (MSE) is a common metric for evaluating regression models, measuring the average squared difference between predicted and actual values."
    }
  ]
};

// Main function to generate questions for a skill
export const generateQuestions = async (skill, forceRefresh = true) => {
  try {
    console.log(`Starting question generation for: ${skill}`);
    
    // Check if user has explicitly chosen to use offline mode
    const offlineMode = await AsyncStorage.getItem('@offline_mode_enabled');
    const useOfflineMode = offlineMode === 'true';
    
    if (useOfflineMode) {
      console.log("User has enabled offline mode - skipping API calls");
      return generateLocalQuestions(skill);
    }
    
    // Check if we have emergency questions for this skill (case insensitive)
    const normalizedSkill = skill.toLowerCase().trim();
    const hasEmergencyQuestions = Object.keys(emergencyQuestions).some(key => 
      key.toLowerCase() === normalizedSkill
    );
    
    // Get cached questions key
    const cachedKey = `mcqs-${skill.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Track API failure count to decide whether to skip API calls
    const apiFailureKey = '@api_failure_count';
    const apiFailureCount = await AsyncStorage.getItem(apiFailureKey);
    const failureCount = apiFailureCount ? parseInt(apiFailureCount, 10) : 0;
    
    // If we've had multiple API failures in a row, skip API calls for a while
    const skipApiDueToFailures = failureCount >= 3;
    
    if (skipApiDueToFailures) {
      console.log(`Skipping API calls due to ${failureCount} consecutive failures`);
      // If we have cached questions, use them
      const cachedQuestions = await AsyncStorage.getItem(cachedKey);
      if (cachedQuestions) {
        return JSON.parse(cachedQuestions);
      }
      // Otherwise use local generation
      return generateLocalQuestions(skill);
    }
    
    // Check if online
    const isOnline = await checkInternetConnection();
    
    // If offline, use cached or locally generated questions
    if (!isOnline) {
      console.log("Device is offline - using local questions");
      const cachedQuestions = await AsyncStorage.getItem(cachedKey);
      
      if (cachedQuestions) {
        console.log("Using cached questions for", skill);
        return JSON.parse(cachedQuestions);
      }
      
      if (hasEmergencyQuestions) {
        const emergencyKey = Object.keys(emergencyQuestions)
          .find(key => key.toLowerCase() === normalizedSkill);
        console.log(`Offline - using emergency questions for ${skill}`);
        return emergencyQuestions[emergencyKey];
      }
      
      console.log("Generating local questions for", skill);
      return generateLocalQuestions(skill);
    }
    
    // If not forcing refresh and we have cached questions, use them
    const cachedQuestions = await AsyncStorage.getItem(cachedKey);
    if (!forceRefresh && cachedQuestions) {
      console.log("Using cached questions for", skill);
      return JSON.parse(cachedQuestions);
    }
    
    // For forced refresh or no cache, generate new questions if online
    console.log("Online - attempting to generate fresh questions");
    
    // Use the direct fetch API implementation with a shorter timeout
    try {
      console.log("Attempting to generate questions via direct API for", skill);
      
      // Fixed timeout
      const timeoutDuration = 15000;
      
      // Add a timeout wrapper around the direct API call
      const directApiPromise = generateQuestionsViaOpenRouter(skill);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout - switching to local questions')), timeoutDuration)
      );
      
      // Race between the API call and timeout
      let questions = await Promise.race([directApiPromise, timeoutPromise]);
      
      // Ensure we have 15 questions by supplementing with locally generated ones if needed
      if (questions.length < 15) {
        console.log(`API returned only ${questions.length} questions, adding more from local generator`);
        
        // Generate local questions to supplement
        const localQuestions = generateLocalQuestions(skill);
        
        // Calculate how many additional questions we need
        const numAdditionalNeeded = 15 - questions.length;
        
        // Get additional questions with proper IDs
        const additionalQuestions = localQuestions
          .slice(0, numAdditionalNeeded)
          .map((q, idx) => ({
            ...q,
            id: questions.length + idx // Ensure continuous IDs
          }));
        
        // Combine API questions with additional local ones
        questions = [...questions, ...additionalQuestions];
        
        // Update the cache with the combined questions
        try {
          await AsyncStorage.setItem(cachedKey, JSON.stringify(questions));
        } catch (cacheError) {
          console.error("Error updating cache with combined questions:", cacheError);
        }
      }
      
      // API request succeeded, reset failure counter
      await AsyncStorage.setItem(apiFailureKey, '0');
      
      console.log(`Successfully generated a total of ${questions.length} questions for ${skill}`);
      return questions;
      
    } catch (apiError) {
      console.error("API error:", apiError);
      
      // Increment API failure counter
      const newFailureCount = failureCount + 1;
      await AsyncStorage.setItem(apiFailureKey, newFailureCount.toString());
      
      console.log(`API call failed (failure #${newFailureCount}) - falling back to alternative sources`);
      
      // If we have cached questions, use them as fallback
      if (cachedQuestions) {
        console.log("Using cached questions as fallback");
        return JSON.parse(cachedQuestions);
      }
      
      // If we have emergency questions, use them
      if (hasEmergencyQuestions) {
        const emergencyKey = Object.keys(emergencyQuestions)
          .find(key => key.toLowerCase() === normalizedSkill);
        console.log(`Using emergency questions for ${skill}`);
        
        // Still generate local questions in the background for future use
        setTimeout(() => {
          try {
            const localQuestions = generateLocalQuestions(skill);
            AsyncStorage.setItem(cachedKey, JSON.stringify(localQuestions))
              .catch(e => console.error("Background cache error:", e));
          } catch (e) {
            console.error("Background generation error:", e);
          }
        }, 500);
        
        return emergencyQuestions[emergencyKey];
      }
      
      // Generate local questions as last resort
      console.log("Generating local questions for", skill);
      const localQuestions = generateLocalQuestions(skill);
      
      // Cache the locally generated questions
      try {
        await AsyncStorage.setItem(cachedKey, JSON.stringify(localQuestions));
      } catch (cacheError) {
        console.error("Error caching local questions:", cacheError);
      }
      
      return localQuestions;
    }
  } catch (error) {
    console.error("Fatal error in question generation:", error);
    
    // Check for emergency questions as final fallback
    const normalizedSkill = skill.toLowerCase().trim();
    const emergencyKey = Object.keys(emergencyQuestions)
      .find(key => key.toLowerCase() === normalizedSkill);
    
    if (emergencyKey) {
      console.log(`Fatal error - using emergency questions for ${skill}`);
      return emergencyQuestions[emergencyKey];
    }
    
    // Final fallback - generate generic questions if everything else fails
    return generateGenericQuestions(skill);
  }
};

// Generate questions using OpenRouter API (provides access to DeepSeek and other models)
export const generateOpenRouterQuestions = async (skill) => {
  try {
    // Get API key and URL directly from setupApi.js to avoid any circular dependencies
    const OPENROUTER_API_KEY = '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';
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Check if API key exists
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }
    
    // Generate dynamic questions using the API
    console.log("Sending request to OpenRouter API");
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 30000);
    });
    
    // Create the actual API request promise
    const apiRequestPromise = axios.post(
      OPENROUTER_URL,
      {
        model: "deepseek/deepseek-chat",  // Using DeepSeek through OpenRouter
        messages: [{
          role: "user",
          content: `Generate 15 ${skill} multiple-choice questions with 4 options and correct answer index. The questions should test knowledge from basic to advanced level.
          
          Format strictly as a valid JSON:
          {
            "questions": [
              {
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Brief explanation of the correct answer"
              }
            ]
          }
          
          Make sure all 15 questions are challenging and assess different aspects of ${skill} knowledge. Return only valid JSON.`
        }],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://p2pskillx.app', // Required by OpenRouter
          'X-Title': 'P2PSkillX', // Optional but good practice
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Race between the API request and the timeout
    const response = await Promise.race([apiRequestPromise, timeoutPromise]);
    
    console.log("Received response from OpenRouter API");

    // Extract and parse the response
    const resultContent = response.data.choices[0].message.content;
    
    // Find the JSON part in the response (in case there's any text before/after)
    const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : resultContent;
    
    try {
      const result = JSON.parse(jsonString);
      
      // Validate the response structure
      if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
        throw new Error('Invalid response format from API');
      }
      
      // Add IDs to questions for tracking
      let questionsWithIds = result.questions.map((q, index) => ({
        ...q,
        id: index
      }));
      
      // If we have fewer than 15 questions, supplement with locally generated ones
      if (questionsWithIds.length < 15) {
        console.log(`API returned only ${questionsWithIds.length} questions, adding more from local generator`);
        const localQuestions = generateLocalQuestions(skill);
        
        // Add enough local questions to reach 15 total
        const additionalQuestions = localQuestions
          .slice(0, 15 - questionsWithIds.length)
          .map((q, index) => ({
            ...q,
            id: questionsWithIds.length + index
          }));
        
        questionsWithIds = [...questionsWithIds, ...additionalQuestions];
      }
      
      // Ensure we have exactly 15 questions
      questionsWithIds = questionsWithIds.slice(0, 15);
      
      // Cache the questions
      const cachedKey = `mcqs-${skill.toLowerCase().replace(/\s+/g, '-')}`;
      await AsyncStorage.setItem(cachedKey, JSON.stringify(questionsWithIds));
      
      console.log(`Successfully generated ${questionsWithIds.length} questions for ${skill}`);
      return questionsWithIds;
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      console.log('Raw API response:', resultContent);
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    console.error('OpenRouter API Error:', error.message || error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error('Failed to generate questions from API. Falling back to local generator.');
  }
};

// Generate truly generic questions for any skill
export const generateGenericQuestions = (skill) => {
  console.log(`Generating generic questions for ${skill}`);
  const questions = [];
  
  // Generic templates that work for any skill
  const templates = [
    `What is considered a best practice in ${skill}?`,
    `Which of the following statements about ${skill} is true?`,
    `What is a fundamental concept in ${skill}?`,
    `Which approach is recommended when working with ${skill}?`,
    `What is the main advantage of using proper techniques in ${skill}?`,
    `Which of these is NOT a common mistake when learning ${skill}?`,
    `What's the correct way to approach a problem in ${skill}?`,
    `Which tool is most commonly used in ${skill}?`,
    `What skill is most complementary to ${skill}?`,
    `What's the first step when starting a new project in ${skill}?`,
    `Which method is most efficient when working with ${skill}?`,
    `What concept should you master first in ${skill}?`,
    `Which of these resources is best for learning ${skill}?`,
    `What distinguishes an expert from a beginner in ${skill}?`,
    `How should you measure progress when learning ${skill}?`
  ];
  
  // For each template, create a question with options
  templates.forEach((template, index) => {
    const correctOption = `The correct approach to ${skill} involves systematic learning and practice`;
    const wrongOptions = [
      `${skill} is best learned through memorization without understanding the concepts`,
      `In ${skill}, taking shortcuts is always better than following established methods`,
      `${skill} doesn't require continuous learning once you've understood the basics`
    ];
    
    questions.push({
      id: index,
      question: template,
      options: shuffleArray([correctOption, ...wrongOptions]),
      correctAnswer: 0, // We'll fix this below
      explanation: `This question tests your understanding of best practices in ${skill}.`
    });
  });
  
  // Fix the correctAnswer index based on where the correct option ended up after shuffling
  return questions.map(q => {
    const correctOptionText = `The correct approach to ${skill} involves systematic learning and practice`;
    const correctIndex = q.options.findIndex(opt => opt === correctOptionText);
    return {
      ...q,
      correctAnswer: correctIndex >= 0 ? correctIndex : 0
    };
  });
};

// Make sure to export the generateLocalQuestions function
export const generateLocalQuestions = (skill) => {
  try {
    console.log(`Generating local questions for skill: ${skill}`);
    
    // Check if we have questions for this skill in our banks
    const categories = getAvailableSkillCategories();
    const normalizedSkill = skill.toLowerCase().trim();
    
    // Check if any category matches the skill
    const hasSkillBank = categories.some(category => 
      category.toLowerCase() === normalizedSkill ||
      normalizedSkill.includes(category.toLowerCase()) ||
      category.toLowerCase().includes(normalizedSkill)
    );
    
    if (hasSkillBank) {
      console.log(`Using question bank for ${skill}`);
      // Get 10 hard questions and 5 easy questions
      const questions = getRandomQuestionsForSkill(skill, 10, 5);
      
      // Format questions for consistency with other question sources
      return questions.map((q, index) => ({
        id: index,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));
    }
    
    // Fall back to the original implementation if we don't have questions for this skill
    console.log(`No question bank found for ${skill}, using generic questions`);
    // Check if we have emergency questions for this skill (case insensitive)
    const skillKey = Object.keys(emergencyQuestions).find(key => 
      key.toLowerCase() === normalizedSkill
    );
    
    if (skillKey) {
      return emergencyQuestions[skillKey];
    }
    
    // Generate generic questions as a last resort
    return generateGenericQuestions(skill);
  } catch (error) {
    console.error("Error generating local questions:", error);
    // Ensure we always return something, even in case of errors
    return generateGenericQuestions(skill);
  }
};

// Function to select random questions with balanced difficulty
function selectRandomQuestionsWithDifficulty(questions, count) {
  // Ensure we don't try to select more questions than available
  const actualCount = Math.min(count, questions.length);
  
  // Create a copy of the questions array to avoid modifying the original
  const shuffledQuestions = shuffleArray([...questions]);
  
  // If we don't have enough questions, just return what we have
  if (shuffledQuestions.length <= actualCount) {
    return shuffledQuestions;
  }
  
  // Try to get a balanced mix of questions - select randomly but ensure variety
  const selectedQuestions = [];
  
  // Track question types to avoid too many similar questions
  const usedConcepts = new Set();
  
  // Fill the selection with diverse questions
  while (selectedQuestions.length < actualCount && shuffledQuestions.length > 0) {
    const nextQuestion = shuffledQuestions.shift();
    
    // Extract a "concept signature" from the question to track similarity
    const conceptSignature = nextQuestion.question.slice(0, 20);
    
    // If we haven't seen too many similar questions, add this one
    if (!usedConcepts.has(conceptSignature) || Math.random() < 0.7) {
      selectedQuestions.push(nextQuestion);
      usedConcepts.add(conceptSignature);
    } else {
      // Put the question at the end of the array for possible later selection
      shuffledQuestions.push(nextQuestion);
    }
    
    // Safety check to prevent infinite loops
    if (selectedQuestions.length + shuffledQuestions.length < actualCount) {
      break;
    }
  }
  
  // If we didn't get enough questions through the diversity filter, just add more
  while (selectedQuestions.length < actualCount && shuffledQuestions.length > 0) {
    selectedQuestions.push(shuffledQuestions.shift());
  }
  
  // Update IDs to ensure they're sequential
  return selectedQuestions.map((q, index) => ({
    ...q,
    id: index
  }));
}

// Knowledge base for common skills
function getSkillKnowledgeBase(skill) {
  // Normalize skill name for matching
  const normalizedSkill = skill.toLowerCase().trim();
  
  // Comprehensive knowledge bases for common skills
  const knowledgeBases = {
    // JavaScript knowledge base
    'javascript': {
      fundamentals: {
        concepts: ['Variables and data types', 'Functions and scope', 'Objects and arrays', 'Asynchronous programming', 'DOM manipulation'],
        correctAnswers: [
          'Variables defined with let can be reassigned but not redeclared in the same scope',
          'Closures allow functions to access variables from an outer function scope',
          'The event loop handles asynchronous callbacks in JavaScript',
          'Promises help manage asynchronous operations more effectively than callbacks',
          'The DOM represents HTML as a tree of objects that can be manipulated'
        ],
        wrongAnswers: [
          'Variables declared with const can be modified directly after declaration',
          'All JavaScript variables are automatically hoisted with their values',
          'JavaScript is a strictly typed language that enforces type checking',
          'Synchronous code always executes faster than asynchronous code',
          'The var keyword is the preferred way to declare variables in modern JavaScript'
        ]
      },
      bestPractices: {
        concepts: ['Using strict mode', 'Avoiding global variables', 'Error handling', 'Code organization', 'Performance optimization'],
        correctAnswers: [
          'Using strict equality (===) to avoid type coercion issues',
          'Implementing proper error handling with try/catch blocks',
          'Avoiding globals and using module patterns or ES modules',
          'Using const for variables that won\'t be reassigned',
          'Optimizing loops by caching array length'
        ],
        wrongAnswers: [
          'Using eval() function for dynamic code execution',
          'Declaring all variables at the global scope',
          'Nesting callbacks many levels deep rather than using promises',
          'Using document.write() for DOM manipulation',
          'Setting numerous event listeners without ever removing them'
        ]
      },
      advancedConcepts: {
        concepts: ['Prototypal inheritance', 'ES6+ features', 'Functional programming', 'Design patterns', 'Memory management'],
        correctAnswers: [
          'Using destructuring to extract multiple values from objects and arrays',
          'Implementing the module pattern to create private variables',
          'Using higher-order functions for more maintainable code',
          'Leveraging prototypal inheritance to share methods efficiently',
          'Using WeakMap for storing private data with proper garbage collection'
        ],
        wrongAnswers: [
          'Classes in JavaScript work exactly like classes in Java or C++',
          'Arrow functions should always replace regular functions in all cases',
          'The "this" keyword always refers to the same object in any context',
          'Generators cannot be used for asynchronous programming',
          'Closures always cause memory leaks and should be avoided'
        ]
      }
    },
    
    // Web Development knowledge base
    'web development': {
      fundamentals: {
        concepts: ['HTML basics', 'CSS fundamentals', 'JavaScript essentials', 'Responsive design', 'Web standards'],
        correctAnswers: [
          'HTML provides the structure of a web page through elements and tags',
          'CSS is used for styling and layout of web pages',
          'JavaScript adds interactivity and dynamic behavior to websites',
          'Responsive design ensures websites work well on different device sizes',
          'Web standards ensure consistency and compatibility across browsers',
          'The DOM (Document Object Model) represents the HTML structure as objects',
          'HTTP is the protocol used for transmitting web pages',
          'URLs are used to identify resources on the web',
          'HTML5 introduced semantic elements like section, article, and nav',
          'HTTPS encrypts data transmitted between client and server'
        ],
        wrongAnswers: [
          'HTML is a programming language for creating web applications',
          'CSS is primarily used for server-side operations',
          'JavaScript is only useful for simple animations and effects',
          'Responsive design isn\'t necessary since most users use desktop computers',
          'Web standards restrict creativity and aren\'t important for most websites',
          'The DOM is only relevant for backend development',
          'HTTP and HTTPS provide identical security features',
          'Modern websites should only be built with JavaScript frameworks',
          'Mobile-first design means designing exclusively for mobile devices',
          'Browser compatibility issues no longer exist in modern web development'
        ]
      },
      bestPractices: {
        concepts: ['Semantic HTML', 'CSS organization', 'JavaScript patterns', 'Performance optimization', 'Accessibility'],
        correctAnswers: [
          'Using semantic HTML improves accessibility and SEO',
          'CSS methodologies like BEM help organize and maintain stylesheets',
          'Using modern JavaScript features with appropriate polyfills',
          'Optimizing assets and reducing network requests improves page load speed',
          'Building accessible websites ensures they work for users with disabilities',
          'Progressive enhancement ensures basic functionality for all users',
          'Lazy loading defers loading of non-critical resources',
          'Code splitting reduces initial load time by dividing code into chunks',
          'Proper error handling improves user experience when issues occur',
          'Cross-browser testing ensures consistent experiences across browsers'
        ],
        wrongAnswers: [
          'Using <div> for everything is better than semantic HTML',
          'Inline styles are preferred for maintainability',
          'Using document.write() is the best way to add content dynamically',
          'Adding more images and animations always improves user experience',
          'Accessibility is only important for government websites',
          'Websites should be pixel-perfect identical across all browsers',
          'Minification hurts debugging and should be avoided',
          'Frontend frameworks always slow down websites',
          'Prioritizing desktop experiences over mobile is best practice',
          'Testing in one browser is sufficient for modern websites'
        ]
      },
      advancedConcepts: {
        concepts: ['Modern frameworks', 'State management', 'API integration', 'Progressive Web Apps', 'Web security'],
        correctAnswers: [
          'Modern frameworks like React and Vue help build complex interactive UIs',
          'State management patterns help organize data flow in complex applications',
          'RESTful APIs and GraphQL provide efficient ways to communicate with servers',
          'Progressive Web Apps deliver app-like experiences on the web',
          'Understanding CORS, XSS, and CSRF helps build secure web applications',
          'Server-side rendering improves initial load time and SEO',
          'JAMstack architecture separates client services from server-side business logic',
          'WebSockets enable real-time bidirectional communication',
          'Static site generators pre-render pages at build time for better performance',
          'Content Security Policy (CSP) helps prevent various types of attacks'
        ],
        wrongAnswers: [
          'Frameworks should be avoided because they\'re too complex',
          'Managing state directly in the DOM is better than using state management libraries',
          'Making direct database queries from the browser is better than using APIs',
          'Native apps are always better than web applications',
          'Security is primarily the server\'s responsibility, not the front-end\'s',
          'All JavaScript frameworks require the same amount of code for similar functionality',
          'PWAs are only useful for mobile devices',
          'Static sites cannot have any dynamic functionality',
          'Server-side rendering is obsolete in modern web development',
          'CORS is only relevant for development environments'
        ]
      },
      frontend: {
        concepts: ['Frontend frameworks', 'CSS preprocessors', 'Build tools', 'Testing', 'Performance'],
        correctAnswers: [
          'React uses a virtual DOM to optimize rendering performance',
          'SASS and LESS extend CSS with variables, nesting, and functions',
          'Webpack bundles JavaScript modules and assets for production',
          'Jest provides a testing framework with snapshot testing capabilities',
          'Lighthouse audits web pages for performance, accessibility, and SEO',
          'TypeScript adds static typing to JavaScript for better developer experience',
          'Redux implements a predictable state container for JavaScript apps',
          'CSS Grid and Flexbox provide powerful layout capabilities',
          'Service workers enable offline functionality in web applications',
          'Web Components allow creating reusable custom elements'
        ],
        wrongAnswers: [
          'React is always the best choice regardless of project requirements',
          'CSS preprocessors are unnecessary with modern CSS features',
          'Build tools add complexity without providing real benefits',
          'Frontend testing is less important than backend testing',
          'Code optimization should only be done after user complaints',
          'Using multiple frameworks together is recommended for best results',
          'jQuery is still the most modern approach to DOM manipulation',
          'The cascading nature of CSS should be avoided entirely',
          'All frontend frameworks work equally well for all types of projects',
          'Manually writing JavaScript is always faster than using frameworks'
        ]
      },
      backend: {
        concepts: ['Server-side languages', 'Databases', 'API design', 'Authentication', 'Hosting'],
        correctAnswers: [
          'Node.js allows using JavaScript for server-side development',
          'SQL databases use structured queries while NoSQL databases offer more flexibility',
          'RESTful APIs follow principles like statelessness and resource-based URLs',
          'JWT (JSON Web Tokens) provides a compact way to securely transmit information',
          'Containerization with tools like Docker simplifies deployment and scaling',
          'ORMs abstract database operations into object-oriented code',
          'Microservices architecture breaks applications into smaller, specialized services',
          'HTTPS is essential for securing data transmission',
          'Serverless computing allows running code without managing infrastructure',
          'Load balancing distributes traffic across multiple servers for better performance'
        ],
        wrongAnswers: [
          'Backend development requires the same skills as frontend development',
          'All websites should use the same type of database',
          'RESTful design is outdated and should be avoided',
          'Storing passwords in plain text is acceptable for simple applications',
          'Virtual private servers are always better than cloud hosting',
          'Monolithic architecture is always preferable to microservices',
          'API security is only necessary for financial applications',
          'Serverless computing eliminates the need for all server management',
          'All backend frameworks provide identical performance characteristics',
          'Database normalization always leads to better performance'
        ]
      }
    },
    
    // Python knowledge base
    'python': {
      fundamentals: {
        concepts: ['Data types and variables', 'Control flow', 'Functions', 'Modules and packages', 'File handling'],
        correctAnswers: [
          'Python uses indentation to define code blocks instead of curly braces',
          'Lists are mutable while tuples are immutable',
          'Python is a dynamically typed language',
          'Everything in Python is an object, including functions',
          'List comprehensions provide a concise way to create lists',
          'Python supports multiple assignment like a, b = 1, 2',
          'The range() function generates a sequence of numbers',
          'Dictionaries store data as key-value pairs',
          'The "if __name__ == \'__main__\'" idiom prevents code from running when imported',
          'Python functions can return multiple values as a tuple'
        ],
        wrongAnswers: [
          'Python requires variable declarations with specific types',
          'All Python operations are thread-safe by default',
          'Python converts all strings to bytes automatically',
          'Python variables must be initialized when declared',
          'Semicolons are required at the end of each statement',
          'Python arrays and lists are the same data structure',
          'Python is primarily a statically typed language',
          'All Python variables are global by default',
          'Python only supports single inheritance',
          'Memory management must be handled manually in Python'
        ]
      },
      bestPractices: {
        concepts: ['PEP 8 style guide', 'Virtual environments', 'Error handling', 'Testing', 'Documentation'],
        correctAnswers: [
          'Using virtual environments to manage project dependencies',
          'Following PEP 8 guidelines for consistent, readable code',
          'Using try/except blocks for specific exceptions rather than catching all',
          'Writing docstrings to document functions and modules',
          'Using context managers (with statement) for resource management',
          'Writing unit tests to verify code functionality',
          'Using linters like pylint or flake8 to improve code quality',
          'Importing specific functions rather than entire modules when possible',
          'Using meaningful variable and function names',
          'Creating reusable, single-purpose functions'
        ],
        wrongAnswers: [
          'Using wildcard imports (from module import *) in all scripts',
          'Naming variables with single letters for better performance',
          'Creating extremely long, multi-purpose functions',
          'Using globals to share data between functions',
          'Catching all exceptions and silently passing them',
          'Writing comments that restate the obvious code operations',
          'Nesting conditionals deeply for complex logic',
          'Using many different coding styles within the same project',
          'Hardcoding configuration values throughout the codebase',
          'Avoiding documentation to save development time'
        ]
      },
      advancedConcepts: {
        concepts: ['Decorators', 'Generators', 'Context managers', 'Metaclasses', 'Concurrency'],
        correctAnswers: [
          'Decorators can be used to modify function behavior without changing their code',
          'Generators enable efficient iteration by yielding values one at a time',
          'Context managers help manage resources properly with the "with" statement',
          'The GIL (Global Interpreter Lock) affects multithreaded Python programs',
          'Asyncio provides tools for writing concurrent code using async/await syntax',
          'Metaclasses can modify class behavior during creation',
          'Python\'s multiprocessing module can bypass GIL limitations',
          'Coroutines allow cooperative multitasking without threads',
          'Dunder (double underscore) methods customize object behavior',
          'Functional programming concepts like map, filter, and reduce are supported'
        ],
        wrongAnswers: [
          'Metaclasses are required for creating any class in Python',
          'Python\'s multithreading is the best choice for CPU-bound tasks',
          'Generators consume more memory than returning complete lists',
          'Context managers are only useful for file operations',
          'Coroutines cannot be used with traditional threading',
          'Decorators always slow down function execution significantly',
          'Asyncio replaces the need for all other concurrency approaches',
          'Functional programming is impossible in Python',
          'The GIL prevents any parallel execution in Python',
          'Dunder methods are only used internally by Python'
        ]
      },
      libraries: {
        concepts: ['Data science tools', 'Web frameworks', 'Testing frameworks', 'GUI development', 'System integration'],
        correctAnswers: [
          'NumPy provides efficient numerical computing capabilities',
          'Pandas offers data structures and tools for data analysis',
          'Django is a high-level web framework that encourages rapid development',
          'Flask is a lightweight WSGI web application framework',
          'Pytest simplifies writing small, readable tests',
          'Matplotlib is a comprehensive library for creating static visualizations',
          'TensorFlow and PyTorch are popular for machine learning and deep learning',
          'Requests simplifies working with HTTP requests',
          'SQLAlchemy is a SQL toolkit and Object-Relational Mapping (ORM) library',
          'Tkinter is included in the Python standard library for GUI development'
        ],
        wrongAnswers: [
          'NumPy can only handle small datasets that fit in memory',
          'Django is preferred for microservices due to its minimal footprint',
          'Pandas is primarily used for web scraping',
          'Flask is more feature-rich out of the box than Django',
          'Pytest can only be used for unit testing, not integration tests',
          'Matplotlib is exclusively for 3D visualizations',
          'All machine learning in Python requires writing code from scratch',
          'The Requests library is part of the standard library',
          'SQLAlchemy only works with SQLite databases',
          'Python has no libraries for creating desktop applications'
        ]
      }
    },
    
    // React knowledge base
    'react': {
      fundamentals: {
        concepts: ['Components', 'JSX', 'Props', 'State', 'Lifecycle methods'],
        correctAnswers: [
          'Components are the building blocks of React applications',
          'JSX is a syntax extension that allows writing HTML-like code in JavaScript',
          'Props are used to pass data from parent to child components',
          'State represents data that changes over time within a component',
          'React follows a unidirectional data flow pattern'
        ],
        wrongAnswers: [
          'React components must always use class syntax',
          'JSX is a separate language that requires a special compiler',
          'Props can be directly modified by child components',
          'State can be updated directly without using setState',
          'React automatically updates the DOM for all data changes'
        ]
      },
      bestPractices: {
        concepts: ['Component composition', 'State management', 'Performance optimization', 'Hooks usage', 'Testing'],
        correctAnswers: [
          'Breaking UI into small, reusable components',
          'Using keys for list items to help React identify changes',
          'Lifting state up to share state between components',
          'Using React.memo or PureComponent to prevent unnecessary renders',
          'Managing side effects with useEffect hook'
        ],
        wrongAnswers: [
          'Deeply nesting components for better organization',
          'Using setState in render methods',
          'Updating state directly for performance improvements',
          'Creating new functions inside render for event handlers',
          'Using indexes as keys for dynamic lists'
        ]
      },
      advancedConcepts: {
        concepts: ['Hooks', 'Context API', 'Render props', 'Higher-order components', 'Suspense and concurrent mode'],
        correctAnswers: [
          'Custom hooks allow reusing stateful logic between components',
          'Context provides a way to pass data through the component tree without props',
          'Memoization with useMemo and useCallback can improve performance',
          'Error boundaries catch JavaScript errors in child components',
          'React Suspense allows components to "wait" for something before rendering'
        ],
        wrongAnswers: [
          'Hooks can be used conditionally inside if statements',
          'Context should be used for all state management needs',
          'Higher-order components completely replace the need for hooks',
          'The useEffect hook runs before the component renders',
          'Concurrent Mode is enabled by default in all React applications'
        ]
      }
    },

    // Data Science knowledge base
    'data science': {
      fundamentals: {
        concepts: ['Data Collection', 'Data Cleaning', 'Exploratory Data Analysis', 'Statistical Analysis', 'Machine Learning Basics'],
        correctAnswers: [
          'Data cleaning typically consumes the most time in the data science workflow',
          'Exploratory Data Analysis helps identify patterns and anomalies in data',
          'The p-value indicates the probability of observing the data given the null hypothesis is true',
          'Feature engineering aims to create more informative variables for modeling',
          'Statistical bias occurs when a model systematically underestimates or overestimates the true value'
        ],
        wrongAnswers: [
          'Data is typically ready for analysis immediately after collection',
          'Correlation always implies causation in data relationships',
          'Linear regression works best for all types of data relationships',
          'Larger datasets always lead to better model performance',
          'All variables in a dataset are equally important for analysis'
        ]
      },
      tools: {
        concepts: ['Python Libraries', 'Visualization Tools', 'Data Processing Frameworks', 'Machine Learning Libraries', 'Statistical Software'],
        correctAnswers: [
          'Pandas is primarily used for data manipulation and analysis in Python',
          'Matplotlib and Seaborn are specialized for data visualization',
          'Scikit-learn provides tools for machine learning and predictive data analysis',
          'TensorFlow and PyTorch are primarily used for deep learning applications',
          'SQL is essential for data scientists working with relational databases'
        ],
        wrongAnswers: [
          'Excel is the preferred tool for large-scale data science projects',
          'R has no advantages over Python for statistical analysis',
          'Tableau is primarily used for machine learning model training',
          'Data scientists rarely need to use SQL in their workflows',
          'Visualization tools are unnecessary if the analysis is correct'
        ]
      },
      techniques: {
        concepts: ['Regression Analysis', 'Classification Methods', 'Clustering Algorithms', 'Dimensionality Reduction', 'Time Series Analysis'],
        correctAnswers: [
          'K-means clustering assigns data points to clusters based on the nearest mean',
          'Principal Component Analysis (PCA) reduces dimensionality while preserving variance',
          'Random Forests combine multiple decision trees to reduce overfitting',
          'Gradient boosting builds models sequentially to correct errors from previous models',
          'Cross-validation helps assess how a model will generalize to independent data'
        ],
        wrongAnswers: [
          'Neural networks always outperform traditional machine learning algorithms',
          'Model accuracy is the only metric needed to evaluate performance',
          'Feature scaling is unnecessary for tree-based models',
          'Supervised and unsupervised learning techniques cannot be combined',
          'Hyperparameter tuning has minimal impact on model performance'
        ]
      }
    },

    // Digital Marketing knowledge base
    'digital marketing': {
      fundamentals: {
        concepts: ['Marketing Strategy', 'Customer Journey', 'Brand Positioning', 'Market Segmentation', 'Value Proposition'],
        correctAnswers: [
          'The marketing funnel typically consists of awareness, consideration, and decision stages',
          'Customer personas help target marketing efforts to specific audience segments',
          'A value proposition communicates the unique benefits a product provides to customers',
          'Market segmentation divides a target market into subgroups with similar characteristics',
          'A/B testing compares two versions of content to determine which performs better'
        ],
        wrongAnswers: [
          'Digital marketing strategies should focus on all audiences equally',
          'Brand positioning is only important for large corporations',
          'The customer journey is the same for all products and services',
          'Digital marketing campaigns should focus on immediate sales only',
          'Marketing success can be measured by a single metric'
        ]
      },
      channels: {
        concepts: ['Search Engine Optimization', 'Social Media Marketing', 'Email Marketing', 'Content Marketing', 'Pay-Per-Click Advertising'],
        correctAnswers: [
          'SEO focuses on improving organic (non-paid) visibility in search engines',
          'Social media platforms each have unique audience demographics and content preferences',
          'Email marketing often has the highest ROI among digital marketing channels',
          'Content marketing focuses on creating valuable content to attract and engage a target audience',
          'PPC campaigns charge advertisers when users click on their ads'
        ],
        wrongAnswers: [
          'Keyword stuffing is an effective SEO technique',
          'The same content strategy works equally well across all social platforms',
          'Email marketing is outdated and ineffective compared to newer channels',
          'Short-form content consistently outperforms long-form content in all contexts',
          'Higher ad spend always leads to better marketing results'
        ]
      },
      analytics: {
        concepts: ['Key Performance Indicators', 'Conversion Tracking', 'Attribution Models', 'Customer Lifetime Value', 'Return on Investment'],
        correctAnswers: [
          'Google Analytics uses a last-click attribution model by default',
          'Conversion rate is calculated by dividing conversions by total visitors',
          'Customer Acquisition Cost (CAC) should be lower than Customer Lifetime Value (CLV)',
          'UTM parameters help track the source of website traffic',
          'Bounce rate measures the percentage of visitors who leave without further interaction'
        ],
        wrongAnswers: [
          'Website traffic is the most important marketing KPI for all businesses',
          'Social media likes and followers are the best indicators of marketing success',
          'All conversions have equal value in marketing analytics',
          'Marketing data should only be analyzed on a monthly basis',
          'Marketing ROI can only be measured for e-commerce businesses'
        ]
      }
    },

    // UI/UX Design knowledge base
    'ui/ux design': {
      principles: {
        concepts: ['User-Centered Design', 'Information Architecture', 'Visual Hierarchy', 'Accessibility', 'Responsive Design'],
        correctAnswers: [
          'User-centered design focuses on understanding user needs and behaviors throughout the design process',
          'Information architecture organizes content to help users find information and complete tasks',
          'Visual hierarchy guides users\' attention to the most important elements first',
          'Accessible design ensures products can be used by people with diverse abilities',
          'Responsive design adapts layouts to different screen sizes and devices'
        ],
        wrongAnswers: [
          'Aesthetics should always take priority over usability in design',
          'User testing is only necessary at the end of the design process',
          'Color is purely an aesthetic choice with no functional impact',
          'Mobile and desktop interfaces should be designed separately with different patterns',
          'Design trends should be followed regardless of user needs'
        ]
      },
      process: {
        concepts: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Iteration'],
        correctAnswers: [
          'User research helps designers understand user needs, behaviors, and motivations',
          'Wireframes are low-fidelity representations focusing on layout and structure',
          'Prototypes simulate user interactions to test design solutions before development',
          'Usability testing involves observing users completing tasks with a design',
          'Design thinking is an iterative, non-linear process focused on solving user problems'
        ],
        wrongAnswers: [
          'Designers should create the final design before gathering user feedback',
          'Wireframes should include detailed visual elements like colors and typography',
          'User personas are fictional characters not based on real user research',
          'Usability testing requires large numbers of participants to be valuable',
          'The design process should follow a strict waterfall methodology'
        ]
      },
      tools: {
        concepts: ['Design Software', 'Prototyping Tools', 'Research Methods', 'Collaboration Tools', 'Design Systems'],
        correctAnswers: [
          'Design systems maintain consistency across products through reusable components',
          'Figma facilitates real-time collaboration between designers and stakeholders',
          'Heatmaps visualize where users click, tap, or focus their attention',
          'A/B testing compares two design variations to determine which performs better',
          'User journey maps visualize the process users go through to accomplish a goal'
        ],
        wrongAnswers: [
          'Design tools determine the quality of design more than the designer\'s skill',
          'Sketching has no place in the modern digital design process',
          'Design handoff to developers requires minimal documentation',
          'Design systems limit creativity and should be avoided',
          'User interviews provide statistically significant quantitative data'
        ]
      }
    },

    // Mobile App Development knowledge base
    'mobile development': {
      fundamentals: {
        concepts: ['Platform Guidelines', 'App Architecture', 'UI Components', 'App Lifecycle', 'Data Storage'],
        correctAnswers: [
          'Native apps are built specifically for a particular platform using its core development language',
          'App architecture patterns like MVC and MVVM help separate concerns in mobile apps',
          'The app lifecycle includes states like foreground, background, and terminated',
          'Responsive layouts adapt to different screen sizes and orientations',
          'Local storage options include databases, key-value stores, and file systems'
        ],
        wrongAnswers: [
          'Cross-platform and native apps always have identical performance',
          'UI design should be identical across iOS and Android platforms',
          'Mobile apps don\'t need to handle background state transitions',
          'All app data should be stored in the cloud to save device storage',
          'The same navigation patterns work equally well on all mobile platforms'
        ]
      },
      frameworks: {
        concepts: ['Native Development', 'Cross-Platform Frameworks', 'State Management', 'API Integration', 'Testing'],
        correctAnswers: [
          'React Native uses JavaScript to create native UI components for iOS and Android',
          'Flutter uses the Dart language and creates apps with a compiled native interface',
          'Swift is the primary language for iOS app development',
          'Kotlin is officially supported for Android development alongside Java',
          'Native SDKs provide platform-specific features and optimizations'
        ],
        wrongAnswers: [
          'Cross-platform frameworks have replaced the need for native development',
          'Hybrid apps always outperform native apps in all scenarios',
          'All mobile frameworks use the same programming language',
          'Mobile frameworks don\'t need to be updated for new OS versions',
          'State management is unnecessary for simple mobile applications'
        ]
      },
      bestPractices: {
        concepts: ['Performance Optimization', 'Security', 'Offline Support', 'App Store Guidelines', 'User Experience'],
        correctAnswers: [
          'Optimizing image and asset sizes improves app download and startup time',
          'Secure data storage is critical for apps handling sensitive user information',
          'Offline-first design ensures apps remain functional without internet access',
          'App Store reviews check for compliance with platform guidelines and policies',
          'Deep linking allows users to navigate directly to specific app content'
        ],
        wrongAnswers: [
          'App performance is only important for gaming applications',
          'All mobile app logic should run on the main UI thread',
          'Apps should always require internet connection to function',
          'User permissions should be requested immediately upon app launch',
          'Battery consumption is not a significant concern in modern app development'
        ]
      }
    },
    
    // Machine Learning knowledge base
    'machine learning': {
      basics: {
        concepts: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Neural Networks', 'Model Evaluation'],
        correctAnswers: [
          'Supervised learning algorithms learn from labeled training data to make predictions',
          'Unsupervised learning finds patterns in data without explicit labels',
          'Reinforcement learning uses a reward system to teach agents optimal behavior',
          'Deep learning is a subset of machine learning that uses neural networks with multiple layers',
          'Cross-validation helps assess model performance on unseen data',
          'Bias-variance tradeoff is a fundamental concept in evaluating ML models',
          'Feature engineering can significantly improve model performance',
          'The training-test split prevents models from memorizing data instead of learning patterns',
          'Transfer learning uses knowledge from one task to improve learning in another task',
          'Regularization techniques help prevent overfitting in machine learning models'
        ],
        wrongAnswers: [
          'Machine learning algorithms can perfectly solve any problem with enough data',
          'All machine learning models require the same amount of data to train effectively',
          'Feature selection is unnecessary when using deep learning models',
          'Neural networks always outperform traditional ML algorithms',
          'More complex models always lead to better performance',
          'Machine learning models never need to be updated once trained',
          'Model evaluation metrics are interchangeable for all problem types',
          'All machine learning algorithms interpret data in the same way',
          'Dimensionality reduction always results in information loss and worse performance',
          'Ensemble methods combine weak models to create an equally weak model'
        ]
      },
      algorithms: {
        concepts: ['Linear Regression', 'Decision Trees', 'Support Vector Machines', 'K-means Clustering', 'Deep Neural Networks'],
        correctAnswers: [
          'Linear regression models the relationship between a dependent variable and one or more independent variables',
          'Decision trees split data recursively based on feature values to make predictions',
          'Support Vector Machines find the hyperplane that best separates classes in high-dimensional space',
          'K-means clustering partitions data into k clusters based on feature similarity',
          'Convolutional Neural Networks are specialized for processing grid-like data such as images',
          'Random Forests combine multiple decision trees to improve accuracy and control overfitting',
          'Recurrent Neural Networks have connections that form cycles, allowing them to maintain memory',
          'Gradient Boosting builds models sequentially, with each model correcting errors of previous ones',
          'Principal Component Analysis reduces dimensionality while preserving maximum variance',
          'LSTM networks are designed to handle the vanishing gradient problem in sequence learning'
        ],
        wrongAnswers: [
          'Linear regression is the best algorithm for all types of prediction problems',
          'Decision trees never overfit the training data',
          'Neural networks cannot be used for regression problems',
          'The performance of machine learning algorithms does not depend on the data distribution',
          'Support Vector Machines work best with unscaled features',
          'K-means clustering always finds the globally optimal clustering',
          'Ensemble methods always require more computation but deliver worse results',
          'Increasing the depth of a decision tree always improves its performance',
          'All neural network architectures require the same amount of data to train effectively',
          'Batch normalization slows down neural network training'
        ]
      },
      applications: {
        concepts: ['Computer Vision', 'Natural Language Processing', 'Recommender Systems', 'Anomaly Detection', 'Time Series Forecasting'],
        correctAnswers: [
          'Computer vision enables machines to interpret and understand visual information from the world',
          'Natural Language Processing helps computers understand, interpret, and generate human language',
          'Recommender systems suggest items to users based on their preferences and behavior',
          'Anomaly detection identifies data points that deviate from expected patterns',
          'Time series forecasting predicts future values based on past observations',
          'Sentiment analysis determines the emotional tone behind text data',
          'Speech recognition converts spoken language into written text',
          'Object detection identifies and locates objects within images or video frames',
          'Machine translation converts text from one language to another',
          'Reinforcement learning is used in robotics to learn optimal control policies'
        ],
        wrongAnswers: [
          'Computer vision algorithms can perfectly replicate human vision in all scenarios',
          'Natural Language Processing systems fully understand text the same way humans do',
          'Recommender systems work perfectly without any user interaction data',
          'Machine learning cannot be applied to medical diagnosis due to regulation constraints',
          'Speech recognition systems work equally well for all languages and accents',
          'Object detection always requires millions of training examples',
          'Machine translation has completely solved the language barrier problem',
          'Sentiment analysis always correctly interprets sarcasm and cultural nuances',
          'Anomaly detection systems never produce false positives',
          'Self-driving cars rely solely on rule-based programming without machine learning'
        ]
      },
      ethics: {
        concepts: ['Bias and Fairness', 'Privacy', 'Transparency', 'Accountability', 'Safety and Security'],
        correctAnswers: [
          'Machine learning models can amplify existing biases in training data',
          'Differential privacy techniques help protect individual data while allowing useful analysis',
          'Explainable AI aims to make machine learning models more transparent and interpretable',
          'Algorithmic impact assessments help evaluate the potential consequences of AI systems',
          'Adversarial attacks can manipulate AI systems by making subtle changes to input data',
          'Data governance frameworks help ensure responsible data collection and usage',
          'Fairness in machine learning involves ensuring models don\'t discriminate against protected groups',
          'Privacy-preserving machine learning allows training models without exposing sensitive data',
          'AI ethics guidelines help establish responsible development and deployment practices',
          'Human oversight is essential in high-stakes AI decision-making processes'
        ],
        wrongAnswers: [
          'Machine learning algorithms are inherently objective and free from human biases',
          'Collecting more data always results in less biased models',
          'Complex models are impossible to make explainable or interpretable',
          'Privacy concerns are not relevant if a dataset has been anonymized',
          'AI systems should always operate autonomously without human oversight',
          'Transparency and model performance are fundamentally opposed goals',
          'Ethical considerations only apply to AI systems in high-risk domains',
          'Adversarial vulnerabilities only affect specific types of neural networks',
          'Regulatory compliance is the only required ethical consideration for AI systems',
          'The trade-off between accuracy and fairness cannot be managed'
        ]
      }
    },

    // Artificial Intelligence knowledge base
    'artificial intelligence': {
      // existing knowledge base
    },
    
    // Cybersecurity knowledge base
    'cybersecurity': {
      fundamentals: {
        concepts: ['CIA Triad', 'Threat Types', 'Attack Vectors', 'Defense in Depth', 'Security Controls'],
        correctAnswers: [
          'The CIA triad consists of Confidentiality, Integrity, and Availability',
          'Security threats can be categorized as unstructured threats, structured threats, and external/internal threats',
          'Defense in depth implements multiple layers of security controls throughout an IT system',
          'Risk management involves identifying, assessing, and mitigating risks to an acceptable level',
          'Authentication verifies identity while authorization determines access privileges',
          'Non-repudiation prevents a user from denying that they performed an action',
          'Principle of least privilege grants only the minimum access rights necessary',
          'Zero trust security assumes no trust by default, even within the network perimeter',
          'Security by design incorporates security from the beginning of system development',
          'A vulnerability is a weakness that can be exploited by a threat'
        ],
        wrongAnswers: [
          'The primary goal of cybersecurity is eliminating all possible vulnerabilities',
          'Once security controls are implemented, they rarely need to be updated',
          'Most security breaches occur due to highly sophisticated attack methods',
          'Antivirus software provides complete protection against all types of malware',
          'Security is primarily a technical issue rather than involving people and processes',
          'Encryption is only necessary for highly sensitive data',
          'The principle of security through obscurity provides reliable protection',
          'Security incidents always result in immediately visible damage',
          'Most organizations face identical security threats regardless of their industry',
          'Complex passwords are sufficient to secure all accounts without other measures'
        ]
      },
      threats: {
        concepts: ['Malware', 'Social Engineering', 'Web Attacks', 'Network Attacks', 'Advanced Persistent Threats'],
        correctAnswers: [
          'Phishing attempts to acquire sensitive information by disguising as a trustworthy entity',
          'Ransomware encrypts a victim\'s files and demands payment for the decryption key',
          'Cross-site scripting (XSS) injects malicious scripts into trusted websites',
          'SQL injection exploits vulnerabilities in database queries to access unauthorized data',
          'Man-in-the-middle attacks secretly relay and possibly alter communications',
          'DDoS attacks overwhelm a system with traffic from multiple sources',
          'Advanced Persistent Threats (APTs) are prolonged, targeted attacks on specific organizations',
          'Zero-day exploits target vulnerabilities before developers have released a patch',
          'Watering hole attacks target specific groups by infecting websites they commonly visit',
          'Insider threats come from individuals within the organization with legitimate access'
        ],
        wrongAnswers: [
          'All malware behaves the same way once it infects a system',
          'Social engineering attacks require advanced technical skills to execute',
          'Web application attacks are only relevant for e-commerce websites',
          'DDoS attacks typically target individual user devices rather than servers',
          'Zero-day vulnerabilities are theoretical concerns rather than real threats',
          'Advanced Persistent Threats primarily target small businesses',
          'Most malware is easily detected by all antivirus programs',
          'Phishing emails are always obvious due to spelling and grammar errors',
          'SQL injection is no longer possible in modern database systems',
          'Network attacks require physical access to the target infrastructure'
        ]
      },
      defense: {
        concepts: ['Encryption', 'Access Control', 'Network Security', 'Monitoring and Detection', 'Incident Response'],
        correctAnswers: [
          'Symmetric encryption uses the same key for encryption and decryption',
          'Public key infrastructure (PKI) uses certificates to authenticate identities',
          'Firewalls filter network traffic based on predetermined security rules',
          'Intrusion detection systems (IDS) identify potential security violations',
          'Security information and event management (SIEM) collects and analyzes security data',
          'Multi-factor authentication combines two or more verification methods',
          'Data Loss Prevention (DLP) prevents unauthorized transmission of sensitive data',
          'Vulnerability scanning identifies potential security weaknesses in systems',
          'Patch management ensures systems are updated with security fixes',
          'Network segmentation limits damage from breaches by isolating network sections'
        ],
        wrongAnswers: [
          'Encrypted data cannot be breached under any circumstances',
          'Complex passwords eliminate the need for additional security measures',
          'Firewalls provide complete protection against all network-based attacks',
          'Security monitoring only needs to be performed during business hours',
          'Automated security tools eliminate the need for human analysis',
          'Security incident response can be handled entirely by IT staff without preparation',
          'All security technologies provide equal protection regardless of implementation',
          'Penetration testing guarantees identification of all vulnerabilities',
          'Security training is only necessary for IT and security professionals',
          'Anti-malware software can detect and remove 100% of malware threats'
        ]
      },
      compliance: {
        concepts: ['Regulations', 'Frameworks', 'Security Policies', 'Auditing', 'Privacy Laws'],
        correctAnswers: [
          'GDPR (General Data Protection Regulation) protects data privacy for EU citizens',
          'HIPAA (Health Insurance Portability and Accountability Act) governs healthcare data in the US',
          'ISO 27001 provides requirements for information security management systems',
          'NIST Cybersecurity Framework provides guidelines for managing cybersecurity risks',
          'PCI DSS (Payment Card Industry Data Security Standard) applies to organizations handling card payments',
          'Security audits evaluate the effectiveness of security controls against established criteria',
          'Information security policies establish rules for protecting information assets',
          'Business continuity plans ensure critical operations continue during disruptions',
          'Data retention policies specify how long data should be kept and when to delete it',
          'Security awareness training helps employees recognize and respond to security threats'
        ],
        wrongAnswers: [
          'Compliance with one regulation automatically ensures compliance with all others',
          'Regulatory requirements remain static and rarely change over time',
          'Security frameworks are only relevant for large enterprises',
          'Documented security policies alone ensure actual security practices',
          'Compliance audits focus primarily on technical controls rather than processes',
          'Privacy regulations apply only to companies that sell personal data',
          'Security standards are identical across all industries and regions',
          'Penetration testing is required only when specifically mandated by regulations',
          'Small businesses are exempt from most cybersecurity regulations',
          'Compliance is a one-time effort rather than an ongoing process'
        ]
      },
      security_operations: {
        concepts: ['SOC Functions', 'Threat Intelligence', 'Security Automation', 'Digital Forensics', 'Vulnerability Management'],
        correctAnswers: [
          'Security Operations Centers (SOCs) monitor and respond to security incidents',
          'Threat intelligence provides information about potential or current threats',
          'Security orchestration automates security operations and incident response',
          'Digital forensics involves collecting and analyzing digital evidence',
          'Incident response plans outline procedures for addressing security incidents',
          'Threat hunting proactively searches for threats that evade existing security solutions',
          'Blue teams focus on defending systems while red teams simulate attacks',
          'Purple teaming combines offense and defense for comprehensive security testing',
          'Chain of custody documents who handled evidence and when during investigations',
          'Threat modeling identifies potential threats and vulnerabilities in a system'
        ],
        wrongAnswers: [
          'Security operations only involve responding to alerts from security tools',
          'Threat intelligence is only valuable for government organizations',
          'Security automation eliminates the need for human analysts',
          'Digital forensics is only relevant after confirmed data breaches',
          'Incident response can be effectively performed without prior planning',
          'Security exercises are primarily for compliance documentation',
          'Threat hunting is unnecessary with modern security technologies',
          'A SOC is only necessary for organizations with sensitive data',
          'Vulnerability management only involves scanning for vulnerabilities',
          'Security monitoring tools eliminate false positives entirely'
        ]
      }
    }
  };
  
  // Check for exact or partial matches in the knowledge bases
  for (const key in knowledgeBases) {
    if (normalizedSkill === key) {
      return knowledgeBases[key];
    }
  }
  
  // Check for partial matches
  for (const key in knowledgeBases) {
    if (normalizedSkill.includes(key) || key.includes(normalizedSkill)) {
      return knowledgeBases[key];
    }
  }
  
  // Generic knowledge base for other skills
  const genericKnowledgeBase = {
    fundamentals: {
      concepts: ['Basic principles', 'Core concepts', 'Foundation knowledge', 'Essential techniques', 'Standard approaches'],
      correctAnswers: [
        `Understanding the core principles is essential in ${skill}`,
        `Learning the fundamental concepts provides a strong foundation for ${skill}`,
        `Mastering the basics is crucial before advancing to complex ${skill} topics`,
        `In ${skill}, fundamental knowledge serves as the building blocks for expertise`,
        `A systematic approach to learning basics leads to better outcomes in ${skill}`,
        `Regular practice is key to developing proficiency in ${skill}`,
        `Understanding theory before practice enhances learning in ${skill}`,
        `Building a strong foundation is essential for advanced ${skill}`,
        `Consistent learning leads to mastery in ${skill}`,
        `Breaking down complex concepts into simpler parts helps master ${skill}`
      ],
      wrongAnswers: [
        `In ${skill}, you can skip foundational concepts and still excel`,
        `Theory has little practical value when learning ${skill}`,
        `Advanced topics in ${skill} are more important than basic concepts`,
        `In ${skill}, memorization is more effective than understanding principles`,
        `Fundamental concepts in ${skill} become obsolete quickly`,
        `Rushing through basics to get to advanced topics is the best approach to ${skill}`,
        `In ${skill}, practice without theory is the optimal learning strategy`,
        `Basic principles in ${skill} aren't relevant to real-world applications`,
        `Random learning without structure works best for ${skill}`,
        `In ${skill}, foundational knowledge is optional for expertise`
      ]
    },
    bestPractices: {
      concepts: ['Standard conventions', 'Professional approaches', 'Quality guidelines', 'Efficiency methods', 'Industry standards'],
      correctAnswers: [
        `Following established conventions ensures consistency in ${skill}`,
        `Regular practice leads to mastery in ${skill}`,
        `Understanding the 'why' behind practices improves proficiency in ${skill}`,
        `In ${skill}, planning before implementation saves time and effort`,
        `Continuous learning is essential to stay current in ${skill}`,
        `Seeking feedback from others improves your ${skill} abilities`,
        `Setting clear goals helps track progress in learning ${skill}`,
        `Structured learning approaches yield better results in ${skill}`,
        `Communities of practice enhance growth in ${skill}`,
        `Professional standards exist to ensure quality in ${skill}`
      ],
      wrongAnswers: [
        `In ${skill}, intuition is more reliable than established practices`,
        `Best practices in ${skill} rarely change and don't need updating`,
        `In ${skill}, quantity of work matters more than quality`,
        `Shortcuts generally lead to better results in ${skill}`,
        `In ${skill}, consistency is less important than creativity`,
        `Working in isolation is the best way to improve in ${skill}`,
        `Formal education is the only valid way to learn ${skill}`,
        `In ${skill}, innovation requires ignoring all established practices`,
        `Following standards limits potential in ${skill}`,
        `Professional communities have little value for advancing in ${skill}`
      ]
    },
    advancedConcepts: {
      concepts: ['Advanced techniques', 'Expert methods', 'Complex strategies', 'Specialized approaches', 'Optimization tactics'],
      correctAnswers: [
        `Advanced ${skill} techniques build upon a solid foundation of basics`,
        `Mastering complex aspects of ${skill} requires deliberate practice`,
        `In advanced ${skill}, understanding context is crucial for application`,
        `Optimization in ${skill} comes from deep understanding of fundamentals`,
        `Expert-level ${skill} involves knowing when to apply specific techniques`,
        `Problem-solving is central to advanced applications of ${skill}`,
        `Innovation in ${skill} often comes from combining established approaches`,
        `Advanced practitioners continuously refine their ${skill} methods`,
        `Expertise in ${skill} develops through varied experience and challenges`,
        `Critical thinking is essential for mastery in ${skill}`
      ],
      wrongAnswers: [
        `Advanced ${skill} concepts can be mastered without understanding basics`,
        `In ${skill}, complex approaches are always better than simple ones`,
        `Advanced techniques in ${skill} work in all situations equally well`,
        `Expert ${skill} practitioners rely primarily on intuition, not principles`,
        `In ${skill}, theoretical knowledge is sufficient for advanced mastery`,
        `Advanced ${skill} is about knowing more techniques, not when to use them`,
        `Creative approaches to ${skill} never need to follow established principles`,
        `Expertise in ${skill} can be achieved quickly with the right shortcuts`,
        `In ${skill}, advanced concepts are only relevant in academic settings`,
        `Specialized knowledge in ${skill} has little practical application`
      ]
    }
  };
  
  // Return the specific knowledge base or fall back to generic
  return knowledgeBases[normalizedSkill] || genericKnowledgeBase;
}

// Generate truly meaningful questions based on the knowledge base
function generateIntelligentQuestions(skill, knowledgeBase) {
  const questions = [];
  const categories = Object.keys(knowledgeBase);
  
  // Generate questions for each category
  categories.forEach((category) => {
    const categoryData = knowledgeBase[category];
    
    if (!categoryData) return; // Skip if category doesn't exist
    
    const { concepts, correctAnswers, wrongAnswers } = categoryData;
    
    // Generate 10 questions per category (instead of 5) for more variety
    for (let i = 0; i < 10; i++) {
      // Select a concept, correct answer, and wrong answers for this question
      const conceptIndex = i % concepts.length;
      const concept = concepts[conceptIndex];
      
      // Get a correct answer - use modulo to cycle through available answers
      const correctAnswerIndex = i % correctAnswers.length;
      const correctAnswer = correctAnswers[correctAnswerIndex];
      
      // Get 3 wrong answers (avoiding duplicates)
      const usedWrongAnswerIndices = new Set();
      const questionWrongAnswers = [];
      
      while (questionWrongAnswers.length < 3 && usedWrongAnswerIndices.size < wrongAnswers.length) {
        const randomIndex = Math.floor(Math.random() * wrongAnswers.length);
        
        if (!usedWrongAnswerIndices.has(randomIndex)) {
          usedWrongAnswerIndices.add(randomIndex);
          questionWrongAnswers.push(wrongAnswers[randomIndex]);
        }
      }
      
      // Generate question text variations based on the category and concept
      const questionTemplates = [
        // Basic question templates
        `Which of the following is a correct statement about ${concept} in ${skill}?`,
        `What is considered a best practice for ${concept} in ${skill}?`,
        `Regarding ${concept} in ${skill}, which statement is correct?`,
        
        // More varied question templates
        `When working with ${concept} in ${skill}, which approach is recommended?`,
        `In ${skill}, what is the most accurate description of ${concept}?`,
        `Which of these statements correctly explains ${concept} as it relates to ${skill}?`,
        `What is a key principle of ${concept} in the context of ${skill}?`,
        `How should ${concept} be understood in ${skill}?`,
        `Which statement best represents current understanding of ${concept} in ${skill}?`,
        `From a professional perspective, which view of ${concept} in ${skill} is most accurate?`,
        `What distinguishes effective use of ${concept} in ${skill}?`,
        `Which approach to ${concept} is considered most effective in ${skill}?`
      ];
      
      // Pick a random question template
      const randomTemplateIndex = Math.floor(Math.random() * questionTemplates.length);
      const questionText = questionTemplates[randomTemplateIndex];
      
      // Create options array with correct answer and wrong answers
      const options = [correctAnswer, ...questionWrongAnswers];
      
      // Shuffle the options
      const shuffledOptions = shuffleArray(options);
      
      // Find the index of the correct answer after shuffling
      const correctAnswerIndex2 = shuffledOptions.indexOf(correctAnswer);
      
      // Generate varied explanations
      const explanationTemplates = [
        `This question tests your understanding of ${concept} in ${skill}. The correct answer demonstrates knowledge of proper ${category === 'fundamentals' ? 'fundamental concepts' : category === 'bestPractices' ? 'best practices' : 'advanced techniques'}.`,
        `Understanding ${concept} is important in ${skill}. The correct option reflects current best practices in the field.`,
        `In ${skill}, ${concept} is a key area of knowledge. The correct answer aligns with professional standards.`,
        `This tests knowledge of ${concept} in ${skill}. The correct answer shows understanding of important principles.`,
        `The correct answer demonstrates proper knowledge of how ${concept} works in ${skill}.`,
        `${concept} is a critical component of ${skill}. The right answer reflects industry standards.`
      ];
      
      // Select a random explanation template
      const randomExplanationIndex = Math.floor(Math.random() * explanationTemplates.length);
      const explanation = explanationTemplates[randomExplanationIndex];
      
      // Add the question to our list
      questions.push({
        id: questions.length,
        question: questionText,
        options: shuffledOptions,
        correctAnswer: correctAnswerIndex2,
        explanation: explanation
      });
    }
  });
  
  // Return shuffled questions
  return shuffleArray(questions);
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}