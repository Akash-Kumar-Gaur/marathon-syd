import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCapWqC_O2vFRE_6cniNiOlMDw8oNWEu-A",
  authDomain: "sydney-marathon-2025.firebaseapp.com",
  projectId: "sydney-marathon-2025",
  storageBucket: "sydney-marathon-2025.appspot.com",
  messagingSenderId: "527925093234",
  appId: "1:527925093234:web:a5dba6eff451db2cfef3eb",
  measurementId: "G-QET6Y1X6YF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firestore and Functions
const db = getFirestore(app);
const functions = getFunctions(app);

console.log("Firebase initialized:", app.name);

export { app, analytics, db, functions, httpsCallable };
