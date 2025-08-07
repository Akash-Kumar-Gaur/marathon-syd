import { raceWeekData } from "../raceWeek.js";
import { raceDayData } from "../raceDay.js";

// Server endpoints for time verification
const TIME_VERIFICATION_ENDPOINTS = [
  "https://worldtimeapi.org/api/timezone/Australia/Sydney",
  "https://timeapi.io/api/Time/current/zone?timeZone=Australia/Sydney",
];

// Fallback time verification using multiple sources
const getServerTime = async () => {
  const timePromises = TIME_VERIFICATION_ENDPOINTS.map(async (endpoint) => {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Parse different response formats
      let timestamp;
      if (data.datetime) {
        // WorldTimeAPI format
        timestamp = new Date(data.datetime);
      } else if (data.formatted) {
        // TimeZoneDB format
        timestamp = new Date(data.formatted);
      } else if (data.dateTime) {
        // TimeAPI format
        timestamp = new Date(data.dateTime);
      } else {
        throw new Error("Unknown response format");
      }

      return timestamp;
    } catch (error) {
      // Only log in development or if it's a significant error
      if (process.env.NODE_ENV === "development") {
        console.warn(`Failed to fetch time from ${endpoint}:`, error.message);
      }
      return null;
    }
  });

  try {
    const times = await Promise.allSettled(timePromises);
    const validTimes = times
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    if (validTimes.length === 0) {
      throw new Error("No server time sources available");
    }

    // Use the median time to avoid outliers
    validTimes.sort((a, b) => a.getTime() - b.getTime());
    const medianIndex = Math.floor(validTimes.length / 2);
    return validTimes[medianIndex];
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Server time unavailable, using device time as fallback");
    }
    return new Date();
  }
};

// Cache server time to avoid excessive API calls
let cachedServerTime = null;
let cacheExpiry = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCachedServerTime = async () => {
  const now = Date.now();

  // Return cached time if still valid
  if (cachedServerTime && cacheExpiry && now < cacheExpiry) {
    return cachedServerTime;
  }

  try {
    const serverTime = await getServerTime();
    cachedServerTime = serverTime;
    cacheExpiry = now + CACHE_DURATION;
    return serverTime;
  } catch (error) {
    // If server time fails, use device time silently
    if (process.env.NODE_ENV === "development") {
      console.warn("Using device time as fallback");
    }
    return new Date();
  }
};

// Check if we should use race day data
const shouldUseRaceDayData = async () => {
  try {
    // Try server time first, but fallback quickly to device time
    let timeToUse;
    try {
      timeToUse = await getCachedServerTime();
    } catch (error) {
      // If server time fails, use device time immediately
      timeToUse = new Date();
    }

    // Convert to Sydney timezone
    const sydneyTime = new Date(
      timeToUse.toLocaleString("en-US", {
        timeZone: "Australia/Sydney",
      })
    );

    // Race day starts after August 30th, 2025, 10:00 PM Sydney time
    const raceDayStart = new Date("2025-08-30T22:00:00+10:00"); // 10 PM Sydney time

    const shouldUseRaceDay = sydneyTime >= raceDayStart;

    if (process.env.NODE_ENV === "development") {
      console.log("Time used (Sydney):", sydneyTime.toISOString());
      console.log("Race day start:", raceDayStart.toISOString());
      console.log("Should use race day data:", shouldUseRaceDay);
    }

    return shouldUseRaceDay;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error determining treasure data selection:", error);
    }
    // Fallback to race week data if time verification fails
    return false;
  }
};

// Get the appropriate treasure data based on current time
export const getTreasureData = async () => {
  const useRaceDay = await shouldUseRaceDayData();
  const data = useRaceDay ? raceDayData : raceWeekData;
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Using ${useRaceDay ? "race day" : "race week"} data with ${
        data.length
      } treasures`
    );
  }
  return data;
};

// Export the check function for use in components
export const checkRaceDayStatus = shouldUseRaceDayData;
