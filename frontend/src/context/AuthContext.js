import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Set default base URL for all axios requests
axios.defaults.baseURL = 'https://fs-4mtv.onrender.com';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log("AuthContext - No token available, skipping user load");
        setLoading(false);
        return;
      }
      
      console.log("AuthContext - Token available, loading user data");
      
      try {
        const response = await fetch('https://fs-4mtv.onrender.com/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load user: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("AuthContext - User data loaded:", data.data);
        setUser(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]);
  
  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('https://fs-4mtv.onrender.com/api/auth/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      console.log("AuthContext - Attempting login with email:", email);
      
      // Use fetch instead of axios for login
      const response = await fetch('https://fs-4mtv.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw {
          response: {
            status: response.status,
            data: errorData
          }
        };
      }
      
      const res = { data: await response.json() };
      console.log("AuthContext - Login response:", res.data);
      
      if (!res.data.user || !res.data.user.id) {
        console.error("AuthContext - Login response missing user ID:", res.data);
        setError('Login response missing user information');
        throw new Error('Login response missing user information');
      }
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      console.log("AuthContext - User set after login:", res.data.user);
      
      return res.data;
    } catch (err) {
      console.error("AuthContext - Login error:", err);
      
      if (err.response) {
        console.error("AuthContext - Response data:", err.response.data);
        console.error("AuthContext - Response status:", err.response.status);
        console.error("AuthContext - Response headers:", err.response.headers);
        setError(err.response.data?.error || `Login failed with status ${err.response.status}`);
      } else if (err.request) {
        console.error("AuthContext - Request error (no response):", err.request);
        setError('No response received from server');
      } else {
        console.error("AuthContext - Error message:", err.message);
        setError(`Login error: ${err.message}`);
      }
      
      throw err;
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };
  
  // Update user in context
  const updateUser = (userData) => {
    setUser(userData);
  };
  
  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};