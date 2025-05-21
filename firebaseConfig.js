
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   FIREBASE_API_KEY,
//   FIREBASE_AUTH_DOMAIN,
//   FIREBASE_PROJECT_ID,
//   FIREBASE_STORAGE_BUCKET,
//   FIREBASE_MESSAGING_SENDER_ID,
//   FIREBASE_APP_ID
// } from '@env';

// const firebaseConfig = {
//   apiKey:FIREBASE_API_KEY,
//   authDomain:FIREBASE_AUTH_DOMAIN,
//   projectId:FIREBASE_PROJECT_ID,
//   storageBucket:FIREBASE_STORAGE_BUCKET,
//   messagingSenderId:FIREBASE_MESSAGING_SENDER_ID,
//   appId:FIREBASE_APP_ID,
// };

const firebaseConfig = {
  apiKey: "AIzaSyBUdWNjWD90RW9PxpQAhZgo-tlQfWbGxdA",
  authDomain: "playground-app-792c2.firebaseapp.com",
  projectId: "playground-app-792c2",
  storageBucket: "playground-app-792c2.firebasestorage.app",
  messagingSenderId: "899534344073",
  appId: "1:899534344073:web:ad5ebfa764ce035ebb9b58"
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

const db = getFirestore(app);
export { auth, db };
