"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { CompoundDetail } from "@/lib/compound-types";
import { getSuggestions } from "@/lib/compound-library";

interface CompoundSearchProps {
  onSelectCompound: (compound: CompoundDetail) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CompoundSearch({ 
  onSelectCompound, 
  placeholder = "Search compounds...",
  autoFocus = false 
}: CompoundSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CompoundDetail[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions when query changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      const results = getSuggestions(query, 8);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelectCompound(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectCompound = (compound: CompoundDetail) => {
    onSelectCompound(compound);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((compound, index) => (
            <button
              key={compound.id}
              onClick={() => handleSelectCompound(compound)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800 last:border-b-0 transition-colors ${
                index === selectedIndex
                  ? "bg-slate-800"
                  : "hover:bg-slate-800/50"
              }`}
            >
              <div className="font-medium text-slate-100">{compound.name}</div>
              {compound.aliases.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Also: {compound.aliases.slice(0, 3).join(", ")}
                  {compound.aliases.length > 3 && "..."}
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                  {compound.effectType}
                </span>
                {compound.categoryTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 text-center text-slate-400">
          No compounds found for "{query}"
        </div>
      )}
    </div>
  );
}
