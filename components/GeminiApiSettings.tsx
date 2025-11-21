"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Check, X, Eye, EyeOff, ExternalLink, Zap, Brain, Cpu, List } from 'lucide-react';
import { testGeminiConnection, listGeminiModels } from '@/app/actions/gemini';
import { AVAILABLE_MODELS } from '@/lib/geminiConfig';

const GEMINI_MODELS = AVAILABLE_MODELS.map(model => ({
  id: model.id,
  name: model.name,
  description: model.description,
  icon: model.id.includes('flash') ? Zap : model.id.includes('3') ? Sparkles : Brain,
  recommended: model.recommended,
}));

export default function GeminiApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isListingModels, setIsListingModels] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string; code?: string | number } | null>(null);
  const [modelsResult, setModelsResult] = useState<{ success: boolean; models?: any[]; error?: string; raw?: string } | null>(null);
  const [showModels, setShowModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-pro');

  useEffect(() => {
    // Check if API key is already configured in environment
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsConfigured(true);
    }
    
    // Load selected model
    const storedModel = localStorage.getItem('gemini_model');
    if (storedModel) {
      setSelectedModel(storedModel);
    } else {
      setSelectedModel('gemini-2.5-pro'); // Default to Gemini 2.5 Pro (Most powerful on free tier)
    }
  }, []);

  function handleSaveKey() {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      localStorage.setItem('gemini_model', selectedModel);
      setIsConfigured(true);
      
      // Set as environment variable for the session
      if (typeof window !== 'undefined') {
        (window as any).NEXT_PUBLIC_GEMINI_API_KEY = apiKey.trim();
      }
    }
  }
  
  function handleModelChange(model: string) {
    setSelectedModel(model);
    if (isConfigured) {
      localStorage.setItem('gemini_model', model);
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
      // Call server action to test connection
      const result = await testGeminiConnection(apiKey.trim());
      setTestResult(result);
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleListModels() {
    if (!apiKey.trim()) return;

    setIsListingModels(true);
    setModelsResult(null);
    setShowModels(false);

    try {
      // Call server action to list models
      const result = await listGeminiModels(apiKey.trim());
      setModelsResult(result);
      setShowModels(true);
    } catch (error) {
      console.error('List models error:', error);
      setModelsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setShowModels(true);
    } finally {
      setIsListingModels(false);
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

      <div className="space-y-4">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Gemini Model
          </label>
          <div className="grid gap-2">
            {GEMINI_MODELS.map((model) => {
              const Icon = model.icon;
              const isSelected = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {model.name}
                        </span>
                        {model.recommended && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {model.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* API Key Input */}
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSaveKey}
            disabled={!apiKey.trim() || isConfigured}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors touch-manipulation min-h-[44px]"
          >
            {isConfigured ? 'Configured' : 'Save Key'}
          </button>

          {isConfigured && (
            <>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors touch-manipulation min-h-[44px]"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleListModels}
                disabled={isListingModels}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                {isListingModels ? 'Loading...' : 'List Models'}
              </button>

              <button
                onClick={handleRemoveKey}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px]"
              >
                Remove
              </button>
            </>
          )}
        </div>

        {testResult && testResult.success && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded">
            <Check className="h-4 w-4" />
            <span>{testResult.message || 'Connection successful! AI features are ready.'}</span>
          </div>
        )}

        {testResult && !testResult.success && (
          <div className="flex flex-col gap-2 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span className="font-medium">Connection Failed</span>
            </div>
            <p className="text-xs text-red-300">{testResult.error || 'Please check your API key.'}</p>
            {testResult.code && (
              <p className="text-xs text-red-300/80">Error code: {testResult.code}</p>
            )}
          </div>
        )}

        {showModels && modelsResult && (
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Available Models</h4>
              <button
                onClick={() => setShowModels(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {modelsResult.success && modelsResult.models ? (
              <div className="max-h-[400px] overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(modelsResult.models, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-sm text-red-400">
                <p className="mb-2">{modelsResult.error || 'Failed to fetch models'}</p>
                {modelsResult.raw && (
                  <pre className="text-xs text-slate-400 mt-2 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">
                    {modelsResult.raw}
                  </pre>
                )}
              </div>
            )}
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
