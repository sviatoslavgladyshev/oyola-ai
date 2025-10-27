// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);