import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Compound, StackPreset, LogEntry, DoseItem } from '@/lib/types';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      pin: null,
      isAuthenticated: false,
      compounds: [],
      stackPresets: [],
      logEntries: [],
      settings: {
        geminiApiKey: '',
        theme: 'cyberpunk',
      },

      // Auth Actions
      setPin: (pin: string) => {
        set({ pin, isAuthenticated: true });
      },

      authenticate: (pin: string) => {
        const { pin: storedPin } = get();
        if (storedPin === pin) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      // Compound Actions
      addCompound: (compound) => {
        const newCompound: Compound = {
          ...compound,
          id: `compound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          compounds: [...state.compounds, newCompound],
        }));
      },

      updateCompound: (id, updates) => {
        set((state) => ({
          compounds: state.compounds.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCompound: (id) => {
        set((state) => ({
          compounds: state.compounds.filter((c) => c.id !== id),
          // Remove compound from presets
          stackPresets: state.stackPresets.map((preset) => ({
            ...preset,
            doseItems: preset.doseItems.filter((item) => item.compoundId !== id),
          })),
          // Remove compound from logs
          logEntries: state.logEntries.map((log) => ({
            ...log,
            doseItems: log.doseItems.filter((item) => item.compoundId !== id),
          })),
        }));
      },

      // Preset Actions
      addPreset: (preset) => {
        const newPreset: StackPreset = {
          ...preset,
          id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          stackPresets: [...state.stackPresets, newPreset],
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          stackPresets: state.stackPresets.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          stackPresets: state.stackPresets.filter((p) => p.id !== id),
        }));
      },

      // Log Actions
      addLog: (log) => {
        const newLog: LogEntry = {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          logEntries: [...state.logEntries, newLog],
        }));
      },

      updateLog: (id, updates) => {
        set((state) => ({
          logEntries: state.logEntries.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      deleteLog: (id) => {
        set((state) => ({
          logEntries: state.logEntries.filter((l) => l.id !== id),
        }));
      },

      logPreset: (presetId, anxiety, functionality, notes = '') => {
        const { stackPresets } = get();
        const preset = stackPresets.find((p) => p.id === presetId);
        
        if (!preset) return;

        const now = Date.now();
        const date = new Date(now).toISOString().split('T')[0];

        const doseItems: DoseItem[] = preset.doseItems.map((item) => ({
          compoundId: item.compoundId,
          dose: item.dose,
          timestamp: now,
        }));

        const newLog: LogEntry = {
          id: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
          date,
          timestamp: now,
          doseItems,
          anxiety,
          functionality,
          notes,
          presetId,
        };

        set((state) => ({
          logEntries: [...state.logEntries, newLog],
        }));
      },

      // Data Management
      importData: (data) => {
        set((state) => ({
          ...state,
          ...data,
        }));
      },

      exportData: () => {
        const { compounds, stackPresets, logEntries, settings } = get();
        return {
          compounds,
          stackPresets,
          logEntries,
          settings,
        };
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
    }),
    {
      name: 'neurostack-storage',
    }
  )
);
