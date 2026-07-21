import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing user on mount
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        if (parsedUser && parsedUser.token) {
          setUser(parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
        }
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('userInfo');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      // ✅ CORRECT URL
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      // Extract user data from response
      const userData = response.data.data || response.data;
      
      if (!userData || !userData.token) {
        throw new Error('Invalid response from server - no token received');
      }
      
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return { 
        success: false, 
        message 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      
      // ✅ CORRECT URL - Make sure this is EXACTLY right
      console.log('Sending registration request to:', 'http://localhost:5000/api/users/register');
      console.log('With data:', { name, email, password: '***' });
      
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name,
        email,
        password
      });
      
      console.log('Registration response:', response.data);
      
      // Extract user data from response
      const userData = response.data.data || response.data;
      
      if (!userData || !userData.token) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from server - no token received');
      }
      
      setUser(userData);
      localStorage.setItem('userInfo', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      return { success: true };
    } catch (err) {
      console.error('Registration error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      return { 
        success: false, 
        message 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!user && !!user.token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      error,
      isAuthenticated,
      setError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};