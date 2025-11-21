/**
 * Natural Language Search Helper
 * Parses natural language queries and converts them to structured searches
 */

import { CompoundFilters } from './compound-types';

export interface ParsedQuery {
  intent: 'search' | 'recommendation' | 'explanation';
  filters: CompoundFilters;
  originalQuery: string;
  keywords: string[];
  useAI: boolean; // Whether to trigger AI search
}

/**
 * Parse a natural language query into structured filters
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const queryLower = query.toLowerCase().trim();
  
  // Detect intent
  const intent = detectIntent(queryLower);
  
  // Extract keywords
  const keywords = extractKeywords(queryLower);
  
  // Extract effect types and tags
  const effectTypes = extractEffectTypes(queryLower);
  const tags = extractTags(queryLower);
  
  // Determine if AI search should be triggered
  const useAI = shouldUseAI(queryLower, intent);
  
  // Build filters
  const filters: CompoundFilters = {
    query: extractCompoundName(queryLower, keywords),
    effectTypes: effectTypes.length > 0 ? effectTypes : undefined,
    tags: tags.length > 0 ? tags : undefined,
  };
  
  return {
    intent,
    filters,
    originalQuery: query,
    keywords,
    useAI,
  };
}

/**
 * Detect user intent from query
 */
function detectIntent(query: string): 'search' | 'recommendation' | 'explanation' {
  // Recommendation patterns
  const recommendationPatterns = [
    /best .* for/i,
    /what .* (should|can) (i|you) take for/i,
    /recommend .* for/i,
    /help (with|me)/i,
    /good for/i,
    /improve/i,
    /boost/i,
  ];
  
  if (recommendationPatterns.some(pattern => pattern.test(query))) {
    return 'recommendation';
  }
  
  // Explanation patterns
  const explanationPatterns = [
    /what is/i,
    /how does .* work/i,
    /why/i,
    /explain/i,
    /tell me about/i,
  ];
  
  if (explanationPatterns.some(pattern => pattern.test(query))) {
    return 'explanation';
  }
  
  return 'search';
}

// Common English stop words to filter out from search queries
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'for', 'to', 'of', 'in', 'on', 'at',
  'what', 'which', 'that', 'best', 'good', 'help', 'me', 'you', 'can', 'should',
  'with', 'and', 'or', 'but',
]);

/**
 * Extract keywords from query
 */
function extractKeywords(query: string): string[] {
  
  return query
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 5); // Limit to 5 keywords
}

// Effect type keyword mappings for natural language understanding
const EFFECT_TYPE_MAP: Record<string, string[]> = {
  'Stimulant': ['stimulant', 'energy', 'wakefulness', 'alertness'],
  'Anxiolytic': ['anxiety', 'anxiolytic', 'calm', 'relax', 'stress'],
  'Nootropic': ['nootropic', 'cognitive', 'focus', 'memory', 'brain', 'mental'],
  'Sleep aid': ['sleep', 'insomnia', 'rest', 'sedative'],
  'Antidepressant': ['depression', 'mood', 'antidepressant', 'sad'],
  'Adaptogen': ['adaptogen', 'stress', 'balance'],
};

/**
 * Extract effect types from query
 */
function extractEffectTypes(query: string): string[] {
  
  const found: string[] = [];
  
  Object.entries(EFFECT_TYPE_MAP).forEach(([type, keywords]) => {
    if (keywords.some(keyword => query.includes(keyword))) {
      found.push(type);
    }
  });
  
  return found;
}

/**
 * Extract category tags from query
 */
function extractTags(query: string): string[] {
  const tagMap: Record<string, string[]> = {
    'Dopamine': ['dopamine', 'motivation', 'reward'],
    'Serotonin': ['serotonin', 'ssri'],
    'GABAergic': ['gaba', 'gabaergic', 'calm'],
    'Cholinergic': ['choline', 'acetylcholine', 'memory'],
    'NMDA': ['nmda', 'glutamate'],
    'ADHD': ['adhd', 'attention', 'hyperactive'],
    'Neuroprotection': ['neuroprotection', 'brain health', 'protect'],
  };
  
  const found: string[] = [];
  
  Object.entries(tagMap).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => query.includes(keyword))) {
      found.push(tag);
    }
  });
  
  return found;
}

/**
 * Extract compound name from query
 */
function extractCompoundName(query: string, keywords: string[]): string {
  // Remove common recommendation/question patterns
  let cleaned = query
    .replace(/best .* for/gi, '')
    .replace(/what .* for/gi, '')
    .replace(/help (with|me)/gi, '')
    .replace(/good for/gi, '')
    .replace(/improve/gi, '')
    .trim();
  
  // If cleaned is empty or very short, use original keywords
  if (cleaned.length < 3 && keywords.length > 0) {
    return keywords.join(' ');
  }
  
  return cleaned || query;
}

/**
 * Determine if AI search should be used
 */
function shouldUseAI(query: string, intent: ParsedQuery['intent']): boolean {
  // Use AI for recommendations and explanations
  if (intent === 'recommendation' || intent === 'explanation') {
    return true;
  }
  
  // Use AI for complex queries
  if (query.split(/\s+/).length > 5) {
    return true;
  }
  
  // Use AI if query contains question words
  const questionWords = ['what', 'why', 'how', 'when', 'should', 'could', 'can'];
  if (questionWords.some(word => query.includes(word))) {
    return true;
  }
  
  return false;
}

/**
 * Generate a prompt for Gemini based on parsed query
 */
export function generateAISearchPrompt(parsed: ParsedQuery): string {
  const { intent, originalQuery, keywords, filters } = parsed;
  
  switch (intent) {
    case 'recommendation':
      return `The user is looking for supplement recommendations. Query: "${originalQuery}"
      
Provide 3-5 specific compound recommendations that would help with their goal. For each:
- Name of the compound
- Why it's recommended
- Typical dosage
- Important considerations

Focus on evidence-based, safe recommendations.`;

    case 'explanation':
      return `The user wants to understand something. Query: "${originalQuery}"
      
Provide a clear, concise explanation covering:
- What it is
- How it works
- Key benefits
- Safety considerations
- Evidence quality

Keep it informative but accessible.`;

    default:
      return `Search for compound information: "${originalQuery}"
      
${filters.effectTypes ? `Effect types: ${filters.effectTypes.join(', ')}` : ''}
${filters.tags ? `Tags: ${filters.tags.join(', ')}` : ''}
${keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''}

Provide compound information if found, or suggest alternatives if not.`;
  }
}
