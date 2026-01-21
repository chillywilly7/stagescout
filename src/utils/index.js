// Utility functions

/**
 * Create a page URL based on the page name
 * @param {string} pageName - The name of the page
 * @returns {string} - The URL for the page
 */
export const createPageUrl = (pageName) => {
  const pageRoutes = {
    Home: '/',
    Search: '/search',
    Tasker: '/tasker',
    BecomeTasker: '/become-tasker',
    Bookings: '/my-bookings',
    MyBookings: '/my-bookings',
    Services: '/my-services',
    MyServices: '/my-services',
    Messages: '/messages',
  };
  
  return pageRoutes[pageName] || '/';
};

/**
 * Format currency value
 * @param {number} value - The value to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

/**
 * Format date to readable string
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Debounce a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
