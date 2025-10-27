// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsLfn3D78iP-s2VY7FhV5KiuUi3dMZ4eo",
  authDomain: "oyola-ai.firebaseapp.com",
  projectId: "oyola-ai",
  storageBucket: "oyola-ai.firebasestorage.app",
  messagingSenderId: "560941459989",
  appId: "1:560941459989:web:5a3da360ec3f29513b3c1c",
  measurementId: "G-S1D4N0GEDL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore (optional - for storing additional user data)
export const db = getFirestore(app);

export default app;

