import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    country: "",
    postcode: "",
    verified: false,
    loginMethod: "",
    challengeScores: {},
    totalBoosterScore: 0,
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDocId, setUserDocId] = useState(() => {
    // Try to get userDocId from localStorage on initialization
    try {
      const stored = localStorage.getItem("userDocId");
      return stored || null;
    } catch (error) {
      console.error("Error loading userDocId from localStorage:", error);
      return null;
    }
  });

  // Load user data from localStorage on mount (for persistence)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("userData");
      if (stored) {
        const parsedData = JSON.parse(stored);

        // Handle migration from isVerified to verified
        if (
          parsedData.isVerified !== undefined &&
          parsedData.verified === undefined
        ) {
          parsedData.verified = parsedData.isVerified;
          delete parsedData.isVerified;
        }
        // Handle migration from boosterScores to challengeScores
        if (
          parsedData.boosterScores !== undefined &&
          parsedData.challengeScores === undefined
        ) {
          parsedData.totalBoosterScore = parsedData.boosterScores || 0;
          parsedData.challengeScores = {};
          delete parsedData.boosterScores;
        }

        setUserData(parsedData);
        setIsLoggedIn(true);

        // If user is verified and has email, try to get document ID from Firebase
        if (parsedData.verified && parsedData.email) {
          loadUserFromFirebase(parsedData.email);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  const loadUserFromFirebase = async (email) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUserDocId(userDoc.id);
        localStorage.setItem("userDocId", userDoc.id);
        console.log("Loaded user document ID from Firebase:", userDoc.id);
      }
    } catch (error) {
      console.error("Error loading user from Firebase:", error);
    }
  };

  const updateUserData = (newUserData) => {
    // Ensure we're using the correct field name
    const cleanUserData = { ...newUserData };
    if (cleanUserData.isVerified !== undefined) {
      cleanUserData.verified = cleanUserData.isVerified;
      delete cleanUserData.isVerified;
    }

    // Ensure challengeScores and totalBoosterScore are always present
    if (!cleanUserData.challengeScores) {
      cleanUserData.challengeScores = {};
    }
    if (cleanUserData.totalBoosterScore === undefined) {
      cleanUserData.totalBoosterScore = 0;
    }

    setUserData(cleanUserData);
    setIsLoggedIn(true);
    // Also persist to localStorage for now (can be removed later)
    localStorage.setItem("userData", JSON.stringify(cleanUserData));
  };

  const addBoosterScore = async (points, challengeName) => {
    setUserData((prev) => {
      const currentChallengeScore = 0;
      const newChallengeScores = {
        ...prev.challengeScores,
        [challengeName]: currentChallengeScore + points,
      };
      const newTotalBoosterScore = (prev.totalBoosterScore || 0) + points;
      const newData = {
        ...prev,
        challengeScores: newChallengeScores,
        totalBoosterScore: newTotalBoosterScore,
      };
      localStorage.setItem("userData", JSON.stringify(newData));

      // Also save to Firebase if we have a document ID
      if (userDocId) {
        updateDoc(doc(db, "users", userDocId), {
          challengeScores: newChallengeScores,
          totalBoosterScore: newTotalBoosterScore,
        })
          .then(() => {
            console.log("Scores saved to Firebase successfully");
          })
          .catch((error) => {
            console.error("Error saving scores to Firebase:", error);
          });
      }

      return newData;
    });
  };

  const getChallengeScore = (challengeName) => {
    return userData.challengeScores?.[challengeName] || 0;
  };

  const setUserDocumentId = (docId) => {
    setUserDocId(docId);
    localStorage.setItem("userDocId", docId);
  };

  const clearUserData = () => {
    setUserData({
      name: "",
      email: "",
      phone: "",
      country: "",
      postcode: "",
      verified: false,
      loginMethod: "",
      challengeScores: {},
      totalBoosterScore: 0,
    });
    setIsLoggedIn(false);
    setUserDocId(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("userDocId");
  };

  const value = {
    userData,
    isLoggedIn,
    updateUserData,
    clearUserData,
    addBoosterScore,
    getChallengeScore,
    setUserDocumentId,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
