# AI Assistant Features

NeuroStack integrates Google's Gemini 3.0 AI to provide intelligent, context-aware assistance throughout the application. The AI features are designed to be proactive, educational, and safety-focused.

## Overview

The AI integration consists of three main features:
1. **Instant Compound Intelligence** - On-demand pharmacological insights
2. **Agentic Stack Builder** - Smart stack optimization recommendations
3. **Global Neuro-Navigator** - Route-aware contextual assistance

## Setup

### API Key Configuration

To enable AI features, you need a Google AI Studio API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment:
   ```bash
   # For local development
   echo "NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here" >> .env.local
   
   # For production (Vercel)
   # Add as environment variable in project settings
   ```

### Supported Models

The app defaults to `gemini-exp-1206` (Gemini 3.0), but supports:
- `gemini-exp-1206` - Gemini 3.0 (recommended)
- `gemini-2.0-flash-exp` - Gemini 2.0 Flash
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

## Features

### 1. Instant Compound Intelligence

**Location**: Library page, compound cards

**How to Use**:
1. Browse the Compound Library
2. Click the purple "AI" button on any compound card
3. View AI-generated insights about the compound

**What You Get**:
- **Mechanism of Action**: How the compound works (simplified)
- **Pharmacokinetics**: Half-life, onset time, duration
- **Interactions**: Potential interactions with your current stack
- **Safety Information**: Important warnings and contraindications

**Technical Details**:
- Uses `getCompoundInsight` server action
- Structured output via Zod schema validation
- Context includes user's current stack and recent logs
- Response time: 2-5 seconds typically

### 2. Agentic Stack Builder

**Location**: Settings > Stack Presets > Create Preset dialog

**How to Use**:
1. Go to Settings
2. Click "Create Stack Preset"
3. Select compounds and configure doses
4. Click "Auto-Optimize Stack"
5. Review AI recommendations

**What You Get**:
- **Safety Warnings**: Critical, moderate, and minor interaction warnings
- **Synergies**: Beneficial compound combinations
- **Timing Suggestions**: Optimal timing for each compound
- **Additions**: Suggested compounds to enhance the stack
- **Overall Assessment**: Summary of stack quality

**Technical Details**:
- Uses `optimizeStackWithGemini` server action
- Structured JSON output with severity/priority levels
- Temperature: 0.4 (balanced creativity/accuracy)
- Response time: 3-8 seconds typically

### 3. Global Neuro-Navigator

**Location**: Floating button (bottom-right corner, all pages)

**How to Use**:
1. Click the purple "AI Navigator" floating button
2. Get context-aware insights for your current page
3. Follow suggestions or explore questions
4. Click "Refresh" for new insights

**Route-Specific Behavior**:

**Dashboard**:
- Analyzes your current streak
- Reviews anxiety/functionality trends
- Suggests logging improvements
- Identifies patterns in recent data

**Analytics**:
- Interprets trend data
- Highlights correlations
- Suggests optimization opportunities
- Identifies data gaps

**Library**:
- Recommends compounds to explore
- Suggests compounds for specific goals
- Educational insights about categories

**Settings**:
- Stack configuration tips
- Compound management suggestions
- Data hygiene recommendations

**Technical Details**:
- Uses `getRouteAwareInsight` server action
- Context built from user data and current route
- Auto-hides if API key not configured
- Response time: 3-6 seconds typically

## Safety & Disclaimers

### Medical Disclaimer

All AI features include prominent disclaimers:

> **This is AI-generated educational information only. It is NOT medical advice. Always consult with qualified healthcare professionals before starting, stopping, or modifying any medication or supplement regimen.**

### Safety-First Design

- **Interaction Warnings**: Critical interactions are clearly flagged
- **Severity Levels**: Color-coded for quick recognition
- **Evidence-Based**: Recommendations grounded in pharmacological principles
- **Conservative Approach**: AI errs on side of caution

### What AI Does NOT Do

