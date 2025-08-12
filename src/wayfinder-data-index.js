// Smart Wayfinder Data Lookup with Direct Decimal Coordinates
// This file provides efficient access to participant data by BIB number
// All coordinates are in decimal format: [latitude, longitude]
// Ped Crossing coordinates are direct arrays: [-33.8405556, 151.2083333]
// Closure times include all 3 periods: "6:30 AM, 7:03 AM, 7:40 AM"

// Import all assembly point data
import { wayfinderData as greenData } from './wayfinder-data-green-assembly.js';
import { wayfinderData as orangeData } from './wayfinder-data-orange-assembly.js';
import { wayfinderData as redData } from './wayfinder-data-red-assembly.js';

// Create a BIB lookup map for fast access
const createBIBLookup = () => {
  const lookup = new Map();
  
  // Add all BIBs from each assembly point
  Object.entries(greenData).forEach(([bib, data]) => lookup.set(bib, data));
  Object.entries(orangeData).forEach(([bib, data]) => lookup.set(bib, data));
  Object.entries(redData).forEach(([bib, data]) => lookup.set(bib, data));
  
  return lookup;
};

// Initialize the lookup map
const bibLookup = createBIBLookup();

// Main function to find participant by BIB
export const findParticipantByBIB = (bibNumber) => {
  return bibLookup.get(bibNumber.toString()) || null;
};

// Get all participants from a specific assembly point
export const getParticipantsByAssemblyPoint = (assemblyPoint) => {
  const normalizedPoint = assemblyPoint.toLowerCase().replace(/s+/g, '-');
  
  switch (normalizedPoint) {
    case 'green-assembly':
      return greenData;
    case 'orange-assembly':
      return orangeData;
    case 'red-assembly':
      return redData;
    default:
      return null;
  }
};

// Get statistics
export const getDataStats = () => ({
  totalParticipants: bibLookup.size,
  greenAssembly: Object.keys(greenData).length,
  orangeAssembly: Object.keys(orangeData).length,
  redAssembly: Object.keys(redData).length
});

// Export individual assembly point data for specific use cases
export { greenData, orangeData, redData };
