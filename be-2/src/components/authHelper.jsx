// Authentication state management
const AUTH_KEY = 'stagepros_auth_session';

export const authState = {
  setSession: (email, userType = 'pro') => {
    if (email) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email, userType, timestamp: Date.now() }));
    }
  },

  getSession: () => {
    const session = localStorage.getItem(AUTH_KEY);
    return session ? JSON.parse(session) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(AUTH_KEY);
  },

  getUserType: () => {
    const session = authState.getSession();
    return session?.userType || 'pro';
  },

  clearSession: () => {
    localStorage.removeItem(AUTH_KEY);
  }
};