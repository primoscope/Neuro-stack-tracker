/**
 * AI Prompt Builders
 * Centralized prompt engineering for all AI features
 */

import { CompoundContext, RouteContext } from './types';

/**
 * System prompt for all AI interactions
 */
export const SYSTEM_PROMPT = `You are an expert pharmacologist and nootropics specialist helping users optimize their supplement and medication tracking.

Key Guidelines:
- Provide clear, evidence-based information
- Focus on safety first - always highlight potential interactions and contraindications
- Be concise but thorough
- Use accessible language, avoiding unnecessary jargon
- Include proper medical disclaimers
- Never diagnose or prescribe - offer educational information only
- Base recommendations on established pharmacological principles

Remember: This is NOT medical advice. Users should always consult healthcare professionals before making changes to their medication or supplement regimen.`;

/**
 * Build prompt for Instant Compound Intelligence
 */
export function buildCompoundInsightPrompt(context: CompoundContext): string {
  const stackInfo = context.currentStack && context.currentStack.length > 0
    ? `\nUser's current stack: ${context.currentStack.map(c => `${c.name} (${c.dose})`).join(', ')}`
    : '';

  const logSummary = context.recentLogs && context.recentLogs.length > 0
    ? `\n\nRecent tracking data (last ${context.recentLogs.length} days):
- Average anxiety: ${(context.recentLogs.reduce((sum, l) => sum + l.anxiety, 0) / context.recentLogs.length).toFixed(1)}/10
- Average functionality: ${(context.recentLogs.reduce((sum, l) => sum + l.functionality, 0) / context.recentLogs.length).toFixed(1)}/10`
    : '';

  return `Provide comprehensive pharmacological information about **${context.compoundName}** (${context.category}).
${stackInfo}${logSummary}

Return a JSON response with:
1. **mechanism**: How this compound works (2-3 sentences, accessible language)
2. **halfLife**: Approximate half-life (e.g., "4-6 hours", "24 hours")
3. **onset**: Time to onset (e.g., "30-60 minutes", "1-2 hours")
4. **duration**: Typical duration of effects (e.g., "4-6 hours", "8-12 hours")
5. **interactions**: List of potential interactions with their current stack compounds (if any). Be specific about mechanism and severity.
6. **safetyNote**: Critical safety information, contraindications, and when to consult a doctor. Include disclaimer that this is educational information only.

Be accurate, evidence-based, and prioritize user safety.`;
}

/**
 * Build prompt for Stack Optimization
 */
export function buildStackOptimizationPrompt(
  compounds: Array<{ name: string; dose: string; timing?: string }>,
  goals?: string[]
): string {
  const compoundsList = compounds.map(c => 
    `- ${c.name} (${c.dose})${c.timing ? ` - ${c.timing}` : ''}`
  ).join('\n');

  const goalsSection = goals && goals.length > 0
    ? `\n\nUser's goals: ${goals.join(', ')}`
    : '';

  return `Analyze this nootropic/supplement stack and provide comprehensive optimization recommendations:

**Current Stack:**
${compoundsList}${goalsSection}

Provide a structured JSON response with:

1. **warnings**: Array of safety warnings
   - severity: 'critical' | 'moderate' | 'minor'
   - message: Clear explanation of the risk
   - compounds: Array of compound names involved

2. **synergies**: Array of synergistic combinations
   - compounds: Which compounds work well together
   - benefit: What benefit this combination provides
   - recommendation: How to optimize this synergy

3. **timingSuggestions**: Array of timing optimizations
   - compound: Name
   - currentTiming: Current timing (if known)
   - suggestedTiming: Optimal timing (Morning/Afternoon/Evening with specific time)
   - reason: Why this timing is better

4. **additions**: Array of suggested compounds to add
   - compound: Name of compound
   - reason: Why it would benefit this stack
   - priority: 'high' | 'medium' | 'low'

5. **summary**: Overall assessment (3-4 sentences)

Prioritize safety. Flag any dangerous interactions. Be specific and actionable.`;
}

/**
 * Build prompt for Route-Aware Insights
 */
export function buildRouteAwarePrompt(context: RouteContext): string {
  let dataContext = '';

  switch (context.route) {
    case '/':
    case '/dashboard':
      dataContext = context.data.streak !== undefined
        ? `Current logging streak: ${context.data.streak} days
Average anxiety (7d): ${context.data.avgAnxiety}/10
Average functionality (7d): ${context.data.avgFunctionality}/10

Recent logs available: ${context.data.recentLogs?.length || 0}`
        : 'No tracking data yet.';
      break;

    case '/analytics':
      dataContext = context.data.recentLogs && context.data.recentLogs.length > 0
        ? `Analyzing ${context.data.recentLogs.length} recent log entries.
Anxiety trend: ${context.data.recentLogs.map(l => l.anxiety).join(', ')}
Functionality trend: ${context.data.recentLogs.map(l => l.functionality).join(', ')}`
        : 'No analytics data available yet.';
      break;

    case '/library':
      dataContext = 'User is browsing the compound library to learn about different supplements and medications.';
      break;

    case '/settings':
      dataContext = context.data.compounds && context.data.compounds.length > 0
        ? `User has ${context.data.compounds.length} compounds in their pharmacy.`
        : 'User is setting up their compound pharmacy.';
      break;

    default:
      dataContext = 'User is exploring the app.';
  }

  return `The user is currently on the **${context.routeName}** page of their nootropic tracking app.

**Context:**
${dataContext}

As their AI assistant, provide a proactive, helpful response:

1. **insight**: One key observation or insight based on their current page and data (2-3 sentences)
2. **suggestions**: 3-5 specific, actionable suggestions they can take right now
3. **questions**: 2-3 follow-up questions you could help them explore

Be conversational, helpful, and focused on their current context. Don't just describe what they can see - add value with analysis and proactive guidance.`;
}

/**
 * Build a safety-focused system prompt
 */
export function buildSafetySystemPrompt(): string {
  return `${SYSTEM_PROMPT}

CRITICAL SAFETY FOCUS:
- Always prioritize user safety
- Clearly flag dangerous interactions (especially MAOIs, SSRIs, stimulants, CNS depressants)
- Recommend immediate medical consultation for serious concerns
- Never minimize potential risks
- Include clear disclaimers that this is educational information, not medical advice`;
}
