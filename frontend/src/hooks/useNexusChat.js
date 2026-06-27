import { useState, useEffect } from 'react';
import api from '../services/api'; // Custom service handles cookies automatically

export const useNexusChat = () => {
  const [chats, setChats] = useState([]); 
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats/');
      if (Array.isArray(res.data)) {
        setChats(res.data);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error("Failed to fetch chats", err);
      setChats([]); 
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeChat?.id) {
        try {
          setMessages([]); 
          // FIX: Changed from axios to api to include cookies
          const res = await api.get(`/chats/${activeChat.id}/messages`);
          setMessages(res.data);
        } catch (err) {
          console.error("Failed to load history", err);
        }
      }
    };
    fetchMessages();
  }, [activeChat?.id]);

  const createNewChat = async () => {
    try {
      // FIX: Changed from axios to api to include cookies
      const res = await api.post('/chats/', { title: "New Conversation" });
      setChats(prev => [res.data, ...prev]);
      setActiveChat(res.data);
      setMessages([]);
    } catch (err) {
      console.error("Create chat failed", err);
    }
  };

  const sendMessage = async (content) => {
    if (!activeChat || !content.trim()) return;
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      // FIX: Added credentials: 'include' and removed manual Authorization header
      const response = await fetch(`${BASE_URL}/chats/${activeChat.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiContent += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiContent;
          return updated;
        });
      }

      fetchChats();

    } catch (err) {
      console.error("Streaming error", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Error: Connection to Nexus lost." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return { chats, activeChat, setActiveChat, messages, setMessages, fetchChats, createNewChat, sendMessage, isStreaming };
};