import AsyncStorage from '@react-native-async-storage/async-storage';

// Your OpenRouter API key - REPLACE THIS with your actual API key
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// Keys for storing API information
const API_KEY_STORAGE_KEY = '@api_key';
const API_URL_STORAGE_KEY = '@api_url';

export const setupApiKey = async () => {
  try {
    // Store API key and URL
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, OPENROUTER_API_KEY);
    await AsyncStorage.setItem(API_URL_STORAGE_KEY, OPENROUTER_API_URL);
    console.log('API key and URL set successfully');
    return true;
  } catch (error) {
    console.error('Error setting API key:', error);
    return false;
  }
};

// Check if API is already configured
export const isApiConfigured = async () => {
  try {
    const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return !!apiKey;
  } catch (error) {
    console.error('Error checking API configuration:', error);
    return false;
  }
};

// Function to clear API settings if needed
export const clearApiSettings = async () => {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    await AsyncStorage.removeItem(API_URL_STORAGE_KEY);
    console.log('API settings cleared');
    return true;
  } catch (error) {
    console.error('Error clearing API settings:', error);
    return false;
  }
}; 