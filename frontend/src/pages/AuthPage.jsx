import api from '../services/api'; 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Zap, Moon, Sun, Mail, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect to dashboard automatically if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);


// ... inside the component
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (isLogin) {
      await login(email, password);
    } else {
      // FIX: Changed 'axios.post' to 'api.post' 
      // This ensures it goes to http://localhost:8000/auth/register
      await api.post('/auth/register', { email, password });
      
      alert("Account created! You can now sign in.");
      setIsLogin(true);
      setEmail('');
      setPassword('');
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.detail || "Connection to Nexus failed. Is the backend running?");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme} 
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-900 shadow-xl text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <Zap className="text-white" size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">
            {isLogin ? "Welcome to Nexus" : "Join the Nexus"}
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
            Intelligence beyond documents.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white outline-none transition-all"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white outline-none transition-all"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-blue-600 font-medium hover:underline transition-all"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;