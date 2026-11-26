// __tests__/12.2.2.AuthTokens.test.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, signOut } from '../utils/firebaseAuth';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Firebase authentication
jest.mock('../utils/firebaseAuth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

describe('12.2.2. Auth Tokens', () => {
  beforeEach(() => {
    // Clear mock function calls
    AsyncStorage.setItem.mockClear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.removeItem.mockClear();
    signInWithEmailAndPassword.mockClear();
    signOut.mockClear();
  });
  
  test('Authentication tokens are stored after login', async () => {
    // Mock token value
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    // Mock Firebase signin response
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: {
        uid: '123456',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValueOnce(mockToken)
      }
    });
    
    // Call the login function
    const authUtils = require('../utils/authUtils');
    await authUtils.login('test@example.com', 'password123');
    
    // Verify token was stored
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@auth_token',
      mockToken
    );
  });
  
  test('Token retrieval works correctly', async () => {
    // Mock stored token
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    AsyncStorage.getItem.mockResolvedValueOnce(mockToken);
    
    // Call the token retrieval function
    const authUtils = require('../utils/authUtils');
    const token = await authUtils.getAuthToken();
    
    // Verify correct token was returned
    expect(token).toBe(mockToken);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@auth_token');
  });
  
  test('Token validation works correctly', async () => {
    // Mock a valid token
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    // Mock an expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    // Test validation
    const authUtils = require('../utils/authUtils');
    
    // Valid token test
    expect(authUtils.isTokenValid(validToken)).toBe(true);
    
    // Expired token test
    expect(authUtils.isTokenValid(expiredToken)).toBe(false);
  });
  
  test('Tokens are removed on logout', async () => {
    // Mock signOut success
    signOut.mockResolvedValueOnce();
    
    // Call logout function
    const authUtils = require('../utils/authUtils');
    await authUtils.logout();
    
    // Verify token was removed
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
    expect(signOut).toHaveBeenCalled();
  });
}); 