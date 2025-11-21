/**
 * Gemini Chat Service
 * Conversational AI interface with Gemini 3.0 for stack insights and recommendations
 */

import { getSelectedModel, type GeminiModel } from './gemini-search';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: string; // Stack info or other context
  model: GeminiModel;
  createdAt: number;
}

/**
 * Send a message to Gemini and get response with suggestions
 */
export async function sendChatMessage(
  message: string,
  session: ChatSession
): Promise<{ response: ChatMessage; suggestions: string[] } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    const model = session.model || getSelectedModel();
    
    // Build conversation history for context
    const conversationHistory = session.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add new user message
    conversationHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Get custom system prompt from localStorage or use default
    const customPrompt = typeof window !== 'undefined' 
      ? localStorage.getItem('bio_coach_system_prompt')
      : null;
    
    const defaultPrompt = `You are an expert pharmacologist and nootropics specialist helping users optimize their supplement stacks. 
              
Context: ${session.context}

Provide clear, evidence-based advice. Be conversational but professional. Keep responses concise (2-4 paragraphs max). Focus on:
- Safety and interactions
- Timing optimization
- Synergistic effects
- Evidence-based recommendations
- Practical implementation

Always include medical disclaimers when appropriate.`;

    // Make API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationHistory,
          systemInstruction: {
            parts: [{
              text: customPrompt || defaultPrompt
            }]
          },
          generationConfig: {
            temperature: 0.7,
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

    // Generate follow-up suggestions
    const suggestions = await generateFollowUpSuggestions(message, text, session);

    const responseMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      suggestions,
    };

    return { response: responseMessage, suggestions };
  } catch (error) {
    console.error('Gemini chat error:', error);
    return null;
  }
}

/**
 * Generate 3 relevant follow-up suggestions based on conversation
 */
async function generateFollowUpSuggestions(
  userMessage: string,
  aiResponse: string,
  session: ChatSession
): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) return [];

  try {
    const model = session.model || getSelectedModel();
    
    const prompt = `Based on this conversation:
User: "${userMessage}"
Assistant: "${aiResponse}"

Generate exactly 3 relevant follow-up questions the user might want to ask next. Make them:
- Specific and actionable
- Related to the conversation context
- Helpful for optimizing their stack
- Short (under 12 words each)

Return only the 3 questions, one per line, no numbering or bullets.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return [];
    }

    // Parse suggestions from response
    const suggestions = text
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
      .slice(0, 3);

    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}

/**
 * Create a new chat session with context
 */
export function createChatSession(context: string, model?: GeminiModel): ChatSession {
  return {
    id: `session-${Date.now()}`,
    messages: [],
    context,
    model: model || getSelectedModel(),
    createdAt: Date.now(),
  };
}

/**
 * Add compound search capability to chat
 * Returns compound info that can be added to user's list
 */
export async function searchAndAddCompound(
  compoundName: string,
  session: ChatSession
): Promise<any | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) return null;

  try {
    const model = session.model || getSelectedModel();
    
    const prompt = `Search for this compound/supplement: "${compoundName}"

Provide comprehensive information in JSON format:
{
  "name": "Primary name",
  "aliases": ["brand names", "alternate names"],
  "category": "Category (Nootropic, Supplement, Medication, etc.)",
  "effectType": "Primary effect type",
  "mechanism": "How it works (brief)",
  "dosage": "Typical dosage range",
  "timing": "Best time to take (morning/evening/etc)",
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "sideEffects": ["side effect 1", "side effect 2"],
  "interactions": "Key interactions to be aware of",
  "evidenceLevel": "A-E (strength of evidence)",
  "safetyRating": "1-10 (safety score)",
  "addable": true/false (is this safe to recommend adding?)
}

Be accurate and evidence-based.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return null;
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const compoundData = JSON.parse(jsonMatch[0]);
      return compoundData;
    }

    return null;
  } catch (error) {
    console.error('Compound search error:', error);
    return null;
  }
}

/**
 * Analyze an entire stack and provide comprehensive insights
 */
export async function analyzeStackWithChat(
  stack: {
    name: string;
    compounds: Array<{ name: string; dose: string; timing: string }>;
    goals?: string[];
  },
  model?: GeminiModel
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) return null;

  try {
    const selectedModel = model || getSelectedModel();
    
    const compoundsList = stack.compounds
      .map(c => `- ${c.name} (${c.dose}, ${c.timing})`)
      .join('\n');

    const prompt = `Analyze this supplement/nootropic stack:

Stack Name: ${stack.name}
${stack.goals ? `Goals: ${stack.goals.join(', ')}` : ''}

Compounds:
${compoundsList}

Provide a comprehensive analysis including:

1. **Overall Assessment**
   - Is this stack well-designed?
   - Overall safety rating
   - Likelihood of achieving goals

2. **Synergies & Interactions**
   - Which compounds work well together?
   - Any concerning interactions?
   - Redundant effects?

3. **Timing Optimization**
   - Is the timing optimal?
   - Should anything be moved to different times?
   - Spacing recommendations

4. **Recommendations**
   - What to add for better results
   - What to remove or replace
   - Dosage adjustments

5. **Safety Considerations**
   - Key warnings
   - What to monitor
   - When to consult a doctor

Keep it actionable and evidence-based. Use bullet points for readability.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || null;
  } catch (error) {
    console.error('Stack analysis error:', error);
    return null;
  }
}
