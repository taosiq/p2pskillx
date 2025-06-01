// apiKeyManager.js - A utility to manage API keys at runtime
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENROUTER_API_KEY } from '../api-keys'; // Import from secure file

// Keys for storing API information
const API_KEY_STORAGE_KEY = '@api_key';
const API_URL_STORAGE_KEY = '@api_url';

// Default OpenRouter values
const DEFAULT_API_KEY = OPENROUTER_API_KEY; // Use imported key
const DEFAULT_API_URL = 'https://openrouter.ai/api/v1';

// Get the API key (from storage or default)
export const getApiKey = async () => {
  try {
    const storedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return storedKey || DEFAULT_API_KEY;
  } catch (error) {
    console.error('Error getting API key:', error);
    return DEFAULT_API_KEY;
  }
};

// Get the API URL (from storage or default)
export const getApiUrl = async () => {
  try {
    const storedUrl = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
    return storedUrl || DEFAULT_API_URL;
  } catch (error) {
    console.error('Error getting API URL:', error);
    return DEFAULT_API_URL;
  }
};

// Set a custom API key
export const setApiKey = async (apiKey) => {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    return true;
  } catch (error) {
    console.error('Error setting API key:', error);
    return false;
  }
};

// Set a custom API URL
export const setApiUrl = async (apiUrl) => {
  try {
    await AsyncStorage.setItem(API_URL_STORAGE_KEY, apiUrl);
    return true;
  } catch (error) {
    console.error('Error setting API URL:', error);
    return false;
  }
};

// Reset to default values
export const resetApiSettings = async () => {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    await AsyncStorage.removeItem(API_URL_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting API settings:', error);
    return false;
  }
};

// Check if OpenRouter is configured
export const isOpenRouterConfigured = async () => {
  const apiKey = await getApiKey();
  const apiUrl = await getApiUrl();
  return apiKey && apiUrl && apiUrl.includes('openrouter.ai');
}; 