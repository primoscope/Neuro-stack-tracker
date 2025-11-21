// Comprehensive compound/nootropic data model
export interface CompoundDetail {
  id: string;
  name: string;
  aliases: string[]; // Brand names, research codes, alternate names
  effectType: string; // e.g., "Stimulant", "Anxiolytic", "Nootropic"
  primaryEffects: string;
  mechanism: string;
  mechanisticTags: string[]; // e.g., ["ADHD", "Dopamine", "Stimulant"]
  acuteEffect: boolean; // Does it work after one dose?
  onset: OnsetPeakDuration;
  recreational: RecreationalRisk;
  dependenceTolerance: string;
  daytimeNighttime: string; // "Daytime only", "Nighttime", "Either"
  
  // Interactions
  interactions: {
    voxra: string; // Interaction with Bupropion
    ssri: string; // Interaction with Escitalopram
  };
  
  // Evidence
  evidence: {
    strength: string; // A-H letter grade
    summary: string;
  };
  
  // Scores
  efficacyScore: number; // 0-10
  safetyScore: number; // 0-10
  
  // Computed fields
  categoryTags: string[]; // Derived from effectType and mechanisticTags
}

export interface OnsetPeakDuration {
  raw: string; // Raw string from CSV
  onsetMin?: number; // Minutes
  onsetMax?: number;
  peakMin?: number;
  peakMax?: number;
  durationMin?: number;
  durationMax?: number;
}

export type RecreationalRisk = 'No' | 'Low' | 'Mild' | 'Moderate' | 'Yes' | 'High';

// Search index entry
export interface CompoundIndexEntry {
  id: string;
  name: string;
  aliases: string[];
  searchTerms: string[]; // Normalized search terms (lowercase, no special chars)
  effectType: string;
  categoryTags: string[];
}

// Filter options
export interface CompoundFilters {
  query?: string;
  tags?: string[];
  effectTypes?: string[];
}

// Standard category tags derived from mechanistic tags and effect types
export const CATEGORY_TAGS = [
  'Stimulant',
  'Anxiolytic',
  'Wakefulness-promoting',
  'Sleep aid',
  'Antidepressant',
  'Nootropic',
  'Adaptogen',
  'GABAergic',
  'Cholinergic',
  'Dopamine',
  'Serotonin',
  'NMDA',
  'Neuroprotection',
  'ADHD',
  'Non-stimulant',
  'Racetam',
  'Peptide',
  'Herbal',
] as const;

export type CategoryTag = typeof CATEGORY_TAGS[number];
