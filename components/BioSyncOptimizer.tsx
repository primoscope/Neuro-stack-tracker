"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { optimizeScheduleWithGemini, type BioSyncResult } from "@/lib/gemini-bio-sync";
import { Compound, DoseItem } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BioSyncOptimizerProps {
  compounds: Compound[];
  currentDoses: DoseItem[];
  onApplySchedule?: (optimizedSchedule: BioSyncResult) => void;
}

/**
 * BioSyncOptimizer - Auto-optimize schedule based on chronopharmacology
 * Uses Gemini to reorder compounds for optimal timing
 */
export function BioSyncOptimizer({
  compounds,
  currentDoses,
  onApplySchedule,
}: BioSyncOptimizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<BioSyncResult | null>(null);
  const [error, setError] = useState<string>("");

  async function handleOptimize() {
    setIsOptimizing(true);
    setError("");
    setResult(null);

    try {
      // Build compound list with current timing
      const compoundList = currentDoses.map((dose) => {
        const compound = compounds.find((c) => c.id === dose.compoundId);
        if (!compound) return null;

        const currentTime = new Date(dose.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: compound.id,
          name: compound.name,
          currentTime,
          dose: `${dose.dose}${compound.unit}`,
        };
      }).filter(Boolean) as Array<{ id: string; name: string; currentTime: string; dose: string }>;

      if (compoundList.length === 0) {
        setError("No active compounds to optimize");
        setIsOptimizing(false);
        return;
      }

      const optimizationResult = await optimizeScheduleWithGemini(compoundList);

      if (!optimizationResult) {
        setError("Failed to optimize schedule. Please check your API key and try again.");
      } else {
        setResult(optimizationResult);
      }
    } catch (err) {
      console.error("Optimization error:", err);
      setError("An error occurred during optimization");
    } finally {
      setIsOptimizing(false);
    }
  }

  function handleApply() {
    if (result && onApplySchedule) {
      onApplySchedule(result);
      setIsOpen(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
          // Auto-trigger optimization when dialog opens
          setTimeout(() => handleOptimize(), 100);
        }}
        disabled={currentDoses.length === 0}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Zap className="w-4 h-4 mr-2" />
        Auto-Optimize Schedule
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          onClose={() => setIsOpen(false)}
          className="sm:max-w-[600px] bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Bio-Sync Schedule Optimization
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loading State */}
            {isOptimizing && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                  <p className="text-slate-300">Analyzing chronopharmacology...</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Gemini is optimizing your schedule based on circadian rhythms
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isOptimizing && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {result && !isOptimizing && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h4 className="font-semibold text-white mb-2">Optimization Summary</h4>
                  <p className="text-sm text-slate-300">{result.summary}</p>
                </div>

                {/* Optimized Schedule */}
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Optimized Schedule
                  </h4>
                  <div className="space-y-2">
                    {result.optimizedSchedule.map((item, idx) => {
                      const compound = compounds.find((c) => c.id === item.compoundId);
                      if (!compound) return null;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{compound.name}</span>
                            <span className="text-blue-400 font-mono text-sm">
                              {item.suggestedTime}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{item.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Important Considerations
                    </h4>
                    <div className="space-y-2">
                      {result.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-200"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleApply}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Schedule
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Note: This is a suggestion based on general principles. Consult your healthcare
                  provider before making significant changes.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isOptimizing && !result && !error && currentDoses.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p>No active doses to optimize</p>
                <p className="text-sm mt-2">Log some compounds first</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
