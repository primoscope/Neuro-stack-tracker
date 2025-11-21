# Gemini AI-Powered Compound Search

## Overview

The Neuro-Stack Tracker now includes AI-powered compound search capabilities using Google's Gemini API. This feature allows users to search for compounds that aren't in the local database by querying the internet for real-time, evidence-based information.

## Features

### 1. Intelligent Hybrid Search
- **Local-First**: Searches the 215-compound local database first for instant results
- **AI Fallback**: Automatically triggers Gemini AI search when:
  - No local results are found (after 1.5 seconds)
  - Query is very specific (>10 characters)
- **Clear Indicators**: AI results are clearly marked with a sparkle icon and "AI" badge

### 2. Comprehensive Compound Information
When Gemini AI finds a compound, it provides:
- **Primary Information**: Name, aliases, brand names
- **Effects & Classification**: Effect type, primary effects, mechanism of action
- **Timing Data**: Onset, peak, and duration
- **Safety Information**: Dependence risk, recreational potential, best timing (day/night)
- **Interactions**: Bupropion (Voxra) and SSRI interactions
- **Evidence**: Letter grade (A-E), evidence summary, references
- **Scores**: Efficacy score (1-30) and safety score (1-10)

### 3. Privacy-First Design
- **Local Storage**: API key stored only in browser's localStorage
- **Direct Connection**: API calls made directly from browser to Google's servers
- **No Server Storage**: No API keys or search data stored on Neuro-Stack servers

## Setup

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with "AIza...")

### Configuring the App

1. Navigate to Settings page
2. Scroll to "AI-Powered Search" section
3. Paste your API key
4. Click "Save Key"
5. Test the connection

## Usage

### Library Page Search
1. Go to the Library page (`/library`)
2. Type a compound name in the search bar
3. If not found locally, wait 1.5 seconds for AI search to activate
4. AI results appear with purple gradient background and sparkle icon
5. Click any result to view detailed information

## API Costs

Gemini API pricing (as of 2024):
- **Free Tier**: 60 requests per minute
- **Typical Search Cost**: ~$0.001 per search (very affordable)

## Privacy & Security

### What Data Is Sent to Google?
- Search query only (e.g., "noopept")
- No personal information
- No user tracking data

### What Data Is Stored?
- **Locally in Browser**: API key (localStorage)
- **Never Stored**: Search queries, results, user identity

## Troubleshooting

### AI Search Not Working
1. Check API key is configured correctly
2. Test connection in Settings
3. Check browser console for errors
4. Verify internet connection

## Support

For issues or questions:
- GitHub Issues: [primoscope/Neuro-stack-tracker](https://github.com/primoscope/Neuro-stack-tracker/issues)
