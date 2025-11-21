/**
 * Gemini Bio-Sync Service
 * Automated schedule optimization based on chronopharmacology
 */

import { getSelectedModel, type GeminiModel } from './gemini-search';
import { DoseItem } from './types';

export interface OptimizedScheduleItem {
  compoundId: string;
  suggestedTime: string; // HH:MM format
  reasoning: string;
}

export interface BioSyncResult {
  optimizedSchedule: OptimizedScheduleItem[];
  summary: string;
  warnings: string[];
}

/**
 * Optimize schedule using Gemini's chronopharmacology knowledge
 */
export async function optimizeScheduleWithGemini(
  compoundNames: Array<{ id: string; name: string; currentTime?: string; dose?: string }>,
  model?: GeminiModel
): Promise<BioSyncResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const selectedModel = model || getSelectedModel();
    
    const compoundsList = compoundNames
      .map((c, idx) => `${idx + 1}. ${c.name}${c.currentTime ? ` (currently taken at ${c.currentTime})` : ''}${c.dose ? ` - ${c.dose}` : ''}`)
      .join('\n');

    const prompt = `You are an expert chronopharmacologist. Optimize the timing of this supplement/medication stack based on circadian rhythms, pharmacokinetics, and synergistic effects.

Current Stack:
${compoundsList}

Please provide:
1. An optimized schedule with specific times (HH:MM format, 24-hour)
2. Reasoning for each timing recommendation
3. Any warnings or concerns

Return your response in JSON format:
{
  "optimizedSchedule": [
    {
      "compoundName": "name",
      "suggestedTime": "HH:MM",
      "reasoning": "why this time is optimal"
    }
  ],
  "summary": "Overall optimization strategy summary",
  "warnings": ["warning1", "warning2"]
}

Guidelines:
- Stimulants should be early (06:00-10:00)
- Adaptogens can be morning or noon
- GABAergics/sleep aids in evening (20:00-22:00)
- Consider interaction timing (e.g., caffeine + L-theanine together)
- Avoid cortisol-blunting agents in the morning
- Space out compounds that compete for absorption
- Consider onset times for desired effects

Be specific and evidence-based.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Map compound names back to IDs
      const optimizedSchedule: OptimizedScheduleItem[] = parsed.optimizedSchedule.map((item: any) => {
        const compound = compoundNames.find(
          (c) => c.name.toLowerCase() === item.compoundName.toLowerCase()
        );
        
        return {
          compoundId: compound?.id || '',
          suggestedTime: item.suggestedTime,
          reasoning: item.reasoning,
        };
      });

      return {
        optimizedSchedule,
        summary: parsed.summary || '',
        warnings: parsed.warnings || [],
      };
    }

    return null;
  } catch (error) {
    console.error('Bio-Sync optimization error:', error);
    return null;
  }
}

/**
 * Format time from timestamp to HH:MM
 */
export function formatTimeFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse HH:MM time to hours as decimal (for timeline calculations)
 */
export function parseTimeToHours(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
}
