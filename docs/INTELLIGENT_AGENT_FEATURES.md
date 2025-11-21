# Intelligent Neuro-Stack Agent Features

## Overview

The Neuro-Stack Tracker has been upgraded with AI-powered intelligence using Google's Gemini 3.0. This document describes the new features and how to use them.

## Features

### 1. Pharmacokinetic Engine ("The Neuro-Curve")

**Location:** `lib/pharmacokinetics.ts`

The pharmacokinetic engine models how compounds behave in the body over time, visualizing their absorption, peak concentration, and elimination.

#### Key Concepts

- **Onset**: Time until effects begin (default: 30 minutes for oral drugs)
- **Peak**: Time of maximum concentration (typically 2x onset time)
- **Duration**: Total time of measurable effects (typically 3x peak time)

#### How It Works

The engine uses a **bi-exponential model**:

1. **Absorption Phase** (onset to peak):
   - Exponential rise from 0% to 100% concentration
   - Models realistic drug absorption kinetics
   - Reaches 20% at onset time

2. **Elimination Phase** (peak to duration):
   - First-order kinetic elimination
   - Exponential decay following peak
   - Models realistic drug clearance

3. **Residual Phase** (after duration):
   - Slow tail-off representing final elimination
   - Prevents abrupt drops to zero

#### API

```typescript
// Calculate profile for a single compound
const profile = calculatePharmacokineticProfile(
  compound,      // CompoundDetail object
  doseTime,      // Timestamp when taken (default: now)
  resolution     // Minutes between data points (default: 15)
);

// Calculate composite load for multiple compounds
const composite = calculateCompositeLoad(profiles);

// Check if two compounds overlap
const overlaps = checkOverlap(profile1, profile2, threshold);
```

### 2. StackTimeline Visualization

**Location:** `components/StackTimeline.tsx`

A responsive chart component that displays pharmacokinetic curves for multiple compounds.

#### Features

- **Composite Load Chart**: Shows aggregate effect of all compounds
- **Individual Curves**: Separate line for each compound
- **Interactive Tooltips**: Hover to see exact concentrations
- **Color-Coded Legend**: Each compound has a unique color
- **Timing Information**: Displays onset, peak, and duration for each compound

#### Usage

```tsx
<StackTimeline 
  compounds={[
    {
      compound: compoundDetail,
      doseTime: Date.now(),
      colorHex: '#3b82f6',
    },
  ]}
  showComposite={true}
  height={400}
/>
```

#### Interpretation

- **Y-axis**: Relative plasma concentration (0-100%)
- **X-axis**: Time in hours (24-hour view)
- **Composite curve**: Sum of all individual concentrations
- **Peak overlap**: Multiple compounds peaking simultaneously may intensify effects

### 3. Stack Optimization (Bio-Sync)

**Location:** `components/StackOptimizer.tsx`, `app/api/stack/optimize/route.ts`

AI-powered stack reordering based on chronopharmacology and interactions.

#### How It Works

1. User clicks "Optimize Stack"
2. Current stack is sent to Gemini 3.0
3. AI analyzes:
   - Effect types (stimulant, sedative, etc.)
   - Timing optimization (AM vs PM)
   - Synergistic effects
   - Interaction risks
4. Returns optimized order with rationale

#### Optimization Criteria

- **Chronopharmacology**: Stimulants in morning, sedatives in evening
- **Synergies**: Group compounds that work well together
- **Interactions**: Separate potentially conflicting compounds
- **Spacing**: Optimal time between doses for absorption

#### Usage

```tsx
<StackOptimizer
  compounds={stackItems}
  goals={['Focus', 'Calm', 'Better Sleep']}
  onOptimizedStack={(optimized, changes) => {
    // Apply the optimized stack
  }}
/>
```

#### API Response

```json
{
  "optimizedCompounds": [
    {
      "id": "...",
      "name": "Caffeine",
      "dose": "200mg",
      "timing": "8:00 AM",
      "effectType": "Stimulant"
    }
  ],
  "rationale": "Reordered to maximize alertness during work hours...",
  "changes": [
    {
      "compound": "Caffeine",
      "change": "Moved to 8:00 AM",
      "reason": "Optimal timing for morning alertness"
    }
  ]
}
```

### 4. Enhanced Compound Details

**Location:** `components/CompoundDetail.tsx`

The compound detail modal now includes:

#### Safety Rating Visualization

- **Visual scale**: 1-10 with color coding
- **Green (8-10)**: Generally safe with proper usage
- **Yellow (6-7)**: Use with caution, monitor effects
- **Red (<6)**: Higher risk, medical supervision recommended

#### Stack Interaction Checking

When viewing a compound, the modal checks your current stack for:

- **Stimulant stacking**: Multiple stimulants (excessive CNS stimulation)
- **Sedative stacking**: Multiple sedatives (excessive sedation)
- **Mechanistic overlap**: Compounds with similar mechanisms

Example alert:
```
⚠ Potential Interactions with Your Stack:
• Caffeine: Both are stimulants - may cause excessive CNS stimulation
```

#### Usage

```tsx
<CompoundDetail
  compound={selectedCompound}
  open={isOpen}
  onOpenChange={setIsOpen}
  userStack={currentStackCompounds} // For interaction checking
/>
```

