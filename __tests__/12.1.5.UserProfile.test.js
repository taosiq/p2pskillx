// __tests__/12.1.5.UserProfile.test.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import ProfileScreen from '../screens/ProfileScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('12.1.5. User Profile', () => {
  beforeEach(() => {
    // Setup AsyncStorage mock with user data
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === '@user_data') {
        return Promise.resolve(JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Software developer with expertise in React Native and JavaScript',
          profileImage: 'https://example.com/profile.jpg'
        }));
      }
      if (key === '@verified_skills') {
        return Promise.resolve(JSON.stringify(['JavaScript', 'React Native', 'Python']));
      }
      return Promise.resolve(null);
    });
  });
  
  test('Profile screen loads and displays user data correctly', async () => {
    const { getByText, findByText, getByTestId } = render(<ProfileScreen />);
    
    // Verify profile information is loaded
    const userName = await findByText('Test User');
    const userEmail = await findByText('test@example.com');
    const userBio = await findByText('Software developer with expertise in React Native and JavaScript');
    
    expect(userName).toBeTruthy();
    expect(userEmail).toBeTruthy();
    expect(userBio).toBeTruthy();
    
    // Verify verified skills section
    const skillsSection = await findByText('Verified Skills');
    expect(skillsSection).toBeTruthy();
    
    // Verify individual skills
    const jsSkill = await findByText('JavaScript');
    const rnSkill = await findByText('React Native');
    const pythonSkill = await findByText('Python');
    
    expect(jsSkill).toBeTruthy();
    expect(rnSkill).toBeTruthy();
    expect(pythonSkill).toBeTruthy();
    
    // Test edit profile button
    const editProfileButton = getByTestId('edit-profile-button');
    expect(editProfileButton).toBeTruthy();
    
    fireEvent.press(editProfileButton);
    
    // Verify navigation to edit profile screen
    expect(editProfileButton.props.onPress).toHaveBeenCalled();
  });
  
  test('Profile handles logout correctly', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    // Find and press logout button
    const logoutButton = getByText('Logout');
    expect(logoutButton).toBeTruthy();
    
    fireEvent.press(logoutButton);
    
    // Check if confirmation dialog appears
    await waitFor(() => {
      const confirmDialog = getByText('Are you sure you want to logout?');
      expect(confirmDialog).toBeTruthy();
    });
    
    // Confirm logout
    const confirmButton = getByText('Yes');
    fireEvent.press(confirmButton);
    
    // Verify AsyncStorage clear
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    });
  });
}); 