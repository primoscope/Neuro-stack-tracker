/**
 * Gemini AI-powered compound search service
 * Uses Google's Gemini API to search for compound information using internet data
 */

import { CompoundDetail } from './compound-types';

export interface GeminiSearchOptions {
  query: string;
  includeInteractions?: boolean;
  includeMechanism?: boolean;
  includeDosage?: boolean;
}

export interface GeminiSearchResult {
  compound: Partial<CompoundDetail>;
  source: 'gemini-api';
  confidence: number;
  references?: string[];
}

/**
 * Search for compound information using Gemini API
 */
export async function searchCompoundWithGemini(
  options: GeminiSearchOptions
): Promise<GeminiSearchResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
    return null;
  }

  try {
    const prompt = buildSearchPrompt(options);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more factual responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return null;
    }

    const textResponse = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      return null;
    }

    // Parse the structured response
    const parsedCompound = parseGeminiResponse(textResponse, options.query);
    
    return {
      compound: parsedCompound,
      source: 'gemini-api',
      confidence: 0.8, // Gemini Pro confidence
      references: extractReferences(textResponse),
    };
  } catch (error) {
    console.error('Gemini API search error:', error);
    return null;
  }
}

/**
 * Build a structured prompt for Gemini to search for compound information
 */
function buildSearchPrompt(options: GeminiSearchOptions): string {
  const { query, includeInteractions, includeMechanism, includeDosage } = options;
  
  return `You are a pharmaceutical and nootropics research assistant. Search for information about the compound: "${query}"

Please provide the following information in a structured JSON format:

{
  "name": "Primary compound name",
  "aliases": ["list", "of", "brand names and aliases"],
  "effectType": "Primary effect type (e.g., Stimulant, Nootropic, Anxiolytic, etc.)",
  "primaryEffects": "Brief summary of primary effects",
  "mechanism": "Mechanism of action (short)",
  "mechanisticTags": ["tag1", "tag2"],
  "acuteEffect": "Yes/No - does it have acute effects after one dose?",
  "timing": {
    "onset": "onset time",
    "peak": "peak time",
    "duration": "duration"
  },
  "recreational": "Yes/No/Low-Medium/etc.",
  "dependenceRisk": "Risk level",
  "bestTiming": "Daytime/Nighttime/Either",
  ${includeInteractions ? '"interactions": { "bupropion": "interaction summary", "ssri": "interaction summary" },' : ''}
  ${includeMechanism ? '"detailedMechanism": "Detailed mechanism of action",' : ''}
  ${includeDosage ? '"dosageRange": "Typical dosage range",' : ''}
  "evidenceGrade": "A-E letter grade based on evidence quality",
  "evidenceSummary": "Brief summary of evidence",
  "efficacyScore": "1-30 score",
  "safetyScore": "1-10 score",
  "fdaApproved": "Yes/No",
  "references": ["source1", "source2"]
}

Focus on factual, evidence-based information. Include medical disclaimers where appropriate. If the compound is not found or you're uncertain about information, indicate that clearly.`;
}

/**
 * Parse Gemini's response into a CompoundDetail structure
 */
function parseGeminiResponse(response: string, query: string): Partial<CompoundDetail> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Convert Gemini's response format to our CompoundDetail format
      return {
        id: parsed.name?.toLowerCase().replace(/\s+/g, '-') || query.toLowerCase().replace(/\s+/g, '-'),
        name: parsed.name || query,
        aliases: parsed.aliases || [],
        effectType: parsed.effectType || 'Unknown',
        primaryEffects: parsed.primaryEffects || '',
        mechanism: parsed.mechanism || '',
        mechanisticTags: parsed.mechanisticTags || [],
        acuteEffect: parsed.acuteEffect === 'Yes' || parsed.acuteEffect === true,
        onset: {
          raw: `${parsed.timing?.onset || ''} / ${parsed.timing?.peak || ''} / ${parsed.timing?.duration || ''}`,
          onsetMin: 0,
          onsetMax: 0,
          peakMin: 0,
          peakMax: 0,
          durationMin: 0,
          durationMax: 0,
        },
        recreational: (parsed.recreational || 'No') as any,
        dependenceTolerance: parsed.dependenceRisk || '',
        daytimeNighttime: parsed.bestTiming || '',
        interactions: {
          voxra: parsed.interactions?.bupropion || '',
          ssri: parsed.interactions?.ssri || '',
        },
        evidence: {
          strength: parsed.evidenceGrade || 'E',
          summary: parsed.evidenceSummary || '',
        },
        efficacyScore: parseInt(parsed.efficacyScore) || 0,
        safetyScore: parseInt(parsed.safetyScore) || 5,
        categoryTags: parsed.mechanisticTags || [],
      };
    }
    
    // If JSON parsing fails, return basic structure
    return {
      id: query.toLowerCase().replace(/\s+/g, '-'),
      name: query,
      aliases: [],
      effectType: 'Unknown',
      primaryEffects: response.substring(0, 200),
      mechanism: '',
      mechanisticTags: [],
      acuteEffect: false,
      onset: { raw: '' },
      recreational: 'No' as any,
      dependenceTolerance: '',
      daytimeNighttime: '',
      interactions: { voxra: '', ssri: '' },
      evidence: { strength: 'E', summary: '' },
      efficacyScore: 0,
      safetyScore: 5,
      categoryTags: [],
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return {
      id: query.toLowerCase().replace(/\s+/g, '-'),
      name: query,
      aliases: [],
      effectType: 'Unknown',
      primaryEffects: 'Error parsing AI response',
      mechanism: '',
      mechanisticTags: [],
      acuteEffect: false,
      onset: { raw: '' },
      recreational: 'No' as any,
      dependenceTolerance: '',
      daytimeNighttime: '',
      interactions: { voxra: '', ssri: '' },
      evidence: { strength: 'E', summary: '' },
      efficacyScore: 0,
      safetyScore: 5,
      categoryTags: [],
    };
  }
}

/**
 * Extract references from Gemini response
 */
function extractReferences(response: string): string[] {
  const references: string[] = [];
  
  // Look for common reference patterns
  const patterns = [
    /PMID[:\s]+(\d+)/gi,
    /DOI[:\s]+(10\.\d+\/[^\s]+)/gi,
    /https?:\/\/[^\s]+/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      references.push(match[0]);
    }
  });
  
  return references;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}
