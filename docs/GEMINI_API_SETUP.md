# Gemini API Setup Guide

This guide explains how to configure and use the Gemini AI features in NeuroStack.

## Overview

NeuroStack integrates Google's **Gemini 3.0** AI models for:
- **Test Connection**: Validate your API key works
- **List Available Models**: Debug which models your key can access
- **Stack Analysis**: AI-powered compound interaction and safety analysis (coming soon)
- **Compound Search**: AI-enhanced compound information lookup

## Model Configuration

We use the following models (November 2025 release):

| Model ID | Purpose | Tier | Description |
|----------|---------|------|-------------|
| `gemini-2.5-flash` | Test & Quick Queries | Free | Fast, reliable, guaranteed response |
| `gemini-3.0-pro-preview` | Deep Analysis | Varies | Latest with agentic reasoning (auto-fallback to 2.5-pro if unavailable) |
| `gemini-2.5-pro` | General Purpose | Free | Most powerful on free tier, stable |

### Official Documentation
- **Gemini 3.0 Developer Guide**: https://ai.google.dev/gemini-api/docs/gemini-3
- **Model Reference**: https://ai.google.dev/gemini-api/docs/models
- **Model Card (PDF)**: https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf
- **Migration Guide**: https://ai.google.dev/gemini-api/docs/migrate

## Setup Instructions

### 1. Get Your API Key

1. Visit https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. **⚠️ IMPORTANT**: Copy your key immediately and store it securely

### 2. Configure Environment Variable

**Local Development:**
```bash
# Create .env.local file in project root
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env.local
```

**Vercel Deployment:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add: `GEMINI_API_KEY` = `your_actual_api_key_here`
4. Redeploy your app

**⚠️ Security Notes:**
- Use `GEMINI_API_KEY` (NOT `NEXT_PUBLIC_GEMINI_API_KEY`)
- The `NEXT_PUBLIC_` prefix exposes keys to the browser (insecure!)
- Our implementation keeps all API calls server-side only
- Never commit `.env.local` to git (already in `.gitignore`)

### 3. Test Your Configuration

1. Open your app
2. Navigate to **Settings > AI Configuration**
3. Click **"Test Connection"**
   - ✅ Success: You should see `System Online: Connected to gemini-2.5-flash`
   - ❌ Failure: Check the error message for details

4. Click **"List Available Models"** to see which models your key can access

## Features

### Test Connection Button
Tests your API key with a simple prompt using `gemini-2.5-flash` (fastest model).

**Expected Response:**
```
✅ System Online: Connected to gemini-2.5-flash
```

**Common Errors:**
- `API key not configured`: Set `GEMINI_API_KEY` in `.env.local`
- `Invalid API key`: Check your key at https://aistudio.google.com/apikey
- `Permission denied (403)`: Your key may not have access to Gemini models
- `Model not found (404)`: Model unavailable or incorrect model ID

### List Available Models
Calls the official `models.list` endpoint to show exactly which models your API key can access.

**Why this is useful:**
- Debugging: See if you have access to Gemini 3.0
- Verification: Confirm your key works with multiple models
- Planning: Know which models are available for development

**Example Output:**
```json
[
  {
    "name": "gemini-2.5-flash",
    "displayName": "Gemini 2.5 Flash",
    "supportedGenerationMethods": ["generateContent", "streamGenerateContent"]
  },
  {
    "name": "gemini-2.5-pro",
    "displayName": "Gemini 2.5 Pro",
    "supportedGenerationMethods": ["generateContent", "streamGenerateContent"]
  }
]
```

### Stack Analysis (Coming Soon)
Uses `gemini-3.0-pro-preview` for deep compound interaction analysis:
- Safety assessment
- Interaction warnings
- Timing optimization
- Dosage recommendations

**Automatic Fallback:**
If Gemini 3.0 returns 404 (waitlist/unavailable), the system automatically falls back to `gemini-2.5-pro`.

## API Usage

### Server Actions

All Gemini API calls are handled server-side via Next.js Server Actions in `app/actions/gemini.ts`:

