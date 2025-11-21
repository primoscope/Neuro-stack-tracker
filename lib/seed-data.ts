import { Compound, StackPreset } from './types';

// Pre-populated compounds for the pharmacy
export const seedCompounds: Omit<Compound, 'id' | 'createdAt'>[] = [
  // Prescription Medications
  { name: 'Bupropion (Voxra)', defaultDose: 150, unit: 'mg', colorHex: '#3b82f6', isActive: true },
  { name: 'Escitalopram', defaultDose: 10, unit: 'mg', colorHex: '#8b5cf6', isActive: true },
  { name: 'Buspirone', defaultDose: 10, unit: 'mg', colorHex: '#ec4899', isActive: true },
  { name: 'Silexan', defaultDose: 160, unit: 'mg', colorHex: '#a855f7', isActive: true },
  { name: 'Mirtazapine', defaultDose: 7.5, unit: 'mg', colorHex: '#6366f1', isActive: true },
  { name: 'Hydroxyzine', defaultDose: 25, unit: 'mg', colorHex: '#14b8a6', isActive: true },
  { name: 'Alimemazine', defaultDose: 10, unit: 'mg', colorHex: '#06b6d4', isActive: true },
  { name: 'Inderal (Propranolol)', defaultDose: 30, unit: 'mg', colorHex: '#0ea5e9', isActive: true },
  { name: 'Pregabalin', defaultDose: 150, unit: 'mg', colorHex: '#3b82f6', isActive: true },
  
  // Nootropics & Supplements
  { name: 'Bromantane', defaultDose: 75, unit: 'mg', colorHex: '#10b981', isActive: true },
  { name: 'Temgicoluril (Mebicar)', defaultDose: 300, unit: 'mg', colorHex: '#22c55e', isActive: true },
  { name: 'Emoxypine Succinate', defaultDose: 125, unit: 'mg', colorHex: '#84cc16', isActive: true },
  { name: 'Aniracetam', defaultDose: 750, unit: 'mg', colorHex: '#eab308', isActive: true },
  { name: 'L-Tyrosine', defaultDose: 500, unit: 'mg', colorHex: '#f59e0b', isActive: true },
  { name: 'Huperzine-A', defaultDose: 150, unit: 'mcg', colorHex: '#f97316', isActive: true },
  { name: 'Vitamin D', defaultDose: 1000, unit: 'IU', colorHex: '#fbbf24', isActive: true },
];

// Pre-configured stack presets
export const seedPresets: Omit<StackPreset, 'id' | 'createdAt'>[] = [
  {
    name: 'Morning Stack',
    colorHex: '#3b82f6',
    doseItems: [
      { compoundId: 'bupropion', dose: 150 },
      { compoundId: 'escitalopram', dose: 10 },
      { compoundId: 'buspirone', dose: 10 },
      { compoundId: 'silexan', dose: 160 },
      { compoundId: 'bromantane', dose: 75 },
      { compoundId: 'temgicoluril', dose: 300 },
      { compoundId: 'emoxypine', dose: 125 },
      { compoundId: 'vitamin-d', dose: 1000 },
    ],
  },
  {
    name: 'Midday Stack',
    colorHex: '#10b981',
    doseItems: [
      { compoundId: 'buspirone', dose: 10 },
      { compoundId: 'temgicoluril', dose: 300 },
      { compoundId: 'emoxypine', dose: 125 },
      { compoundId: 'pregabalin', dose: 150 },
    ],
  },
  {
    name: 'Evening/Night Stack',
    colorHex: '#6366f1',
    doseItems: [
      { compoundId: 'buspirone', dose: 10 },
      { compoundId: 'mirtazapine', dose: 7.5 },
      { compoundId: 'pregabalin', dose: 150 },
    ],
  },
  {
    name: 'PRN Anxiety Relief',
    colorHex: '#ec4899',
    doseItems: [
      { compoundId: 'hydroxyzine', dose: 25 },
      { compoundId: 'alimemazine', dose: 10 },
      { compoundId: 'inderal', dose: 30 },
    ],
  },
  {
    name: 'Nootropic Boost',
    colorHex: '#eab308',
    doseItems: [
      { compoundId: 'aniracetam', dose: 750 },
      { compoundId: 'l-tyrosine', dose: 500 },
    ],
  },
];
