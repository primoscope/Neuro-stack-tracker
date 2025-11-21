/**
 * TypeScript types for AI service responses
 */

import { z } from 'zod';

/**
 * Compound Insight Response
 * Used by Instant Compound Intelligence feature
 */
export const CompoundInsightSchema = z.object({
  mechanism: z.string().describe('Mechanism of action in simple terms'),
  halfLife: z.string().describe('Approximate half-life'),
  onset: z.string().describe('Time to onset of effects'),
  duration: z.string().describe('Typical duration of effects'),
  interactions: z.array(z.string()).describe('Potential interactions with current stack'),
  safetyNote: z.string().describe('Important safety considerations'),
});

export type CompoundInsight = z.infer<typeof CompoundInsightSchema>;

/**
 * Stack Optimization Response
 * Used by Agentic Stack Builder feature
 */
export const StackOptimizationSchema = z.object({
  warnings: z.array(z.object({
    severity: z.enum(['critical', 'moderate', 'minor']),
    message: z.string(),
    compounds: z.array(z.string()),
  })).describe('Safety warnings and dangerous interactions'),
  
  synergies: z.array(z.object({
    compounds: z.array(z.string()),
    benefit: z.string(),
    recommendation: z.string(),
  })).describe('Synergistic combinations'),
  
  timingSuggestions: z.array(z.object({
    compound: z.string(),
    currentTiming: z.string().optional(),
    suggestedTiming: z.string(),
    reason: z.string(),
  })).describe('Timing optimization recommendations'),
  
  additions: z.array(z.object({
    compound: z.string(),
    reason: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })).describe('Suggested compounds to add'),
  
  summary: z.string().describe('Overall assessment and key takeaways'),
});

export type StackOptimization = z.infer<typeof StackOptimizationSchema>;

/**
 * Route-Aware Insight Response
 * Used by Global Neuro-Navigator feature
 */
export const RouteInsightSchema = z.object({
  insight: z.string().describe('Main insight or observation'),
  suggestions: z.array(z.string()).describe('Actionable suggestions (3-5 items)'),
  questions: z.array(z.string()).describe('Follow-up questions user might want to explore'),
});

export type RouteInsight = z.infer<typeof RouteInsightSchema>;

/**
 * Context for route-aware insights
 */
export interface RouteContext {
  route: string;
  routeName: string;
  data: {
    compounds?: Array<{ name: string; dose: string }>;
    recentLogs?: Array<{ date: string; anxiety: number; functionality: number }>;
    streak?: number;
    avgAnxiety?: number;
    avgFunctionality?: number;
  };
}

/**
 * Compound context for instant intelligence
 */
export interface CompoundContext {
  compoundName: string;
  category: string;
  currentStack?: Array<{ name: string; dose: string }>;
  recentLogs?: Array<{
    date: string;
    anxiety: number;
    functionality: number;
    compounds: string[];
  }>;
}