### 5. Natural Language Search

**Location:** `lib/natural-language-search.ts`

Parses natural language queries to improve search results.

#### Intent Detection

- **Search**: "caffeine", "l-theanine"
- **Recommendation**: "best nootropic for focus", "help with anxiety"
- **Explanation**: "what is alpha-gpc", "how does modafinil work"

#### Automatic Extraction

- **Effect types**: Detects "stimulant", "anxiety", "sleep", etc.
- **Tags**: Extracts "dopamine", "serotonin", "ADHD", etc.
- **Keywords**: Filters stop words, keeps meaningful terms

#### Usage

```typescript
const parsed = parseNaturalLanguageQuery("best nootropic for focus");
// {
//   intent: 'recommendation',
//   filters: {
//     effectTypes: ['Nootropic'],
//     tags: ['Cognitive']
//   },
//   useAI: true
// }
```

### 6. Smart Chat with Action Chips

**Location:** `components/GeminiChatBox.tsx`, `lib/gemini-chat.ts`

Enhanced conversational interface with clickable action suggestions.

#### Features

- **Context-aware**: Always has current stack information
- **Action chips**: 3 clickable suggestions after each response
- **Conversation history**: Maintains context across messages
- **Actionable prompts**: Suggestions like "Add Alpha-GPC 300mg", "Check interactions"

#### Suggestion Types

1. **Questions**: "Why is choline important?"
2. **Actions**: "Add Magnesium 400mg"
3. **Checks**: "Show timing conflicts"

#### Usage

```tsx
<GeminiChatBox
  context={`Stack: Morning Focus\nCompounds: ${compoundsList}`}
  title="Chat about your stack"
  onClose={() => setShowChat(false)}
/>
```

### 7. Comprehensive Stack Analysis

**Location:** `components/StackInsightsPanel.tsx`

All-in-one analysis panel combining multiple AI features:

- Stack analysis with Gemini
- Compound search and add
- Timing optimization recommendations
- Safety considerations

## Configuration

### Environment Variables

```bash
# Required for all AI features
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here

# Or server-side only
GEMINI_API_KEY=your_api_key_here
```

### Model Selection

Default model: `gemini-exp-1206` (Gemini 3.0)

Available models:
- `gemini-exp-1206` - Gemini 3.0 (recommended)
- `gemini-2.0-flash-exp` - Gemini 2.0 Flash
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

## Best Practices

### 1. Pharmacokinetic Visualization

- Use for planning timing of multiple compounds
- Look for peak overlaps that might cause issues
- Consider spacing doses to avoid interactions

### 2. Stack Optimization

- Run optimization before making major stack changes
- Review rationale carefully - AI isn't always perfect
- Consider your personal response patterns

### 3. Interaction Checking

- Always check interactions before adding new compounds
- Pay attention to mechanistic overlaps
- Consult healthcare professionals for serious concerns

### 4. Natural Language Search

- Be specific: "nootropic for memory" vs. just "memory"
- Use medical/scientific terms when possible
- Try multiple phrasings if first search doesn't work

### 5. Chat Interface

- Provide context about your goals
- Click suggestion chips to explore related topics
- Ask follow-up questions to dig deeper

## Technical Details

### Pharmacokinetic Model Constants

```typescript
DEFAULT_ONSET_MINUTES = 30;          // Typical oral drug onset
DEFAULT_PEAK_MULTIPLIER = 2;         // Peak at 2x onset time
DEFAULT_DURATION_MULTIPLIER = 3;     // Duration at 3x peak time
ONSET_CONCENTRATION_PERCENT = 20;    // 20% at onset
```

### API Rate Limits

- Gemini API: Standard rate limits apply
- Automatic debouncing: 1.5s for search
- Suggestion generation: 150 tokens max

### Data Sources

- **Compound Library**: 215 compounds from `data/compounds-master.csv`
- **Pharmacokinetic Data**: Extracted from "Onset/Peak/Duration" column
- **Evidence Grades**: A-E scale based on research quality

## Troubleshooting

### "Gemini API not configured"

Set the `NEXT_PUBLIC_GEMINI_API_KEY` or `GEMINI_API_KEY` environment variable.

### Timeline shows flat lines

Compound may be missing pharmacokinetic data. Check `compound.onset` values.

### Optimization returns generic suggestions

Try adding more compounds (minimum 3-5 recommended) or specify clearer goals.

### Suggestions not appearing in chat

Check browser console for errors. May be API rate limiting or network issues.

## Future Enhancements

Potential future features:

- [ ] Image recognition for supplement labels (Gemini Vision)
- [ ] Personalized recommendations based on history
- [ ] Drug interaction database integration
- [ ] Real-time concentration tracking
- [ ] Genetic data integration (CYP450 metabolism)

## Support

For issues or questions:

1. Check this documentation
2. Review existing GitHub issues
3. Open a new issue with:
   - Feature being used
   - Steps to reproduce
   - Expected vs. actual behavior
   - Console errors (if any)

## Credits

- **Pharmacokinetic Model**: Based on standard PK/PD principles
- **Compound Data**: Curated from scientific literature
- **AI Engine**: Google Gemini 3.0
- **Visualization**: Recharts library

## License

MIT License - See LICENSE file for details
