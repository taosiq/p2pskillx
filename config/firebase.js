import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_API_KEY } from '../api-keys'; // Kept out of git (see .gitignore)

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "p2pskillx-e5c83.firebaseapp.com",
  projectId: "p2pskillx-e5c83",
  storageBucket: "p2pskillx-e5c83.appspot.com",
  messagingSenderId: "1056682056125",
  appId: "1:1056682056125:android:37e5cba384a1474a21dad4"
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// initializeAuth must run first so the login survives app restarts (AsyncStorage).
// On a fast refresh the app already exists, so reuse the existing auth instance.
const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

// Firestore keeps an in-memory cache on React Native; IndexedDB persistence is web-only.
const db = getFirestore(app);

export { auth, db };
export default app;
