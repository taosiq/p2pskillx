import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsDR8-vqECntFCf2EoBlhCn_5xeM-7Asg",
  authDomain: "p2pskillx-e5c83.firebaseapp.com",
  projectId: "p2pskillx-e5c83",
  storageBucket: "p2pskillx-e5c83.appspot.com",
  messagingSenderId: "1056682056125",
  appId: "1:1056682056125:android:37e5cba384a1474a21dad4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
export default app; 