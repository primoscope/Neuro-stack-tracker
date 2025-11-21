import { NextRequest, NextResponse } from 'next/server';
import { getSelectedModel } from '@/lib/gemini-search';

export const runtime = 'edge';

interface CompoundItem {
  id: string;
  name: string;
  dose: string;
  timing?: string;
  effectType?: string;
}

interface OptimizeStackRequest {
  compounds: CompoundItem[];
  goals?: string[];
}

interface OptimizedStackResponse {
  optimizedCompounds: CompoundItem[];
  rationale: string;
  changes: Array<{
    compound: string;
    change: string;
    reason: string;
  }>;
}

/**
 * POST /api/stack/optimize
 * Optimize stack ordering based on chronopharmacology and interactions
 */
export async function POST(request: NextRequest) {
  try {
    const body: OptimizeStackRequest = await request.json();
    const { compounds, goals } = body;

    if (!compounds || !Array.isArray(compounds) || compounds.length === 0) {
      return NextResponse.json(
        { error: 'Compounds array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Gemini API not configured',
          message: 'Set GEMINI_API_KEY environment variable to enable stack optimization'
        },
        { status: 503 }
      );
    }

    const model = getSelectedModel();
    
    // Build the optimization prompt
    const compoundsList = compounds
      .map((c, idx) => `${idx + 1}. ${c.name} - ${c.dose}${c.timing ? ` (currently: ${c.timing})` : ''}${c.effectType ? ` [${c.effectType}]` : ''}`)
      .join('\n');

    const prompt = `You are a pharmacology expert specializing in nootropic stack optimization. Analyze and optimize the following supplement stack:

Current Stack:
${compoundsList}

${goals && goals.length > 0 ? `User Goals: ${goals.join(', ')}` : ''}

Please optimize this stack based on:
1. **Chronopharmacology**: Stimulants in AM, sedatives in PM, adaptogens based on their profile
2. **Synergistic Effects**: Group compounds that work well together
3. **Interaction Avoidance**: Separate compounds with potential conflicts
4. **Timing Optimization**: Optimal spacing for absorption and effect

Provide your response in the following JSON format:
{
  "optimizedCompounds": [
    {
      "id": "original-id",
      "name": "Compound Name",
      "dose": "original dose",
      "timing": "Suggested timing (e.g., '8:00 AM', 'Morning', 'Evening', '10:00 PM')",
      "effectType": "effect type if available"
    }
  ],
  "rationale": "Brief explanation of the overall optimization strategy",
  "changes": [
    {
      "compound": "Compound Name",
      "change": "What changed (moved to morning, separated from X, etc.)",
      "reason": "Why this change improves the stack"
    }
  ]
}

Order the compounds chronologically by suggested timing. Be specific about timing recommendations.`;

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
            temperature: 0.3, // Lower temperature for more consistent recommendations
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
      return NextResponse.json(
        { error: 'No response from Gemini' },
        { status: 500 }
      );
    }

    // Extract JSON from response - find first complete JSON object
    let optimizationResult: OptimizedStackResponse;
    try {
      // Try to find JSON block with proper braces
      const jsonMatch = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
      if (!jsonMatch) {
        // Fallback: try to extract from code blocks
        const codeBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          optimizationResult = JSON.parse(codeBlockMatch[1]);
        } else {
          throw new Error('No JSON found in response');
        }
      } else {
        optimizationResult = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse optimization response:', parseError);
      return NextResponse.json(
        { error: 'Could not parse optimization response', details: text.substring(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(optimizationResult);
  } catch (error) {
    console.error('Stack optimization error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
