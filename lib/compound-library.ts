import { CompoundDetail, CompoundIndexEntry, CompoundFilters } from './compound-types';
import compoundsData from './data/compounds.json';
import searchIndexData from './data/compound-search-index.json';

/**
 * Normalize compound name to ID format
 */
export function normalizeCompoundName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Type assertion for imported JSON
const compounds = compoundsData as CompoundDetail[];
const searchIndex = searchIndexData as CompoundIndexEntry[];

/**
 * Search compounds by query string and filters
 */
export function searchCompounds(filters: CompoundFilters): CompoundDetail[] {
  let results = compounds;
  
  // Filter by query (case-insensitive, matches name, aliases, or search terms)
  if (filters.query && filters.query.trim()) {
    const queryLower = normalizeQuery(filters.query);
    const queryWords = queryLower.split(' ').filter(w => w.length > 0);
    
    results = results.filter(compound => {
      const indexEntry = searchIndex.find(idx => idx.id === compound.id);
      if (!indexEntry) return false;
      
      // Check if any query word matches any search term
      return queryWords.some(queryWord => {
        // Exact match on search terms
        if (indexEntry.searchTerms.some(term => term.includes(queryWord))) {
          return true;
        }
        
        // Fuzzy match on name and aliases
        const nameLower = compound.name.toLowerCase();
        const aliasesLower = compound.aliases.map(a => a.toLowerCase());
        
        if (nameLower.includes(queryWord)) return true;
        if (aliasesLower.some(alias => alias.includes(queryWord))) return true;
        
        return false;
      });
    });
  }
  
  // Filter by category tags
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(compound => {
      return filters.tags!.some(tag => 
        compound.categoryTags.some(ctag => 
          ctag.toLowerCase() === tag.toLowerCase()
        )
      );
    });
  }
  
  // Filter by effect types
  if (filters.effectTypes && filters.effectTypes.length > 0) {
    results = results.filter(compound => {
      return filters.effectTypes!.some(effectType =>
        compound.effectType.toLowerCase().includes(effectType.toLowerCase())
      );
    });
  }
  
  return results;
}

/**
 * Get a single compound by ID
 */
export function getCompoundById(id: string): CompoundDetail | undefined {
  return compounds.find(c => c.id === id);
}

/**
 * Get all compounds
 */
export function getAllCompounds(): CompoundDetail[] {
  return compounds;
}

/**
 * Get compounds grouped by category
 */
export function getCompoundsByCategory(): Record<string, CompoundDetail[]> {
  const grouped: Record<string, CompoundDetail[]> = {};
  
  compounds.forEach(compound => {
    // Group by primary effect type
    const category = compound.effectType || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(compound);
  });
  
  return grouped;
}

/**
 * Get all unique category tags across all compounds
 */
export function getAllCategoryTags(): string[] {
  const tagsSet = new Set<string>();
  
  compounds.forEach(compound => {
    compound.categoryTags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet).sort();
}

/**
 * Get all unique effect types
 */
export function getAllEffectTypes(): string[] {
  const typesSet = new Set<string>();
  
  compounds.forEach(compound => {
    if (compound.effectType) {
      typesSet.add(compound.effectType);
    }
  });
  
  return Array.from(typesSet).sort();
}

/**
 * Get suggestions for typeahead search
 */
export function getSuggestions(query: string, limit: number = 10): CompoundDetail[] {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const queryLower = normalizeQuery(query);
  
  // Score each compound by relevance
  const scored = compounds.map(compound => {
    let score = 0;
    const nameLower = compound.name.toLowerCase();
    
    // Exact match on name (highest priority)
    if (nameLower === queryLower) {
      score += 1000;
    }
    // Starts with query
    else if (nameLower.startsWith(queryLower)) {
      score += 100;
    }
    // Contains query
    else if (nameLower.includes(queryLower)) {
      score += 50;
    }
    
    // Check aliases
    compound.aliases.forEach(alias => {
      const aliasLower = alias.toLowerCase();
      if (aliasLower === queryLower) {
        score += 500;
      } else if (aliasLower.startsWith(queryLower)) {
        score += 50;
      } else if (aliasLower.includes(queryLower)) {
        score += 25;
      }
    });
    
    return { compound, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(item => item.compound);
  
  return scored;
}

/**
 * Normalize query for searching
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a compound is bookmarked (to be implemented with user preferences)
 */
export function isCompoundBookmarked(compoundId: string): boolean {
  // TODO: Implement bookmarking in user store
  return false;
}

/**
 * Format onset/peak/duration for display
 */
export function formatOnsetPeakDuration(compound: CompoundDetail): {
  onset: string;
  peak: string;
  duration: string;
} {
  const { onset } = compound;
  
  if (!onset || onset.raw === 'N/A') {
    return { onset: 'N/A', peak: 'N/A', duration: 'N/A' };
  }
  
  const formatTime = (min?: number, max?: number): string => {
    if (!min) return 'N/A';
    
    const formatMinutes = (minutes: number): string => {
      if (minutes < 60) return `${minutes}m`;
      if (minutes < 1440) {
        const hours = Math.round(minutes / 60 * 10) / 10;
        return `${hours}h`;
      }
      const days = Math.round(minutes / 1440 * 10) / 10;
      return `${days}d`;
    };
    
    if (!max || min === max) {
      return formatMinutes(min);
    }
    
    return `${formatMinutes(min)}-${formatMinutes(max)}`;
  };
  
  return {
    onset: formatTime(onset.onsetMin, onset.onsetMax),
    peak: formatTime(onset.peakMin, onset.peakMax),
    duration: formatTime(onset.durationMin, onset.durationMax),
  };
}
