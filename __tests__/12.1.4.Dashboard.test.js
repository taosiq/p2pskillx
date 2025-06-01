// __tests__/12.1.4.Dashboard.test.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import DashboardScreen from '../screens/DashboardScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('12.1.4. Dashboard', () => {
  beforeEach(() => {
    // Mock the AsyncStorage to return user data
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@user_data') {
        return Promise.resolve(JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }));
      }
      if (key === '@verified_skills') {
        return Promise.resolve(JSON.stringify(['JavaScript', 'React Native']));
      }
      return Promise.resolve(null);
    });
  });
  
  test('Dashboard displays all components correctly', async () => {
    const { getByText, getByTestId, findByText } = render(<DashboardScreen />);
    
    // Verify welcome message
    const welcomeMessage = await findByText(/Welcome, Test User/);
    expect(welcomeMessage).toBeTruthy();
    
    // Verify skill cards
    const teachButton = getByTestId('teach-skill-button');
    const learnButton = getByTestId('learn-skill-button');
    
    expect(teachButton).toBeTruthy();
    expect(learnButton).toBeTruthy();
    
    // Verify verified skills section
    const skillsSection = await findByText('Your Verified Skills');
    expect(skillsSection).toBeTruthy();
    
    // Verify the verified skills are displayed
    const jsSkill = await findByText('JavaScript');
    const rnSkill = await findByText('React Native');
    
    expect(jsSkill).toBeTruthy();
    expect(rnSkill).toBeTruthy();
    
    // Test navigation to teach skill screen
    fireEvent.press(teachButton);
    expect(getByTestId('teach-skill-button').props.onPress).toHaveBeenCalled();
    
    // Test navigation to learn skill screen
    fireEvent.press(learnButton);
    expect(getByTestId('learn-skill-button').props.onPress).toHaveBeenCalled();
  });
  
  test('Dashboard handles no verified skills correctly', async () => {
    // Update mock to return empty skills array
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@verified_skills') {
        return Promise.resolve(JSON.stringify([]));
      }
      if (key === '@user_data') {
        return Promise.resolve(JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }));
      }
      return Promise.resolve(null);
    });
    
    const { findByText } = render(<DashboardScreen />);
    
    // Verify no skills message
    const noSkillsMessage = await findByText('No verified skills yet. Start learning to add skills!');
    expect(noSkillsMessage).toBeTruthy();
  });
}); 