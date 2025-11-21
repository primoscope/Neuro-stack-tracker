/**
 * Gemini Server Actions
 * Server-side actions for Gemini API operations
 * 
 * Using Vercel AI SDK (@ai-sdk/google) for proper Next.js integration
 * Reference: https://sdk.vercel.ai/providers/google
 * 
 * All API calls happen server-side to keep keys secure (no NEXT_PUBLIC_ prefix)
 */

'use server';

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { GEMINI_MODELS, getServerGeminiApiKey } from '@/lib/geminiConfig';

/**
 * Response type for test connection
 */
export interface TestConnectionResult {
  success: boolean;
  model?: string;
  message?: string;
  error?: string;
  code?: string | number;
}

/**
 * Response type for list models
 */
export interface ListModelsResult {
  success: boolean;
  models?: Array<{
    name: string;
    displayName?: string;
    description?: string;
    supportedGenerationMethods?: string[];
  }>;
  error?: string;
  raw?: string;
}

/**
 * Response type for analyze stack
 */
export interface AnalyzeStackResult {
  success: boolean;
  analysis?: {
    safety: string;
    interactions: string[];
    optimization: string[];
  };
  error?: string;
}

/**
 * Test Gemini API connection with a simple prompt
 * Uses gemini-2.5-flash for guaranteed fast response (recommended for test button)
 * 
 * Reference: https://ai.google.dev/gemini-api/docs/models
 */
export async function testGeminiConnection(
  apiKeyOverride?: string
): Promise<TestConnectionResult> {
  try {
    const apiKey = apiKeyOverride || getServerGeminiApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        message: 'Please set GEMINI_API_KEY environment variable or provide an API key',
      };
    }

    const modelId = GEMINI_MODELS.FAST; // gemini-2.5-flash for instant response
    const testPrompt = 'Reply with exactly the word "Success" and nothing else.';

    // Use direct fetch API for more control over the request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      
      return {
        success: false,
        error: errorMsg,
        code: response.status,
      };
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return {
        success: false,
        error: 'No response from API',
        message: 'The API returned an empty response',
      };
    }

    return {
      success: true,
      model: modelId,
      message: `System Online: Connected to ${modelId}`,
    };
  } catch (error: any) {
    console.error('Test connection error:', error);
    
    // Parse error for better user feedback
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let errorCode: string | number | undefined;
    
    if (error.statusCode) {
      errorCode = error.statusCode;
    }
    
    // Check for common error patterns
    if (errorMessage.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your key at https://aistudio.google.com/apikey';
    } else if (errorMessage.includes('404')) {
      errorMessage = 'Model not found. Please verify your API key has access to Gemini models.';
      errorCode = 404;
    } else if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      errorMessage = 'Permission denied. Your API key may not have access to this model.';
      errorCode = 403;
    }
    
    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}

/**
 * List available Gemini models
 * Calls the official models.list endpoint
 */
export async function listGeminiModels(
  apiKeyOverride?: string
): Promise<ListModelsResult> {
  try {
    const apiKey = apiKeyOverride || getServerGeminiApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        raw: errorText,
      };
    }

    const data = await response.json();
    
    if (!data.models || !Array.isArray(data.models)) {
      return {
        success: false,
        error: 'Invalid response format from API',
        raw: JSON.stringify(data),
      };
    }

    // Filter to only Gemini models
    const geminiModels = data.models
      .filter((model: any) => 
        model.name && 
        (model.name.includes('gemini') || model.name.includes('models/gemini'))
      )
      .map((model: any) => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName || model.name,
        description: model.description || '',
        supportedGenerationMethods: model.supportedGenerationMethods || [],
      }));

    return {
      success: true,
      models: geminiModels,
    };
  } catch (error) {
    console.error('List models error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Analyze a stack of compounds for safety and optimization
 * Uses Gemini 3.0 Pro Preview for advanced reasoning
 * Automatically falls back to 2.5 Pro if 3.0 is unavailable (404/waitlist)
 * 
 * Reference: https://ai.google.dev/gemini-api/docs/gemini-3
 */
export async function analyzeStack(
  stackData: {
    compounds: Array<{
      name: string;
      dose: string;
      timing?: string;
    }>;
    userGoals?: string[];
  },
  apiKeyOverride?: string
): Promise<AnalyzeStackResult> {
  try {
    const apiKey = apiKeyOverride || getServerGeminiApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured',
      };
    }

    // Build analysis prompt with professional framing
    // (Gemini 3.0 has stricter safety filters for medical content)
    const compoundsList = stackData.compounds
      .map(c => `- ${c.name} (${c.dose}${c.timing ? `, ${c.timing}` : ''})`)
      .join('\n');
    
    const goalsText = stackData.userGoals && stackData.userGoals.length > 0
      ? `\n\nResearch Goals: ${stackData.userGoals.join(', ')}`
      : '';

    const systemPrompt = `You are a pharmaceutical research assistant analyzing supplement and nootropic data. 
Provide evidence-based analysis while noting this is for research purposes only, not medical advice.`;

    const prompt = `As a pharmaceutical researcher, analyze the following supplement stack for a research study:

${compoundsList}${goalsText}

Think step-by-step about potential interactions and provide:
1. Safety Assessment: Overall safety profile and any warnings
2. Interactions: Known or potential interactions between compounds
3. Optimization: Evidence-based suggestions for timing, dosing, or stack composition

Format as JSON: { "safety": "...", "interactions": [...], "optimization": [...] }`;

    // Try Gemini 3.0 Pro Preview first, fallback to 2.5 Pro if unavailable
    let modelId: string = GEMINI_MODELS.REASONING; // gemini-3.0-pro-preview
    let textResponse: string;
    
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 64,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        // If 3.0 returns 404 (waitlist/unavailable), fallback to 2.5 Pro
        if (response.status === 404) {
          console.log('Gemini 3.0 unavailable, falling back to 2.5 Pro...');
          modelId = GEMINI_MODELS.STABLE; // gemini-2.5-pro
          
          const fallbackResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: fullPrompt
                  }]
                }],
                generationConfig: {
                  temperature: 0.3,
                  topK: 64,
                  topP: 0.95,
                  maxOutputTokens: 2048,
                },
              }),
            }
          );

          if (!fallbackResponse.ok) {
            const errorData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          textResponse = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
      } else {
        const data = await response.json();
        textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch (error: any) {
      throw error;
    }

    if (!textResponse) {
      return {
        success: false,
        error: 'No response from API',
      };
    }
    
    // Try to parse JSON response
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          analysis: {
            safety: parsed.safety || 'No safety information available',
            interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
            optimization: Array.isArray(parsed.optimization) ? parsed.optimization : [],
          },
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, return raw text
      console.warn('Failed to parse JSON from Gemini response, returning raw text');
    }

    return {
      success: true,
      analysis: {
        safety: textResponse,
        interactions: [],
        optimization: [],
      },
    };
  } catch (error: any) {
    console.error('Analyze stack error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
