/**
 * AI Chat Panel Component for Citizen Dashboard
 * Natural language query system for city data
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface City {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  query: string;
  response: string;
  intent: string;
  confidence: number;
  data_sources: string[];
  timestamp: string;
  is_valid_domain: boolean;
}

interface AIChatPanelProps {
  cities: City[];
  selectedCityId: string;
  onCityChange?: (cityId: string) => void;
}

export default function AIChatPanel({ cities, selectedCityId, onCityChange }: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userQuery = query.trim();
    setQuery('');
    setLoading(true);

    try {
      const result = await api.sendAIQuery(userQuery, selectedCityId);
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        query: userQuery,
        response: result.response,
        intent: result.intent,
        confidence: result.confidence,
        data_sources: result.data_sources || [],
        timestamp: new Date().toISOString(),
        is_valid_domain: result.is_valid_domain
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        query: userQuery,
        response: 'Sorry, I encountered an error processing your query. Please try again.',
        intent: 'ERROR',
        confidence: 0,
        data_sources: [],
        timestamp: new Date().toISOString(),
        is_valid_domain: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    if (confidence >= 0.5) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return { label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'AIR': return '🌫️';
      case 'TRAFFIC': return '🚗';
      case 'ALERT': return '⚠️';
      case 'RISK': return '⚡';
      case 'GENERAL': return '📊';
      default: return '❓';
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">Ask AI About Your City</h3>
            <p className="text-sm text-white/90">Get instant answers about air quality, traffic, alerts & safety</p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">City Intelligence Assistant</h4>
              <button
                onClick={() => setMessages([])}
                className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors duration-200"
              >
                Clear History
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium opacity-90">City:</label>
              <select
                value={selectedCityId}
                onChange={(e) => onCityChange?.(e.target.value)}
                className="flex-1 bg-white/20 border border-white/30 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id} className="text-gray-900">{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h5 className="font-medium mb-2">Ask me anything about your city!</h5>
                <p className="text-sm">
                  Try: "What's the air quality today?", "Is traffic heavy?", or "Any active alerts?"
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Query */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm">
                      <p className="text-sm">{msg.query}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getIntentIcon(msg.intent)}</span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{msg.intent}</span>
                        {msg.confidence > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceBadge(msg.confidence).color}`}>
                            {getConfidenceBadge(msg.confidence).label} confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-2">{msg.response}</p>
                      {msg.data_sources && msg.data_sources.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Sources:</span>
                          {msg.data_sources.map((source, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about air quality, traffic, alerts, or safety..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 transition-colors duration-200"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              I can answer questions about air quality, traffic, alerts, and city safety. I cannot help with politics, coding, or general knowledge.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
