"use client";

import { useState, useEffect } from 'react';
import { Brain, FileText, RefreshCw, Save } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `You are a knowledgeable Bio-Coach AI assistant specializing in pharmacology, nootropics, and supplement optimization.

Your role:
- Provide evidence-based insights on compounds, their interactions, and effects
- Help users optimize their supplement/medication schedules
- Identify potential contraindications and safety concerns
- Suggest improvements to supplement stacks based on pharmacological properties
- Use scientific terminology but remain accessible to non-experts

Always prioritize safety and encourage users to consult healthcare professionals for medical advice.`;

export default function BioCoachConfiguration() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    // Load saved system prompt
    const saved = localStorage.getItem('bio_coach_system_prompt');
    if (saved) {
      setSystemPrompt(saved);
    }
  }, []);

  function handleSave() {
    setSaveStatus('saving');
    localStorage.setItem('bio_coach_system_prompt', systemPrompt);
    
    setTimeout(() => {
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }

  function handleReset() {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setHasChanges(true);
  }

  function handleChange(value: string) {
    setSystemPrompt(value);
    setHasChanges(true);
  }

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 rounded-lg border border-indigo-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-indigo-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Bio-Coach Persona</h3>
            <p className="text-sm text-gray-400">
              Customize how the AI assistant responds to your queries
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* System Prompt Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              System Prompt Override
            </label>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset to Default
            </button>
          </div>
          
          <textarea
            value={systemPrompt}
            onChange={(e) => handleChange(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm leading-relaxed"
            placeholder="Enter custom system prompt..."
          />
          
          <p className="text-xs text-gray-500 mt-2">
            The system prompt defines the AI's personality, expertise, and response style.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="h-4 w-4" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </button>
          
          {hasChanges && saveStatus === 'idle' && (
            <span className="text-sm text-orange-400">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Prompt Examples */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-300">Example Persona Adjustments</h4>
          </div>
          
          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <span className="text-purple-400 font-medium">• Strict & Scientific:</span>
              <p className="ml-4 mt-1">
                "Be precise and academic. Always cite studies. Emphasize safety and contraindications."
              </p>
            </div>
            
            <div>
              <span className="text-green-400 font-medium">• Holistic & Gentle:</span>
              <p className="ml-4 mt-1">
                "Take a holistic approach. Consider lifestyle factors. Be encouraging and supportive."
              </p>
            </div>
            
            <div>
              <span className="text-blue-400 font-medium">• Performance-Focused:</span>
              <p className="ml-4 mt-1">
                "Prioritize cognitive enhancement and performance. Focus on synergistic combinations."
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-blue-400">How it works:</strong> The system prompt is sent 
            with every Bio-Coach AI request to define its behavior. Changes take effect immediately 
            for new conversations. This setting is stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
