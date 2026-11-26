// __tests__/12.2.3.InvalidData.test.js

import { generateQuestionsViaOpenRouter } from '../utils/directApi';
import { checkInternetConnection } from '../utils/networkUtils';
import { generateQuestions } from '../utils/questionGenerator';

// Mock modules
jest.mock('../utils/directApi', () => ({
  generateQuestionsViaOpenRouter: jest.fn(),
}));

jest.mock('../utils/networkUtils', () => ({
  checkInternetConnection: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('12.2.3. Invalid Data Handling', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  test('Handles empty skill name gracefully', async () => {
    // Set up mocks
    checkInternetConnection.mockResolvedValueOnce(true);
    generateQuestionsViaOpenRouter.mockRejectedValueOnce(new Error('Skill name cannot be empty'));
    
    // Call the function with empty skill name
    try {
      await generateQuestions('');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error was thrown
      expect(error.message).toContain('Skill name cannot be empty');
    }
  });
  
  test('Handles malformed API responses', async () => {
    // Set up mocks
    checkInternetConnection.mockResolvedValueOnce(true);
    
    // Simulate a malformed API response
    generateQuestionsViaOpenRouter.mockResolvedValueOnce({
      // Missing required fields
      invalidStructure: true
    });
    
    // Call the function with a valid skill name
    try {
      await generateQuestions('JavaScript');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify it falls back to local generation
      expect(error.message).toContain('Invalid response format');
    }
  });
  
  test('Falls back to local questions when API fails', async () => {
    // Set up mocks
    checkInternetConnection.mockResolvedValueOnce(true);
    generateQuestionsViaOpenRouter.mockRejectedValueOnce(new Error('API unavailable'));
    
    // Mock the local questions generator
    const mockLocalQuestions = [
      {
        id: 0,
        question: "What is JavaScript?",
        options: ["A programming language", "A markup language", "A database", "An operating system"],
        correctAnswer: 0,
        explanation: "JavaScript is a programming language used for web development."
      }
    ];
    
    // Make global function to simulate generateLocalQuestions
    global.generateLocalQuestions = jest.fn().mockReturnValueOnce(mockLocalQuestions);
    
    // Call the function
    const result = await generateQuestions('JavaScript');
    
    // Verify fallback worked
    expect(result).toEqual(mockLocalQuestions);
  });
  
  test('Handles offline mode correctly', async () => {
    // Simulate being offline
    checkInternetConnection.mockResolvedValueOnce(false);
    
    // Mock cached questions
    const mockCachedQuestions = JSON.stringify([
      {
        id: 0,
        question: "What is JavaScript?",
        options: ["A programming language", "A markup language", "A database", "An operating system"],
        correctAnswer: 0,
        explanation: "JavaScript is a programming language used for web development."
      }
    ]);
    
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce(mockCachedQuestions);
    
    // Call the function
    const result = await generateQuestions('JavaScript');
    
    // Verify we used cached questions
    expect(AsyncStorage.getItem).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
    
    // Verify the API was not called
    expect(generateQuestionsViaOpenRouter).not.toHaveBeenCalled();
  });
}); 