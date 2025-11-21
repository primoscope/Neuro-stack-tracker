"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Check, X, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function GeminiApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Check if API key is already configured in environment
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsConfigured(true);
    }
  }, []);

  function handleSaveKey() {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsConfigured(true);
      
      // Set as environment variable for the session
      if (typeof window !== 'undefined') {
        (window as any).NEXT_PUBLIC_GEMINI_API_KEY = apiKey.trim();
      }
    }
  }

  function handleRemoveKey() {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsConfigured(false);
    setTestResult(null);
  }

  async function handleTestConnection() {
    if (!apiKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test with a simple query
      const response = await fetch('/api/compounds/search-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'caffeine' }),
      });

      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/20">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-purple-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">AI-Powered Search</h3>
          <p className="text-sm text-gray-400">
            Enable Gemini AI to search the internet for compound information
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Google Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-2 pr-24 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-gray-400 hover:text-white rounded"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {isConfigured && (
                <div className="p-1.5 text-green-400">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveKey}
            disabled={!apiKey.trim() || isConfigured}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {isConfigured ? 'Configured' : 'Save Key'}
          </button>

          {isConfigured && (
            <>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleRemoveKey}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
              >
                Remove
              </button>
            </>
          )}
        </div>

        {testResult === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded">
            <Check className="h-4 w-4" />
            <span>Connection successful! AI search is ready.</span>
          </div>
        )}

        {testResult === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded">
            <X className="h-4 w-4" />
            <span>Connection failed. Please check your API key.</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">
            Get your free API key from Google AI Studio:
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
          >
            <span>Get API Key</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-blue-400">How it works:</strong> When you search for a compound 
            not in the local database, Gemini AI will automatically search the internet for information 
            including effects, mechanisms, interactions, dosage, and safety data. Results are clearly 
            marked as AI-generated.
          </p>
        </div>

        <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-3">
          <p className="text-xs text-orange-300 leading-relaxed">
            <strong>Privacy Note:</strong> Your API key is stored locally in your browser only. 
            API calls are made directly from your browser to Google's servers. No data is stored 
            on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
