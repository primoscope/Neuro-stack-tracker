/**
 * Enhanced Gemini 3.0 Bio-Coach Service
 * Provides comprehensive AI-powered stack optimization, scheduling, and compound research
 */

import { getSelectedModel, type GeminiModel, searchCompoundWithGemini } from './gemini-search';
import { CompoundDetail } from './compound-types';

export interface BioCoachService {
  hybridSearch: (query: string) => Promise<CompoundDetail | null>;
  autoSchedule: (compounds: ScheduleCompound[]) => Promise<ScheduleResult | null>;
  optimizeStack: (stack: StackData) => Promise<OptimizationResult | null>;
}

export interface ScheduleCompound {
  name: string;
  dose: string;
  effectType?: string;
  onset?: string;
  peak?: string;
  duration?: string;
}

export interface ScheduleSlot {
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  compounds: Array<{
    name: string;
    dose: string;
    reason: string;
  }>;
  optimalTime: string;
}

export interface ScheduleResult {
  schedule: ScheduleSlot[];
  explanation: string;
  warnings: string[];
}

export interface StackData {
  compounds: Array<{
    name: string;
    dose: string;
    timing?: string;
  }>;
  goals?: string[];
  currentIssues?: string[];
}

export interface OptimizationResult {
  recommendations: Recommendation[];
  timingAdjustments: TimingAdjustment[];
  interactions: Interaction[];
  safetyScore: number;
}

export interface Recommendation {
  type: 'add' | 'remove' | 'adjust_dose' | 'replace';
  compound: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TimingAdjustment {
  compound: string;
  currentTiming: string;
  recommendedTiming: string;
  reason: string;
}

export interface Interaction {
  compounds: string[];
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}

/**
 * Hybrid search: Check local database first, then use Gemini 3.0 to research if missing
 */
export async function hybridCompoundSearch(
  query: string,
  localCompounds: CompoundDetail[]
): Promise<CompoundDetail | null> {
  // First, search local database
  const normalizedQuery = query.toLowerCase().trim();
  
  const localResult = localCompounds.find(compound => {
    const nameMatch = compound.name.toLowerCase() === normalizedQuery;
    const aliasMatch = compound.aliases.some(alias => 
      alias.toLowerCase() === normalizedQuery
    );
    return nameMatch || aliasMatch;
  });

  if (localResult) {
    return localResult;
  }

  // If not found locally, use Gemini 3.0 to research
  console.log(`Compound "${query}" not found locally. Researching with Gemini 3.0...`);
  
  const geminiResult = await searchCompoundWithGemini({
    query,
    includeInteractions: true,
    includeMechanism: true,
    includeDosage: true,
  });

  if (geminiResult) {
    return geminiResult.compound as CompoundDetail;
  }

  return null;
}

/**
 * Auto-schedule compounds based on pharmacological properties
 */
export async function autoScheduleCompounds(
  compounds: ScheduleCompound[]
): Promise<ScheduleResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const model = getSelectedModel();
    
    const compoundsList = compounds.map(c => 
      `- ${c.name} (${c.dose})${c.effectType ? ` - ${c.effectType}` : ''}${c.onset ? ` [Onset: ${c.onset}, Peak: ${c.peak}, Duration: ${c.duration}]` : ''}`
    ).join('\n');

    const prompt = `You are a pharmacologist optimizing a supplement/medication schedule. Analyze these compounds and create an optimal daily schedule:

${compoundsList}

Create a schedule that:
1. Places stimulants/activating compounds in the MORNING
2. Places neutral/cognitive enhancers in AFTERNOON
3. Places sedating/calming compounds in EVENING
4. Considers onset times and peak effects
5. Avoids overlapping peak effects of stimulants
6. Maximizes therapeutic benefits throughout the day

Return ONLY a JSON object in this exact format (no markdown, no explanation outside JSON):
{
  "schedule": [
    {
      "timeOfDay": "Morning",
      "compounds": [
        {
          "name": "Compound name",
          "dose": "dose amount",
          "reason": "Why this timing"
        }
      ],
      "optimalTime": "7:00 AM - 9:00 AM"
    }
  ],
  "explanation": "Brief overview of the schedule logic",
  "warnings": ["Any important safety considerations"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return null;
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result as ScheduleResult;
    }

    return null;
  } catch (error) {
    console.error('Auto-schedule error:', error);
    return null;
  }
}

/**
 * Generate comprehensive stack optimization recommendations
 */
export async function optimizeStack(
  stack: StackData
): Promise<OptimizationResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const model = getSelectedModel();
    
    const compoundsList = stack.compounds.map(c => 
      `- ${c.name} (${c.dose})${c.timing ? ` - ${c.timing}` : ''}`
    ).join('\n');

    const prompt = `Analyze this supplement/medication stack and provide optimization recommendations:

Compounds:
${compoundsList}

${stack.goals ? `Goals: ${stack.goals.join(', ')}` : ''}
${stack.currentIssues ? `Current Issues: ${stack.currentIssues.join(', ')}` : ''}

Provide a comprehensive analysis in JSON format (no markdown):
{
  "recommendations": [
    {
      "type": "add|remove|adjust_dose|replace",
      "compound": "compound name",
      "reason": "detailed reason",
      "priority": "high|medium|low"
    }
  ],
  "timingAdjustments": [
    {
      "compound": "compound name",
      "currentTiming": "current timing",
      "recommendedTiming": "recommended timing",
      "reason": "why this change"
    }
  ],
  "interactions": [
    {
      "compounds": ["compound1", "compound2"],
      "severity": "critical|moderate|minor",
      "description": "interaction description",
      "recommendation": "what to do"
    }
  ],
  "safetyScore": 1-10
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return null;
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result as OptimizationResult;
    }

    return null;
  } catch (error) {
    console.error('Stack optimization error:', error);
    return null;
  }
}

/**
 * Check if Bio-Coach services are available
 */
export function isBioCoachAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}
