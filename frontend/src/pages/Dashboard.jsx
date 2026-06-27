import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FileVault from '../components/FileVault';
import ChatMessage from '../components/ChatMessage';
import { useNexusChat } from '../hooks/useNexusChat';
import { MessageSquare, Plus, FileText, LogOut, Moon, Sun, Send, Mic, Edit2, Check, Trash2, Zap } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [input, setInput] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const { 
    chats, activeChat, setActiveChat, messages, 
    fetchChats, createNewChat, sendMessage, isStreaming 
  } = useNexusChat();

  const messagesEndRef = useRef(null);

  useEffect(() => { 
    fetchChats(); 
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use 'auto' during streaming to prevent layout shaking
      messagesEndRef.current.scrollIntoView({ 
        behavior: isStreaming ? "auto" : "smooth",
        block: "end" 
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleRename = async (chatId) => {
  if (!editTitle.trim()) return setEditingChatId(null);
  try {
    // FIX: Use 'api' instead of 'axios'
    await api.patch(`/chats/${chatId}`, null, { params: { new_title: editTitle } });
    setEditingChatId(null);
    fetchChats();
  } catch (err) { 
    console.error(err);
    alert("Failed to rename chat. Session might have expired."); 
  }
};

// Replace handleDeleteChat inside Dashboard component
const handleDeleteChat = async (e, chatId) => {
  e.stopPropagation();
  if (!window.confirm("Delete this conversation?")) return;
  try {
    // FIX: Use 'api' instead of 'axios'
    await api.delete(`/chats/${chatId}`);
    if (activeChat?.id === chatId) setActiveChat(null);
    fetchChats();
  } catch (err) { 
    console.error(err);
    alert("Failed to delete chat."); 
  }
};
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      <FileVault isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
      
      {/* Sidebar */}
      <aside className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
               <Zap size={18} />
             </div>
             <span className="font-bold text-xl dark:text-white tracking-tight">Nexus</span>
           </div>
           <button 
             onClick={() => setIsVaultOpen(true)} 
             className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-all"
             title="Knowledge Vault"
           >
             <FileText size={20} />
           </button>
        </div>

        <button 
          onClick={createNewChat} 
          className="mx-6 mb-6 py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
        >
          <Plus size={18} /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
  <div className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2 tracking-widest">History</div>
  
  {/* Add this safety check: Array.isArray(chats) */}
  {Array.isArray(chats) ? (
    chats.map(chat => (
      <div key={chat.id} className="group relative flex items-center">
        {editingChatId === chat.id ? (
          <div className="flex items-center w-full bg-white dark:bg-slate-800 rounded-xl px-2 border border-blue-500">
            <input 
              autoFocus
              className="flex-1 p-2 bg-transparent outline-none text-sm dark:text-white"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
            />
            <button onClick={() => handleRename(chat.id)} className="text-green-500 p-1"><Check size={16}/></button>
          </div>
        ) : (
          <button 
            onClick={() => setActiveChat(chat)}
            className={`w-full p-3 rounded-xl text-left truncate transition-all flex items-center justify-between group ${
              activeChat?.id === chat.id 
              ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 font-semibold' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="truncate flex-1 mr-2">{chat.title}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 
                size={14} 
                className="hover:text-blue-600 cursor-pointer p-0.5" 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChatId(chat.id);
                  setEditTitle(chat.title);
                }}
              />
              <Trash2 
                size={14} 
                className="hover:text-red-500 cursor-pointer p-0.5" 
                onClick={(e) => handleDeleteChat(e, chat.id)}
              />
            </div>
          </button>
        )}
      </div>
    ))
  ) : (
    /* This shows if chats is still loading or failed */
    <div className="px-4 py-2 text-xs text-slate-500 italic">No conversations found...</div>
  )}
</div>
        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button onClick={toggleTheme} className="w-full p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-3 text-slate-600 dark:text-slate-300 transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />} 
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={logout} className="w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 text-red-500 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative">
        <header className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center px-8 justify-between backdrop-blur-md bg-white/70 dark:bg-slate-950/70 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold dark:text-white truncate max-w-md">
              {activeChat ? activeChat.title : 'Nexus Intelligence'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Authorized User</span>
              <span className="text-xs text-blue-600 font-medium">{user?.email}</span>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 scroll-smooth chat-scroll-container custom-scrollbar">
          {!activeChat && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <MessageSquare size={40} />
                </div>
                <h2 className="text-4xl font-bold dark:text-white mb-3 tracking-tight">
                  How can <span className="text-blue-600">Nexus</span> help?
                </h2>
                <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Start a new chat or open the Knowledge Vault to begin querying your documents.
                </p>
              </motion.div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} className="h-4" /> 
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-gradient-to-t from-white dark:from-slate-950 via-white/90 dark:via-slate-950/90 to-transparent">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-3">
            <div className="relative flex-1 group">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeChat ? "Message Nexus..." : "Select a conversation to begin..."}
                disabled={!activeChat || isStreaming}
                className="w-full py-4 pl-6 pr-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none dark:text-white shadow-xl transition-all disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isStreaming || !input.trim() || !activeChat} 
                className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/40 active:scale-90"
              >
                <Send size={20} />
              </button>
            </div>
            
            <button 
              type="button"
              className={`p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${
                isStreaming 
                ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white'
              }`}
              title="Voice Mode"
            >
              <Mic size={24} />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium tracking-wide">
            Powered by Nexus Intelligence Engine • Verified Document Context
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;