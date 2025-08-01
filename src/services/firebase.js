import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate that required environment variables are set
const requiredEnvVars = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(
      ", "
    )}\n` +
      "Please create a .env file with your Firebase configuration. See .env.example for reference."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === "development") {
  try {
    // Only connect to emulators if they're available
    if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true") {
      connectFirestoreEmulator(db, "localhost", 8080);
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log("Connected to Firebase emulators");
    }
  } catch (error) {
    console.warn("Firebase emulator connection failed:", error);
  }
}

console.log("Firebase initialized:", app.name);

// Error handling wrapper for Firebase operations
export const safeFirebaseOperation = async (
  operation,
  operationName = "Firebase operation"
) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);

    // Provide user-friendly error messages
    if (error.code === "permission-denied") {
      throw new Error("Access denied. Please check your permissions.");
    } else if (error.code === "unavailable") {
      throw new Error("Service temporarily unavailable. Please try again.");
    } else if (error.code === "deadline-exceeded") {
      throw new Error("Request timed out. Please try again.");
    } else {
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
};

export { app, analytics, db, functions, httpsCallable };
