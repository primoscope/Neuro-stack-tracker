/**
 * Gemini 3.0 AI Client
 * Unified client setup using Vercel AI SDK for streaming and structured responses
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

/**
 * Get configured Gemini client
 */
export function getGeminiClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  return createGoogleGenerativeAI({
    apiKey,
  });
}

/**
 * Get the selected Gemini model
 */
export function getSelectedModel(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_model');
    if (stored) {
      return stored;
    }
  }
  return 'gemini-exp-1206'; // Default to Gemini 3.0
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}

/**
 * Generate text with Gemini (non-streaming)
 */
export async function generateAIText(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const google = getGeminiClient();
  const modelName = options?.model || 'gemini-exp-1206';
  
  const result = await generateText({
    model: google(modelName),
    prompt,
    system: options?.systemPrompt,
    temperature: options?.temperature ?? 0.7,
    maxOutputTokens: options?.maxTokens ?? 1024,
  });

  return result.text;
}

/**
 * Generate structured JSON object with Gemini
 */
export async function generateAIObject<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: {
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<T> {
  const google = getGeminiClient();
  const modelName = options?.model || 'gemini-exp-1206';

  const result = await generateObject({
    model: google(modelName),
    schema,
    prompt,
    system: options?.systemPrompt,
    temperature: options?.temperature ?? 0.3,
  });

  return result.object;
}


