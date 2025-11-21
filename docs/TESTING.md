# Testing Guide

This document outlines the testing procedures for the NeuroStack app, focusing on the Gemini API integration, mobile UI, and new features.

## Prerequisites

- Node.js 18+ installed
- Valid Gemini API key from https://aistudio.google.com/apikey
- Modern browser (Chrome, Firefox, Safari, Edge)
- Mobile device or browser dev tools for mobile testing

## 1. Gemini API Testing

### 1.1 Local Development Testing

**Setup:**
```bash
# Create .env.local with your API key
echo "GEMINI_API_KEY=your_actual_key_here" > .env.local

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Test Cases:**

#### Test 1: Valid API Key - Test Connection
1. Navigate to http://localhost:3000/settings
2. Scroll to "AI-Powered Search" section
3. Click **"Test Connection"** button

**Expected Result:**
- ✅ Green success message appears
- ✅ Message reads: `System Online: Connected to gemini-2.5-flash`
- ✅ No errors in browser console
- ✅ No errors in terminal/server logs

#### Test 2: Invalid API Key
1. In Settings > AI, click "Remove" (if configured)
2. Enter an invalid key like `test123`
3. Click "Save Key"
4. Click "Test Connection"

**Expected Result:**
- ❌ Red error message appears
- ❌ Error indicates "Invalid API key" or similar
- ❌ Status code shown (likely 403 or 400)
- ✅ App doesn't crash

#### Test 3: List Available Models
1. Configure valid API key
2. Click **"List Available Models"** button

**Expected Result:**
- ✅ JSON data appears in expandable panel
- ✅ Shows at least 2-3 Gemini models
- ✅ Each model has: `name`, `displayName`, `description`
- ✅ Example models: `gemini-2.5-flash`, `gemini-2.5-pro`

#### Test 4: No API Key Configured
1. Remove API key if configured
2. Try clicking "Test Connection" (should be disabled)

**Expected Result:**
- ⚠️ Button should require key to be saved first
- ⚠️ Helpful message about setting API key

### 1.2 Vercel Deployment Testing

**Setup:**
1. Deploy app to Vercel
2. Add `GEMINI_API_KEY` in Vercel dashboard:
   - Settings > Environment Variables
   - Add variable for Production, Preview, and Development
3. Redeploy

**Test Cases:**

#### Test 5: Production Test Connection
1. Visit your deployed app URL
2. Navigate to Settings > AI
3. Click "Test Connection"

**Expected Result:**
- ✅ Same as Test 1 (green success message)
- ✅ No CORS errors in browser console
- ✅ Network tab shows requests go to your domain (not googleapis.com directly)

#### Test 6: Check Server Logs
1. In Vercel dashboard, go to Functions > Logs
2. Trigger "Test Connection" in app
3. Check logs for server-side output

**Expected Result:**
- ✅ See server-side log entries
- ✅ No exposed API keys in logs
- ✅ Successful request logs if key is valid

## 2. Mobile UI Testing

### 2.1 Responsive Viewport Tests

**Setup:**
```bash
# Start dev server
npm run dev
```

**Test Viewports:**
- iPhone SE (375x667)
- iPhone 13 (390x844)
- Pixel 5 (393x851)
- iPad Mini (768x1024)
- Galaxy Fold (280x653 - extreme case)

**Using Chrome Dev Tools:**
1. Open http://localhost:3000
2. Press F12 or Cmd+Option+I
3. Click device toolbar icon (or Cmd+Shift+M)
4. Select device from dropdown

#### Test 7: Dashboard Layout (Mobile)
**Viewport:** iPhone SE (375px width)

1. Navigate to Dashboard (/)
2. Check metrics cards
3. Scroll through page

**Expected Result:**
- ✅ No horizontal scrolling
- ✅ All cards fit within viewport width
- ✅ Text is readable (not too small)
- ✅ Buttons are tappable (min 44px height)
- ✅ Content doesn't overflow containers

#### Test 8: Settings Page (Mobile)
**Viewport:** iPhone 13 (390px width)

1. Navigate to /settings
2. Scroll through all sections
3. Try expanding/collapsing sections

**Expected Result:**
- ✅ No horizontal scrolling
- ✅ Compound cards don't clip text
- ✅ Action buttons (Edit/Delete) always visible
- ✅ All buttons are tappable (44px minimum)
- ✅ Input fields fit viewport

#### Test 9: Library Page (Mobile)
**Viewport:** Pixel 5 (393px width)

1. Navigate to /library
2. Scroll through compound cards
3. Click on a compound to view details

**Expected Result:**
- ✅ Compound cards display full content
- ✅ Name, category tags visible
- ✅ No text clipping
- ✅ Touch targets adequate size
- ✅ Modal/details view fits screen

#### Test 10: Touch Target Sizes
**Viewport:** Any mobile

1. Navigate to Settings > AI
2. Try tapping all buttons

**Expected Result:**
- ✅ All buttons min 44px height (WCAG guideline)
- ✅ Easy to tap without misclicks
- ✅ Adequate spacing between buttons
- ✅ Buttons have visual pressed state

### 2.2 Orientation Testing

#### Test 11: Portrait to Landscape
1. Use mobile device viewport
2. Start in portrait mode
3. Rotate to landscape (Dev tools rotate icon)

**Expected Result:**
- ✅ Layout adapts smoothly
- ✅ No content hidden or clipped
- ✅ Readable and usable in both orientations

## 3. Global Compound Search Testing

### 3.1 Search Functionality

#### Test 12: Basic Search
1. Navigate to where GlobalCompoundSearch is used
2. Type "Caff" in search box

**Expected Result:**
- ✅ "Caffeine" appears in results
- ✅ Search is case-insensitive
- ✅ Results update in real-time as you type
- ✅ Shows result count

#### Test 13: Search by Category
1. Type "stimulant" in search

**Expected Result:**
- ✅ Shows all stimulant compounds
- ✅ Caffeine, Bromantane, Nicotine, etc. appear

#### Test 14: Search by Keyword
1. Type "sleep" in search

**Expected Result:**
- ✅ Shows compounds with "sleep" in notes
- ✅ Melatonin, Glycine, Magnesium, etc. appear

#### Test 15: No Results
1. Type "xyz123notreal"

**Expected Result:**
- ✅ Shows "No compounds found" message
- ✅ Helpful text: "Try a different search term"
- ✅ No errors or crashes

#### Test 16: Performance
1. Clear search (empty query)
2. Observe initial load

**Expected Result:**
- ✅ Shows first 20 compounds quickly
- ✅ Total count shows 100+
- ✅ Smooth scrolling in results

### 3.2 Selection & Integration

#### Test 17: Select Compound
1. Search for "L-Theanine"
2. Click on the result

**Expected Result:**
- ✅ `onSelect` callback fires
- ✅ Compound data passed correctly
- ✅ Includes: id, name, category, defaultDosage, notes

## 4. Build & Lint Testing

### 4.1 Build Tests

#### Test 18: Production Build
```bash
npm run build
```

**Expected Result:**
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build completes successfully
- ✅ All pages compile
- ✅ See: `Route (app)` list with all pages

#### Test 19: Type Checking
```bash
npx tsc --noEmit
```

**Expected Result:**
- ✅ No type errors
- ✅ All imports resolve correctly

#### Test 20: Lint
```bash
npm run lint
```

**Expected Result:**
- ✅ No linting errors
- ✅ No unused variables
- ✅ Consistent code style

## 5. Security Testing

### 5.1 API Key Security

#### Test 21: Check for Exposed Keys
1. Build production app
2. Open browser dev tools > Sources
3. Search all files for "AIza" (API key prefix)

**Expected Result:**
- ❌ No API keys in client-side JavaScript
- ✅ All API calls go through server actions
- ✅ Keys only in environment variables

#### Test 22: Network Inspection
1. Open Network tab in dev tools
2. Trigger "Test Connection"
3. Inspect request headers and URLs

**Expected Result:**
- ✅ API calls go to your domain (not googleapis.com directly)
- ✅ API key not visible in Network tab
- ✅ Server-side requests handle authentication

## 6. Regression Testing

### 6.1 Existing Features

#### Test 23: Compound Management
1. Navigate to Settings
2. Add a new compound
3. Edit it
4. Delete it

**Expected Result:**
- ✅ All CRUD operations work
- ✅ Data persists in localStorage
- ✅ No errors or crashes

#### Test 24: Stack Presets
1. Create a new stack preset
2. Add compounds to it
3. Use it for quick logging

**Expected Result:**
- ✅ Presets save correctly
- ✅ Quick log works
- ✅ No functionality broken

#### Test 25: Data Export/Import
1. Export data
2. Clear data
3. Import previously exported data

**Expected Result:**
- ✅ Export creates valid JSON
- ✅ Import restores all data
- ✅ No data loss

## Test Results Template

Use this template to document your test results:

```markdown
## Test Results - [Date]