```typescript
import { testGeminiConnection, listGeminiModels, analyzeStack } from '@/app/actions/gemini';

// Test connection
const result = await testGeminiConnection();
// or with override key:
const result = await testGeminiConnection('your-temp-key');

// List models
const models = await listGeminiModels();

// Analyze stack (coming soon)
const analysis = await analyzeStack({
  compounds: [
    { name: 'Caffeine', dose: '200mg', timing: 'morning' },
    { name: 'L-Theanine', dose: '200mg', timing: 'morning' }
  ],
  userGoals: ['focus', 'calm energy']
});
```

### Configuration

Model selection is centralized in `lib/geminiConfig.ts`:

```typescript
import { GEMINI_MODELS, getModelForUseCase } from '@/lib/geminiConfig';

// Get fast model for testing
const testModel = GEMINI_MODELS.FAST; // 'gemini-2.5-flash'

// Get reasoning model for analysis
const analysisModel = GEMINI_MODELS.REASONING; // 'gemini-3.0-pro-preview'

// Get model by use case
const model = getModelForUseCase('test'); // Returns appropriate model
```

## Troubleshooting

### Problem: Test Connection Always Fails

**Solution:**
1. Check `.env.local` exists with correct key
2. Restart dev server after adding `.env.local`
3. Verify key at https://aistudio.google.com/apikey
4. Check browser console and server logs for detailed errors

### Problem: "Model not found" Error

**Solution:**
- Gemini 3.0 may be in waitlist - this is normal
- System automatically falls back to Gemini 2.5 Pro
- Use "List Available Models" to see what you have access to

### Problem: API Key Works in Browser but not in Vercel

**Solution:**
1. Ensure you added `GEMINI_API_KEY` in Vercel dashboard (not in code)
2. Redeploy after adding the environment variable
3. Check Vercel function logs for errors

### Problem: CORS Errors in Browser

**Solution:**
- This means client-side code is trying to call Gemini directly
- All calls should go through server actions (`app/actions/gemini.ts`)
- Never use `NEXT_PUBLIC_GEMINI_API_KEY`

## Rate Limits & Quotas

**Free Tier (as of November 2025):**
- Gemini 2.5 Flash: 15 requests per minute
- Gemini 2.5 Pro: 2 requests per minute
- Gemini 3.0 Pro Preview: Varies (may require paid tier)

**Best Practices:**
- Use `gemini-2.5-flash` for testing/quick queries
- Reserve `gemini-3.0-pro-preview` for complex analysis
- Implement client-side debouncing for search features
- Cache results when appropriate

## Security Best Practices

✅ **DO:**
- Use `GEMINI_API_KEY` environment variable
- Keep API calls server-side only
- Use `.env.local` for local development
- Add `GEMINI_API_KEY` in Vercel dashboard for production
- Revoke and regenerate keys if accidentally exposed

❌ **DON'T:**
- Use `NEXT_PUBLIC_` prefix for API keys
- Commit API keys to git
- Share keys in chat, issues, or pull requests
- Call Gemini API directly from client components
- Store keys in localStorage or cookies

## Support & Resources

- **Google AI Studio**: https://aistudio.google.com/
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **Gemini 3.0 Guide**: https://ai.google.dev/gemini-api/docs/gemini-3
- **API Status Dashboard**: https://status.cloud.google.com/
- **Community Forum**: https://discuss.ai.google.dev/c/gemini-api/

## Changelog

### v2.0.0 (November 2025)
- ✨ Migrated to Gemini 3.0 API
- ✨ Added Test Connection feature
- ✨ Added List Available Models debug tool
- ✨ Server-side API calls for security
- ✨ Automatic fallback from 3.0 to 2.5
- 📚 Updated all model IDs to latest stable versions
- 🔒 Removed client-side API key exposure

### v1.0.0 (Previous)
- ⚠️ Used deprecated `gemini-pro` model
- ⚠️ Client-side API calls (CORS issues)
- ⚠️ No test button functionality