- ❌ Diagnose medical conditions
- ❌ Prescribe medications or doses
- ❌ Replace professional medical advice
- ❌ Provide emergency medical guidance
- ❌ Guarantee accuracy (always verify information)

## Architecture

### AI Service Layer (`lib/ai/`)

```
lib/ai/
├── client.ts       # Vercel AI SDK integration
├── types.ts        # TypeScript types and Zod schemas
├── prompts.ts      # Prompt engineering
├── actions.ts      # Server actions
└── index.ts        # Exports
```

### Server Actions

All AI operations use Next.js Server Actions for security:
- API keys never exposed to client
- Type-safe with Zod validation
- Error handling and timeouts
- Cost-aware (uses appropriate temperatures)

### Prompt Engineering

Prompts are carefully designed for:
- **Safety**: Always prioritize user safety
- **Conciseness**: Keep responses under 2048 tokens
- **Structure**: Return parseable JSON when needed
- **Context**: Use user data appropriately
- **Disclaimers**: Include medical warnings

## Cost Considerations

### Token Usage (Approximate)

| Feature | Input Tokens | Output Tokens | Cost/Call* |
|---------|--------------|---------------|------------|
| Compound Intelligence | 300-500 | 400-600 | $0.002 |
| Stack Optimization | 400-700 | 600-1000 | $0.003 |
| Route Navigator | 300-600 | 500-800 | $0.002 |

*Based on Gemini 3.0 pricing (as of Dec 2024)

### Optimization Strategies

1. **Structured Outputs**: Zod schemas reduce token waste
2. **Appropriate Temperatures**: Lower for factual, higher for creative
3. **Context Pruning**: Only send relevant data
4. **Caching**: (Future) Cache common queries

## Troubleshooting

### AI Features Not Appearing

1. **Check API Key**: Ensure `NEXT_PUBLIC_GEMINI_API_KEY` is set
2. **Restart Dev Server**: After adding environment variable
3. **Check Console**: Look for error messages
4. **Verify Key**: Test key in Google AI Studio

### Slow Response Times

1. **Model Selection**: Try `gemini-1.5-flash` for speed
2. **Network**: Check internet connection
3. **API Limits**: You may be rate-limited (wait 60 seconds)

### Errors

**"API key not configured"**
- Add `NEXT_PUBLIC_GEMINI_API_KEY` to environment

**"Failed to generate insight"**
- API key may be invalid or expired
- Rate limit may be exceeded
- Network connectivity issue

**"Parsing error"**
- AI returned unexpected format
- Try refreshing/regenerating
- Check console for details

## Future Enhancements

Potential improvements for future versions:

1. **Conversational Follow-ups**: Chat with the Navigator
2. **Historical Analysis**: Long-term pattern recognition
3. **Personalization**: Learn user preferences over time
4. **Compound Suggestions**: Proactive recommendations
5. **Export Reports**: Generate PDF summaries
6. **Multi-modal**: Image analysis (pill identification)
7. **Voice Input**: Speech-to-text for logging
8. **Predictive Insights**: Forecast trends

## Privacy

- **Data Handling**: User data only sent when explicitly requesting AI features
- **No Training**: Your data is not used to train Google's models
- **API Key Storage**: Stored in environment variables, not in database
- **LocalStorage**: All personal data stays in your browser
- **No Tracking**: AI features don't send analytics

## Best Practices

1. **Verify Information**: Always cross-reference AI suggestions
2. **Start Small**: Test optimizations gradually
3. **Track Results**: Monitor how changes affect you
4. **Consult Professionals**: Especially for prescription medications
5. **Stay Updated**: Keep API key secure, rotate periodically

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/primoscope/Neuro-stack-tracker/issues)
- Review error messages in browser console
- Verify API key configuration
- Test with simple queries first

---

**Remember**: AI is a tool to enhance your tracking experience, not replace medical advice. Use it wisely and always prioritize safety.
