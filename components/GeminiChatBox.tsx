"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { sendChatMessage, createChatSession, type ChatSession, type ChatMessage } from '@/lib/gemini-chat';

interface GeminiChatBoxProps {
  context: string; // Stack info or other context
  title?: string;
  onClose?: () => void;
  initialMessage?: string;
}

export default function GeminiChatBox({
  context,
  title = "Chat with Gemini 3.0",
  onClose,
  initialMessage,
}: GeminiChatBoxProps) {
  const [session, setSession] = useState<ChatSession>(() => createChatSession(context));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && session.messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  async function handleSendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, session);
      
      if (result) {
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, result.response],
        }));
      } else {
        // Error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your API configuration and try again.',
          timestamp: Date.now(),
        };
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
        }));
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSuggestionClick(suggestion: string) {
    handleSendMessage(suggestion);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-2xl transition-all ${
      isExpanded ? 'fixed inset-4 z-50' : 'h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
            Gemini 3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
        {session.messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-400/50" />
            <p className="text-sm">Ask me anything about your stack!</p>
            <p className="text-xs mt-2">I can help with interactions, timing, dosages, and more.</p>
          </div>
        )}

        {session.messages.map((message, index) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>

            {/* Suggestions after assistant messages */}
            {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-2">
                {message.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-full border border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about interactions, timing, dosages..."
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
