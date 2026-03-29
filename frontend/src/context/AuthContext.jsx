import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../api/client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState(null);
  const navigate = useNavigate();

  // Sync access token with API client
  const setAccessToken = (token) => {
    setAccessTokenState(token);
    setAuthToken(token);
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to refresh token on app load using cookie
        const response = await api.post('/auth/refresh-token');
        if (response.data.success) {
          const token = response.data.data.accessToken;
          setAccessToken(token);
          setUser(response.data.data.user);
        }
      } catch (error) {
        // Clear invalid tokens - user is not authenticated
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const token = response.data.data.accessToken;
      setAccessToken(token);
      setUser(response.data.data.user);
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Login failed');
  };

  // Register
  const register = async (email, password, firstName, lastName) => {
    const response = await api.post('/auth/register', { email, password, firstName, lastName });
    if (response.data.success) {
      const token = response.data.data.accessToken;
      setAccessToken(token);
      setUser(response.data.data.user);
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Registration failed');
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      navigate('/');
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data.success) {
        const token = response.data.data.accessToken;
        setAccessToken(token);
        setUser(response.data.data.user);
        return token;
      }
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    }
    return null;
  };

  // Get current user
  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
        return response.data.data.user;
      }
    } catch (error) {
      setAccessToken(null);
      setUser(null);
    }
    return null;
  };

  // Update user state
  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    accessToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshToken,
    fetchUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;