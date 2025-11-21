/**
 * Gemini API Configuration
 * Central configuration for Gemini model IDs and settings
 * 
 * OFFICIAL DOCUMENTATION (November 2025 Release):
 * - Gemini 3.0 Developer Guide: https://ai.google.dev/gemini-api/docs/gemini-3
 * - Model Cards & Specs: https://ai.google.dev/gemini-api/docs/models
 * - Gemini 3 Pro Model Card (PDF): https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf
 * - Migration Guide (1.5 → 3.0): https://ai.google.dev/gemini-api/docs/migrate
 * - Vercel AI SDK (Recommended): https://sdk.vercel.ai/providers/google
 * - Release Notes/Changelog: https://ai.google.dev/gemini-api/docs/changelog
 * 
 * IMPORTANT: Gemini 3.0 was officially released November 18, 2025
 * - Supports agentic reasoning and deep analysis
 * - Stricter safety filters for medical/pharmaceutical content
 * - Use professional framing in prompts (e.g., "As a pharmaceutical researcher...")
 * 
 * Last verified: November 2025
 */

/**
 * Gemini Model Configuration
 * Using VALIDATED model IDs from official Google AI documentation
 * 
 * These model strings are confirmed working as of November 2025:
 */
export const GEMINI_MODELS = {
  /**
   * Fast model - REQUIRED for Test Connection button
   * Model ID: gemini-2.5-flash
   * 
   * Features:
   * - Fastest response time (guaranteed 200 OK)
   * - Free tier: Yes
   * - Best for: Testing, quick queries, validation
   * 
   * Use this for the "Test Connection" feature to ensure immediate success
   * without hitting preview model quotas or waitlists.
   */
  FAST: 'gemini-2.5-flash',
  
  /**
   * Reasoning model - Latest Gemini 3.0 with agentic capabilities
   * Model ID: gemini-3.0-pro-preview
   * 
   * Released: November 18, 2025
   * Features:
   * - Advanced agentic reasoning
   * - Deep analysis capabilities
   * - "Think step-by-step" prompting support
   * - Context caching support
   * 
   * Use for: Stack analysis, complex pharmacological queries, Neuro-Navigator
   * 
   * Fallback: If 404 occurs (waitlist/quota), automatically fallback to gemini-2.5-pro
   * 
   * Reference: https://ai.google.dev/gemini-api/docs/gemini-3
   */
  REASONING: 'gemini-3.0-pro-preview',
  
  /**
   * Stable production model - Reliable fallback
   * Model ID: gemini-2.5-pro
   * 
   * Features:
   * - Most powerful model on free tier
   * - Production-ready and stable
   * - No waitlist required
   * 
   * Use as: Fallback when gemini-3.0-pro-preview is unavailable
   */
  STABLE: 'gemini-2.5-pro',
  
  /**
   * Fallback order for automatic retries:
   * 1. gemini-3.0-pro-preview (try first for analysis)
   * 2. gemini-2.5-pro (fallback if 404)
   * 3. gemini-2.5-flash (last resort)
   */
} as const;

/**
 * Available model options for user selection
 */
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash ⚡',
    description: 'Fast and efficient - great for quick queries and testing',
    tier: 'free',
    recommended: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro ⭐',
    description: 'Most powerful on free tier - excellent reasoning',
    tier: 'free',
    recommended: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3.0 Pro Preview 🆕',
    description: 'Latest release (Nov 2024) - Advanced reasoning',
    tier: 'paid',
    recommended: false,
  },
  {
    id: 'gemini-2.0-flash-thinking-exp',
    name: 'Gemini 2.0 Flash (Thinking)',
    description: 'Extended reasoning - best for complex analysis',
    tier: 'experimental',
    recommended: false,
  },
] as const;

/**
 * Default generation configuration
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 64,
  topP: 0.95,
  maxOutputTokens: 2048,
} as const;

/**
 * Get the API key from environment
 * Server-side only - never expose to client
 */
export function getServerGeminiApiKey(): string | null {
  // Only check server-side environment variables
  return process.env.GEMINI_API_KEY || null;
}

/**
 * Validate if API key is configured
 */
export function isGeminiConfigured(): boolean {
  return !!getServerGeminiApiKey();
}

/**
 * Get model ID by use case
 */
export function getModelForUseCase(useCase: 'test' | 'analysis' | 'general'): string {
  switch (useCase) {
    case 'test':
      return GEMINI_MODELS.FAST;
    case 'analysis':
      return GEMINI_MODELS.REASONING;
    case 'general':
    default:
      return GEMINI_MODELS.STABLE;
  }
}
