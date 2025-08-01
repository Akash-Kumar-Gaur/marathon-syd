// Data validation and sanitization utilities

/**
 * Validates user data structure
 * @param {Object} data - User data to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateUserData = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Required fields for a valid user
  const requiredFields = ['name', 'email', 'verified'];
  return requiredFields.every(field => data.hasOwnProperty(field));
};

/**
 * Sanitizes user data to ensure consistent structure
 * @param {Object} data - Raw user data
 * @returns {Object} - Sanitized user data
 */
export const sanitizeUserData = (data) => {
  if (!data || typeof data !== 'object') {
    return getDefaultUserData();
  }

  return {
    name: String(data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    avatar: data.avatar || '',
    country: String(data.country || ''),
    postcode: String(data.postcode || ''),
    verified: Boolean(data.verified),
    loginMethod: String(data.loginMethod || ''),
    challengeScores: data.challengeScores || {},
    totalBoosterScore: Number(data.totalBoosterScore || 0),
    collectedTreasures: Array.isArray(data.collectedTreasures) ? data.collectedTreasures : [],
    createdAt: data.createdAt || new Date(),
    verifiedAt: data.verifiedAt || null,
  };
};

/**
 * Default user data structure
 * @returns {Object} - Default user data
 */
export const getDefaultUserData = () => ({
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
  collectedTreasures: [],
  createdAt: new Date(),
  verifiedAt: null,
});

/**
 * Validates treasure data structure
 * @param {Object} treasure - Treasure data to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateTreasureData = (treasure) => {
  if (!treasure || typeof treasure !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'name', 'coordinates'];
  return requiredFields.every(field => treasure.hasOwnProperty(field));
};

/**
 * Sanitizes treasure data
 * @param {Object} treasure - Raw treasure data
 * @returns {Object} - Sanitized treasure data
 */
export const sanitizeTreasureData = (treasure) => {
  if (!validateTreasureData(treasure)) {
    return null;
  }

  return {
    id: String(treasure.id),
    name: String(treasure.name),
    hint: String(treasure.hint || ''),
    offer: String(treasure.offer || ''),
    address: String(treasure.address || ''),
    hours: String(treasure.hours || ''),
    redeem: String(treasure.redeem || ''),
    code: String(treasure.code || ''),
    image: String(treasure.image || ''),
    coordinates: {
      latitude: Number(treasure.coordinates.latitude),
      longitude: Number(treasure.coordinates.longitude),
    },
  };
};

/**
 * Validates challenge score data
 * @param {Object} scores - Challenge scores to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateChallengeScores = (scores) => {
  if (!scores || typeof scores !== 'object') {
    return false;
  }
  
  // Check if all values are numbers
  return Object.values(scores).every(score => typeof score === 'number' && !isNaN(score));
};

/**
 * Sanitizes challenge scores
 * @param {Object} scores - Raw challenge scores
 * @returns {Object} - Sanitized challenge scores
 */
export const sanitizeChallengeScores = (scores) => {
  if (!validateChallengeScores(scores)) {
    return {};
  }

  const sanitized = {};
  Object.entries(scores).forEach(([key, value]) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      sanitized[key] = numValue;
    }
  });

  return sanitized;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Sanitizes email
 * @param {string} email - Raw email
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
};

/**
 * Validates and normalizes treasure ID
 * @param {string|number} id - Treasure ID to normalize
 * @returns {string} - Normalized treasure ID
 */
export const normalizeTreasureId = (id) => {
  if (!id) {
    return '';
  }
  
  // If it's already a string with "treasure_" prefix, return as-is
  if (typeof id === 'string' && id.startsWith('treasure_')) {
    return id;
  }
  
  // If it's a number or string number, convert to "treasure_X" format
  const numId = parseInt(id);
  if (!isNaN(numId)) {
    return `treasure_${numId}`;
  }
  
  // Fallback to string
  return String(id);
}; 