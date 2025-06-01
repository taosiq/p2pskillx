// __tests__/12.2.1.OpenRouterQuiz.test.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateQuestionsViaOpenRouter } from '../utils/directApi';

// Mock fetch
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

describe('12.2.1. OpenRouter Quiz API', () => {
  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    AsyncStorage.setItem.mockClear();
  });
  
  test('Successfully calls OpenRouter API and processes response', async () => {
    // Mock successful API response
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                question: "What is JavaScript?",
                options: ["A programming language", "A markup language", "A database", "An operating system"],
                correctAnswer: 0,
                explanation: "JavaScript is a programming language used for web development."
              },
              {
                question: "What does HTML stand for?",
                options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
                correctAnswer: 0,
                explanation: "HTML stands for Hyper Text Markup Language."
              }
            ]
          })
        }
      }]
    };
    
    // Setup fetch mock
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });
    
    // Call the function
    const result = await generateQuestionsViaOpenRouter('JavaScript');
    
    // Verify API was called
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('openrouter.ai/api/v1/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer'),
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining('JavaScript')
      })
    );
    
    // Verify result was processed correctly
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe("What is JavaScript?");
    expect(result[0].options).toHaveLength(4);
    expect(result[0].correctAnswer).toBe(0);
    
    // Verify result was cached
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mcqs-javascript',
      expect.any(String)
    );
  });
  
  test('Handles API errors gracefully', async () => {
    // Mock API failure
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // Call the function and expect it to throw
    await expect(generateQuestionsViaOpenRouter('JavaScript'))
      .rejects
      .toThrow();
    
    // Verify API was still called
    expect(fetch).toHaveBeenCalled();
  });
  
  test('Handles connectivity issues', async () => {
    // Mock network failure
    fetch.mockRejectedValueOnce(new Error('Network request failed'));
    
    // Call the function and expect it to throw
    await expect(generateQuestionsViaOpenRouter('JavaScript'))
      .rejects
      .toThrow('Network request failed');
  });
  
  test('Handles malformed responses', async () => {
    // Mock invalid JSON response
    const mockResponse = {
      choices: [{
        message: {
          content: "This is not valid JSON"
        }
      }]
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });
    
    // Call the function and expect it to throw
    await expect(generateQuestionsViaOpenRouter('JavaScript'))
      .rejects
      .toThrow();
  });
}); 