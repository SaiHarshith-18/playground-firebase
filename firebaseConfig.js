// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCy6tOQKrGXuuSrd5W-GBjyM_o99QE35fU",
  authDomain: "playground-app-748f2.firebaseapp.com",
  projectId: "playground-app-748f2",
  storageBucket: "playground-app-748f2.firebasestorage.app",
  messagingSenderId: "263589227516",
  appId: "1:263589227516:web:9bb5202960f09f257c2079"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);