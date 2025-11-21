"use client";

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import commonCompounds from '@/data/common-compounds.json';

interface Compound {
  id: string;
  name: string;
  category: string;
  defaultDosage: string;
  notes: string;
}

interface GlobalCompoundSearchProps {
  onSelect: (compound: Compound) => void;
  onClose?: () => void;
}

export function GlobalCompoundSearch({ onSelect, onClose }: GlobalCompoundSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter compounds based on search query
  const filteredCompounds = useMemo(() => {
    if (!searchQuery.trim()) {
      return commonCompounds.slice(0, 20); // Show first 20 by default
    }

    const query = searchQuery.toLowerCase();
    return commonCompounds.filter(compound =>
      compound.name.toLowerCase().includes(query) ||
      compound.category.toLowerCase().includes(query) ||
      compound.notes.toLowerCase().includes(query)
    ).slice(0, 50); // Limit to 50 results
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-slate-900 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Search Common Compounds</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category, or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {searchQuery ? `${filteredCompounds.length} results` : `${commonCompounds.length}+ compounds available`}
        </p>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCompounds.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No compounds found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCompounds.map((compound) => (
              <button
                key={compound.id}
                onClick={() => onSelect(compound)}
                className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 touch-manipulation"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{compound.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                        {compound.category}
                      </span>
                      <span className="text-xs text-slate-400">{compound.defaultDosage}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{compound.notes}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
