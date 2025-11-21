// Compound/Supplement in the user's pharmacy
export interface Compound {
  id: string;
  name: string;
  defaultDose: number;
  unit: 'mg' | 'ml' | 'g' | 'pills' | 'mcg' | 'IU';
  colorHex: string;
  isActive: boolean;
  createdAt: number;
}

// Individual dose item in a log entry
export interface DoseItem {
  compoundId: string;
  dose: number;
  timestamp: number;
}

// A preset stack combining multiple compounds
export interface StackPreset {
  id: string;
  name: string;
  doseItems: Array<{
    compoundId: string;
    dose: number;
  }>;
  colorHex: string;
  createdAt: number;
}

// Log entry for a specific time
export interface LogEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp: number;
  doseItems: DoseItem[];
  anxiety: number; // 1-10
  functionality: number; // 1-10
  notes: string;
  presetId?: string; // If logged via a preset
}

export interface AppSettings {
  geminiApiKey: string;
  theme: 'cyberpunk' | 'clinical';
}

export interface AppState {
  pin: string | null;
  isAuthenticated: boolean;
  compounds: Compound[];
  stackPresets: StackPreset[];
  logEntries: LogEntry[];
  settings: AppSettings;
  
  // Auth Actions
  setPin: (pin: string) => void;
  authenticate: (pin: string) => boolean;
  logout: () => void;
  
  // Compound Actions
  addCompound: (compound: Omit<Compound, 'id' | 'createdAt'>) => void;
  updateCompound: (id: string, compound: Partial<Compound>) => void;
  deleteCompound: (id: string) => void;
  
  // Preset Actions
  addPreset: (preset: Omit<StackPreset, 'id' | 'createdAt'>) => void;
  updatePreset: (id: string, preset: Partial<StackPreset>) => void;
  deletePreset: (id: string) => void;
  
  // Log Actions
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  updateLog: (id: string, log: Partial<LogEntry>) => void;
  deleteLog: (id: string) => void;
  logPreset: (presetId: string, anxiety: number, functionality: number, notes?: string) => void;
  
  // Data Management
  importData: (data: Partial<{
    compounds: Compound[];
    stackPresets: StackPreset[];
    logEntries: LogEntry[];
    settings: AppSettings;
  }>) => void;
  exportData: () => {
    compounds: Compound[];
    stackPresets: StackPreset[];
    logEntries: LogEntry[];
    settings: AppSettings;
  };
  updateSettings: (settings: Partial<AppSettings>) => void;
}
