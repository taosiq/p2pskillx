// __tests__/12.1.1.OpeningApp.test.js

import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { act } from 'react-test-renderer';
import App from '../App';

describe('12.1.1. Opening the App', () => {
  test('App renders correctly with all initial components', async () => {
    // Setup mock navigation
    jest.mock('@react-navigation/native', () => ({
      useNavigation: () => ({
        navigate: jest.fn(),
      }),
    }));

    let component;
    
    // Use act to handle any async rendering
    await act(async () => {
      component = render(<App />);
    });
    
    // Wait for all animations and async operations to complete
    await waitFor(() => {
      // Verify splash screen appears
      const splashLogo = component.queryByTestId('splash-logo');
      expect(splashLogo).toBeTruthy();
    });
    
    // Verify navigation to login screen happens after splash
    await waitFor(() => {
      const loginScreen = component.queryByTestId('login-screen');
      expect(loginScreen).toBeTruthy();
      
      // Verify essential UI elements are present
      const appTitle = component.queryByText('P2PSkillX');
      expect(appTitle).toBeTruthy();
      
      const welcomeMessage = component.queryByText('Welcome to P2PSkillX');
      expect(welcomeMessage).toBeTruthy();
    }, { timeout: 5000 });
    
    // Verify app initialization completes successfully
    expect(component).toBeTruthy();
  });
}); 