// __tests__/12.2.5.AlreadyRegisteredError.test.js

import { register } from '../utils/authUtils';
import { createUserWithEmailAndPassword } from '../utils/firebaseAuth';

// Mock Firebase authentication
jest.mock('../utils/firebaseAuth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

describe('12.2.5. Already Registered Error', () => {
  beforeEach(() => {
    // Clear mock function calls
    createUserWithEmailAndPassword.mockClear();
  });
  
  test('Detects already registered email', async () => {
    // Mock Firebase error for email already in use
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
      message: 'The email address is already in use by another account.'
    });
    
    // Call register function
    try {
      await register('existing@example.com', 'password123', 'Existing User');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was caught
      expect(error.message).toContain('already registered');
      // Make sure user-friendly message is returned
      expect(error.message).toContain('Please login instead');
    }
    
    // Verify Firebase was called
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith('existing@example.com', 'password123');
  });
  
  test('Handles registration attempt with invalid email', async () => {
    // Call register with invalid email
    try {
      await register('invalidemail', 'password123', 'Invalid User');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was thrown
      expect(error.message).toContain('Invalid email format');
    }
    
    // Verify Firebase was not called
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
  
  test('Handles registration attempt with weak password', async () => {
    // Mock Firebase error for weak password
    createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/weak-password',
      message: 'Password should be at least 6 characters.'
    });
    
    // Call register with weak password
    try {
      await register('valid@example.com', '123', 'Valid User');
      fail('Should have thrown an error');
    } catch (error) {
      // Verify correct error was caught
      expect(error.message).toContain('weak password');
    }
    
    // Verify Firebase was called
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith('valid@example.com', '123');
  });
  
  test('Successfully registers a new user', async () => {
    // Mock successful registration
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: {
        uid: '123456',
        email: 'new@example.com',
        getIdToken: jest.fn().mockResolvedValueOnce('mock-token')
      }
    });
    
    // Call register function
    const result = await register('new@example.com', 'password123', 'New User');
    
    // Verify success
    expect(result).toBeTruthy();
    expect(result.uid).toBe('123456');
    
    // Verify Firebase was called
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
  });
}); 