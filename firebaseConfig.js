
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

const firebaseConfig = {
  apiKey:              FIREBASE_API_KEY,
  authDomain:          FIREBASE_AUTH_DOMAIN,
  projectId:           FIREBASE_PROJECT_ID,
  storageBucket:       FIREBASE_STORAGE_BUCKET,
  messagingSenderId:   FIREBASE_MESSAGING_SENDER_ID,
  appId:               FIREBASE_APP_ID,
};

// 1) only initialize the App once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// 2) try initializeAuth; on error, fall back to getAuth()
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // already initialized
  auth = getAuth(app);
}

export { auth };
