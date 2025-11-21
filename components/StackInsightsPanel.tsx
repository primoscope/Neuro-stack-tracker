"use client";

import { useState } from 'react';
import { Sparkles, Loader2, MessageCircle, Plus, CheckCircle, AlertTriangle, Clock, Target, Shield } from 'lucide-react';
import { analyzeStackWithChat, searchAndAddCompound } from '@/lib/gemini-chat';
import GeminiChatBox from './GeminiChatBox';

interface StackInsightsPanelProps {
  stack: {
    name: string;
    compounds: Array<{ name: string; dose: string; timing: string }>;
    goals?: string[];
  };
  onAddCompound?: (compound: any) => void;
}

export default function StackInsightsPanel({ stack, onAddCompound }: StackInsightsPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyzeStack() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeStackWithChat(stack);
      
      if (result) {
        setAnalysis(result);
      } else {
        setError('Unable to analyze stack. Check API configuration.');
      }
    } catch (err) {
      console.error('Stack analysis error:', err);
      setError('Failed to analyze stack. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSearchCompound() {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    setError(null);

    try {
      // Create a temporary session for search
      const tempSession = {
        id: 'temp',
        messages: [],
        context: `Stack: ${stack.name}`,
        model: 'gemini-exp-1206' as any,
        createdAt: Date.now(),
      };

      const result = await searchAndAddCompound(searchQuery, tempSession);
      
      if (result) {
        setSearchResult(result);
      } else {
        setError('Compound not found or unable to retrieve information.');
      }
    } catch (err) {
      console.error('Compound search error:', err);
      setError('Failed to search compound. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddToStack() {
    if (searchResult && onAddCompound) {
      onAddCompound(searchResult);
      setSearchQuery('');
      setSearchResult(null);
    }
  }

  const parseAnalysis = (text: string) => {
    const sections = text.split(/(?=\*\*\d+\.\s+|\n\d+\.\s+)/g);
    return sections.map((section, idx) => {
      const titleMatch = section.match(/\*\*(.+?)\*\*/);
      const title = titleMatch ? titleMatch[1] : null;
      const content = section.replace(/\*\*(.+?)\*\*/g, '').trim();
      
      return { title, content, id: idx };
    });
  };

  const getIcon = (title: string) => {
    if (title?.includes('Assessment')) return CheckCircle;
    if (title?.includes('Synerg') || title?.includes('Interaction')) return AlertTriangle;
    if (title?.includes('Timing')) return Clock;
    if (title?.includes('Recommendation')) return Target;
    if (title?.includes('Safety')) return Shield;
    return Sparkles;
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAnalyzeStack}
          disabled={isAnalyzing || stack.compounds.length === 0}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Analyze Stack with Gemini 3.0</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{showChat ? 'Hide' : 'Chat with AI'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Compound Search & Add */}
      <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 rounded-lg border border-blue-500/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-400" />
          <h4 className="font-semibold text-white">Search & Add Compound</h4>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchCompound()}
            placeholder="Search for any compound or supplement..."
            className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearchCompound}
            disabled={!searchQuery.trim() || isSearching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-semibold text-white text-lg">{searchResult.name}</h5>
                {searchResult.aliases && searchResult.aliases.length > 0 && (
                  <p className="text-sm text-gray-400">
                    Also known as: {searchResult.aliases.join(', ')}
                  </p>
                )}
                <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                  {searchResult.category}
                </span>
              </div>
              {searchResult.addable && (
                <button
                  onClick={handleAddToStack}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add to Stack
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Dosage:</span>
                <p className="text-white">{searchResult.dosage}</p>
              </div>
              <div>
                <span className="text-gray-400">Best Timing:</span>
                <p className="text-white">{searchResult.timing}</p>
              </div>
              <div>
                <span className="text-gray-400">Evidence:</span>
                <p className="text-white">Grade {searchResult.evidenceLevel}</p>
              </div>
              <div>
                <span className="text-gray-400">Safety:</span>
                <p className="text-white">{searchResult.safetyRating}/10</p>
              </div>
            </div>

            {searchResult.benefits && (
              <div>
                <span className="text-sm text-gray-400">Benefits:</span>
                <ul className="text-sm text-gray-300 mt-1 space-y-1">
                  {searchResult.benefits.map((benefit: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchResult.interactions && (
              <div className="bg-orange-900/20 border border-orange-500/20 rounded p-2">
                <span className="text-sm font-medium text-orange-300">⚠️ Interactions:</span>
                <p className="text-sm text-gray-300 mt-1">{searchResult.interactions}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stack Analysis */}
      {analysis && (
        <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/20 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Stack Analysis</h3>
          </div>

          <div className="space-y-6">
            {parseAnalysis(analysis).map((section) => {
              if (!section.content.trim()) return null;
              
              const Icon = section.title ? getIcon(section.title) : Sparkles;
              
              return (
                <div key={section.id} className="space-y-2">
                  {section.title && (
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-purple-400" />
                      <h4 className="font-semibold text-white">{section.title}</h4>
                    </div>
                  )}
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pl-7">
                    {section.content}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAnalyzeStack}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ↻ Refresh Analysis
          </button>
        </div>
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="mt-4">
          <GeminiChatBox
            context={`Stack: ${stack.name}\nCompounds: ${stack.compounds.map(c => `${c.name} (${c.dose}, ${c.timing})`).join(', ')}\n${stack.goals ? `Goals: ${stack.goals.join(', ')}` : ''}`}
            title={`Chat about "${stack.name}"`}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}
