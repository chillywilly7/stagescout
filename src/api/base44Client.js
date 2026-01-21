// Mock base44 API client
// This is a placeholder - replace with your actual API implementation

export const base44 = {
  auth: {
    me: async () => {
      // Return mock user or null if not authenticated
      return null;
    },
    login: async (email, password) => {
      console.log('Login attempt:', email);
      return null;
    },
    logout: async () => {
      return true;
    },
  },
  entities: {
    Tasker: {
      list: async (sortBy, limit) => {
        console.log('Fetching taskers:', { sortBy, limit });
        return [];
      },
      get: async (id) => {
        console.log('Fetching tasker:', id);
        return null;
      },
    },
    Booking: {
      list: async () => {
        return [];
      },
      create: async (data) => {
        console.log('Creating booking:', data);
        return null;
      },
    },
    Message: {
      list: async () => {
        return [];
      },
    },
    Review: {
      list: async () => {
        return [];
      },
    },
  },
};