### Environment
- Browser: [Chrome 120 / Firefox 121 / Safari 17]
- OS: [macOS 14 / Windows 11 / iOS 17]
- App Version: [commit hash or version number]

### Gemini API Tests
- [ ] Test 1: Valid API Key - Test Connection
- [ ] Test 2: Invalid API Key
- [ ] Test 3: List Available Models
- [ ] Test 4: No API Key Configured
- [ ] Test 5: Production Test Connection
- [ ] Test 6: Check Server Logs

### Mobile UI Tests
- [ ] Test 7: Dashboard Layout (Mobile)
- [ ] Test 8: Settings Page (Mobile)
- [ ] Test 9: Library Page (Mobile)
- [ ] Test 10: Touch Target Sizes
- [ ] Test 11: Portrait to Landscape

### Search Tests
- [ ] Test 12: Basic Search
- [ ] Test 13: Search by Category
- [ ] Test 14: Search by Keyword
- [ ] Test 15: No Results
- [ ] Test 16: Performance
- [ ] Test 17: Select Compound

### Build Tests
- [ ] Test 18: Production Build
- [ ] Test 19: Type Checking
- [ ] Test 20: Lint

### Security Tests
- [ ] Test 21: Check for Exposed Keys
- [ ] Test 22: Network Inspection

### Regression Tests
- [ ] Test 23: Compound Management
- [ ] Test 24: Stack Presets
- [ ] Test 25: Data Export/Import

### Issues Found
[List any issues discovered during testing]

### Notes
[Any additional observations or concerns]
```

## Continuous Integration

For CI/CD pipelines, run:

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build

# All checks must pass before merging
```

## Reporting Issues

When reporting issues, include:
1. Test number and name
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots (especially for UI issues)
5. Browser console errors
6. Server logs (if applicable)
7. Device/viewport used
