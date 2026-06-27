// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // IMPORTANT: Use our custom 'api' service

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      setUser(null); // Silent fail is fine here, user just stays on login
    } finally {
      setLoading(false);
    }
  };
  checkAuth();
}, []);

const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  await api.post('/auth/login', formData); // Backend sets cookies
  const userRes = await api.get('/auth/me');
  setUser(userRes.data);
};

const logout = async () => {
  try {
    await api.post('/auth/logout');
  }
  catch (err) {
    console.error("Server logout failed, clearing local state anyway");
  } 
  finally {
    setUser(null);
    localStorage.clear(); 
    window.location.href = '/';
  }
};

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};