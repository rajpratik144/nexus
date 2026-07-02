import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';

const ChatMessage = ({ msg }) => {
  const isUser = msg.role === 'user';

  const renderContent = (content) => {
    if (!content || typeof content !== 'string') return null;

    // Split markdown into normal text and Mermaid blocks
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    const parts = content.split(mermaidRegex);

    return parts.map((part, i) => {
      // Mermaid diagram
      if (i % 2 === 1) {
        return <Mermaid key={i} chart={part.trim()} />;
      }

      // Normal Markdown
      return (
        <div key={i} className="chat-bubble-container">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {part}
            </ReactMarkdown>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className={`flex ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-6 w-full`}
    >
      <div
        className={`shadow-sm border transition-all ${
          isUser
            ? 'bg-blue-600 text-white border-blue-500 rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]'
            : 'bg-white dark:bg-slate-900 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none p-5 w-full md:max-w-[90%]'
        }`}
      >
        {renderContent(msg.content)}
      </div>
    </div>
  );
};

export default ChatMessage;