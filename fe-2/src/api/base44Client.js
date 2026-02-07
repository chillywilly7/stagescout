// FastAPI Backend Client
// Communicates with the Python FastAPI backend running on port 8000

const API_BASE_URL = "http://localhost:8000/api";

export const base44 = {
  auth: {
    me: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
        console.error("Error fetching current user:", error);
        return null;
      }
    },
    
    login: async (email, password, userType = 'pro') => {
      try {
        const endpoint = userType === 'customer' 
          ? `${API_BASE_URL}/auth/customer/login`
          : `${API_BASE_URL}/auth/login`;
          
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
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
      window.dispatchEvent(new CustomEvent("showLoginModal"));
    },
  },
  
  entities: {
    CustomerAccount: {
      filter: async (filters = {}) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          const response = await fetch(
            `${API_BASE_URL}/customers?${params.toString()}`,
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
            return data.customers || [];
          }
          return [];
        } catch (error) {
          console.error("Error filtering customers:", error);
          return [];
        }
      },
      
      create: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/customers`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to create customer");
          }
        } catch (error) {
          console.error("Error creating customer:", error);
          throw error;
        }
      },
      
      update: async (id, data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to update customer");
          }
        } catch (error) {
          console.error("Error updating customer:", error);
          throw error;
        }
      },
    },
    
    ProAccount: {
      filter: async (filters = {}) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          const response = await fetch(
            `${API_BASE_URL}/pros?${params.toString()}`,
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
            return data.pros || [];
          }
          return [];
        } catch (error) {
          console.error("Error filtering pros:", error);
          return [];
        }
      },
      
      create: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/pros`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to create pro account");
          }
        } catch (error) {
          console.error("Error creating pro:", error);
          throw error;
        }
      },
    },
    
    Scout: {
      list: async (sortBy = "average_rating", limit = 10) => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/scouts?sort_by=${sortBy}&limit=${limit}`,
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
            return data.scouts || [];
          }
          return [];
        } catch (error) {
          console.error("Error fetching scouts:", error);
          return [];
        }
      },
      
      get: async (id) => {
        try {
          const response = await fetch(`${API_BASE_URL}/scouts/${id}`, {
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
          console.error("Error fetching scout:", error);
          return null;
        }
      },
      
      filter: async (filters = {}, sortBy = null, limit = null) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          // Handle sort parameter (e.g., '-sxsw_years' means descending by sxsw_years)
          if (sortBy) {
            const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
            params.append('sort_by', sortField);
          }
          
          // Handle limit parameter
          if (limit) {
            params.append('limit', limit);
          }
          
          const response = await fetch(
            `${API_BASE_URL}/scouts?${params.toString()}`,
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
            return data.scouts || [];
          }
          return [];
        } catch (error) {
          console.error("Error filtering scouts:", error);
          return [];
        }
      },
    },
    
    BookingRequest: {
      list: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.bookings || [];
          }
          return [];
        } catch (error) {
          console.error("Error fetching bookings:", error);
          return [];
        }
      },
      
      filter: async (filters = {}) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          const response = await fetch(
            `${API_BASE_URL}/bookings?${params.toString()}`,
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
            return data.bookings || [];
          }
          return [];
        } catch (error) {
          console.error("Error filtering bookings:", error);
          return [];
        }
      },
      
      create: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to create booking");
          }
        } catch (error) {
          console.error("Error creating booking:", error);
          throw error;
        }
      },
      
      update: async (id, data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to update booking");
          }
        } catch (error) {
          console.error("Error updating booking:", error);
          throw error;
        }
      },
    },
    
    ChatMessage: {
      list: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/messages`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.messages || [];
          }
          return [];
        } catch (error) {
          console.error("Error fetching messages:", error);
          return [];
        }
      },
      
      filter: async (filters = {}) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          const response = await fetch(
            `${API_BASE_URL}/messages?${params.toString()}`,
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
            return data.messages || [];
          }
          return [];
        } catch (error) {
          console.error("Error filtering messages:", error);
          return [];
        }
      },
      
      create: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/messages`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            return result;
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to send message");
          }
        } catch (error) {
          console.error("Error creating message:", error);
          throw error;
        }
      },
    },
  },
};
