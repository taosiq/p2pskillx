import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsDR8-vqECntFCf2EoBlhCn_5xeM-7Asg",
  authDomain: "p2pskillx-e5c83.firebaseapp.com",
  projectId: "p2pskillx-e5c83",
  storageBucket: "p2pskillx-e5c83.appspot.com",
  messagingSenderId: "1056682056125",
  appId: "1:1056682056125:android:37e5cba384a1474a21dad4"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence, only if it hasn't been initialized
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  // If auth is not initialized yet, initialize it with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence for Firestore
try {
  // Only enable persistence in production or when not in a web environment
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log('Firestore offline persistence enabled');
      })
      .catch((error) => {
        console.warn('Error enabling Firestore offline persistence:', error.code, error.message);
        // Handle specific error cases
        if (error.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence only enabled in one tab');
        } else if (error.code === 'unimplemented') {
          console.warn('Current environment does not support persistence');
        }
      });
  }
} catch (error) {
  console.warn('Error setting up Firestore persistence:', error);
}

export { auth, db };
export default app; 