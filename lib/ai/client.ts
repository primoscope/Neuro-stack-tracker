/**
 * Gemini 3.0 AI Client
 * Unified client setup using Vercel AI SDK for streaming and structured responses
 * Configured according to Google Gemini API best practices
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

/**
 * Safety settings for Gemini API
 * Following Google's recommendations for health/medical content
 */
const SAFETY_SETTINGS = {
  // Allow informational medical content but block dangerous advice
  harmBlockThreshold: 'BLOCK_MEDIUM_AND_ABOVE' as const,
  harmCategory: [
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT', 
    'HARM_CATEGORY_DANGEROUS_CONTENT',
    'HARM_CATEGORY_HARASSMENT',
  ] as const,
};

/**
 * Generation configuration optimized for medical/pharmaceutical content
 */
interface GenerationConfig {
  temperature: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
}

/**
 * Get API key from environment or localStorage
 */
function getApiKey(): string | null {
  // First try environment variables
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  // Fallback to localStorage (client-side only)
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      return storedKey;
    }
  }
  
  return null;
}

/**
 * Get configured Gemini client
 */
export function getGeminiClient() {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable or configure it in Settings.');
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
  return 'gemini-2.5-pro'; // Default to Gemini 2.5 Pro (Most powerful on free tier)
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiAvailable(): boolean {
  return !!getApiKey();
}

/**
 * Get generation config based on use case
 * Optimized for Gemini 3.0 Pro Preview (topK: 64, topP: 0.95)
 */
function getGenerationConfig(
  temperature: number,
  maxTokens: number
): GenerationConfig {
  return {
    temperature,
    topK: 64, // Gemini 3.0 recommended value
    topP: 0.95, // Gemini 3.0 recommended value
    maxOutputTokens: maxTokens,
    candidateCount: 1, // Only generate one response
  };
}

/**
 * Generate text with Gemini (non-streaming)
 * Configured with safety settings and optimal parameters
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
  const modelName = options?.model || getSelectedModel();
  const config = getGenerationConfig(
    options?.temperature ?? 0.7,
    options?.maxTokens ?? 1024
  );
  
  const result = await generateText({
    model: google(modelName),
    prompt,
    system: options?.systemPrompt,
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
    topK: config.topK,
    topP: config.topP,
  });

  return result.text;
}

/**
 * Generate structured JSON object with Gemini
 * Uses JSON mode for reliable structured output
 */
export async function generateAIObject<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: {
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    maxTokens?: number;
  }
): Promise<T> {
  const google = getGeminiClient();
  const modelName = options?.model || getSelectedModel();
  const config = getGenerationConfig(
    options?.temperature ?? 0.3,
    options?.maxTokens ?? 2048
  );

  const result = await generateObject({
    model: google(modelName),
    schema,
    prompt,
    system: options?.systemPrompt,
    temperature: config.temperature,
    maxTokens: config.maxOutputTokens,
    topK: config.topK,
    topP: config.topP,
    mode: 'json', // Force JSON mode for structured output
  });

  return result.object;
}


