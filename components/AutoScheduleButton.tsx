"use client";

import { useState } from 'react';
import { Calendar, Loader2, CheckCircle, AlertTriangle, Sun, Sunset, Moon } from 'lucide-react';
import { autoScheduleCompounds, type ScheduleCompound, type ScheduleResult } from '@/lib/gemini-bio-coach';

interface AutoScheduleButtonProps {
  compounds: ScheduleCompound[];
  onScheduleGenerated?: (schedule: ScheduleResult) => void;
  className?: string;
}

/**
 * Auto-Schedule Button - Uses Gemini to automatically organize compounds
 * into Morning, Afternoon, and Evening slots based on pharmacological properties
 */
export default function AutoScheduleButton({
  compounds,
  onScheduleGenerated,
  className = '',
}: AutoScheduleButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleAutoSchedule() {
    if (compounds.length === 0) {
      setError('No compounds to schedule');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await autoScheduleCompounds(compounds);
      
      if (result) {
        setSchedule(result);
        setShowResults(true);
        onScheduleGenerated?.(result);
      } else {
        setError('Unable to generate schedule. Check API configuration.');
      }
    } catch (err) {
      console.error('Auto-schedule error:', err);
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function getTimeIcon(timeOfDay: string) {
    switch (timeOfDay) {
      case 'Morning':
        return Sun;
      case 'Afternoon':
        return Sunset;
      case 'Evening':
        return Moon;
      default:
        return Calendar;
    }
  }

  function getTimeColor(timeOfDay: string) {
    switch (timeOfDay) {
      case 'Morning':
        return 'text-yellow-400';
      case 'Afternoon':
        return 'text-orange-400';
      case 'Evening':
        return 'text-purple-400';
      default:
        return 'text-blue-400';
    }
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-sm text-green-200">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Auto-Schedule Button */}
      <button
        onClick={handleAutoSchedule}
        disabled={isGenerating || compounds.length === 0}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Schedule...</span>
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            <span>Auto-Schedule with AI</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">Error</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Schedule Results */}
      {showResults && schedule && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Optimized Schedule</h3>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {/* Explanation */}
          {schedule.explanation && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-gray-300 leading-relaxed">
                {schedule.explanation}
              </p>
            </div>
          )}

          {/* Schedule Slots */}
          <div className="space-y-4">
            {schedule.schedule.map((slot, idx) => {
              const TimeIcon = getTimeIcon(slot.timeOfDay);
              const timeColor = getTimeColor(slot.timeOfDay);

              return (
                <div
                  key={idx}
                  className="bg-slate-800/70 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-slate-900 rounded-lg ${timeColor}`}>
                      <TimeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{slot.timeOfDay}</h4>
                      <p className="text-xs text-gray-400">{slot.optimalTime}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {slot.compounds.map((compound, cidx) => (
                      <div
                        key={cidx}
                        className="bg-slate-900/50 rounded-lg p-3 border border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {compound.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                {compound.dose}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {compound.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warnings */}
          {schedule.warnings && schedule.warnings.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-300 mb-2">
                    Important Considerations
                  </h4>
                  <ul className="space-y-1">
                    {schedule.warnings.map((warning, idx) => (
                      <li key={idx} className="text-xs text-orange-200/90 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setSuccessMessage('Schedule applied successfully! Create a preset to save it for quick logging.');
                setTimeout(() => setSuccessMessage(null), 5000);
                if (onScheduleGenerated && schedule) {
                  onScheduleGenerated(schedule);
                }
              }}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply Schedule
            </button>
            <button
              onClick={handleAutoSchedule}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
