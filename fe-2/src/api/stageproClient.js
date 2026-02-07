// StagePro API Client
// Communicates with the Python FastAPI backend running on port 8000

const API_BASE_URL = "http://localhost:8000/api";

export const stagepro = {
  auth: {
    me: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
      }
    },
    
    login: async (email, password, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    },
    
    signup: async (email, password, name, phone = "", userType = 'pro', securityQ1 = "", securityA1 = "", securityQ2 = "", securityA2 = "") => {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          phone,
          user_type: userType,
          security_question_1: securityQ1,
          security_answer_1: securityA1,
          security_question_2: securityQ2,
          security_answer_2: securityA2
        }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Signup failed");
    },
    
    checkEmail: async (email, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Failed to check email");
    },
    
    checkPhone: async (phone, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/check-phone`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Failed to check phone");
    },
    
    getSecurityQuestions: async (email, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/security-questions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Failed to get security questions");
    },
    
    forgotPassword: async (email, securityAnswer1, securityAnswer2, newPassword, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          security_answer_1: securityAnswer1,
          security_answer_2: securityAnswer2,
          new_password: newPassword,
          user_type: userType
        }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Password reset failed");
    },
    
    sendResetCode: async (email, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Failed to send reset code");
    },
    
    verifyResetCode: async (email, code, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Code verification failed");
    },
    
    resetPassword: async (email, newPassword, userType = 'pro') => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword, user_type: userType }),
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json();
      throw new Error(error.detail || "Password reset failed");
    },
    
    logout: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
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
    
    // Pro-specific auth methods
    pro: {
      getSecurityQuestions: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/pro/security-questions`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Failed to get security questions");
      },
      
      sendResetCode: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/pro/forgot-password/send-code`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Failed to send reset code");
      },
      
      resetWithSecurityQuestions: async (email, securityAnswer1, securityAnswer2, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/auth/pro/forgot-password/security-questions`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            security_answer_1: securityAnswer1,
            security_answer_2: securityAnswer2,
            new_password: newPassword
          }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Password reset failed");
      },
      
      verifyResetCode: async (email, code) => {
        const response = await fetch(`${API_BASE_URL}/auth/pro/forgot-password/verify-code`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Code verification failed");
      },
      
      resetPassword: async (email, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/auth/pro/forgot-password/reset`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, new_password: newPassword }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Password reset failed");
      },
    },
    
    // Customer-specific auth methods
    customer: {
      sendVerification: async (email, name) => {
        const response = await fetch(`${API_BASE_URL}/auth/customer/send-verification`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        });
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "Failed to send verification");
      },
    },
  },
  
  // Integrations for file uploads and emails
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        
        if (response.ok) {
          return await response.json();
        }
        const error = await response.json();
        throw new Error(error.detail || "File upload failed");
      },
      
      SendEmail: async ({ to, subject, body }) => {
        const response = await fetch(`${API_BASE_URL}/email/send`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body }),
        });
        
        if (response.ok) {
          return await response.json();
        }
        // Silently fail for email - log but don't throw
        console.log("Email sending delegated to backend:", { to, subject });
        return { success: true };
      }
    }
  },
  
  // App logging
  appLogs: {
    logUserInApp: async (pageName) => {
      try {
        const response = await fetch(`${API_BASE_URL}/logs/page-view`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_name: pageName }),
        });
        return response.ok;
      } catch (error) {
        // Silently fail for logging
        return false;
      }
    }
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
            return result.customer || result;
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
            return { ...result.pro, id: result.id };
          } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to create pro account");
          }
        } catch (error) {
          console.error("Error creating pro:", error);
          throw error;
        }
      },
      
      update: async (id, data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/pros/${id}`, {
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
            throw new Error(error.detail || "Failed to update pro account");
          }
        } catch (error) {
          console.error("Error updating pro:", error);
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
      
      create: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/scouts`, {
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
            throw new Error(error.detail || "Failed to create scout");
          }
        } catch (error) {
          console.error("Error creating scout:", error);
          throw error;
        }
      },
      
      update: async (id, data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/scouts/${id}`, {
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
            throw new Error(error.detail || "Failed to update scout");
          }
        } catch (error) {
          console.error("Error updating scout:", error);
          throw error;
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
      
      filter: async (filters = {}, sortBy = null) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          if (sortBy) {
            const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
            params.append('sort_by', sortField);
          }
          
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
      
      filter: async (filters = {}, sortBy = null) => {
        try {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, value);
            }
          });
          
          if (sortBy) {
            params.append('sort_by', sortBy);
          }
          
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
