/**
 * Gemini AI Insights Service
 * Provides AI-powered analysis and insights for various app features
 */

import { getSelectedModel, type GeminiModel } from './gemini-search';

export interface InsightOptions {
  context: string;
  data?: any;
  model?: GeminiModel;
  temperature?: number;
}

export interface InsightResult {
  insight: string;
  confidence: number;
  model: string;
  timestamp: number;
}

/**
 * Generate AI insights for stack combinations
 */
export async function analyzeStackCombination(
  compounds: string[],
  symptoms?: string[]
): Promise<InsightResult | null> {
  const context = `Analyze this nootropic/medication stack combination:
Compounds: ${compounds.join(', ')}
${symptoms ? `Target symptoms: ${symptoms.join(', ')}` : ''}

Provide analysis on:
1. Synergies and potential interactions
2. Timing recommendations (morning vs evening)
3. Potential side effects or contraindications
4. Efficacy for target symptoms
5. Safety considerations

Format as brief, actionable bullet points.`;

  return generateInsight({ context, temperature: 0.3 });
}

/**
 * Generate personalized recommendations based on user logs
 */
export async function generatePersonalizedRecommendations(
  userData: {
    compounds: string[];
    anxietyScores: number[];
    functionalityScores: number[];
    recentLogs: any[];
  }
): Promise<InsightResult | null> {
  const avgAnxiety = userData.anxietyScores.length > 0 
    ? userData.anxietyScores.reduce((a, b) => a + b) / userData.anxietyScores.length
    : 0;
  
  const avgFunctionality = userData.functionalityScores.length > 0
    ? userData.functionalityScores.reduce((a, b) => a + b) / userData.functionalityScores.length
    : 0;

  const context = `Analyze this user's nootropic tracking data:
Current compounds: ${userData.compounds.join(', ')}
Average anxiety level: ${avgAnxiety.toFixed(1)}/10
Average functionality: ${avgFunctionality.toFixed(1)}/10
Number of logs: ${userData.recentLogs.length}

Based on this data, provide:
1. Pattern analysis (what's working, what's not)
2. Optimization suggestions
3. Timing adjustments
4. Compounds to consider adding/removing
5. Lifestyle factors to address

Keep recommendations practical and evidence-based.`;

  return generateInsight({ context, temperature: 0.4 });
}

/**
 * Analyze trends and correlations in user data
 */
export async function analyzeTrends(
  timeSeriesData: {
    dates: string[];
    anxiety: number[];
    functionality: number[];
    compounds: string[][];
  }
): Promise<InsightResult | null> {
  const context = `Analyze these wellness tracking trends:
Date range: ${timeSeriesData.dates[0]} to ${timeSeriesData.dates[timeSeriesData.dates.length - 1]}
Data points: ${timeSeriesData.dates.length}

Provide insights on:
1. Overall trends (improving/declining/stable)
2. Correlations between compounds and outcomes
3. Day-of-week patterns
4. Recommendations for optimization

Focus on actionable insights.`;

  return generateInsight({ context, data: timeSeriesData, temperature: 0.3 });
}

/**
 * Get smart suggestions for compound timing
 */
export async function getTimingOptimization(
  compounds: Array<{ name: string; onset: string; peak: string; duration: string }>
): Promise<InsightResult | null> {
  const context = `Optimize timing for this stack:
${compounds.map(c => `- ${c.name}: Onset ${c.onset}, Peak ${c.peak}, Duration ${c.duration}`).join('\n')}

Provide:
1. Optimal time to take each compound
2. Spacing recommendations
3. Morning vs evening allocation
4. Peak effect timing coordination

Format as a clear timing schedule.`;

  return generateInsight({ context, temperature: 0.2 });
}

/**
 * Explain compound mechanisms in simple terms
 */
export async function explainMechanism(
  compoundName: string,
  mechanism: string
): Promise<InsightResult | null> {
  const context = `Explain this compound's mechanism of action in simple, accessible language:
Compound: ${compoundName}
Technical mechanism: ${mechanism}

Provide:
1. Simple explanation (avoid jargon)
2. What it means for the user
3. Why it matters for their goals
4. Analogy if helpful

Keep it under 150 words.`;

  return generateInsight({ context, temperature: 0.4 });
}

/**
 * Generate safety warnings and precautions
 */
export async function generateSafetyWarnings(
  compounds: string[]
): Promise<InsightResult | null> {
  const context = `Analyze safety considerations for these compounds:
${compounds.join(', ')}

Provide:
1. Critical interactions to avoid
2. Contraindications
3. Monitoring recommendations
4. Red flags to watch for

Be specific and evidence-based. Prioritize safety.`;

  return generateInsight({ context, temperature: 0.2 });
}

/**
 * Core function to generate insights using Gemini API
 */
async function generateInsight(options: InsightOptions): Promise<InsightResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const model = options.model || getSelectedModel();
    const temperature = options.temperature ?? 0.3;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: options.context }]
          }],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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

    return {
      insight: text,
      confidence: 0.85,
      model,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Gemini insights error:', error);
    return null;
  }
}

/**
 * Check if Gemini insights are available
 */
export function areInsightsAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}
