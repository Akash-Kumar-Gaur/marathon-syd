// Utility for working with closure times
// Converts string times to comparable time objects

/**
 * Convert time string to minutes since midnight for easy comparison
 * @param {string} timeStr - Time string like "6:30 AM" or "7:00 AM"
 * @returns {number} Minutes since midnight
 */
export const timeStringToMinutes = (timeStr) => {
  const time = timeStr.trim();
  const [timePart, period] = time.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);

  let totalMinutes = hours * 60 + minutes;

  if (period === "PM" && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === "AM" && hours === 12) {
    totalMinutes = minutes; // 12:00 AM = 0 minutes
  }

  return totalMinutes;
};

/**
 * Check if current time falls within any closure period
 * @param {string} closureTimeStart - Start times like "6:30 AM, 7:03 AM, 7:40 AM"
 * @param {string} closureTimeEnd - End times like "7:00 AM, 7:31 AM, 8:10 AM"
 * @returns {boolean} True if current time is within any closure period
 */
export const isCurrentlyInClosurePeriod = (
  closureTimeStart,
  closureTimeEnd
) => {
  //   return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startTimes = closureTimeStart.split(", ").map(timeStringToMinutes);
  const endTimes = closureTimeEnd.split(", ").map(timeStringToMinutes);

  return startTimes.some((start, index) => {
    const end = endTimes[index];
    return currentMinutes >= start && currentMinutes <= end;
  });
};

/**
 * Get all closure periods as structured data
 * @param {string} closureTimeStart - Start times like "6:30 AM, 7:03 AM, 7:40 AM"
 * @param {string} closureTimeEnd - End times like "7:00 AM, 7:31 AM, 8:10 AM"
 * @returns {Array} Array of closure period objects
 */
export const getClosurePeriods = (closureTimeStart, closureTimeEnd) => {
  const startTimes = closureTimeStart.split(", ");
  const endTimes = closureTimeEnd.split(", ");

  return startTimes.map((start, index) => ({
    period: index + 1,
    start: start,
    end: endTimes[index],
    startMinutes: timeStringToMinutes(start),
    endMinutes: timeStringToMinutes(endTimes[index]),
  }));
};

/**
 * Check if current time is within a specific closure period
 * @param {number} periodNumber - Which period to check (1, 2, or 3)
 * @param {string} closureTimeStart - Start times string
 * @param {string} closureTimeEnd - End times string
 * @returns {boolean} True if current time is within specified period
 */
export const isInSpecificClosurePeriod = (
  periodNumber,
  closureTimeStart,
  closureTimeEnd
) => {
  const periods = getClosurePeriods(closureTimeStart, closureTimeEnd);
  const targetPeriod = periods[periodNumber - 1];

  if (!targetPeriod) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    currentMinutes >= targetPeriod.startMinutes &&
    currentMinutes <= targetPeriod.endMinutes
  );
};

// Example usage and testing
const testClosureTimes = {
  start: "6:30 AM, 7:03 AM, 7:40 AM",
  end: "7:00 AM, 7:31 AM, 8:10 AM",
};

console.log("=== TIME UTILITY TEST ===");

console.log("\n1. Converting time strings to minutes:");
console.log("6:30 AM =", timeStringToMinutes("6:30 AM"), "minutes");
console.log("7:00 AM =", timeStringToMinutes("7:00 AM"), "minutes");
console.log("7:03 AM =", timeStringToMinutes("7:03 AM"), "minutes");
console.log("8:10 AM =", timeStringToMinutes("8:10 AM"), "minutes");

console.log("\n2. Closure periods structure:");
const periods = getClosurePeriods(testClosureTimes.start, testClosureTimes.end);
periods.forEach((period) => {
  console.log(
    `Period ${period.period}: ${period.start} - ${period.end} (${period.startMinutes}-${period.endMinutes} minutes)`
  );
});

console.log("\n3. Current time check:");
const now = new Date();
const currentTimeStr = now.toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
console.log("Current time:", currentTimeStr);
console.log(
  "Is currently in closure period:",
  isCurrentlyInClosurePeriod(testClosureTimes.start, testClosureTimes.end)
);

console.log("\n4. Specific period checks:");
[1, 2, 3].forEach((periodNum) => {
  const isInPeriod = isInSpecificClosurePeriod(
    periodNum,
    testClosureTimes.start,
    testClosureTimes.end
  );
  console.log(`In Period ${periodNum}: ${isInPeriod}`);
});
