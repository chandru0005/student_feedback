import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('edu_feedback_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('edu_feedback_token');
      const storedUser = localStorage.getItem('edu_feedback_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with /me
          const res = await authApi.getMe();
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('edu_feedback_user', JSON.stringify(res.data.user));
          }
        } catch (e) {
          console.warn('[Auth] Session invalid or expired');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password, role) => {
    const res = await authApi.login({ identifier, password, role });
    if (res.data && res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('edu_feedback_token', newToken);
      localStorage.setItem('edu_feedback_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (studentData) => {
    const res = await authApi.register(studentData);
    if (res.data && res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('edu_feedback_token', newToken);
      localStorage.setItem('edu_feedback_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('edu_feedback_token');
    localStorage.removeItem('edu_feedback_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: Boolean(token && user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
