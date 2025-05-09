import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        const res = await axios.get('/api/auth/me');
        console.log("AuthContext - User data loaded:", res.data.data);
        setUser(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err.response?.data?.error || err.message);
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
      const res = await axios.post('/api/auth/register', userData);
      
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
      
      const res = await axios.post('/api/auth/login', { email, password });
      console.log("AuthContext - Login response:", res.data);
      
      if (!res.data.user || !res.data.user._id) { // Changed from user.id to user._id
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
      setError(err.response?.data?.error || 'Login failed');
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
  
  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};