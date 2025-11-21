"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { searchCompounds } from '@/lib/compound-library';
import { CompoundDetail as CompoundDetailType } from '@/lib/compound-types';
import { GeminiSearchResult } from '@/lib/gemini-search';
import { CompoundDetail } from './CompoundDetail';

interface CompoundSearchWithAIProps {
  onSelect?: (compound: CompoundDetailType) => void;
  placeholder?: string;
  maxResults?: number;
}

export default function CompoundSearchWithAI({
  onSelect,
  placeholder = "Search compounds or ask AI...",
  maxResults = 8,
}: CompoundSearchWithAIProps) {
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<CompoundDetailType[]>([]);
  const [aiResult, setAiResult] = useState<GeminiSearchResult | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState<CompoundDetailType | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Local search (immediate)
  useEffect(() => {
    if (query.trim()) {
      const results = searchCompounds({ query: query.trim() }).slice(0, maxResults);
      setLocalResults(results);
      setShowResults(true);
    } else {
      setLocalResults([]);
      setShowResults(false);
      setAiResult(null);
    }
  }, [query, maxResults]);

  // AI search (delayed, only if no local results or query is long)
  useEffect(() => {
    // Clear previous timeout
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }

    // Reset AI results
    setAiResult(null);
    setAiError('');

    // Only trigger AI search if:
    // 1. Query is long enough (>3 chars)
    // 2. No local results found, OR query is very specific (>10 chars)
    if (query.trim().length > 3 && (localResults.length === 0 || query.trim().length > 10)) {
      // Delay AI search by 1.5 seconds to avoid unnecessary API calls
      aiTimeoutRef.current = setTimeout(() => {
        performAiSearch(query.trim());
      }, 1500);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [query, localResults.length]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function performAiSearch(searchQuery: string) {
    setIsAiSearching(true);
    setAiError('');

    try {
      const response = await fetch('/api/compounds/search-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'AI search failed');
      }

      const result: GeminiSearchResult = await response.json();
      setAiResult(result);
    } catch (error) {
      console.error('AI search error:', error);
      setAiError(error instanceof Error ? error.message : 'AI search unavailable');
    } finally {
      setIsAiSearching(false);
    }
  }

  function handleSelectCompound(compound: CompoundDetailType) {
    setSelectedCompound(compound);
    if (onSelect) {
      onSelect(compound);
    }
  }

  function handleSelectAiResult() {
    if (aiResult?.compound) {
      // The compound from AI result should already be properly typed
      const fullCompound = aiResult.compound as CompoundDetailType;
      setSelectedCompound(fullCompound);
      if (onSelect) {
        onSelect(fullCompound);
      }
    }
  }

  return (
    <>
      <div ref={searchRef} className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isAiSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5 animate-spin" />
          )}
          {!isAiSearching && query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {showResults && (query.trim() || localResults.length > 0 || aiResult) && (
          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {/* Local Results */}
            {localResults.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-900/50 sticky top-0">
                  From Database ({localResults.length})
                </div>
                {localResults.map((compound) => (
                  <button
                    key={compound.id}
                    onClick={() => handleSelectCompound(compound)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 border-b border-gray-700/50 last:border-b-0"
                  >
                    <div className="font-medium text-white">{compound.name}</div>
                    {compound.aliases.length > 0 && (
                      <div className="text-sm text-gray-400">
                        Also: {compound.aliases.slice(0, 3).join(', ')}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      {compound.categoryTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* AI Result */}
            {aiResult && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gradient-to-r from-purple-900/50 to-blue-900/50 sticky top-0 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  AI Search Result (via Internet)
                </div>
                <button
                  onClick={handleSelectAiResult}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700/50 border-b border-gray-700/50"
                >
                  <div className="font-medium text-white flex items-center gap-2">
                    {aiResult.compound.name}
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                      AI
                    </span>
                  </div>
                  {aiResult.compound.aliases && aiResult.compound.aliases.length > 0 && (
                    <div className="text-sm text-gray-400">
                      Also: {aiResult.compound.aliases.slice(0, 3).join(', ')}
                    </div>
                  )}
                  {aiResult.compound.primaryEffects && (
                    <div className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {aiResult.compound.primaryEffects}
                    </div>
                  )}
                  {aiResult.references && aiResult.references.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {aiResult.references.length} reference(s) found
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* AI Searching State */}
            {isAiSearching && (
              <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span>Searching internet with AI...</span>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="px-4 py-3 text-sm text-orange-400 flex items-center gap-2 bg-orange-900/10">
                <AlertCircle className="h-4 w-4" />
                <span>{aiError}</span>
              </div>
            )}

            {/* No Results */}
            {!isAiSearching && localResults.length === 0 && !aiResult && query.trim() && (
              <div className="px-4 py-8 text-center text-gray-400">
                <p className="mb-2">No compounds found in database</p>
                <p className="text-sm text-gray-500">
                  {query.length > 3 
                    ? 'AI search will activate automatically...' 
                    : 'Type more characters to enable AI search'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compound Detail Modal */}
      <CompoundDetail
        compound={selectedCompound}
        open={selectedCompound !== null}
        onOpenChange={(open) => !open && setSelectedCompound(null)}
      />
    </>
  );
}
