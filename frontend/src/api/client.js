import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies (refresh tokens)
});

// Store for access token (set by AuthContext)
let accessToken = null;

// Set auth token for all requests
export const setAuthToken = (token) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    // CRITICAL: Set current access token on every request
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Update access token if returned in response (token refresh)
    const newToken = response.headers['x-access-token'] || 
                     response.headers['authorization']?.split(' ')[1];
    if (newToken && newToken !== accessToken) {
      accessToken = newToken;
      setAuthToken(newToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token via cookie
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (refreshResponse.data.success) {
          const newToken = refreshResponse.data.data.accessToken;
          
          // Update stored token and retry original request
          accessToken = newToken;
          setAuthToken(newToken);
          
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth state and redirect to login
        accessToken = null;
        setAuthToken(null);
        
        // Only redirect if we're not already on a public page
        if (typeof window !== 'undefined' && !window.location.pathname.match(/^\/(login|register|quiz|pricing|library)/)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 - redirect to login for protected routes
    if (error.response?.status === 403 && originalRequest.url?.includes('/dashboard')) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;