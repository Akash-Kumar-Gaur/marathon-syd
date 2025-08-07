import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  validateUserData,
  sanitizeUserData,
  getDefaultUserData,
} from "../utils/dataValidation";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(getDefaultUserData());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDocId, setUserDocId] = useState(() => {
    try {
      const stored = localStorage.getItem("userDocId");
      return stored || null;
    } catch (error) {
      console.error("Error loading userDocId from localStorage:", error);
      return null;
    }
  });

  // Initialize user data - Firebase is the source of truth
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const storedDocId = localStorage.getItem("userDocId");
        const storedUserData = localStorage.getItem("userData");

        if (storedDocId && storedDocId.trim() !== "") {
          if (storedUserData) {
            // Both docId and userData exist - validate and refresh from Firebase
            try {
              const parsedData = JSON.parse(storedUserData);
              if (validateUserData(parsedData)) {
                // Load fresh data from Firebase to ensure consistency
                const freshData = await loadUserFromFirebaseById(storedDocId);
                if (freshData) {
                  console.log("Successfully loaded fresh data from Firebase");
                  setUserData(freshData);
                  setIsLoggedIn(true);
                  setUserDocId(storedDocId);
                } else {
                  console.log(
                    "Failed to load from Firebase, using stored data"
                  );
                  setUserData(parsedData);
                  setIsLoggedIn(true);
                }
              } else {
                console.log(
                  "Stored data validation failed, attempting to reload from Firebase"
                );
                // Try to reload from Firebase even if stored data is invalid
                const freshData = await loadUserFromFirebaseById(storedDocId);
                if (freshData) {
                  console.log(
                    "Successfully reloaded data from Firebase after validation failure"
                  );
                  setUserData(freshData);
                  setIsLoggedIn(true);
                  setUserDocId(storedDocId);
                } else {
                  console.log("No valid data found in Firebase, logging out");
                  clearUserData();
                }
              }
            } catch (parseError) {
              console.error("Error parsing stored user data:", parseError);
              // Try to reload from Firebase even if parsing failed
              const freshData = await loadUserFromFirebaseById(storedDocId);
              if (freshData) {
                console.log(
                  "Successfully reloaded data from Firebase after parse error"
                );
                setUserData(freshData);
                setIsLoggedIn(true);
                setUserDocId(storedDocId);
              } else {
                console.log("No valid data found in Firebase, logging out");
                clearUserData();
              }
            }
          } else {
            // Only docId exists but no userData - try to reload from Firebase
            console.log(
              "userData missing from localStorage, attempting to reload from Firebase"
            );
            const freshData = await loadUserFromFirebaseById(storedDocId);
            if (freshData) {
              console.log("Successfully reloaded userData from Firebase");
              setUserData(freshData);
              setIsLoggedIn(true);
              setUserDocId(storedDocId);
            } else {
              console.log("No valid data found in Firebase, logging out");
              clearUserData();
            }
          }
        } else {
          // No docId or empty docId - user is not logged in, clear everything
          console.log(
            "No userDocId found or empty userDocId, logging out user"
          );
          clearUserData();
        }
      } catch (error) {
        console.error("Error initializing user data:", error);
        clearUserData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserData();
  }, []);

  // Helper function to clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("userData");
      localStorage.removeItem("userDocId");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  // Load user data from Firebase by document ID
  const loadUserFromFirebaseById = async (docId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", docId));
      if (userDoc.exists()) {
        const firebaseData = userDoc.data();
        console.log("Firebase data loaded:", firebaseData);

        if (validateUserData(firebaseData)) {
          const updatedUserData = sanitizeUserData(firebaseData);

          // Update localStorage with fresh data
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          localStorage.setItem("userDocId", docId);

          return updatedUserData;
        } else {
          console.error("Invalid user data from Firebase:", firebaseData);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error loading user from Firebase by ID:", error);
      return null;
    }
  };

  // Load user data from Firebase by email (for login)
  const loadUserFromFirebase = async (email) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const firebaseData = userDoc.data();
        console.log("Firebase data loaded by email:", firebaseData);

        if (validateUserData(firebaseData)) {
          setUserDocId(userDoc.id);
          localStorage.setItem("userDocId", userDoc.id);

          const updatedUserData = sanitizeUserData(firebaseData);

          console.log("Updated user data from Firebase:", updatedUserData);
          setUserData(updatedUserData);
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          setIsLoggedIn(true);

          return updatedUserData;
        } else {
          console.error("Invalid user data from Firebase:", firebaseData);
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error loading user from Firebase:", error);
      return null;
    }
  };

  const updateUserData = (newUserData) => {
    // Validate incoming data
    if (!validateUserData(newUserData)) {
      console.error(
        "Invalid user data provided to updateUserData:",
        newUserData
      );
      return;
    }

    // Clean and validate the data
    const cleanUserData = sanitizeUserData(newUserData);
    if (cleanUserData.isVerified !== undefined) {
      cleanUserData.verified = cleanUserData.isVerified;
      delete cleanUserData.isVerified;
    }

    console.log("Updating user data:", cleanUserData);

    setUserData(cleanUserData);
    setIsLoggedIn(true);

    // Update localStorage
    try {
      localStorage.setItem("userData", JSON.stringify(cleanUserData));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }

    // Save to Firebase if we have a document ID
    if (userDocId) {
      console.log("Saving user data to Firebase with userDocId:", userDocId);
      updateDoc(doc(db, "users", userDocId), cleanUserData)
        .then(() => {
          console.log("User data saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving user data to Firebase:", error);
          // Don't update local state if Firebase save fails
          // This prevents data corruption
        });
    } else {
      console.log("No userDocId available, skipping Firebase save");
    }
  };

  const addBoosterScore = async (points, challengeName) => {
    if (!userDocId) {
      console.error("Cannot add booster score: no userDocId");
      return;
    }

    setUserData((prev) => {
      const currentChallengeScore = prev.challengeScores?.[challengeName] || 0;
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

      // Update localStorage
      try {
        localStorage.setItem("userData", JSON.stringify(newData));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }

      // Save to Firebase
      updateDoc(doc(db, "users", userDocId), {
        challengeScores: newChallengeScores,
        totalBoosterScore: newTotalBoosterScore,
      })
        .then(() => {
          console.log("Scores saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving scores to Firebase:", error);
          // Revert local state if Firebase save fails
          setUserData(prev);
        });

      return newData;
    });
  };

  const getChallengeScore = (challengeName) => {
    return userData.challengeScores?.[challengeName] || 0;
  };

  const setUserDocumentId = (docId) => {
    if (!docId) {
      console.error("Cannot set userDocId: invalid document ID");
      return;
    }

    setUserDocId(docId);
    try {
      localStorage.setItem("userDocId", docId);
    } catch (error) {
      console.error("Error saving userDocId to localStorage:", error);
    }
  };

  const addCollectedTreasure = async (treasureId) => {
    if (!userDocId) {
      console.error("Cannot add collected treasure: no userDocId");
      return;
    }

    setUserData((prev) => {
      // Check if treasure is already collected
      if (prev.collectedTreasures?.includes(treasureId)) {
        console.log(`Treasure ${treasureId} already collected`);
        return prev;
      }

      const newCollectedTreasures = [
        ...(prev.collectedTreasures || []),
        treasureId,
      ];
      const newData = {
        ...prev,
        collectedTreasures: newCollectedTreasures,
      };

      // Update localStorage
      try {
        localStorage.setItem("userData", JSON.stringify(newData));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }

      // Save to Firebase
      updateDoc(doc(db, "users", userDocId), {
        collectedTreasures: newCollectedTreasures,
      })
        .then(() => {
          console.log("Collected treasure saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving collected treasure to Firebase:", error);
          // Revert local state if Firebase save fails
          setUserData(prev);
        });

      return newData;
    });
  };

  const clearUserData = () => {
    setUserData(getDefaultUserData());
    setIsLoggedIn(false);
    setUserDocId(null);
    clearLocalStorage();

    // Redirect to welcome page if not already there
    if (
      window.location.pathname !== "/welcome" &&
      window.location.pathname !== "/"
    ) {
      console.log("Redirecting to welcome page after logout");
      window.location.href = "/welcome";
    }
  };

  const value = {
    userData,
    isLoggedIn,
    isLoading,
    userDocId,
    updateUserData,
    clearUserData,
    addBoosterScore,
    getChallengeScore,
    setUserDocumentId,
    loadUserFromFirebase,
    loadUserFromFirebaseById,
    addCollectedTreasure,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
