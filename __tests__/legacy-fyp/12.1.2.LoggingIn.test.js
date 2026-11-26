// __tests__/12.1.2.LoggingIn.test.js

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { signInWithEmailAndPassword } from '../utils/firebaseAuth';

// Mock firebase auth
jest.mock('../utils/firebaseAuth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('12.1.2. Logging In', () => {
  test('User can login with valid credentials', async () => {
    // Mock successful login
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-user-id', email: 'test@example.com' }
    });
    
    const { getByPlaceholderText, getByText, getByTestId } = render(<LoginScreen />);
    
    // Get form elements
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');
    
    // Fill form
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'Password123');
    
    // Check that inputs have correct values
    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('Password123');
    
    // Submit form
    fireEvent.press(loginButton);
    
    // Verify loading indicator appears
    await waitFor(() => {
      const loadingIndicator = getByTestId('login-loading');
      expect(loadingIndicator).toBeTruthy();
    });
    
    // Verify firebase auth was called with correct credentials
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'Password123');
    
    // Verify navigation to dashboard after successful login
    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });
  
  test('Shows error message for invalid credentials', async () => {
    // Mock failed login
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid email or password'));
    
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    // Get form elements
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');
    
    // Fill form with invalid credentials
    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    
    // Submit form
    fireEvent.press(loginButton);
    
    // Verify error message appears
    await waitFor(() => {
      const errorMessage = getByText('Invalid email or password');
      expect(errorMessage).toBeTruthy();
    });
  });
}); 