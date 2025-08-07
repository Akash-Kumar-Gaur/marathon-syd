import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
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

// Leaderboard functions
export const fetchLeaderboardData = async () => {
  try {
    console.log("Fetching leaderboard data from Firebase...");

    // Get all users from Firebase
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    if (snapshot.empty) {
      console.log("No users found in Firebase");
      return [];
    }

    // Calculate scores and create leaderboard entries
    const leaderboardEntries = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();

      // Only include verified users in leaderboard
      if (!userData.verified) {
        return;
      }

      // Calculate total score: (treasures * 10) + totalBoosterScore
      const treasureScore = (userData.collectedTreasures?.length || 0) * 10;
      const boosterScore = userData.totalBoosterScore || 0;
      const totalScore = treasureScore + boosterScore;

      // Only include users with score > 0
      if (totalScore > 0) {
        leaderboardEntries.push({
          id: doc.id,
          name: userData.name || "Anonymous",
          points: totalScore,
          treasureCount: userData.collectedTreasures?.length || 0,
          boosterScore: boosterScore,
          avatarId: userData.avatar?.id || 1,
          avatarImage: userData.avatar?.image,
        });
      }
    });

    // Sort by points (descending) and assign positions
    leaderboardEntries.sort((a, b) => b.points - a.points);

    // Add positions and limit to top 25
    const topEntries = leaderboardEntries.slice(0, 25).map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

    console.log(`Leaderboard data fetched: ${topEntries.length} entries`);
    return topEntries;
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }
};

// Calculate user's total score
export const calculateUserScore = (userData) => {
  if (!userData) return 0;

  const treasureScore = (userData.collectedTreasures?.length || 0) * 10;
  const boosterScore = userData.totalBoosterScore || 0;
  return treasureScore + boosterScore;
};

// Get user's rank in leaderboard
export const getUserRank = async (userId, userScore) => {
  try {
    const leaderboardData = await fetchLeaderboardData();
    const userRank =
      leaderboardData.findIndex((entry) => entry.id === userId) + 1;
    return userRank > 0 ? userRank : null; // null if user not in top 25
  } catch (error) {
    console.error("Error getting user rank:", error);
    return null;
  }
};

// Route and Distance Caching Service
class RouteCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100; // Maximum number of cached routes
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  // Generate cache key from start and end coordinates
  generateKey(start, end) {
    // Round coordinates to 4 decimal places to group nearby locations
    const roundedStart = [
      Math.round(start[0] * 10000) / 10000,
      Math.round(start[1] * 10000) / 10000,
    ];
    const roundedEnd = [
      Math.round(end[0] * 10000) / 10000,
      Math.round(end[1] * 10000) / 10000,
    ];
    return `${roundedStart[0]},${roundedStart[1]}-${roundedEnd[0]},${roundedEnd[1]}`;
  }

  // Get cached route data
  get(start, end) {
    const key = this.generateKey(start, end);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log("Route cache hit:", key);
      return cached.data;
    }

    if (cached) {
      // Remove expired cache entry
      this.cache.delete(key);
    }

    return null;
  }

  // Set cached route data
  set(start, end, data) {
    const key = this.generateKey(start, end);

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    console.log("Route cached:", key);
  }

  // Clear all cached data
  clear() {
    this.cache.clear();
    console.log("Route cache cleared");
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach((value) => {
      if (now - value.timestamp < this.cacheExpiry) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }
}

// Global route cache instance
export const routeCache = new RouteCache();

// Debug function to log cache statistics
export const logCacheStats = () => {
  const stats = routeCache.getStats();
  console.log("Route Cache Stats:", stats);
  return stats;
};

// Function to clear cache (useful for testing)
export const clearRouteCache = () => {
  routeCache.clear();
  console.log("Route cache cleared");
};

// Cached route fetching function
export const fetchCachedRoute = async (start, end, accessToken) => {
  // Check cache first
  const cachedRoute = routeCache.get(start, end);
  if (cachedRoute) {
    return cachedRoute;
  }

  try {
    console.log("Fetching new route from API...");

    // Fetch from Mapbox API
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const routeData = {
        geometry: route.geometry,
        distance: route.distance / 1000, // Convert to kilometers
        duration: route.duration / 60, // Convert to minutes
      };

      // Cache the result
      routeCache.set(start, end, routeData);

      return routeData;
    }

    throw new Error("No routes found");
  } catch (error) {
    console.error("Error fetching route:", error);

    // Fallback to straight line calculation
    const fallbackRoute = {
      geometry: {
        type: "LineString",
        coordinates: [start, end],
      },
      distance: calculateDirectDistance(start, end),
      duration: null,
    };

    // Cache the fallback result too
    routeCache.set(start, end, fallbackRoute);

    return fallbackRoute;
  }
};

// Calculate direct distance between two points (Haversine formula)
export const calculateDirectDistance = (start, end) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((end[1] - start[1]) * Math.PI) / 180;
  const dLon = ((end[0] - start[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start[1] * Math.PI) / 180) *
      Math.cos((end[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Cached distance calculation
export const getCachedDistance = (start, end) => {
  const cachedRoute = routeCache.get(start, end);
  if (cachedRoute) {
    return cachedRoute.distance;
  }

  // If no cached route, calculate direct distance
  return calculateDirectDistance(start, end);
};

export { app, analytics, db, functions, httpsCallable };
