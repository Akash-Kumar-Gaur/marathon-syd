// Location and Routing Utility Functions
// Extracted from WayfinderMapbox.js to reduce file size and improve maintainability

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert coordinates to Mapbox format [longitude, latitude]
 * @param {Array} coordinates - Coordinates in [lng, lat] or [lat, lng] format
 * @returns {Array} Coordinates in Mapbox format [lng, lat]
 */
export const convertToMapboxFormat = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }
  
  // If coordinates are already in [lng, lat] format, return as is
  if (coordinates[0] >= -180 && coordinates[0] <= 180) {
    return coordinates;
  }
  
  // If coordinates are in [lat, lng] format, convert to [lng, lat]
  return [coordinates[1], coordinates[0]];
};

/**
 * Calculate distance from a point to a line segment
 * @param {number} px - X coordinate of the point
 * @param {number} py - Y coordinate of the point
 * @param {number} x1 - X coordinate of line start
 * @param {number} y1 - Y coordinate of line start
 * @param {number} x2 - X coordinate of line end
 * @param {number} y2 - Y coordinate of line end
 * @returns {number} Distance in kilometers
 */
export const calculateDistanceFromPointToLine = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  // Return distance in kilometers
  return Math.sqrt(dx * dx + dy * dy) * 111; // Rough conversion to km
};

/**
 * Get BIB data for a participant
 * @param {string} bibNumber - BIB number to search for
 * @returns {Object|null} BIB data or null if not found
 */
export const getBibData = (bibNumber) => {
  // This function should be imported from the actual data source
  // For now, it's a placeholder that will be replaced with the actual import
  console.warn("getBibData function needs to be imported from the actual data source");
  return null;
};

/**
 * Get selected route for a BIB number
 * @param {string} bibNumber - BIB number to get route for
 * @returns {Object|null} Route data or null if not found
 */
export const getSelectedRoute = (bibNumber) => {
  // This function should be imported from the actual data source
  // For now, it's a placeholder that will be replaced with the actual import
  console.warn("getSelectedRoute function needs to be imported from the actual data source");
  return null;
};

/**
 * Search for locations using OpenStreetMap Nominatim API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
export const searchLocation = async (query) => {
  if (!query.trim()) {
    return [];
  }

  try {
    // Using OpenStreetMap Nominatim API for geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1&countrycodes=au`
    );
    const data = await response.json();

    return data.map((item) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.error("Error searching location:", error);
    return [];
  }
};

/**
 * Validate if coordinates are valid
 * @param {Array} coordinates - Coordinates to validate
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (coordinates) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return false;
  }
  
  const [lng, lat] = coordinates;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

/**
 * Format coordinates for display
 * @param {Array} coordinates - Coordinates to format
 * @param {number} precision - Decimal places for formatting
 * @returns {string} Formatted coordinates string
 */
export const formatCoordinates = (coordinates, precision = 6) => {
  if (!validateCoordinates(coordinates)) {
    return "Invalid coordinates";
  }
  
  const [lng, lat] = coordinates;
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};
