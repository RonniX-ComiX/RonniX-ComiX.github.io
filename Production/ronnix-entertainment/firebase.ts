import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// WICHTIG: Ersetze diese Platzhalter mit deinen Daten aus der Firebase Console
// Gehe zu: Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvLLP1wy2dZsiwwPHWEG3JkHqH3PlUyMA",
  authDomain: "ronnix-comix.firebaseapp.com",
  projectId: "ronnix-comix",
  storageBucket: "ronnix-comix.firebasestorage.app",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1'); // Region muss mit deiner Cloud Function übereinstimmen
export const googleProvider = new GoogleAuthProvider();
export default app;