// __tests__/12.1.3.OpenRouterQuizGeneration.test.js

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { act } from 'react-test-renderer';
import SkillVerificationMCQScreen from '../screens/SkillVerificationMCQScreen';
import { generateQuestionsViaOpenRouter } from '../utils/directApi';

// Mock the API function
jest.mock('../utils/directApi', () => ({
  generateQuestionsViaOpenRouter: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      skills: ['JavaScript'],
    },
  }),
}));

describe('12.1.3. OpenRouter Quiz Generation', () => {
  test('Successfully generates and displays MCQs', async () => {
    // Mock the API response
    const mockQuestions = [
      {
        id: 0,
        question: "What is JavaScript?",
        options: ["A programming language", "A markup language", "A database", "An operating system"],
        correctAnswer: 0,
        explanation: "JavaScript is a programming language used for web development."
      },
      {
        id: 1,
        question: "Which symbol is used for comments in JavaScript?",
        options: ["//", "#", "<!--", "/**/"],
        correctAnswer: 0,
        explanation: "// is used for single line comments in JavaScript."
      },
      // More questions...
    ];
    
    generateQuestionsViaOpenRouter.mockResolvedValueOnce(mockQuestions);
    
    let component;
    
    await act(async () => {
      component = render(<SkillVerificationMCQScreen />);
    });
    
    // Check loading state is displayed initially
    expect(component.getByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(generateQuestionsViaOpenRouter).toHaveBeenCalledWith('JavaScript');
    });
    
    // Verify questions are displayed
    await waitFor(() => {
      expect(component.getByText("What is JavaScript?")).toBeTruthy();
      expect(component.getByText("A programming language")).toBeTruthy();
    });
    
    // Test answering a question
    const option = component.getByText("A programming language");
    fireEvent.press(option);
    
    // Verify option is selected
    await waitFor(() => {
      expect(option.props.style).toContainEqual(expect.objectContaining({
        backgroundColor: '#e3f2fd',
      }));
    });
    
    // Verify that the timer is displayed
    const timer = component.getByTestId('quiz-timer');
    expect(timer).toBeTruthy();
    expect(timer.props.children).toMatch(/\d+:\d+/); // Time format: MM:SS
    
    // Test the show results button
    const showResultsButton = component.getByText("Show Results");
    fireEvent.press(showResultsButton);
    
    // Verify results display
    await waitFor(() => {
      const correctMarker = component.getAllByText("✓")[0];
      expect(correctMarker).toBeTruthy();
    });
  });
  
  test('Handles API errors gracefully', async () => {
    // Mock API failure
    generateQuestionsViaOpenRouter.mockRejectedValueOnce(new Error('API connection failed'));
    
    let component;
    
    await act(async () => {
      component = render(<SkillVerificationMCQScreen />);
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(component.getByText(/API connection failed/)).toBeTruthy();
      expect(component.getByText("Try Again")).toBeTruthy();
      expect(component.getByText("Use Offline Questions")).toBeTruthy();
    });
    
    // Test the "Use Offline Questions" button
    const useOfflineButton = component.getByText("Use Offline Questions");
    fireEvent.press(useOfflineButton);
    
    // Verify questions are loaded from local source
    await waitFor(() => {
      // Some question text should be visible
      expect(component.getByTestId('question-card')).toBeTruthy();
    });
  });
}); 