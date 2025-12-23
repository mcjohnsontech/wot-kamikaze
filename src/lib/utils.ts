/**
 * Generate a secure random token for rider and customer access
 * @param length - Length of the token (default: 16)
 * @returns A random alphanumeric token
 */
export const generateToken = (length: number = 16): string => {
  // Browser-compatible version using crypto.getRandomValues
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-browser environments
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Format phone number for WhatsApp
 * @param phone - Phone number (can include +, -, (), spaces)
 * @returns Cleaned phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if missing
  if (!cleaned.startsWith('234')) {
    return '234' + cleaned.slice(-10);
  }
  return cleaned;
};

/**
 * Calculate ETA based on distance and average speed
 * @param distanceKm - Distance in kilometers
 * @param speedKmh - Average speed in km/h (default: 30 for Lagos traffic)
 * @returns ETA in minutes
 */
export const calculateETA = (distanceKm: number, speedKmh: number = 30): number => {
  return Math.ceil((distanceKm / speedKmh) * 60);
};

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format currency to Nigerian Naira
 * @param amount - Amount in naira
 * @returns Formatted string
 */
export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
