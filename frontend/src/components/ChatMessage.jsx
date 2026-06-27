import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === 'user';
  
  const renderContent = (content) => {
    // Regex to find mermaid blocks
    if (!content || typeof content !== 'string') return null;

    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    const parts = content.split(mermaidRegex);

    return parts.map((part, i) => {
      // If the index is odd, it's a mermaid chart (based on the regex split)
      if (i % 2 === 1) {
        return <Mermaid key={i} chart={part.trim()} />;
      }
      
      // For text parts, we wrap ReactMarkdown in a div to avoid the 'className' error
      return (
        <div 
          key={i} 
          className="prose dark:prose-invert max-w-none 
            prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-700
            prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-2
            prose-td:p-2 prose-td:border prose-td:border-slate-100 dark:prose-td:border-slate-800
            prose-p:leading-relaxed prose-pre:bg-slate-800 dark:prose-pre:bg-slate-950"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm border transition-all ${
        isUser 
        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
        : 'bg-white dark:bg-slate-900 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none'
      }`}>
        {renderContent(msg.content)}
      </div>
    </div>
  );
};

export default ChatMessage;