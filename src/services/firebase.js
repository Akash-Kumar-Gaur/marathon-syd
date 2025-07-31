import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyCapWqC_O2vFRE_6cniNiOlMDw8oNWEu-A",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "sydney-marathon-2025.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "sydney-marathon-2025",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "sydney-marathon-2025.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "527925093234",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:527925093234:web:a5dba6eff451db2cfef3eb",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-QET6Y1X6YF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const functions = getFunctions(app);

console.log("Firebase initialized:", app.name);

export { app, analytics, db, functions, httpsCallable };
