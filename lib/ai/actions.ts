/**
 * AI Server Actions
 * Server-side actions for AI operations
 */

'use server';

import { generateAIObject, isGeminiAvailable } from './client';
import {
  CompoundInsightSchema,
  StackOptimizationSchema,
  RouteInsightSchema,
  type CompoundContext,
  type RouteContext,
} from './types';
import {
  buildCompoundInsightPrompt,
  buildStackOptimizationPrompt,
  buildRouteAwarePrompt,
  buildSafetySystemPrompt,
  SYSTEM_PROMPT,
} from './prompts';

/**
 * Get instant compound intelligence
 * Streams pharmacological insights about a specific compound
 */
export async function getCompoundInsight(context: CompoundContext) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY.');
  }

  try {
    const prompt = buildCompoundInsightPrompt(context);
    
    // Generate structured response
    const insight = await generateAIObject(
      prompt,
      CompoundInsightSchema,
      {
        systemPrompt: buildSafetySystemPrompt(),
        temperature: 0.3,
      }
    );

    return {
      success: true,
      data: insight,
    };
  } catch (error) {
    console.error('Compound insight error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insight',
    };
  }
}

/**
 * Optimize stack with AI recommendations
 * Returns structured optimization suggestions
 */
export async function optimizeStackWithGemini(
  compounds: Array<{ name: string; dose: string; timing?: string }>,
  goals?: string[]
) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY.');
  }

  try {
    const prompt = buildStackOptimizationPrompt(compounds, goals);
    
    const optimization = await generateAIObject(
      prompt,
      StackOptimizationSchema,
      {
        systemPrompt: buildSafetySystemPrompt(),
        temperature: 0.4,
      }
    );

    return {
      success: true,
      data: optimization,
    };
  } catch (error) {
    console.error('Stack optimization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize stack',
    };
  }
}

/**
 * Get route-aware insights
 * Provides contextual AI assistance based on current page
 */
export async function getRouteAwareInsight(context: RouteContext) {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY.');
  }

  try {
    const prompt = buildRouteAwarePrompt(context);
    
    const insight = await generateAIObject(
      prompt,
      RouteInsightSchema,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.6,
      }
    );

    return {
      success: true,
      data: insight,
    };
  } catch (error) {
    console.error('Route-aware insight error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insight',
    };
  }
}

/**
 * Check AI availability (can be called from client)
 */
export async function checkAIAvailability() {
  return {
    available: isGeminiAvailable(),
  };
}
