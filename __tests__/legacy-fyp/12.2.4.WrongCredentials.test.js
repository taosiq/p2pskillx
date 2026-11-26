// __tests__/12.2.4.WrongCredentials.test.js

import { login } from '../utils/authUtils';
import { signInWithEmailAndPassword } from '../utils/firebaseAuth';

// Mock Firebase authentication
jest.mock('../utils/firebaseAuth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

describe('12.2.4. Wrong Credentials', () => {
  beforeEach(() => {
    // Clear mock function calls
    signInWithEmailAndPassword.mockClear();
  });
  
  test('Handles incorrect email format', async () => {
    // Call login with invalid email
    try {
      await login('invalidemail', 'password123');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was thrown
      expect(error.message).toContain('Invalid email format');
    }
    
    // Verify Firebase was not called
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });
  
  test('Handles invalid password', async () => {
    // Mock Firebase error
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/wrong-password',
      message: 'The password is invalid or the user does not have a password.'
    });
    
    // Call login with valid email but wrong password
    try {
      await login('valid@example.com', 'wrongpassword');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was caught
      expect(error.message).toContain('Invalid password');
    }
    
    // Verify Firebase was called
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith('valid@example.com', 'wrongpassword');
  });
  
  test('Handles non-existent user', async () => {
    // Mock Firebase error
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/user-not-found',
      message: 'There is no user record corresponding to this identifier.'
    });
    
    // Call login with non-existent user
    try {
      await login('nonexistent@example.com', 'password123');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was caught
      expect(error.message).toContain('User not found');
    }
    
    // Verify Firebase was called
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith('nonexistent@example.com', 'password123');
  });
  
  test('Handles too many failed attempts', async () => {
    // Mock Firebase error for too many requests
    signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/too-many-requests',
      message: 'Access to this account has been temporarily disabled due to many failed login attempts.'
    });
    
    // Call login
    try {
      await login('valid@example.com', 'password123');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was caught
      expect(error.message).toContain('Too many failed login attempts');
    }
    
    // Verify Firebase was called
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith('valid@example.com', 'password123');
  });
}); 