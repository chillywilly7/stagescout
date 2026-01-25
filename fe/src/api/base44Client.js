// FastAPI Backend Client
// Communicates with the Python FastAPI backend running on port 8000

const API_BASE_URL = "http://localhost:8000/api";

export const base44 = {
  auth: {
    me: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include", // Include cookies for authentication
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
        return null;
      } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
      }
    },
    
    login: async (email, password) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          credentials: "include", // Enable cookie storage
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          const error = await response.json();
          throw new Error(error.detail || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    
    logout: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        return response.ok;
      } catch (error) {
        console.error("Logout error:", error);
        return false;
      }
    },
    
    redirectToLogin: () => {
      // This will be called from the UI to show login modal
      window.dispatchEvent(new CustomEvent("showLoginModal"));
    },
  },
  
  entities: {
    Tasker: {
      list: async (sortBy = "average_rating", limit = 10) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/taskers?sort_by=${sortBy}&limit=${limit}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            return data.taskers || [];
          }
          return [];
        } catch (error) {
          console.error("Error fetching taskers:", error);
          return [];
        }
      },
      
      get: async (id) => {
        try {
          const response = await fetch(`${API_BASE_URL}/taskers/${id}`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return data;
          }
          return null;
        } catch (error) {
          console.error("Error fetching tasker:", error);
          return null;
        }
      },
      
      getByCategory: async (category, limit = 10) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/taskers/category/${category}?limit=${limit}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            return data.taskers || [];
          }
          return [];
        } catch (error) {
          console.error("Error fetching taskers by category:", error);
          return [];
        }
      },
    },
    
    Booking: {
      list: async () => {
        // TODO: Implement when booking endpoints are ready
        return [];
      },
      
      create: async (data) => {
        // TODO: Implement when booking endpoints are ready
        console.log("Creating booking:", data);
        return null;
      },
    },
    
    Message: {
      list: async () => {
        // TODO: Implement when messaging endpoints are ready
        return [];
      },
    },
    
    Review: {
      list: async () => {
        // TODO: Implement when review endpoints are ready
        return [];
      },
    },
  },
};

